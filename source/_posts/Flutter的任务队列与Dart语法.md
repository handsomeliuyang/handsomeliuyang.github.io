---
title: Flutter的任务队列与Dart语法
date: 2019-08-24 10:16:54
categories: Android
tags: [Android, Flutter]
---

# Dart语法

## 背景
由于同时进行多个项目，不同项目之间使用不同的语言，如Java，Dart，Javascript，Kotlin。每种语言之间虽然大体相同，但还是有一些细节差异，为了提升开发效率，总结Dart的语法差异点并记忆。

## 关键点
1. 一切都是对象，数字，方法，null都是对象，对象都继承于object
2. 入口函数为main()，支持函数式编程
3. 如何定义私有类和私有变量：标识符以 (_) 开头，则该标识符 在库内是私有的
4. 变量定义：
    1. 不指名类型：var name;
    2. 指定类型：String name;
    3. 所有变量的默认值是null
5. 定义常量：final 或 const，const为编译时常量
6. 类型：
    1. num类型：int，double
    2. 字符串：
        1. 单引号，双引号都可以
        2. 支持表达式：'${s.toUpperCase()} is very handy!'
        3. 多行字符串：三个单引号 或 三个双引号
    3. 布尔类型：
        1. bool，true, false
        2. 只有为true时，才是真，其他都为false
    4. 数据与列表：List
        1. 创建：List list = [1, 2, 3];
        2. 长度：length属性
    5. Key-Value：Map
        1. 创建：Map map = {key:value};
        2. 赋值：map['key'] = 'value';
        3. 长度：length属性
7. 方法：
    1. 方法也是对象，对应Function类
    2. 定义：返回值 方法名(参数){}
    3. 命名参数：
        1. 定义：{bool bold, bool hidden}
        2. 使用：enableFlags(bold: true, hidden: false);
    4. 可选参数：
        1. 定义：[String device]
        2. 使用：可不传入
8. 匿名函数 或 lambda 或者 closure闭包
    1. 定义：(参数){}，简写：(参数) => 一行语句
9. 类型判断：
    1. 类型转换：as
    2. 类型判断：is，is!


# Flutter的任务队列

## 背景
Flutter是默认是单线程+两个队列，所有的Future都运行在UI线程里，即主Isolate里，对于真正需要异步的任务，可以通过compute()来实现，由于compute方法，每次都是创建一个新的isolate，极端情况下，同时可能会有多个isolate运行。

需求：是否能实现类似线程池的能力，能整体控制同时运行的isolate数量

## 思路与实现
经过测试，发现Flutter有如下限制：
1. Isolate只有在创建时，通过spawn()方法，才能传递方法对象，isolate创建后，不能传递方法对象
2. Isolate不支持反射库 ---- 为了保证‘tree-shaking’的效果
3. 两个Isolate之间，不共享内存，所以无法通过单例共享数据，由于httpclient本身已经在异步执行，为了httpclient能获取CommonHeader，不要把httpclient请求放在异步isolate里

实现思路：把任务保存到Queue队列里，整理控制Isolate的数量，如后台同时只能运行一个isolate

难点：
1. 任务进入队列后，如果通知调用方？---- 通过查看compute()源码得知：通过Completer
2. 队列里的传入类型不确定，无法使用泛型？----- 去掉compute()的泛型，整体使用dynamic

DioManager管理类：
```dart
class _Task {
    Function callback;
    dynamic message;
    Completer<dynamic> result;

    _Task({
        this.callback,
        this.message,
        this.result
    });
}

class IsolateManager {

    static IsolateManager _isolateManager = new IsolateManager();

    static IsolateManager getInstance(){
        return _isolateManager;
    }

    Queue<Object> _queue = Queue<Object>();
    bool _running = false;

    IsolateManager();

    Future<dynamic> compute(Function callback, dynamic message) async {
        // 先入队列，再整体分配，不然可能会同时创建过多的isolate
        final Completer<dynamic> result = Completer<dynamic>();

        // 入队列
        _Task _task = _Task(callback: callback, message: message, result: result);
        _queue.add(_task);

        // 触发队列执行
        taskDispatch();

        return result.future;
    }

    void taskDispatch() async {
        // 先判断当是否有任务在执行
        if(_running) {
            return ;
        }
        
        // 判断队列是否为空
        if(_queue.isEmpty){
            return ;
        }

        _running = true;
        // 获取列队并执行
        _Task task = _queue.removeFirst();

        await IsolateIo.compute(task.callback, task.message, task.result);

        _running = false;

        // 继承任务分发
        taskDispatch();
    }
}
```

_isolate_io类：通过修改compute源码实现
```dart
Future<dynamic> compute(Function callback, dynamic message, Completer<dynamic> result) async {
//    if (!kReleaseMode) {
    String debugLabel = callback.toString();
//    }
    final Flow flow = Flow.begin();
    Timeline.startSync('$debugLabel: start', flow: flow);
    final ReceivePort resultPort = ReceivePort();
    final ReceivePort errorPort = ReceivePort();
    Timeline.finishSync();
    final Isolate isolate = await Isolate.spawn(
        _spawn,
        _IsolateConfiguration(
            callback,
            message,
            resultPort.sendPort,
            debugLabel,
            flow.id,
        ),
        errorsAreFatal: true,
        onExit: resultPort.sendPort,
        onError: errorPort.sendPort,
    );
//    final Completer<R> result = Completer<R>();
    errorPort.listen((dynamic errorData) {
        assert(errorData is List<dynamic>);
        assert(errorData.length == 2);
        final Exception exception = Exception(errorData[0]);
        final StackTrace stack = StackTrace.fromString(errorData[1]);
        if (result.isCompleted) {
            Zone.current.handleUncaughtError(exception, stack);
        } else {
            result.completeError(exception, stack);
        }
    });
    resultPort.listen((dynamic resultData) {
//        assert(resultData == null || resultData is R);
        assert(resultData != null);
        if (!result.isCompleted)
            result.complete(resultData);
    });
    await result.future;
    Timeline.startSync('$debugLabel: end', flow: Flow.end(flow.id));
    resultPort.close();
    errorPort.close();
    isolate.kill();
    Timeline.finishSync();
    return result.future;
}

@immutable
class _IsolateConfiguration {
    const _IsolateConfiguration(
        this.callback,
        this.message,
        this.resultPort,
        this.debugLabel,
        this.flowId,
        );
    final Function callback;
    final dynamic message;
    final SendPort resultPort;
    final String debugLabel;
    final int flowId;

    dynamic apply() => callback(message);
}

Future<void> _spawn(_IsolateConfiguration configuration) async {
    dynamic result;
    await Timeline.timeSync(
        '${configuration.debugLabel}',
            () async { result = await configuration.apply(); },
        flow: Flow.step(configuration.flowId),
    );
    Timeline.timeSync(
        '${configuration.debugLabel}: returning result',
            () { configuration.resultPort.send(result); },
        flow: Flow.step(configuration.flowId),
    );
}
```

# 参考
1. [Dart 语法预览](http://dart.goodev.org/guides/language/language-tour)
2. [Dart Fundamentals – Isolates](https://codingwithjoe.com/dart-fundamentals-isolates/)
