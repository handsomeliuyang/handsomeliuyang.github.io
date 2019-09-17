---
title: Flutter与Android工程的混合开发
date: 2019-09-17 08:59:52
categories: Android
tags: [Android, Flutter]
---

# 需求
Flutter与现有Android工程融合后的要求：
1. Flutter工程与Android工程解耦
2. 扩展能力通过Flutter Plugin实现
3. Flutter工程能独立运行
4. 包大小要求：只保留armeabi下的so

# add to app
细节参考官网文档：[Add Flutter to existing apps](https://github.com/flutter/flutter/wiki/Add-Flutter-to-existing-apps)
> Last updated August 23, 2019.  
> The "add-to-app" support is in preview, and is so far only available on the master channel.

注意点：要使用Flutter的master分支的代码

## 创建Flutter Module
在Android项目的同级目录下，创建Flutter Module：
```shell
flutter create -t module --org com.example wuba_flutter
```

创建后的项目结构：
![](/Flutter与Android工程的混合开发/20190917092102520.png)

主要结构与正常的Flutter项目一致，主要的区别是：
1. android目录，改为了.android
2. 多了一个Flutter module，同时app module依赖Flutter module
    1. 具体的内容：
        ![](/Flutter与Android工程的混合开发/20190917092452530.png)
    2. 提供用于创建自定Flutter Activity的Api
    3. 注册所有的插件
    4. 注意：引Flutter module是通过Flutter tooling自动生成的
3. include_flutter.groovy的作用：
    1. 设置对外暴露的项目名称：:flutter
    2. 关联Flutter Plugin：通过解析flutter项目的.flutter-plugins文件，获取所有的依赖插件
4. pubspec.yaml比独立的Flutter项目，多出了如下配置：具体作用可以直接读其注释
    ![](/Flutter与Android工程的混合开发/20190917093500924.png)
    
## 以module的方式融合到Android工程

第一步：修改Android工程的settings.gradle文件，添加如下配置：
```gradle
// 引入Flutter项目
setBinding(new Binding([gradle: this]))                                 // new
evaluate(new File(                                                      // new
    settingsDir.parentFile,                                               // new
    'wuba_flutter/.android/include_flutter.groovy'                          // new
))
```

第二步：依赖flutter，创建Flutter Activity：
1. 依赖flutter
    ```gradle
    implementation project(':flutter')
    ```
2. 利用Flutter Api，创建Flutter Activity
    ```kotlin
    package com.wuba.flutter;
    import android.os.Bundle;
    import android.support.annotation.Nullable;
    import android.support.v4.app.FragmentActivity;
    import android.support.v4.app.FragmentTransaction;
    import io.flutter.facade.Flutter;

    public class WubaFlutterActivity extends FragmentActivity {

        @Override
        protected void onCreate(@Nullable Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);

            FragmentTransaction tx = getSupportFragmentManager().beginTransaction();
            tx.replace(android.R.id.content, Flutter.createFragment("/"));
            tx.commit();
        }
    }
    ```
3. 配置Manifest文件
    ```xml
    <activity android:name="com.wuba.flutter.WubaFlutterActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|layoutDirection|fontScale|screenLayout|density"
            android:hardwareAccelerated="true"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
    </activity>
    ```

Flutter的加载过程：
1. 初始化，加载flutter engine
    ```java
    FlutterMain.startInitialization(activity.getApplicationContext());
    FlutterMain.ensureInitializationComplete(activity.getApplicationContext(), null);
    ```
2. 为当前的Activity，创建FlutterView
    ```java
    final FlutterNativeView nativeView = new FlutterNativeView(activity);
    final FlutterView flutterView = new FlutterView(activity, null, nativeView) {
      ...
    };
    ```

注意点：
1. FlutterApplication，FlutterActivity是配套使用的，一个做初始化，一个用于创建FlutterView
2. 通过Flutter.createFragment()，创建多个自定义的Activity，会不会造成多次初始化？答案是不会，原因如下：
    ```java
    public static void startInitialization(@NonNull Context applicationContext, @NonNull FlutterMain.Settings settings) {
        if (!isRunningInRobolectricTest) {
            if (Looper.myLooper() != Looper.getMainLooper()) {
                throw new IllegalStateException("startInitialization must be called on the main thread");
            } else if (sSettings == null) { // 通过静态变量sSettings来保证不会重复初始化
                sSettings = settings;
                long initStartTimestampMillis = SystemClock.uptimeMillis();
                initConfig(applicationContext);
                initResources(applicationContext);
                System.loadLibrary("flutter");
                VsyncWaiter.getInstance((WindowManager)applicationContext.getSystemService("window")).init();
                long initTimeMillis = SystemClock.uptimeMillis() - initStartTimestampMillis;
                FlutterJNI.nativeRecordStartTimestamp(initTimeMillis);
            }
        }
    }
    ```
    
如果使用稳定版本的Flutter SDK编译，编译也会成功，但运行时会报错？  
原因：isolate_snapshot_data默认情况下，只在build/intermediates/flutter/debug/android-arm/flutter_assets/生成，不在build/intermediates/library_assets/目录下生成，但多个lib库之间的assets合并，只合并library_assets目录下的文件


## 以aar的方式融合到Android工程
请参考[Add Flutter to existing apps](https://github.com/flutter/flutter/wiki/Add-Flutter-to-existing-apps)

# 包大小要求：只保留armeabi下的so

Flutter通过JIT编译后，apk里的存在形式：
> ![](/Flutter与Android工程的混合开发/20190917100312871.png)
> 参考：[Exploring Flutter in Android](https://medium.com/@takahirom/exploring-flutter-in-android-533598ba17d2)

主要是两个文件：
1. flutter engine：libflutter.so  
    ![](/Flutter与Android工程的混合开发/20190917100708404.png)
2. dart代码编译后的snapshot：存在assets/flutter_assets目录下  
    ![](/Flutter与Android工程的混合开发/20190917100923888.png)
    
Flutter Engine（libflutter.so）：
1. 包含哪些模块：  
    ![](/Flutter与Android工程的混合开发/20190917101647274.png)
2. 编译过程：通过flutter engine的源码编译：https://github.com/flutter/engine
3. 开发期间生成过程：使用的是Flutter SDK里已经生成好的，路径地址：flutter sdk/bin/cache/artifacts/engine
    1. 包括arm，arm64，x86，x64：  
        ![](/Flutter与Android工程的混合开发/20190917102005624.png)
    2. 每个目录下都含有flutter.jar文件  
        ![](/Flutter与Android工程的混合开发/20190917102219764.png)
        
问题：Flutter SDK里携带的flutter engine没有armeabi下的so，只有armeabi-v7a的so，如何实现只保留armeabi的so？  
解决方案：
1. 把armeabi-v7a下的libflutter.so复制到armeabi目录下 --- 现在使用的方案
2. 通过flutter engine的源码整体编译一次，产出armeabi的so，[编译方法](https://github.com/flutter/flutter/wiki/Compiling-the-engine)

# 参考
1. [Add Flutter to existing apps](https://github.com/flutter/flutter/wiki/Add-Flutter-to-existing-apps)
2. [Exploring Flutter in Android](https://medium.com/@takahirom/exploring-flutter-in-android-533598ba17d2)