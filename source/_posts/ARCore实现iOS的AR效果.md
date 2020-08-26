---
title: ARCore实现iOS的AR效果
date: 2020-07-21 15:35:45
categories: Android
tags: [Android]
---

# iOS的AR效果
<img src="https://wos.58cdn.com.cn/IjGfEdCbIlr/ishare/pic_18767146674867936.gif" height="400" style="max-width: 100%; cursor: default;">

此AR效果可以分为两个过程：
1. 旋转显示“找工作卡片”
2. 点击“找工作卡片”显示“帮帮3D动画效果”

# ARCore实现的效果
由于ARCore发展比ARKit慢很多，加上终端上的差异，提供的能力比较弱，最新Sceneform-1.16.0版本，才支持glTF的animation。

iOS的这个效果是三年前实现的，由于之前的Sceneform不支持animation，一直无法完成ARCore的改写，只能借助第三方的SDK，如ViroCore。

直到最近Sceneform版本支持animation后，才完成改写。dae的3D模型转换失败，改为其他3D模型。

<video src="https://wos.58cdn.com.cn/IjGfEdCbIlr/ishare/video_19920195115761207.mp4" controls="true" width="100%" height="400"></video>

# ARCore简单理解

> ARCore的主要三个功能
> 1. 运动跟踪：让手机可以理解和跟踪它相对于现实世界的位置。
> 2. 环境理解：让手机可以检测各类表面（例如地面、咖啡桌或墙壁等水平、垂直和倾斜表面）的大小和位置。
> 3. 光估测：让手机可以估测环境当前的光照条件。

AR效果的实现过程：
1. 通过识别摄像头每帧图像中的**特征点**，计算**特征点**的移动
2. 将这些**特征点**的移动与手机惯性传感器的读数组合，估算出摄像头的正确位置和方向。
3. 依据摄像头最新的位置和方向，调整观察坐标系，重新渲染3D模型，使3D模型看起来就像现实世界的一部分。

# ARCore关键术语

1. feature points: 特征点
2. planes: 平面，一组特征点（clusters of feature points）
3. anchor: 锚点，世界坐标系中的一个固定点，随着手机移动，在观察坐标系里，坐标会不断进行变化。
4. trackable: 可追踪对象，平面和特征点可被称为trackable，即随着手机移动，可定位其在真实世界的位置
5. hit test: 基于屏幕的二维坐标，映射到世界坐标，返回一个可追踪对象（trackable），即平面或特征点
6. TrackingState: Camera当前的运动跟踪状态，只有当state为TRACKING时，当前的位置信息才可以使用

# Sceneform
> Sceneform是一个3D框架，封装OpenGL，简化3D模型的加载，渲染和交互

## 导入

3D资源的格式有：obj、fbx、gltf等等多种格式
1. obj：通用格式，大部分的3D工具都支持此格式，主要用于传输
2. glTF：最小的3D格式，去掉所有的冗余数据，类似于图片的JPEG格式，很适合移动端及web端。

为了执行效率，Sceneform会将3D资源进行格式转换为sfa,sfb格式，再进行加载。
1. 转换插件：Google Sceneform Tools（Android Studio插件）
2. sfa文件：json文件，可阅读的描述文件，Task(createAsset-{asset-name})会依据最新的3D资源对此文件进行覆写。
3. sfb文件：Sceneform的3D资源的二进制数据，Task(compileAsset-{asset-name})将sfa编译到sfb中。

## 加载
Renderable是Sceneform加载3D资源（*.sfb）后的对象，由顶点，资源，纹理组成。

支持的加载来源有：xml布局文件；3D资源（*.sfb）；运行时创建简单的几何图形；加载动态3D资源

### xml布局文件
通过ViewRenderable可加载xml布局文件，如下所示：
```java
ViewRenderable.builder()
    .setView(context, R.layout.layout_ad)
    .build()
    .thenAccept(viewRenderable -> {
        adRenderable = viewRenderable;
    })
    .exceptionally(
            throwable -> {
                Toast toast = Toast.makeText(context, "Unable to load adRenderable", Toast.LENGTH_LONG);
                toast.setGravity(Gravity.CENTER, 0, 0);
                toast.show();
                return null;
            });
```

注意：
1. build() 函数在子线程加载
2. 成功回调(thenAccept)和异常回调(exceptionally)，都是在主线程执行

效果如下所示：
![](/ARCore实现iOS的AR效果/20200722030845713.png)

### 3D资源（*.sfb）
通过ModelRenderable加载内置的（*.sfb）文件
```java
ModelRenderable.builder()
    .setSource(context, Uri.parse("andy_dance.sfb"))
    .build()
    .thenAccept(modelRenderable -> mBangbangRenderable = modelRenderable)
    .exceptionally(throwable -> {
        Toast toast = Toast.makeText(context, "Unable to load bangbangRenderable", Toast.LENGTH_LONG);
        toast.setGravity(Gravity.CENTER, 0, 0);
        toast.show();
        return null;
    });
```

注意：
1. build() 函数在子线程加载
2. 成功回调(thenAccept)和异常回调(exceptionally)，都是在主线程执行

效果如下所示：
![](/ARCore实现iOS的AR效果/20200722030916442.png)

### 加载动态3D资源
运行时加载3D资源，暂不支持直接加载*.sfb文件，只支持glTF格式的3D资源的加载。也是通过ModelRenderable加载。

# 实现过程

有了上面的知识的储备，实现成本其实并不高。

## AR环境搭建
ARCore和Sceneform的依赖：app/build.gradle
```gradle
dependencies {
    ...
    // Provides ARCore Session and related resources.
    implementation 'com.google.ar:core:1.15.0'
    implementation "com.google.ar.sceneform.ux:sceneform-ux:1.15.0"
    // Alternatively, use ArSceneView without the UX dependency.
    implementation 'com.google.ar.sceneform:core:1.15.0'
    implementation "com.google.ar.sceneform:animation:1.15.0"
}
apply plugin: 'com.google.ar.sceneform.plugin'
```

插件依赖：build.gralde
```gradle
buildscript {
    dependencies {
        classpath 'com.android.tools.build:gradle:3.4.1'
        classpath 'com.google.ar.sceneform:plugin:1.15.0'
    }
}
```

通过com.google.ar.sceneform.ux.ArFragment快速构建AR环境
```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <fragment
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:name="com.google.ar.sceneform.ux.ArFragment"
        android:id="@+id/ux_fragment"/>

</FrameLayout>
```
ARFragment的初始化及配置
```java
package com.wuba.sceneform;

public class MainActivity extends AppCompatActivity {
    private ArFragment arFragment;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // 做AR支持检测
        if (!ARCoreUtils.checkIsSupportedDeviceOrFinish(this)) {
            return;
        }
        setContentView(R.layout.layout_main);
        arFragment = (ArFragment) getSupportFragmentManager().findFragmentById(R.id.ux_fragment);
        // 移除引导动画
        arFragment.getPlaneDiscoveryController().hide();
        arFragment.getPlaneDiscoveryController().setInstructionView(null);
    }
}
```

## 加载3D资源
“找工作”对象：从xml里加载
```java
ViewRenderable.builder()
    .setView(context, R.layout.layout_ad)
    .build()
    .thenAccept(viewRenderable -> {
        adRenderable = viewRenderable;
    })
    .exceptionally(
            throwable -> {
                Toast toast = Toast.makeText(context, "Unable to load adRenderable", Toast.LENGTH_LONG);
                toast.setGravity(Gravity.CENTER, 0, 0);
                toast.show();
                return null;
            });
```

“帮帮3D动画效果”对象：3D模型加载，利用Google Sceneform Tools插件，导入andy_dance.fbx资源，并通过ModelRenderable进行加载：
```java
ModelRenderable.builder()
    .setSource(context, Uri.parse("andy_dance.sfb"))
    .build()
    .thenAccept(modelRenderable -> mBangbangRenderable = modelRenderable)
    .exceptionally(throwable -> {
        Toast toast = Toast.makeText(context, "Unable to load bangbangRenderable", Toast.LENGTH_LONG);
        toast.setGravity(Gravity.CENTER, 0, 0);
        toast.show();
        return null;
    });
```

## 移动找特征点，并显示“找工作”

要在真实世界上放置渲染对象，看起来像现实世界的一部分，就需要基于可追踪对象(trackable)，放置渲染对象。

步骤如下：
1. 监听摄像头的每帧图像处理
2. 判断Camera.TrackingState是否是TRACKING
3. 对当前图像帧做frame.hitTest()测试，获取可追踪对象(trackable)
4. 基于可追踪对象(trackable)的Pose，创建Anchor，通过Anchor添加3D渲染对象。

```java
// 监听
arFragment.getArSceneView().getScene().addOnUpdateListener(new Scene.OnUpdateListener() {
    @Override
    public void onUpdate(FrameTime frameTime) {
        arFragment.onUpdate(frameTime);
        onSceneUpdate();
    }
});

private void onSceneUpdate() {
    View contentView = findViewById(android.R.id.content);

    boolean trackingChanged = updateTracking();

    if(trackingChanged){
        if(isTracking){
            contentView.getOverlay().add(pointer);
        } else {
            contentView.getOverlay().remove(pointer);
        }

        contentView.invalidate();
    }

    if(isTracking){
        boolean hitTestChanged = updateHitTest();
        if(hitTestChanged) {

            if(isHitting) {
                adManager.showAd(hitResult, arFragment);
            }

            Log.d(TAG, "hitTestChanged .... " + isHitting);

            pointer.setEnabled(isHitting);
            contentView.invalidate();
        }
    }
}
```

问题：很多trackable相距很近，“找工作”显示太密集？？

**解决方案：**设置两个“找工作”对象之间的最小距离，计算其三维世界的距离。
```java
private boolean isClose(Pose adPos, Pose hitPose) {
    // Compute the difference vector between the two hit locations.
    float dx = adPos.tx() - hitPose.tx();
    float dy = adPos.ty() - hitPose.ty();
    float dz = adPos.tz() - hitPose.tz();

    // Compute the straight-line distance.
    float distanceMeters = (float) Math.sqrt(dx*dx + dy*dy + dz*dz);

    Log.d("MainActivity", "distanceMeters = " + distanceMeters);

    // too close
    if(distanceMeters < 1.7) {
        return true;
    }

    return false;
}

```

## “找工作”点击显示机器人对象

点击“找工作”对象后，修改当前Node的Renderable数据：
```java
transformableNode.setOnTapListener(new Node.OnTapListener() {
    @Override
    public void onTap(HitTestResult hitTestResult, MotionEvent motionEvent) {
        showBangBang(transformableNode);
    }
});

public void showBangBang(TransformableNode transformableNode){
    if (mBangbangRenderable == null) {
        return;
    }
    transformableNode.setRenderable(mBangbangRenderable);
    transformableNode.select();
    startAnimation(transformableNode, mBangbangRenderable);
}
```

# 后续
还有很多的问题没有解决，只是撑握了Api的使用，无法基于OpenGL做深度定制：
1. 四大厂商的手机如何配置ARCore环境？
2. dae转换为obj或gltf？
3. 3D模型的二次编辑修改？
3. OpenGL深入研究，实现基于OpenGL版本？

# 参考
1. [ARCore overview](https://developers.google.com/ar/discover)
2. [Run Sceneform apps in Android Emulator](https://developers.google.com/sceneform/develop/emulator)
3. [Introduction to Sceneform](https://codelabs.developers.google.com/codelabs/sceneform-intro/index.html#0)


