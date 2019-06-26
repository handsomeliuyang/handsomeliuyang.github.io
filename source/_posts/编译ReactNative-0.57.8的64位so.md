---
title: 编译ReactNative-0.57.8的64位so
date: 2019-06-25 09:44:45
categories: Android
tags: [ReactNative]
---

# 背景
支持64位so的要求：
1. Google Play要求在2019-8月之后的所有更新包都必须支持64位
2. 方舟编译器也需要支持64位

ReactNative从0.58.0版本开始，支持64位，但更新ReactNative的版本的成本非常之高，升级频率一般在1年左右

ReactNative已经开源，理论上只要利用其源码编译出64位的so就可以

# ReactNative的源码编译
参考文章：[Building from source](https://github.com/facebook/react-native/wiki/Building-from-source)

步骤：
1. 下载0.57.8的源码：[v0.57.8源码](https://github.com/facebook/react-native/releases/tag/v0.57.8) 或 从github下载对应的Tag也可以
2. 创建一个ReactNative项目：
    1. 参考文档：[Getting Started](https://facebook.github.io/react-native/docs/0.57/getting-started)
    2. npm install -g react-native-cli
    3. react-native init AwesomeProject --version 0.57.8
3. 修改项目的编译参数：
    1. 打开文件：AwesomeProject/android/build.gradle
    2. 修改如下参数及对应值：---- 因为reactnative-0.57.8的依赖
        1. minSdkVersion = 16
        2. compileSdkVersion = 27
        3. targetSdkVersion = 26
        4. buildToolsVersion = "27.0.3"
4. 下载Android-NDK：[android-ndk-r17c](http://dl.google.com/android/repository/android-ndk-r17c-darwin-x86_64.zip)
5. 修改环境变量
    1. vim ~/.bash_profile
    2. 添加如下配置：
        1. export ANDROID_SDK=android-sdk路径
        2. export ANDROID_NDK=android-ndk-r17c路径
3. 添加local.properties文件：
    1. 位置：AwesomeProject/android/
    2. 内容：
        1. sdk.dir=android-sdk路径
        2. ndk.dir=android-ndk-r17c路径
4. 替换AwesomeProject/node_modules目录下的react-native：
    1. 删除AwesomeProject/node_modules/react-native文件夹
    2. 复react-native-0.57.8的源码到目录AwesomeProject/node_modules下，并修改目录名为react-native
    3. 在AwesomeProject/node_modules/react-native目录下，执行npm install脚本
5. 修改AwesomeProject/android/build.gradle文件：
    ```gradle
    ...
        dependencies {
            classpath 'com.android.tools.build:gradle:3.2.1'
            classpath 'de.undercouch:gradle-download-task:3.4.3'

            // NOTE: Do not place your application dependencies here; they belong
            // in the individual module build.gradle files
        }
    ...
    ```
6. 修改AwesomeProject/android/settings.gradle文件：
    ```gradle
    ...
    include ':ReactAndroid'

    project(':ReactAndroid').projectDir = new File(
        rootProject.projectDir, '../node_modules/react-native/ReactAndroid')
    ...
    ```
7. 修改AwesomeProject/android/app/build.gradle文件：
    ```gradle
    ...
    dependencies {
        implementation fileTree(dir: 'libs', include: ['*.jar'])
        implementation 'com.android.support:appcompat-v7:${rootProject.ext.supportLibVersion}'

        implementation project(':ReactAndroid')

        ...
    }
    ...
    ```
8. Android Studio打开项目： Import project，选择 AwesomeProject/android 文件夹
9. 编译：app [assembleDebug]

# 编译64位so

**修改配置，编译64位so：**
1. ReactAndroid/src/main/jni/Application.mk：添加arm64-v8a, x86_64
    ```
    ...
    APP_ABI := armeabi-v7a x86 arm64-v8a x86_64
    ...
    ```
2. android/app/build.gradle：添加arm64-v8a, x86_64
    ```
    ...
    ndk {
        abiFilters "armeabi-v7a", "x86", "arm64-v8a", "x86_64"
    }
    ...
    ```
3. Clean工程：注意保留ReactAndroid/build/downloads目录，每次下载时间很长
4. 编译：app [assembleDebug]
5. 结果：<font color="#ff0000">编译出错，无法找到jsc的64位so</font>

**问题原因分析：ReactNative的jni代码依赖了第三方库的C代码，如下所示：**
1. boost：源码依赖，先下载源码，再编译
2. double-conversion：源码依赖，先下载源码，再编译
3. folly：源码依赖，先下载源码，再编译
4. glibc：c的运行库
5. glog：源码依赖，先下载源码，再编译
6. jsc：依赖aar（org.webkit:android-jsc:r174650），但此aar里，只有armeabi armeabi-v7a x86，没有64位的so，分析过程如下：
    1. 查找jsc的task：
        ```
        :ReactAndroid:downloadJSCHeaders
        :ReactAndroid:prepareJSC
        ```
    2. prepareJSC：
        ```gradle
        // Create Android.mk library module based on so files from mvn + include headers fetched from webkit.org
        task prepareJSC(dependsOn: dependenciesPath ? [] : [downloadJSCHeaders]) << {
            copy {
                from zipTree(configurations.compile.fileCollection { dep -> dep.name == 'android-jsc' }.singleFile)
                from dependenciesPath ? "$dependenciesPath/jsc-headers" : {downloadJSCHeaders.dest}
                from 'src/main/jni/third-party/jsc/Android.mk'
                include 'jni/**/*.so', '*.h', 'Android.mk'
                filesMatching('*.h', { fname -> fname.path = "JavaScriptCore/${fname.path}"})
                into "$thirdPartyNdkDir/jsc";
            }
        }
        
        // 对应的依赖
        dependencies {
            ...
            compile 'org.webkit:android-jsc:r174650'
        }
        ```
    3. 从prepareJSC的逻辑：当下载了org.webkit:android-jsc:r174650文件后，读取其中so文件
    4. 下载org.webkit:android-jsc:r174650文件，修改后缀为.zip，解压，发现没有64位so：
    ![](/编译ReactNative-0.57.8的64位so/20190626095023347.png)

**分析0.58.0的解决方案：（注意：react-native-0.58.0版本已经支持了64位so）**
1. 下载0.58.0的源码：[0.58.0](https://github.com/facebook/react-native/releases/tag/v0.58.0)
2. 其依赖jsc的方式没有变：依赖aar，版本号也没有变，还是r174650
    ```
    task prepareJSC(dependsOn: dependenciesPath ? [] : [downloadJSCHeaders]) << {
        copy {
            from zipTree(configurations.compile.fileCollection { dep -> dep.name == 'android-jsc' }.singleFile)
            from dependenciesPath ? "$dependenciesPath/jsc-headers" : {downloadJSCHeaders.dest}
            from 'src/main/jni/third-party/jsc'
            include 'jni/**/*.so', '*.h', 'Android.mk'
            filesMatching('*.h', { fname -> fname.path = "JavaScriptCore/${fname.path}"})
            into "$thirdPartyNdkDir/jsc";
        }
    }

    dependencies {
        ...
        compile 'org.webkit:android-jsc:r174650'
        ...
    }
    ```
3. 但ReactAndroid/src/main/third-party/jsc目录有变化，内置了arm64-v8a和x86_64的so进来：  
    ![](/编译ReactNative-0.57.8的64位so/20190626095753373.png)

**解决方案：** 由于android-jsc的版本号一样，那0.58.0内置的jsc的64位so，在0.57.8版本里也可以使用
1. 完整复制0.58.0下的jsc64位so到0.57.8的对应目录下
2. 修改ReactAndroid/build.gradle脚本：使用文件对比工具FileMerge，查看0.58.0与jsc有关的改动点：
    1. prepareJSC里，copy命令修改：from 'src/main/jni/third-party/jsc/Android.mk' 改为 from 'src/main/jni/third-party/jsc'
    ![](/编译ReactNative-0.57.8的64位so/20190626101740578.png)
    2. jniLibs.srcDirs的目录修改：jniLibs.srcDir "$buildDir/react-ndk/exported" 改为 jniLibs.srcDirs = ["$buildDir/react-ndk/exported", 'src/main/jni/third-party/jsc/jni']
    ![](/编译ReactNative-0.57.8的64位so/20190626101926159.png)
3. 编译：app [assembleDebug]
4. 编译后的so：链接:https://pan.baidu.com/s/1f-O6mcmrUxVu6g4DOXXqkA  密码:qk83
