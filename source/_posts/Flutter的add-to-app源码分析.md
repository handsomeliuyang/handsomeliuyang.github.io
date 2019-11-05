---
title: Flutter混合工程工程化编译改造系列：add to app源码分析
date: 2019-10-30 14:19:59
categories: Android
tags: [Flutter]
---

# add to app
详细教程文档：[Add Flutter to existing apps](https://github.com/flutter/flutter/wiki/Add-Flutter-to-existing-apps)

主要步骤：
1. 创建FlutterModule：flutter create -t module xxx
2. 在Host App的settings.gradle文件添加如下配置：
    ```gradle
    // MyApp/settings.gradle
    include ':app'                                     // assumed existing content
    setBinding(new Binding([gradle: this]))                                 // new
    evaluate(new File(                                                      // new
      settingsDir.parentFile,                                               // new
      'my_flutter/.android/include_flutter.groovy'                          // new
    ))   
    ```
3. 依赖flutter module库：
    ```gradle
    dependencies {
      implementation project(':flutter')
    }
    ```

# 源码分析
通过阅读Flutter官方文档，Flutter的源码分为两部分：
1. Flutter Framework：[源码地址](https://github.com/flutter/flutter)
2. Flutter Engine: [源码地址](https://github.com/flutter/engine)

Flutter Framework源码的环境配置与编译都比较容易，主要两步：
1. clone代码后，把flutter/bin目录添加到环境变量里，执行任务flutter的命令，都会自动编译flutter tool
2. 修改flutter tool源码后，重新编译flutter tool：
    ```
    cd flutter_sdk_path
    rm ./bin/cache/flutter_tools.stamp
    rm ./bin/cache/flutter_tools.snapshot
    ```

## flutter create -t module过程分析
flutter create的源码路径：flutter/packages/flutter_tools/lib/src/commands/create.dart

![](/Flutter的add-to-app源码分析/create流程2.png)

flutter create 命令都是通过template来创建，但create app与create module的模板不一样，create module处于beta阶段：
1. 创建的Platform代码在.android文件里
2. 执行flutter create, pub命令，会强制删除.android再重建

## 工程结构分析
新增一个.android/Flutter Module的主要作用：
1. 提供一个Flutter类和FlutterFragment类
    1. 初始化flutter: FlutterMain.startInitialization()
    2. 创建FlutterView：new FlutterView(activity, null, nativeView)
2. 注册Plugin插件
3. 通过插flutter的gradle插件，编译整个Flutter工程，生成snapshot和libflutter.so文件
```gralde
apply from: "$flutterRoot/packages/flutter_tools/gradle/flutter.gradle"
```

## FlutterPlugin插件过程分析
插件源码目录：flutter/packages/flutter_tools/gradle/flutter.gradle

![](/Flutter的add-to-app源码分析/flutterplugin.png)

从图中可了解到：
1. 对于flutter engine的依赖，是通过关联其aar实现的
2. debug编译时，Flutter的Dart工程，通过JIT编译，生成snapshot
3. release编译时，Flutter的Dart工程，通过AOT编译，生成libapp.so
4. release编译生成的libapp.so，通过打包成jar依赖
5. flutter的其他数据，如字体等等文件，复制到apk的assets目录下
6. Debug包的生成文件有：
    1. lib/xxx/libflutter.so
    2. assets/flutter_assets
7. Release包的生成文件有：
    1. lib/xxx/libflutter.so
    2. lib/xxx/libapp.so
    3. assets/flutter_assets

# 总结
现有的add to app的一些问题：
1. beta状态，只有master分支才支持，问题很多：
    1. .android文件夹执行flutter pub命令时，会被重新生成
    2. 同时master分支不稳定，无法生成可运行的release包
2. 开发期间编译很耗时，同时编译两个工程

改造思路：
1. 基于稳定分支，分离Flutter Dart编译与Flutter Native编译过程
2. Flutter载体页支持usb或网络加载Flutter Dart的snapshot文件，并支持热更新

敬请期待后续...

# 参考
1. [Setting up the Framework development environment](https://github.com/flutter/flutter/wiki/Setting-up-the-Framework-development-environment)
2. [The flutter tool](https://github.com/flutter/flutter/wiki/The-flutter-tool)
3. [Add Flutter to existing apps](https://github.com/flutter/flutter/wiki/Add-Flutter-to-existing-apps)