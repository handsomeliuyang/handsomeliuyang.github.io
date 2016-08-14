---
title: Android内核学习笔记：Android进程\线程管理
categories: Android
tags: [Android内核学习笔记]
---

# Android程序启动过程

![](Android程序的启动流程.png)

1. ActivityManagerService与WindowManagerService在独立的进程里，与程序进度之间的通信通过Bindler进行
2. 每个应用程序都是运行在独立的进程里的，进程与进程之间无法直接通信，每个进程里都一个JVM虚拟机，不能通过static进行通信
3. 应用程序的进程是由ActivityManagerService通过Process.start("android.app.ActivityThread")创建的，进程创建后，会同时创建一个线程，这个线程就是我们所说的UIThread。
4. 同一个进程里的Activity, Service等等四大组件都是运行在ActivityThread里，即UI线程里的。所以通常我们要在Service里创建一个Thread来真正执行后台程序
5. 应用程序启动后，除了创建AcivityThread后，还会创建两个BindlerThread，作用就是用于与AMS，WMS进行交互的。

# 什么是线程

**Runnable是不是线程？**

不是，Runnable只是一个接口，用于创建线程的接口类

**Thread是不是线程？**

不是，Thread只有在调用thread.start()方法后，才会创建一个Thread出来，之前的所有的初始化步骤都是在当前线程里执行的。Thread.start()方法如下：

```java
public synchronized void start(){
	checkNotStarted();
	hasBeanStarted = true;
	VMThread.create(this, stackSize); // 这里才是真正创建一个CPU线程的地方
}
```

只有当VMThread.create()方法之后，才会创建一个真正的线程。

# Android的UIThread

Android有四大组件：Activity，Service，ContentProvider，Broadcast。组各自的功能：

1. Activity：界面，生命周期：onCreate(), ...
2. Service：后台服务，生命周期：onCreate(), ...
3. Broadcast：广播，生命周期：onReceive()
4. ContentProvider：用于数据共享，生命周期：onCreate(), ...

**四大组件的运行哪个进程，哪个线程里呢？**

1. 默认情况下：四大组件都是运行在以程序的包名命名的进程里，
2. 四大组件都是运行在UIThread里，但注意：是其生命周期方法是运行在UIThread里。如ContentProvider的query()等等方法的执行线程要依调用方来决定
3. Service的生命周期是运行在UIThread里，我们需要执行的后台任务，需要创建一个子线程来执行
4. 四大组件，Activity，Service，Broadcast都是需要时，系统进行创建，但ContentProvider例外，其是在应用进程启动时，就会开发创建。

# Android的编程框架

从开始接触Android开始，我们都是面向四大组件及四大组件的生命周期方法来进行编程。  
但学过C程序开发的都知道，应用程序都是从main()方法开始执行，再执行一个while()循环，不停接收事件，再处理事件的过程。  
Android的事件驱动流程：  
![](Android程序流程.png)

1. 由AMS创建应用程序进程，并创建UIThread，通过Looper.loop()，让UIThread进入事件驱动循环中
2. 四大组件的生命周期方法，用户交互等等都当作Message，进入MessageQueue里，进入UIThread的事件驱动循环中。

# ANR异常

概念：ANR（Application No Response）用户点击屏幕后，如果5s没有处理完成此点击Event，就会报ANR异常

ANR发生的情况：

1. 在UIThread里执行网络请求，IO操作等等耗时操作
2. UI绘制时间过长，也有可能造成ANR异常
3. ANR异常很多时候不是由一个耗时操作造成的，很多是由一组操作，如进行10000次SP读写操作。






