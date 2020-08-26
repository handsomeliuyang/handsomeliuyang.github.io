---
title: 双开系列：AIDL原理简介及动态扩展实现
date: 2020-08-09 12:32:34
categories: Android
tags: [Android]
---

# AIDL的用法

定义接口，IRemoteService.aidl
```java
package com.ly.studydemo.binder;
import com.ly.studydemo.binder.MyData;
interface IRemoteService {
    int getPid();
    MyData getMyData();
}
```

编译器自动生成两个类：
1. 服务端：IRemoteService.Stub，继承Binder，真正的服务提供者
2. 客户端：IRemoteService.Stub.Proxy，实现接口IRemoteService，与服务端通信，请求和结果传输

服务端通过继承IRemoteService.Stub，提供服务：
```java
// 真正的实现类
private val mBinder: IRemoteService.Stub = object:IRemoteService.Stub() {
    override fun getPid(): Int {
        Log.i(TAG, "[RemoteService] getPid()=${android.os.Process.myPid()}")
        return android.os.Process.myPid()
    }

    override fun getMyData(): MyData? {
        Log.i(TAG, "[RemoteService] getMyData()=${this@RemoteService.mMyData}")
        return this@RemoteService.mMyData
    }
}
```

客户端(如Activity)获取到IBinder对象后，转换为接口对象使用：
```java
IRemoteService remoteService = IRemoteService.Stub.asInterface(service);
```

客户端要获取IBinder对象有两种方式：
1. 异步获取：通过绑定Service获取
2. 同步获取：通过ContentProvider获取

整体过程如下图所示：
![](/双开系列：AIDL原理简介及动态扩展实现/AIDL使用.png)

# IRemoteService.Stub源码分析

由于是跨进程通过，不可能真正持有IRemoteService的实现类，客户端持有仅仅只是一个Proxy对象。
```java
private static class Proxy implements com.ly.studydemo.binder.IRemoteService {
    private android.os.IBinder mRemote;

    Proxy(android.os.IBinder remote) {
        mRemote = remote;
    }

    @Override
    public android.os.IBinder asBinder() {
        return mRemote;
    }

    public java.lang.String getInterfaceDescriptor() {
        return DESCRIPTOR;
    }

    @Override
    public int getPid() throws android.os.RemoteException {
        android.os.Parcel _data = android.os.Parcel.obtain();
        android.os.Parcel _reply = android.os.Parcel.obtain();
        int _result;
        try {
            _data.writeInterfaceToken(DESCRIPTOR);
            boolean _status = mRemote.transact(Stub.TRANSACTION_getPid, _data, _reply, 0);
            if (!_status && getDefaultImpl() != null) {
                return getDefaultImpl().getPid();
            }
            _reply.readException();
            _result = _reply.readInt();
        } finally {
            _reply.recycle();
            _data.recycle();
        }
        return _result;
    }

    @Override
    public com.ly.studydemo.binder.MyData getMyData() throws android.os.RemoteException {
        android.os.Parcel _data = android.os.Parcel.obtain();
        android.os.Parcel _reply = android.os.Parcel.obtain();
        com.ly.studydemo.binder.MyData _result;
        try {
            _data.writeInterfaceToken(DESCRIPTOR);
            boolean _status = mRemote.transact(Stub.TRANSACTION_getMyData, _data, _reply, 0);
            if (!_status && getDefaultImpl() != null) {
                return getDefaultImpl().getMyData();
            }
            _reply.readException();
            if ((0 != _reply.readInt())) {
                _result = com.ly.studydemo.binder.MyData.CREATOR.createFromParcel(_reply);
            } else {
                _result = null;
            }
        } finally {
            _reply.recycle();
            _data.recycle();
        }
        return _result;
    }

    public static com.ly.studydemo.binder.IRemoteService sDefaultImpl;
}
```

通过mRemote.transact()，以code的方式传递需要调用的方法名，服务端收到code码后，会调用IRemoteService.Stub的实现类的对应方法，这就是远程过程调用（RPC）。

![](/双开系列：AIDL原理简介及动态扩展实现/20200813104040407.png)

# Binder IPC的内部实现
Android的跨进程通信：
1. Zygote进程通过Socket机制通信
2. 应用进程通过Binder IPC通信

进程之间之所以无法直接通信的原因是虚拟内存管理技术，进程分为两部分（以32位为例）：
1. 用户空间：0~3G，进程独有，即虚拟内存地址映射到的物理地址是独有，即使用不同的页表
2. 内核空间：3G~4G，进程共享，即虚拟内存地址映射到的物理地址，其他进程也可以访问到，即使用同一个页表

> ![](/双开系列：AIDL原理简介及动态扩展实现/进程页表隔离.png)
> 图片引用自[Binder内存拷贝的本质和变迁](https://juejin.im/post/6844904113046568973)

用户空间和内核空间都使用虚拟内存管理技术，由于所有的内核空间的地址，使用同一个页表，可访问相同的物理地址。所以进程间通信要借助内核空间，有两种方式：
1. 共享内存：两个进程通过内核空间，共享同一块物理内存，都具有读写权限。需要处理同步问题。
2. 内存拷贝：通常是两次拷贝，先从A进程的用户空间拷贝到共享的内核空间，再从共享的内核空间拷贝至B进程的用户空间。不用考虑同步问题，但性能有损失。

Binder IPC也是采用内存拷贝，但通过mmap（内存映射技术），只需拷贝一次，提升了性能。
![](/双开系列：AIDL原理简介及动态扩展实现/20200814100618132.png)

# AIDL的限制
AIDL虽然让跨进程通信变得很简单，但无法实现运行时，动态扩展功能。每次AIDL的接口变化，都需要重新编译。

在VirtualApp里，通过IPC总线，实现了运行时动态的扩展能力。

# IPC总线（IPCBus）

AIDL自动生成的Stub和Stub.Proxy的主要功能：
1. 生成code，如TRANSACTION_getPid, TRANSACTION_getMyDatat，用于传输方法名的传输
2. 传输方法名(即code)和方法参数，调用真正实现类对应的方法

## 总线实现
通过IPC总线实现这两个能力后，就可以实现运行时增加通信能力，整体框架如下：

![](/双开系列：AIDL原理简介及动态扩展实现/20200826033225943.png)

**动态生成code：替换AIDL的编译时生成**
```kotlin
class ServerInterface(val interfaceClass: Class<*>) {

    private val codeToInterfaceMethod: SparseArray<IPCMethod>
    private val methodToIPCMethodMap: Map<Method, IPCMethod>

    init {
        val methods = interfaceClass.methods
        codeToInterfaceMethod = SparseArray(methods.size)
        methodToIPCMethodMap = HashMap(methods.size)

        // 遍历接口的所有方法，生成方法对应的code
        for((index, method) in methods.withIndex()){
            val code = Binder.FIRST_CALL_TRANSACTION + index
            val ipcMethod = IPCMethod(code, method, interfaceClass.name)
            codeToInterfaceMethod.put(code, ipcMethod)
            methodToIPCMethodMap.put(method, ipcMethod)
        }
    }
    ...
}
```

**客户端：通过动态代理替换IRemoteService.Stub.Proxy的功能**

IRemoteService.Stub.Proxy 实现
```java
private static class Proxy implements com.ly.studydemo.binder.IRemoteService {
    private android.os.IBinder mRemote;
    ...
    @Override
    public int getPid() throws android.os.RemoteException {
        android.os.Parcel _data = android.os.Parcel.obtain();
        android.os.Parcel _reply = android.os.Parcel.obtain();
        int _result;
        try {
            _data.writeInterfaceToken(DESCRIPTOR);
            boolean _status = mRemote.transact(Stub.TRANSACTION_getPid, _data, _reply, 0);
            if (!_status && getDefaultImpl() != null) {
                return getDefaultImpl().getPid();
            }
            _reply.readException();
            _result = _reply.readInt();
        } finally {
            _reply.recycle();
            _data.recycle();
        }
        return _result;
    }
    ...
}
```

IPCBus的动态代理实现
```kotlin
fun <T> get(interfaceClass: Class<*>): T? {
    val serverInterface = ServerInterface(interfaceClass)
    // 通过AIDL:IServiceFetcher获取服务器注册的Binder对象
    val binder = getService(interfaceClass.name) ?: return null

    return Proxy.newProxyInstance(
        interfaceClass.classLoader,
        arrayOf(interfaceClass),
        IPCInvocationBridge(serverInterface, binder)
    ) as T
}
class IPCInvocationBridge(val serverInterface: ServerInterface, val binder: IBinder) : InvocationHandler {

    override fun invoke(proxy: Any?, method: Method?, args: Array<Any>?): Any? {
        val ipcMethod = serverInterface.getIPCMethod(method)
            ?: throw IllegalStateException("Can not found the ipc method : " + method?.declaringClass?.name + "@" + method?.name)
        return ipcMethod.callRemote(binder, args)
    }
}

// IPCMethod.callRemote
fun callRemote(server: IBinder, args: Array<Any>?): Any? {
    val data = Parcel.obtain()
    val reply = Parcel.obtain()
    try {
        data.writeInterfaceToken(interfaceName)
        data.writeArray(args)
        server.transact(code, data, reply, 0)
        reply.readException()
        val result = reply.readValue(this.javaClass.classLoader)
        return result
    } finally {
        data.recycle()
        reply.recycle()
    }
}
```

**服务端：通过Binder实现类TransformBinder替换IRemoteService.Stub的功能**

IRemoteService.Stub实现
```java
public static abstract class Stub extends android.os.Binder implements com.ly.studydemo.binder.IRemoteService {
    ...
    @Override
    public boolean onTransact(int code, android.os.Parcel data, android.os.Parcel reply, int flags) throws android.os.RemoteException {
        java.lang.String descriptor = DESCRIPTOR;
        switch (code) {
            case INTERFACE_TRANSACTION: {
                reply.writeString(descriptor);
                return true;
            }
            case TRANSACTION_getPid: {
                data.enforceInterface(descriptor);
                int _result = this.getPid();
                reply.writeNoException();
                reply.writeInt(_result);
                return true;
            }
            case TRANSACTION_getMyData: {
                data.enforceInterface(descriptor);
                com.ly.studydemo.binder.MyData _result = this.getMyData();
                reply.writeNoException();
                if ((_result != null)) {
                    reply.writeInt(1);
                    _result.writeToParcel(reply, android.os.Parcelable.PARCELABLE_WRITE_RETURN_VALUE);
                } else {
                    reply.writeInt(0);
                }
                return true;
            }
            default: {
                return super.onTransact(code, data, reply, flags);
            }
        }
    }
}
```

IPCBus里的TransformBinder实现
```kotlin
class TransformBinder(val serverInterface: ServerInterface, val server: Any) : Binder() {

    override fun onTransact(code: Int, data: Parcel, reply: Parcel?, flags: Int): Boolean {
        if(code == Binder.INTERFACE_TRANSACTION) {
            reply?.writeString(serverInterface.getInterfaceName())
            return true
        }
        val ipcMethod = serverInterface.getIPCMethod(code)
            ?: return super.onTransact(code, data, reply, flags)
        ipcMethod.handleTransact(server, data, reply)
        return true
    }

}
// IPCMethod.handleTransact()
fun handleTransact(server: Any, data: Parcel, reply: Parcel?){
    data.enforceInterface(interfaceName)
    val parameters = data.readArray(this.javaClass.classLoader)

    try {
        val res: Any?
        if (parameters == null) {
            res = method.invoke(server)
        } else {
            res = method.invoke(server, parameters)
        }
        reply?.writeNoException()
        reply?.writeValue(res)
    }catch (e: Exception) {
        reply?.writeException(e)
    }
}
```

## Binder的单例管理

因为跨进程通信最终还是通过IBinder实现，每个接口对应的IBinder对象应该复用，全局单例。
![](/双开系列：AIDL原理简介及动态扩展实现/20200826040156423.png)

## AIDL搭桥传输IBinder对象

首先通过AIDL创建跨进通信，用于传输动态IPC的Binder对象。

![](/双开系列：AIDL原理简介及动态扩展实现/20200826041119691.png)

1. 通过ContentProvider传递AIDL(IServiceFetcher)对象
2. 通过AIDL(IServiceFetcher)传递动态的Binder对象

# 总结
IPCBus的关键是把编译时生成的code，改为动态生成，其他机制与自动生成的IRemoteService.Stub里的机制一样。

# 参考
1. [Binder内存拷贝的本质和变迁](https://juejin.im/post/6844904113046568973)
2. [VirtualApp](https://github.com/asLody/VirtualApp)