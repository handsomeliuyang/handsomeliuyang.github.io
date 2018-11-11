---
title: Flutter实现Git权限分配工具之旅
date: 2018-10-30 14:40:35
categories: Android
tags:[Flutter, Android]
---
# Flutter初见
> Flutter is a mobile app SDK for building high-performance, high-fidelity, apps for iOS and Android, from a single codebase. 

Flutter 是一款移动应用程序 SDK，致力于使用一套代码来构建高性能、高保真的 iOS 和 Android 应用程序。

**Flutter的优势：**
1. 开发效率高：
    1. 一套代码开发 iOS 和 Android
    2. 热加载（hot reload）
3. 创建美观，高度定制的用户体验
    1. Material Design 和 Cupertino （iOS 风格）Widget
    2. 实现定制，美观，品牌驱动的设计，而不受 OEM Widget 集的限制

**框架结构（Architecture）**
![](https://flutter.io/images/whatisflutter/diagram-layercake.svg)
1. **[Skia](https://skia.org/)：**开源的2d图形库。其已作为Chrome, Chrome OS, Android, Firefox, Firefox OS等其他众多产品的图形引擎，支持平台还包括Windows,macOS,iOS8+,Ubuntu14.04+等。
2. **Dart：**
    1. debug：JIT(Just In Time)编译，运行时分析、编译，运行较慢。Hot Reload基于JIT运行
    2. release：AOT(Ahead Of Time)编译，生成了原生的arm代码，开发期间较慢，但运行期间快
    3. 一切都是对象，甚至数字，函数，和null都是对象
    4. 默认publick，通过加(_)标记为私有
    5. 单线程，没有锁的概念
3. **Text：**文本渲染

**Dart的线程模型**

Flutter与Android一样，通过Main线程和消息循环实现UI绘制操作与UI事件，如下所示：
![](/Flutter实现Git权限分配工具之旅/事件循环.png)

Dart的不同点：
1. Dart是单线程执行，通过Future来实现异步编程，只是把任务暂时放在消息队列里，本质还是单线程执行，与javascript类型
2. 两个消息队列：event队列和microtask队列

单线程带来的问题：单某个任务执行时间过长，超过16ms时，会导致丢帧，给用户的感觉就是卡顿，React借助requestIdleCallback Api实现了卡顿优化，[详情请参考](https://handsomeliuyang.github.io/2018/08/07/DiyReact%E5%AD%A6%E4%B9%A0%E4%B9%8B%E8%B7%AF/)

Dart解决这个问题的方案：通过[Isolate](https://docs.flutter.io/flutter/dart-isolate/Isolate-class.html)真正意义上创建线程，但此线程与java里的线程不一样：isolates之间不会共享内存，更像进程，通过传递message来进行交流，[Demo](https://flutter.io/docs/cookbook/networking/background-parsing)

**一切都是Widget**

Widgets是Flutter应用程序用户界面的基础构建模块，Widgets包含了views，view controllers，layouts等等能力。

Flutter提供了很多基组Widgets，但这些Widgets有一个与Android最大的不同点：每个Widget的能力很单一，如Text Widget，没有width, height, padding,color等等属性，需要借助其他Widget。

![](/Flutter实现Git权限分配工具之旅/widgets的基础组件.png)

更多细节请查看：[Flutter快速上车之Widget](https://www.jianshu.com/p/9e6c470ea5bf)

**StatelessWidget & StatefulWidget**

Flutter的widget分为无状态和有状态，如下所示：
![](http://doc.flutter-dev.cn/images/whatisflutter/diagram-widgetclass.svg)

如何选择？下面是我的一些经验：
1. 包含TextField的widget --- StatefulWidget
2. 用户交互时，产出的数据，如点击计数
    1. 局部数据 --- StatefulWidget
    2. 全局数据（store存储） --- StatelessWidget
3. 默认为StatelessWidget

**Widget，Element，RenderObject**

Flutter里的Widgets，Elements, RenderObject三要素与React中的Element，Instance/Fiber, Dom有点类似
1. Widgets：widget tree，只是属性集合，需要被绘制的属性集合，每次build，都是新对象，所以属性都要用final修饰
2. Elements：element tree，concrete widget tree，diff操作，每次build，不会重新构建，进行diff和update
3. RenderObject：真正负责layout, rendering等等操作，一般是由element创建

**Flutter的性能**

Flutter性能要高的原因：
1. debug为字节码，release为机器码
2. 不依赖OEM widgets
3. 没有bridge

> **Native View:**
>![](/Flutter实现Git权限分配工具之旅/native-view.png)

>**Hybrid:**
>![](/Flutter实现Git权限分配工具之旅/hybrid.png)

>**ReactNative:**
>![](/Flutter实现Git权限分配工具之旅/reactnative.png)

>**Flutter**
>![](/Flutter实现Git权限分配工具之旅/flutter.png)

<font color="#ff0000">注意：以上只是从实现角度分析，在机器性能好的情况下，实际差距不大</font>

# Git权限分配工具简介
为不同类型的角色批量分配Git权限的工具，整体效果如下：
![](/Flutter实现Git权限分配工具之旅/flutter-igit.gif)

源码下载地址：https://github.com/handsomeliuyang/flutter-igit

## 框架结构
![](/Flutter实现Git权限分配工具之旅/框架.png)

1. pubspec.yaml：与package.json/build.grale类似，用于配置程序的信息，如下所示：
    ![](/Flutter实现Git权限分配工具之旅/pubspec.yaml.png)
2. assets：用于存放内置图片与资源，自建目录可修改
3. lib：src目录，按功能模块分为：
    1. main.dart/main_dev.dart：程序的入口文件，与c语言类似，dart程序的入口为main()函数，main_dev.dart的区别是使用DevToolsStore，用于查看store与action
    2. App.dart：最外层的配置，如下所示：
        ```dart
        @override
        Widget build(BuildContext context) {
            return StoreProvider( // 使用Redux的要求
                store: widget.store,
                child: new MaterialApp( // 使用Material要求
                    title: 'Flutter igit', 
                    theme: new ThemeData( // 全局样式
                        primaryColor: const Color(0xFF1C306D),
                        accentColor: const Color(0xFFFFAD32),
                    ),
                    home: MainPage(
                        devDrawerBuilder: widget.devDrawerBuilder
                    ),
                ),
            );
        }
        ```
    3. 按功能划分目录：models, networking, redux, ui, utils

### redux

redux的结构非常简单，如下所示：
![](/Flutter实现Git权限分配工具之旅/redux_architecture.png)

由于Flutter是一个类似MVVM框架，所以通过StoreConnector实现数据监听，如下所示：
```dart
@override
Widget build(BuildContext context) {
    return StoreConnector<AppState, DrawListViewModel> (
        distinct: true,
        converter: (store) => DrawListViewModel.fromStore(store),
        builder: (context, viewModel){
            return DrawListContent(
                header: this.header,
                viewModel: viewModel,
            );
        },
    );
}
```

在Flutter里，应用了Redux后的实现结构为：
![](/Flutter实现Git权限分配工具之旅/flutter-redux-apply.png)

Redux是全局单例，应用的功能模块很多，所以redux的目录与state按功能模块的划分更加合适，如下所示：
```dart
class AppState {

    final TradelineState tradelineState;
    final PermissionState permissionState;
    final ProjectState projectState;

    AppState({
        @required this.tradelineState,
        @required this.permissionState,
        @required this.projectState
    });

    static initial() {
        return AppState(
            tradelineState: TradelineState.initial(),
            permissionState: PermissionState.initial(),
            projectState: ProjectState.initial()
        );
    }
    
    ...
}
```
![](/Flutter实现Git权限分配工具之旅/redux-catalog.png)

### network
flutter的http请求很简单，主要是使用两个Api：http，Uri，如下所示：
```dart
Future<List<GitProject>> getGroups(int page, String search) async {
    Uri uri = Uri.http(
        AUTHORITY,
        '${FIXED_PATH}/groups',
        <String, String>{
            'private_token': Config.LIUYANG_TOKEN,
            'per_page': PER_PAGE.toString(),
            'all_available': 'true',
            'page':'${page}',
            'search':'com.wuba'
        });

    final response = await http.get(uri.toString());
    final jsonResponse = json.decode(response.body);

    debugPrint('liuyang ${jsonResponse}');

    if(response.statusCode == 200){
        List<GitProject> groups = List<GitProject>();
        for(int i=0; i<jsonResponse.length; i++){
            groups.add(GitProject.fromJson(jsonResponse[i], ProjectType.group));
        }
        return groups;
    } else {
        throw Exception('Failed ${response.statusCode} ${response.body}');
    }
}
```

**注意：**
1. 上面是通过async,Future实现异步操作，但此异步并不是真正的开异步线程，只是把任务放在队列里，延迟执行而已，应该使用isolate实现真正的异步执行
2. 面向对象编程，每个Model里，都有两个Api：fromJson()，toJson()

## MainPage
整体效果：
![](/Flutter实现Git权限分配工具之旅/mainpage.png)
关键点：
1. 此框架页包含：AppBar，Drawer，DevDrawer，PermissionPage
2. 此框架默认应该是StatelessWidget，但由于AppBar的title需要动态拼接，导致只能改为StatefulWidget，如下：
    ```dart
    class _MyPageState extends State<MainPage> {
        Widget _buildTitle(BuildContext context) {
            return StoreConnector<AppState, Tradeline>(
                distinct: true,
                converter: (store) => store.state.tradelineState.current,
                builder: (BuildContext context, Tradeline currentTradeline) {
                    return Text(
                        '分配 ${currentTradeline?.name ?? ''} 的igit权限'
                    );
                },
            );
        }

        @override
        Widget build(BuildContext context) {
            return new Scaffold(
                appBar: new AppBar(title: _buildTitle(context)),
                drawer: Drawer(
                    child: DrawList(
                        header: DrawListHeader()
                    ),
                ),
                endDrawer: widget.devDrawerBuilder != null ? widget.devDrawerBuilder(context) : null,
                body: PermissionPage(),
            );
        }
    }
    ```
3. dart里创建对象时，new关键字不是必需的，如下：
    ```dart
    class Shape {
    }
    
    Shape shape = new Shape();
    Shape shape1 = Shape();
    ```
    在build时，个人感觉省略掉new关键字，可读性更强

## Drawer
效果如下：
![](/Flutter实现Git权限分配工具之旅/drawer.png)

功能比较简单，思路如下：
1. 通过StoreConnector，获取并监听Store
2. 构建ListView

```dart
class DrawList extends StatelessWidget {
    final Widget header;

    DrawList({
        @required this.header
    });

    @override
    Widget build(BuildContext context) {
        return StoreConnector<AppState, DrawListViewModel> (
            distinct: true,
            converter: (store) => DrawListViewModel.fromStore(store),
            builder: (context, viewModel){
                return DrawListContent(
                    header: this.header,
                    viewModel: viewModel,
                );
            },
        );
    }

}

class DrawListContent extends StatelessWidget {

    final Widget header;
    final DrawListViewModel viewModel;

    DrawListContent({
        @required this.header,
        @required this.viewModel
    });

    @override
    Widget build(BuildContext context) {
        return ListView.builder(
            itemCount: this.viewModel.tradelines.length + 1,
            itemBuilder: (BuildContext context, int index) {
                if (index == 0) {
                    return this.header;
                }

                Tradeline tradeline = this.viewModel.tradelines[index - 1];
                bool isSelected = this.viewModel.currentTradeline.name ==
                    tradeline.name;
                var backgroundColor = isSelected
                    ? const Color(0xFFEEEEEE)
                    : Theme
                    .of(context)
                    .canvasColor;

                return Material(
                    color: backgroundColor,
                    child: ListTile(
                        onTap: () {
                            viewModel.changeCurrentTradeline(tradeline);
                            Navigator.pop(context);
                        },
                        selected: isSelected,
                        title: Text(tradeline.name),
                    ),
                );
            }
        );
    }

}
```

关键点：
1. ListTile的属性有限，设置Item的背景通过Material Widget，也可以通过Container Widget
2. ListView没有header的概念，都是item
3. ListView没有分隔线的Api，分隔线是由Item实现，通过ListTile.divideTiles()实现，其内部是通过DecoratedBox Widget实现
4. Navigator栈：Drawer，Dialog，Route都由Navigator栈管理，所以如下操作都是出栈操作Navigator.pop(context)：
    1. dismiss drawer
    2. dismiss dialog
    3. Back

## Permission

Panel效果的源码来自：flutter_gallery里的Expansion panels例子，个人学习新技术的过程：
1. 看官方的文档
2. 运行官方demo，思考如何实现，对照源码的实现

具体的代码，可通过下载源码查看，这里重点讲一下Flutter的生命周期函数，在Flutter里，StatelessWidget和StatefulWidget没有生命周期，因为其是不可变的，只有State才有生命周期，如下所示：
![](/Flutter实现Git权限分配工具之旅/state-lifecycle.png)

当数据变化时，StatelessWidget与StatefulWidget每次都会创建新的对象，并执行build()函数，State会被复用，造成flutter程序的如下特点：
1. StatelessWidget, StatefulWidget里的成员变量都是final的，可以理解为React里的props
2. State里的成员变量可以理解为React里的state，即为局部变量（Store里的为全局变量）
3. State的initState()只执行一次，如果成员变量需要依据props而修改，可以在didUpdateWidget()里更新
4. 修改State的成员变量时，如果希望界面需要同步修改，需要在setState()里修改，如下所示：--- <font color="#ff0000">大家可以对比下与React的setState()有什么区别？</font>
    ```dart
    setState(() {
        item.isExpanded = false;
    });
    ```

如下所示：
```dart
class PermissionContent extends StatefulWidget {
    final List<GitProject> projects;
    final List<GitUser> users;
    final Function addGitProject;
    final Function deleteGitProject;
    final Function getUserIdByName;
    final Function deleteGitUser;
    final Function allocationPermission;

    const PermissionContent({
        @required this.projects,
        @required this.users,
        @required this.addGitProject,
        @required this.deleteGitProject,
        @required this.getUserIdByName,
        @required this.deleteGitUser,
        @required this.allocationPermission
    });

    @override
    _PermissionContentState createState() => _PermissionContentState();
}

class _PermissionContentState extends State<PermissionContent> {
    static const Map<String, String> ACCESS_LEVEL = {...};

    List<PanelItem> _panelItems;
    PanelItem _userPanelItem;
    PanelItem _rolePanelItem;
    PanelItem _projectPanelItem;

    @override
    void initState() {
        super.initState();
        _userPanelItem = _initUserPanelItem();
        _rolePanelItem = _initRolePanelItem();
        _projectPanelItem = _initProjectPanelItem();
        _panelItems = <PanelItem>[
            _userPanelItem,
            _rolePanelItem,
            _projectPanelItem
        ];
    }

    @override
    void didUpdateWidget(PermissionContent oldWidget) {
        super.didUpdateWidget(oldWidget);
        // 更新数据
        _projectPanelItem.value = widget.projects;
        _userPanelItem.value = widget.users;
    }

    void _navigatorProjectPage(BuildContext context) async {...}

    PanelItem _initUserPanelItem() {...}

    PanelItem _initRolePanelItem() {...}

    PanelItem _initProjectPanelItem() {...}
    
    @override
    Widget build(BuildContext context) {...}
}
```

** 交互反馈 **

除了通过Widget构建界面外，有时我们还需要给用户交互反馈：
1. Toasts/Snackbars：仅信息反馈，定时消失，不进Navigator栈
    ```dart
    Scaffold.of(context).showSnackBar(new SnackBar(
        content: new Text("权限分配成功"),
    ));
    ```
2. Dialog：信息反馈，有进一步交互，Natvigator栈管理
    ```dart
    // show:
    showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context){
            return Dialog(
                child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                        CircularProgressIndicator(),
                        Text("Loading"),
                    ],
                ),
            );
        }
    );
    // Dismiss:
    Navigator.pop(context);
    ```

Dialog仅仅只是modal，无法通过props来控制显示与消失，只能监听局部变量state或全局变量store来控制show与dismiss，分配权限的过程的代码如下：
```dart
// 创建Completer对象
Completer<bool> completer = Completer<bool>();
// 发送action，通过igit的Api分配权限
widget.allocationPermission(completer, users, level, projects);

// 同时显示LoadingDialog
showDialog(
    context: context,
    barrierDismissible: false,
    builder: (BuildContext context){
        return Dialog(
            child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                    CircularProgressIndicator(),
                    Text("Loading"),
                ],
            ),
        );
    }
);
// 监听成功与失败，并显示不同Toasts
completer.future.then((user){
    Navigator.pop(context);

    Scaffold.of(context).showSnackBar(new SnackBar(
        content: new Text("权限分配成功"),
    ));

}, onError: (e){
    Navigator.pop(context);

    Scaffold.of(context).showSnackBar(new SnackBar(
        content: new Text("权限分配失败 ${e}"),
    ));
});
```

## Project

效果如下：
![](/Flutter实现Git权限分配工具之旅/project.png)

详细细节请查看代码，重点分享其中几个关键点

**LoadingView**  
除静态页面外，所有的页面都有一个共同的加载流程：加载中...，失败/成功。统一实现LoadingView，如下所示：
```dart
class ProjectListWrap extends StatelessWidget {

    final ProjectListViewModel projectListViewModel;

    ProjectListWrap({
        this.projectListViewModel
    });

    @override
    Widget build(BuildContext context) {
        return LoadingView(
            status: projectListViewModel.status,
            loadingContent: PlatformAdaptiveProgressIndicator(),
            errorContent: ErrorView(
                description: '加载出错',
                onRetry: projectListViewModel.refreshProjects,
            ),
            successContent: ProjectListContent(
                projects: projectListViewModel.projects,
                nextState: projectListViewModel.nextStatus,
                currentPage: projectListViewModel.currentPage,
                hasNext: projectListViewModel.hasNext,
                refreshProjects: projectListViewModel.refreshProjects,
                fetchNextProjects: projectListViewModel.fetchNextProjects,
            ),
        );
    }
}
```

**下滑加载下一页**  
列表数据很多，通过滑动动态加载下一页数据，监听的方式与Android的类似，通过监听其滑动位置，同时由于滑动是有状态的，所以要使用StatefulWidget，如下所示：
```dart
class ProjectListContent extends StatefulWidget {

    final List<GitProject> projects;
    final LoadingStatus nextState;
    final int currentPage;
    final bool hasNext;
    final Function refreshProjects;
    final Function fetchNextProjects;

    ProjectListContent({
        @required this.projects,
        @required this.nextState,
        @required this.currentPage,
        @required this.hasNext,
        @required this.refreshProjects,
        @required this.fetchNextProjects
    });

    @override
    State<StatefulWidget> createState() => _ProjectListContentState();
}

class _ProjectListContentState extends State<ProjectListContent> {

    final ScrollController scrollController = ScrollController();

    @override
    void initState() {
        super.initState();

        scrollController.addListener(_scrollListener);
    }

    @override
    void dispose() {
        scrollController.removeListener(_scrollListener);

        scrollController.dispose();
        super.dispose();
    }

    void _scrollListener() {
        if (scrollController.position.extentAfter < 64 * 3) {
            if(widget.nextState == LoadingStatus.success && widget.hasNext){
                widget.fetchNextProjects(widget.currentPage + 1);
            }
        }
    }

    @override
    Widget build(BuildContext context) {...}

    Widget _nextStateToText() {
        if(!widget.hasNext) {
            return Text('加载成功，已无下一页');
        }

        if(widget.nextState == LoadingStatus.error){
            return Text('加载失败，滑动重新加载');
        }

        return Text('加载中...');
    }
}
```

# 总结

Flutter是不同于ReactNative的跨端解决方案，是以一套代码实现高开发效率与高性能为目标，没有ReactNative的bridge，同时通过Dart解决javascript开发效率问题。

现在Flutter比较ReactNative的最大问题是：release下不支持"hot update"，官方的解释如下：
>Often people ask if Flutter supports "code push" or "hot update" or other similar names for pushing out-of-store updates to apps.
>
>Currently we do not offer such a solution out of the box, but the primary blockers are not technological. Flutter supports just in time (JIT) or interpreter based execution on both Android and iOS devices. Currently we remove these libraries during --release builds, however we could easily include them.
>
>The primary blockers to this feature resolve around current quirks of the iOS ecosystem which may require apps to use JavaScript for this kind of over-the-air-updates functionality. Thankfully Dart supports compiling to JavaScript and so one could imagine several ways in which one compile parts of ones application to JavaScript instead of Dart and thus allows replacement of or augmentation with those parts in deployed binaries.
>
>This bug tracks adding some supported solution like this. I'll dupe all the other reports here.
>
> 简单翻译：Flutter不支持release下的hot update，不是由于技术原因，而是iOS系统只支持javaScript实现无线更新功能，由于Dart可以转换为Javasript代码，所以有一种可能性：程序的一部分使用javascript，而不是dart，再通过动态下载这部分javascript代码，实现hot update。

Flutter是否会成为主流的跨端解决方案，主要原因不在于其高的开发效率与高性能，主要是看Fushsia操作系统的覆盖程序，如果Fushsia能成为主流的物联网与Android设备的主流系统，Flutter才能真正成为主流。

# 参考
1. [Technical Overview](https://flutter.io/technical-overview/)
2. [Why I move to Flutter](https://medium.com/@nhancv/why-i-move-to-flutter-34c4005b96ef)
3. [Dart与消息循环机制[翻译]](https://www.jianshu.com/p/7549b63a72d7)
4. [Flutter快速上车之Widget](https://www.jianshu.com/p/9e6c470ea5bf)
5. [Flutter, what are Widgets, RenderObjects and Elements?](https://medium.com/flutter-community/flutter-what-are-widgets-renderobjects-and-elements-630a57d05208)
6. [Introduction to Redux in Flutter](https://blog.novoda.com/introduction-to-redux-in-flutter/)
7. [User Feedback: Toasts / Snackbars](https://flutterbyexample.com/user-feedback-toasts-snackbars/)
8. [Code Push / Hot Update / out of band updates](https://github.com/flutter/flutter/issues/14330)
