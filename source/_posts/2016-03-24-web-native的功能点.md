---
title: Web+Native的功能点
date: 2016-03-24 15:28:51
categories: Android
tags: [Android, 开发模式]
---

# web+native框架简介

采用web+native模式的原因：

1. 纯Native的迭代太慢，不能动态更新，且不能跨平台
2. 纯Web页，有很功能无法实现，有些动画效果实现其体验太差

# 整体框架结构图

![](/img_markdown/22.png)

![](/img_markdown/24.png)

# WebView加载流程

![](/img_markdown/23.png)

1. 在Step1里有两个作用：
    1. 可以拦截html请求，对Html请求进行白名单的判断，只有规定域名的请求才能通过
    2. 转发一些如拨打电话请求，如tel:xxx
2. 在Step2里主要是显示Loading加载框
3. Step3：shouldInterceptRequest()
    1. 此方法在Api为11时才有，即3.0以后才有此方法，所以在2.x系统里，无法劫持资源请求
    2. 主要用于拦截资源请求，让其走本地资源缓存，实现Native资源缓存机制
4. Step4：onPageFinished()要等所有的资源都加载完成后，才会进行回调，但此时，界面早已经渲染出来了。
5. Loading界面消失的机制：
    1. 在html界面渲染完后，js马上回调一个PageFinished的Action通知Native，提前消失掉Loading界面
    2. 如果没有等到PageFinished的Action，就在onPageFinished()方法里，把Loading界面消失掉

# 跳转协议

现在的跳转协议是一个json格式，如下所示：
```json
{
    "action":"loadpage",
    "pagetype":"link",
    "url":"http://xxxx",
    "title":"标题"
    "xxx":""
}
```

由于web页的Title是Native实现的，所以其标题需要从跳转协议里得到。

# html拦截机制

Native实现缓存的思路是：通过shouldInterceptRequest()拦截html的请求。

![](/img_markdown/25.png)

# js,css,image拦截机制

机制和Html的一致，都是通过shouldInterceptRequest()拦截请求。

# html,js,css,image的缓存框架

## 异步加载图片

虽然shouldInterceptRequest()方法是在后台线程里执行的，但如果直接在此方法里，请求图片资源，那所有的图片资源都将是同步的方式加载，影响最终的加载速度，也会阻塞shouldInterceptRequest()方法的执行，从而阻塞webview的渲染。

解决思路：创建新的线程来请求图片资源，马上返回shouldInterceptRequest()方法，但如何实现呢？通过查看WebView的源码，找到了一种方式：使用管道，代码如下：
```java
@Override
public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
    ParcelFileDescriptor[] pipe = ParcelFileDescriptor.createPipe(); // 创建一个管道，一个出口，一个入口
    new TransferThread(context, uri, new ParcelFileDescriptor.AutoCloseOutputStream(pipe[1])).start();
    AssetFileDescriptor assetFileDescriptor = new AssetFileDescriptor(pipe[0], 0, AssetFileDescriptor.UNKNOWN_LENGTH);
    FileInputStream in = assetFileDescriptor.createInputStream();
    return new WebResourceResponse(type, "utf-8", in);
}
```

## 缓存资源的版本号管理

缓存资源是通过其版本号来更新的，那资源的版本号应该存在哪里了？最直接的解决办法是：创建一个数据库，里面存储文件名与版本号的对应关系。我们最早也是这样实现的，这样会带来维护成本，还有其出错的概率。

最好的方案：把版本号与缓存文件存储在一起。

实现思路：不管缓存文件是文本文件，还是图片，在文件的开始位置写入一些Byte字节，这些Byte字节就存储了对应的版本号。
```java
/**
 * Created by maolei on 2015/9/8.
 */
public class ExtraDiskCache{

    private static final String FUNCTION = "diskCache";

    /** Magic number for current version of cache file format. */
    private static final int CACHE_MAGIC = 0x20150908;

    private static final String NO_VALUE = "null";

    /** The root directory to use for the cache. */
    private final File mRootDirectory;

    // TODO clear file

    public ExtraDiskCache(File rootDirectory){
        mRootDirectory = rootDirectory;
        if(!mRootDirectory.exists()){
            mRootDirectory.mkdirs();
        }
    }

    private File getFile(String fileName){
        return new File(mRootDirectory, fileName);
    }

    public boolean save(String fileName, Map<String, String> extraInfo, InputStream in){
        BufferedOutputStream fos = null;
        // network inputstream need temp file;
        File tempFile = getFile(fileName + "_temp");
        try{
            fos = new BufferedOutputStream(new FileOutputStream(tempFile));
            if(extraInfo != null && extraInfo.size() > 0){
                boolean success = writeHeader(fos, extraInfo);
                if(!success){
                    throw new IOException();
                }
            }
            byte[] buf = new byte[1024];
            int len;
            while ((len = in.read(buf)) > 0) {
                fos.write(buf, 0, len);
            }
            fos.flush();
            File cacheFile = getFile(fileName);
            if(cacheFile.exists()){
                cacheFile.delete();
            }
            tempFile.renameTo(cacheFile);
            return true;
        }catch (IOException e){
            LOGGER.k(FUNCTION, "write data error", e);
        }finally {
            try {
                if(in != null){
                    in.close();
                }
                if(fos != null){
                    fos.close();
                }
                if(tempFile.exists()){
                    tempFile.delete();
                }
            }catch (IOException e){
                LOGGER.k(FUNCTION, "close stream error", e);
            }
        }
        return false;
    }

    public Map<String, String> getInfo(String fileName){
        BufferedInputStream bis = null;
        try{
            bis = new BufferedInputStream(new FileInputStream(getFile(fileName)));
            return readHeader(bis);
        }catch (IOException e){
            LOGGER.k(FUNCTION, "getInfo error", e);
        }finally {
            try {
                if(bis != null){
                    bis.close();
                }
            }catch (IOException e){
            }
        }
        return null;
    }


    public InputStream getContentStream(String fileName){
        try{
            File file = getFile(fileName);
            BufferedInputStream bis = new BufferedInputStream(new FileInputStream(file));
            if(readHeader(bis) != null){
                // current file has extra info, so return unread input stream
                return bis;
            }
            // current file is normal file, return origin input stream
            bis.close();
            return new BufferedInputStream(new FileInputStream(file));
        }catch (IOException e){

        }
        return null;
    }

    private Map<String, String> readHeader(InputStream in){
        try {
            int magic = readInt(in);
            if (magic != CACHE_MAGIC) {
                throw new IOException();
            }
            return readStringStringMap(in);
        }catch (IOException e){

        }
        return null;
    }

    private boolean writeHeader(OutputStream out, Map<String, String> extraInfo){
        try{
            writeInt(out, CACHE_MAGIC);
            writeStringStringMap(extraInfo, out);
            return true;
        }catch (IOException e){
            return false;
        }
    }



    /**
     * Simple wrapper around {@link java.io.InputStream#read()} that throws EOFException
     * instead of returning -1.
     */
    private static int read(InputStream is) throws IOException {
        int b = is.read();
        if (b == -1) {
            throw new EOFException();
        }
        return b;
    }

    static void writeInt(OutputStream os, int n) throws IOException {
        os.write((n >> 0) & 0xff);
        os.write((n >> 8) & 0xff);
        os.write((n >> 16) & 0xff);
        os.write((n >> 24) & 0xff);
    }

    static int readInt(InputStream is) throws IOException {
        int n = 0;
        n |= (read(is) << 0);
        n |= (read(is) << 8);
        n |= (read(is) << 16);
        n |= (read(is) << 24);
        return n;
    }

    static void writeLong(OutputStream os, long n) throws IOException {
        os.write((byte)(n >>> 0));
        os.write((byte)(n >>> 8));
        os.write((byte)(n >>> 16));
        os.write((byte)(n >>> 24));
        os.write((byte)(n >>> 32));
        os.write((byte)(n >>> 40));
        os.write((byte)(n >>> 48));
        os.write((byte)(n >>> 56));
    }

    static long readLong(InputStream is) throws IOException {
        long n = 0;
        n |= ((read(is) & 0xFFL) << 0);
        n |= ((read(is) & 0xFFL) << 8);
        n |= ((read(is) & 0xFFL) << 16);
        n |= ((read(is) & 0xFFL) << 24);
        n |= ((read(is) & 0xFFL) << 32);
        n |= ((read(is) & 0xFFL) << 40);
        n |= ((read(is) & 0xFFL) << 48);
        n |= ((read(is) & 0xFFL) << 56);
        return n;
    }

    static void writeString(OutputStream os, String s) throws IOException {
        byte[] b = s.getBytes("UTF-8");
        writeLong(os, b.length);
        os.write(b, 0, b.length);
    }

    static String readString(InputStream is) throws IOException {
        int n = (int) readLong(is);
        byte[] b = streamToBytes(is, n);
        return new String(b, "UTF-8");
    }

    static void writeStringStringMap(Map<String, String> map, OutputStream os) throws IOException {
        if(map == null || map.size() == 0){
            return;
        }
        writeInt(os, map.size());
        for (Map.Entry<String, String> entry : map.entrySet()) {
            writeString(os, entry.getKey());
            String value = entry.getValue();
            if(TextUtils.isEmpty(value)){
                writeString(os, NO_VALUE);
            }else{
                writeString(os, entry.getValue());
            }

        }
    }

    static Map<String, String> readStringStringMap(InputStream is) throws IOException {
        int size = readInt(is);
        if(size <= 0){
            return null;
        }
        Map<String, String> result = new HashMap<String, String>(size);
        for (int i = 0; i < size; i++) {
            String key = readString(is).intern();
            String value = readString(is).intern();
            if(NO_VALUE.equals(value)){
                value = "";
            }
            result.put(key, value);
        }
        return result;
    }

    /**
     * Reads the contents of an InputStream into a byte[].
     * */
    private static byte[] streamToBytes(InputStream in, int length) throws IOException {
        byte[] bytes = new byte[length];
        int count;
        int pos = 0;
        while (pos < length && ((count = in.read(bytes, pos, length - pos)) != -1)) {
            pos += count;
        }
        if (pos != length) {
            throw new IOException("Expected " + length + " bytes, read " + pos + " bytes");
        }
        return bytes;
    }
}
```

## 相关的类

1. WebResLoader：资源加载类，负责：异步加载，同步加载
2. WebResCacheManager：资源管理类，负责：资源保存，加载，资源版本管理

# 交互框架

# WebView的载体页

# Cookie，Header

# WebView添加额外功能

1. 文件上传
2. 文件下载
3. 白名单