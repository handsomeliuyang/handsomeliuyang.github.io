---
title: Flutter在58App上的深度调研
date: 2019-04-16 11:23:34
categories: Android
tags: [Flutter, Android]
---

# 背景

现在跨平台的框架主要有如下几种：
1. ReactNative，Weex
2. kotlin-native
3. Flutter
4. 小程序
5. Hybrid

长期来看，跨平台开发一定会是一个趋势，因为其能带来如下好处：
1. 减少开发成本，提升开发效率
2. 动态部署，不依赖发版

但现阶段，框架很多，各有各的优缺点，对于应用开发的RD来说，面临一个框架如何选择的难题。在行业趋势没有真正出现之前，RD应该要勇于去学习，去尝试新框架，学习其设计思想，体验其优势与劣势，找到最适合自己的框架。

之前对Flutter做过简单应用的尝试（[Flutter实现Git权限分配工具之旅](https://handsomeliuyang.github.io/2018/10/30/Flutter%E5%AE%9E%E7%8E%B0Git%E6%9D%83%E9%99%90%E5%88%86%E9%85%8D%E5%B7%A5%E5%85%B7%E4%B9%8B%E6%97%85/)），但不够深入，任何一个框架在没有真正进行深入实践时，根本无法判断其优缺点，为了不浮于表面，人云亦云的去判定Flutter框架，才有了这次的调研：基于Flutter实现58App的首页功能（首页模块是58App相对比较复杂的模块）

# 具体实现
## 首页tab框架
**实现效果**

<iframe height= 520 width= 100% src="/2019/04/16/Flutter在58App上的深度调研/首页tab框架.gif" frameborder=0 allowfullscreen></iframe>

在Flutter的Material Widget里，有BottomNavigationBar和TabBar两个类似的效果，但都无法直接使用，改造成本非常的大，最终选择自定义实现底部栏。

### 自定义ImageButton Widget
ImageButton的要求：
1. 支持图片与文本
2. 支持两种状态：default，active
3. 不同状态有不同的图片，不同的文本颜色

实现思路：
1. InkResponse Widget实现处理点击事件
2. Column布局
3. StatelessWidget，通过props来修改状态

```dart
import 'package:flutter/material.dart';

class ImageButton extends StatelessWidget {

    final double width;
    final double height;
    final String imageAssetName;
    final String activeImageAssetName;
    final GestureTapCallback onTap;
    final String text;
    final Color textColor;
    final Color activeTextColor;

    final bool isActive;

    const ImageButton({Key key,
        @required this.width,
        @required this.height,
        @required this.imageAssetName,
        @required this.activeImageAssetName,
        this.text,
        this.textColor,
        this.activeTextColor,
        this.onTap,
        @required this.isActive
    }) : super(key: key);


    @override
    Widget build(BuildContext context) {
        return InkResponse(
            child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                    Image.asset(
                        this.isActive ? this.activeImageAssetName : this.imageAssetName,
                        width: width,
                        height: height,
                        fit: BoxFit.contain
                    ),
                    Text(
                        this.text,
                        style: TextStyle(color: this.isActive ? this.activeTextColor : this.textColor),
                    )
                ],
            ),
            onTap: onTap,
        );
    }

}
```

### 自定义HomeBottomNavigationBar Widget
要求：
1. tabItem数量为奇数，中间的发布大小凸出来
2. 能与TabBarView联动

实现思路：
1. Container Widget设置高度，背景
2. Row，Expanded做等分
3. Padding设置每个tabItem的paddingTop
4. 通过TabController实现与TabBarView联动
    5. tabController 继承 ChangeNotifier，ChangeNotifier是用于通知观察机制
    6. _controller.addListener()来监听TabBarView的切换
    7. _controller.animateTo(i)来通知tab的切换

代码如下：
```dart
import 'package:flutter/material.dart';
import 'package:flutter_gallery/wuba_demo/home/publish/publish_home.dart';
import '../wuba_ui/button/image_button.dart';

class NavigationItem {
    final String title;

    final String icon;
    final String activeIcon;

    NavigationItem({
        this.title,
        this.icon,
        this.activeIcon
    });
}

class HomeBottomNavigationBar extends StatefulWidget {

    final List<NavigationItem> items;
    final Function onTap;
    final TabController controller;
    final Color defaultColor;
    final Color selectColor;

    HomeBottomNavigationBar({
        @required this.items,
        this.onTap,
        @required this.controller,
        @required this.defaultColor,
        @required this.selectColor
    });

    @override
    _HomeBottomNavigationBarState createState() => _HomeBottomNavigationBarState();
}

class _HomeBottomNavigationBarState extends State<HomeBottomNavigationBar> {

    int _currentIndex;
    TabController _controller;

    @override
    void initState() {
        super.initState();
        _updateTabController();
    }

    @override
    void didUpdateWidget(HomeBottomNavigationBar oldWidget) {
        super.didUpdateWidget(oldWidget);
        _updateTabController();
    }


    @override
    void dispose() {
        if (_controller != null) {
            _controller.removeListener(_handleTabControllerTick);
        }
        super.dispose();
    }

    void _handleTabControllerTick() {
        debugPrint('_handleTabControllerTick ${_controller.index}');
        if (this._currentIndex != _controller.index) {
            setState(() {
                this._currentIndex = _controller.index;
            });
        }
    }

    void _updateTabController() {
        if (widget.controller == _controller) {
            return;
        }
        // 移除老的controller的listener
        if (_controller != null) {
            _controller.removeListener(_handleTabControllerTick);
        }

        _controller = widget.controller;
        if (_controller != null) {
            _controller.addListener(_handleTabControllerTick);
            _currentIndex = _controller.index;
        }
    }

    @override
    Widget build(BuildContext context) {
        var children = <Widget>[];
        // 添加正常的tab选项
        for (var i = 0; i < widget.items.length; i++) {
            var navigationItem = widget.items[i];
            children.add(Expanded(
                flex: 1,
                child: Padding(
                    padding: EdgeInsets.only(top: 15),
                    child: ImageButton(
                        width: 23,
                        height: 23,
                        imageAssetName: navigationItem.icon,
                        activeImageAssetName: navigationItem.activeIcon,
                        text: navigationItem.title,
                        textColor: widget.defaultColor,
                        activeTextColor: widget.selectColor,
                        isActive: this._currentIndex == i,
                        onTap:  () {
                            if (this._controller != null) {
                                this._controller.animateTo(i);
                            }
                            if (widget.onTap != null) {
                                widget.onTap(i);
                            }
                        },
                    ),
                )
            ));
        }

        // 添加发布item
        children.insert(2, Expanded(
            flex: 1,
            child: ImageButton(
                width: 40,
                height: 40,
                imageAssetName: 'assets/images/home/wb_home_tab_publish_img.png',
                activeImageAssetName: '',
                text: '发布',
                textColor: widget.defaultColor,
                isActive: false,
                onTap: (){
                    Navigator.push(context, PageRouteBuilder(
                        transitionDuration: Duration(),
                        pageBuilder: (BuildContext context, Animation<double> animation, Animation<double> secondaryAnimation){
                            return PublishHome();
                        }
                    ));
                },
            ),
        ));

        return Container(
            height: 63,
            decoration: BoxDecoration(
                image: DecorationImage(
                    image: AssetImage('assets/images/home/wb_tab_bg.png'),
                    fit: BoxFit.fill
                )
            ),
            child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: children,
            )
        );
    }
}
```

### 首页tab
实现思路：
1. Stack Positioned实现叠层布局，解决tabbar凸起部份覆盖在TabBarView上
2. TabBarView Widget实现类似ViewPager效果

代码如下：
```dart
import 'package:flutter/material.dart';
import 'home_bottom_navigation_bar.dart';
import 'package:wubarn_plugin/wuba_rn_view.dart';

class HomeDemo extends StatefulWidget {
    static const String routeName = '/wuba/home';

    const HomeDemo({ Key key }) : super(key: key);

    @override
    _HomeDemoState createState() => _HomeDemoState();
}

class _HomeDemoState extends State<HomeDemo>
    with SingleTickerProviderStateMixin {

    List<NavigationItem> _navigationViews;
    TabController controller;

    @override
    void initState() {
        super.initState();

        _navigationViews = <NavigationItem>[
            NavigationItem(
                icon: 'assets/images/home/wb_home_tap_index_normal.png',
                activeIcon: 'assets/images/home/wb_home_tap_index_pressed.png',
                title: '首页',
            ),
            NavigationItem(
                icon: 'assets/images/home/wb_home_tap_history_normal.png',
                activeIcon: 'assets/images/home/wb_home_tap_history_pressed.png',
                title: '部落',
            ),
            NavigationItem(
                icon: 'assets/images/home/wb_home_tap_message_normal.png',
                activeIcon: 'assets/images/home/wb_home_tap_message_pressed.png',
                title: '消息',
            ),
            NavigationItem(
                icon: 'assets/images/home/wb_home_tap_center_normal.png',
                activeIcon: 'assets/images/home/wb_home_tap_center_pressed.png',
                title: '我的',
            )
        ];

        controller = TabController(
            initialIndex: 2, length: this._navigationViews.length, vsync: this);
    }

    @override
    Widget build(BuildContext context) {
        return Scaffold(
            body: Stack(
                children: <Widget>[
                    Positioned(
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 50,
                        child: TabBarView(
                            controller: controller,
                            children: <Widget>[
                                Container(
                                    color: Colors.red,
                                    child: Text('Fragment'),
                                ),
                                Container(
                                    child: WubaRNView(),
                                ),
                                Container(
                                    color: Colors.white,
                                    child: Text('Fragment'),
                                ),
                                Container(
                                    color: Colors.yellow,
                                    child: Text('Fragment'),
                                )
                            ]
                        ),
                    ),
                    Positioned(
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 63,
                        child: HomeBottomNavigationBar(
                            items: this._navigationViews,
                            controller: this.controller,
                            defaultColor: Colors.black,
                            selectColor: Colors.red,
                        ),
                    )
                ],
            ),
        );
    }
}
```

### 内嵌ReactNative

实现思路：
1. 通过独立的Flutter Plugin实现
2. ReactNative的ReactRootView可以被嵌入Native中，那同样可以被嵌入Flutter中
3. Flutter的AndroidView只有两个状态：create，dispose。在这两个状态里，执行ReactNative相关的生命周期函数

dart部分：创建对应的Widget
```dart
class WubaRNView extends StatefulWidget {

    @override
    _WubaRNViewState createState() => _WubaRNViewState();
}

class _WubaRNViewState extends State<WubaRNView> {

    @override
    Widget build(BuildContext context) {
        // 不同的端，其通信方式不一样
        if (defaultTargetPlatform == TargetPlatform.android) {
            return AndroidView(
                viewType: 'plugins.wuba.com/wubarnview',
                onPlatformViewCreated: _onPlatformViewCreated,
            );
        }
        return Text(
            '$defaultTargetPlatform is not yet supported by the WubaRNView plugin');
    }

    void _onPlatformViewCreated(int id) {

    }
}
```

Android的实现：
1. 注册ViewFactory
    ```java
    public class WubarnPlugin {
        public static final String VIEW_TYPE = "plugins.wuba.com/wubarnview";

        /** Plugin registration. */
        public static void registerWith(Registrar registrar) {
            registrar.platformViewRegistry().registerViewFactory(VIEW_TYPE, new WubarnViewFactory(registrar.messenger()));
        }
    }
    ```
2. 通过ViewFactory创建WubarnView
    ```java
    public class WubarnViewFactory extends PlatformViewFactory {
        private final BinaryMessenger messenger;

        public WubarnViewFactory(BinaryMessenger messenger) {
            super(StandardMessageCodec.INSTANCE);
            this.messenger = messenger;
        }

        @Override
        public PlatformView create(Context context, int id, Object o) {
            return new WubarnView(context, messenger, id);
        }
    }
    ```
3. WubarnView的具体实现
    ```java
    public class WubarnView implements PlatformView, MethodChannel.MethodCallHandler{
        private final ReactRootView mReactRootView;
        private final ReactInstanceManager mReactInstanceManager;

        public WubarnView(Context context, BinaryMessenger messenger, int id) {
            MethodChannel methodChannel = new MethodChannel(messenger, WubarnPlugin.VIEW_TYPE + "_" + id);
            methodChannel.setMethodCallHandler(this);
            // ReactNative的创建及初始化，设置其默认加载的bundle名称
            mReactRootView = new ReactRootView(context);
            mReactInstanceManager = ReactInstanceManager.builder()
                    .setApplication((Application) context.getApplicationContext())
                    .setBundleAssetName("index.android.bundle")
                    .setJSMainModulePath("index")
                    .addPackage(new MainReactPackage())
                    .setUseDeveloperSupport(false)
                    .setInitialLifecycleState(LifecycleState.RESUMED)
                    .build();
            // 这个"App1"名字一定要和我们在index.js中注册的名字保持一致AppRegistry.registerComponent()
            mReactRootView.startReactApplication(mReactInstanceManager, "App1", null);
        }

        @Override
        public View getView() {
            return mReactRootView;
        }

        @Override
        public void dispose() {
            // mReactInstanceManager.onHostPause(mActivity);
            // mReactInstanceManager.onHostResume(mActivity, null);
            // mReactInstanceManager.onHostDestroy(mActivity);
            mReactRootView.unmountReactApplication();
        }

        @Override
        public void onMethodCall(MethodCall methodCall, MethodChannel.Result result) {
            switch (methodCall.method){
                case "":
                    break;
                default:
                    result.notImplemented();
            }
        }
    }
    ```
4. 上面初始化ReactInstanceManager当中的常量，与React代码是一一对应的
    1. "App1"：与在React里注册的组件名称是一样的
        ```javascript
        import { AppRegistry } from 'react-native';
        import App from './App';
        
        AppRegistry.registerComponent('App1', () => App);
        ```
    2. .setJSMainModulePath("index")：JS bundle中主入口的文件名，是React工程里的入口文件index.js的名称
    3. .setBundleAssetName("index.android.bundle")：这个是内置到assets目录下的bundle名称，与bundle生成命令有关
        ```shell
        react-native bundle --platform android --dev false --entry-file index.js --bundle-output /Users/ly/liuyang/workspace_flutter/wubarn_plugin/example/android/app/src/main/assets/index.android.bundle --assets-dest /Users/ly/liuyang/workspace_flutter/wubarn_plugin/example/android/app/src/main/res/
        ```

## 发布入口页
**实现效果**

<iframe height= 520 width= 100% src="/2019/04/16/Flutter在58App上的深度调研/发布入口页.gif" frameborder=0 allowfullscreen></iframe>

### 切换效果

实现思路：
1. 通过PageRoute，去掉切换的动画
2. 通过AnimatedBuilder，实现旋转动画
3. 通过WillPopScope Widget拦截返回事件

Flutter的页面切换是由Navigator管理，其中有一个栈，栈帧是路由，通过PageRoute可以自定义切换的动画，如下去掉切换动画的代码：
```dart
Navigator.push(context, PageRouteBuilder(
    transitionDuration: Duration(), // 去掉了执行动画的时间
    pageBuilder: (BuildContext context, Animation<double> animation, Animation<double> secondaryAnimation){
        return PublishHome();
    }
));
```

由于Flutter是MVVM框架，Flutter里的Animation只负责计算，不负责界面布局与渲染，需要手动调用setState()来让界面重绘，不过可以通过AnimatedBuilder简化流程，但Flutter在实现组合动画比较麻烦。
```dart
class PublishHome extends StatefulWidget {
    @override
    _PublishHomeState createState() => _PublishHomeState();
}

class _PublishHomeState extends State<PublishHome> with SingleTickerProviderStateMixin {

    Animation<double> animation;
    AnimationController controller;

    @override
    void initState() {
        super.initState();

        controller = AnimationController(duration: Duration(milliseconds: 200), vsync: this);
        animation = Tween(begin: 0.0, end: 45.0).animate(controller);
        animation.addStatusListener((AnimationStatus status){
            if(status == AnimationStatus.dismissed) {
                Navigator.pop(context);
            }
        });
        controller.forward();
    }

    @override
    Widget build(BuildContext context) {
        return WillPopScope(
            onWillPop: () async {
                controller.reverse();
                return false;
            },
            child: Scaffold(
                backgroundColor: Colors.white,
                body: SafeArea(
                    top: true,
                    child: Stack(
                        children: <Widget>[
                            ...
                            Positioned(
                                left: 0,
                                right: 0,
                                bottom: 0,
                                height: 63,
                                child: GestureDetector(
                                    child: Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: <Widget>[
                                            AnimatedBuilder(
                                                animation: this.animation,
                                                builder: (BuildContext context, Widget child){
                                                    return Transform.rotate(
                                                        angle: animation.value * math.pi / 180.0,
                                                        child: child,
                                                    );
                                                },
                                                child: Image.asset(
                                                    'assets/images/home/wb_home_tab_publish_img.png',
                                                    width: 40,
                                                    height: 40,
                                                    fit: BoxFit.contain
                                                ),
                                            ),
                                            Text(
                                                '发布',
                                                style: TextStyle(color: Colors.white),
                                            )
                                        ],
                                    ),
                                    onTap: (){
                                        controller.reverse();
                                    },
                                ),
                            )
                        ],

                    ),
                ),
            )
        );
    }
}
```

### 渐变按钮
要求：
1. 不使用图片实现
2. 背景支持渐变
3. 不要点击效果

Material Widget里的四种Button无法满足按钮要求，第三方渐变按钮也无法完全满足要求，通过Container Widget的decoration自定义此Widget：
```dart
import 'package:flutter/material.dart';

class GradientButton extends StatelessWidget {
    final double width;
    final double height;
    final Gradient gradient;
    final Widget child;
    final Function onTap;
    final BorderRadius shapeRadius;

    const GradientButton(
        {Key key, this.width, this.height, this.gradient, this.onTap, this.shapeRadius, this.child})
        : super(key: key);

    @override
    Widget build(BuildContext context) {
        return GestureDetector(
            onTap: this.onTap,
            child: Container(
                width: this.width,
                height: this.height,
                decoration: BoxDecoration(
                    gradient: this.gradient, // 设置渐变
                    borderRadius: this.shapeRadius // 设置圆角
                ),
                child: Center(
                    child: child,
                )
            ),
        );
    }
}
```

## 部落图片选择控件
**实现效果**

<iframe height= 520 width= 100% src="/2019/04/16/Flutter在58App上的深度调研/部落图片选择控件.gif" frameborder=0 allowfullscreen></iframe>

### 底部抽屉效果
要求：
1. BottomSheet增加中间态
2. 有回弹效果

第三方库RubberBottomSheet实现了此效果，其原理如下：
1. 通过Stack实现叠加布局
2. 修改AnimationController的原码，依据lowerBound，upperBound的实现思路，实现halfBound，即中间态

直接使用RubberBottomSheet的代码非常简单：
```dart
class TribePublish extends StatefulWidget {

    @override
    _TribePublishState createState() => _TribePublishState();

}

class _TribePublishState extends State<TribePublish> with SingleTickerProviderStateMixin {

    RubberAnimationController _controller;

    @override
    void initState() {
        super.initState();
        _controller = RubberAnimationController(
            vsync: this,
            lowerBoundValue: AnimationControllerValue(pixel: 54),
            halfBoundValue: AnimationControllerValue(pixel: 300),
            upperBoundValue: AnimationControllerValue(percentage: 1.0),
            duration: Duration(milliseconds: 200)
        );
    }

    @override
    Widget build(BuildContext context) {
        return Scaffold(
            backgroundColor: Colors.white,
            appBar: AppBar(
                title: Text('部落发布'),
            ),
            body: RubberBottomSheet(
                header: _getHeader(),
                lowerLayer: _getLowerLayer(),
                upperLayer: _getUpperLayer(),
                animationController: _controller,
            )
        );
    }
}
```

### 加载并显示相册图片

**加载相册图片**
1. 通过MethodChannel，实现与Native通信，加载相册图片
2. 在Android里，加载相册图片，需要先授权
3. 防止相册图片过多，需进行分页加载

Android端的代码实现：
```java
public class AlbumManagerPlugin implements MethodChannel.MethodCallHandler {

    public static void registerWith(PluginRegistry registry) {
        registerWith(registry.registrarFor("com.wuba.plugins.AlbumManagerPlugin"));
    }

    public static void registerWith(PluginRegistry.Registrar registrar){
        final MethodChannel channel = new MethodChannel(registrar.messenger(), "plugins.wuba.com/album_manager");
        channel.setMethodCallHandler(new AlbumManagerPlugin(registrar.context(), registrar));
    }

    /**
     * the page size of query albums
     */
    public static final int PAGE_SIZE = 200;

    private final Context mContext;
    private final PluginRegistry.Registrar mRegistrar;
    private PermissionsUtils mPermissionsUtils;

    public AlbumManagerPlugin(Context context, PluginRegistry.Registrar registrar) {
        this.mContext = context;
        mRegistrar = registrar;
        mPermissionsUtils = new PermissionsUtils();

        registrar.addRequestPermissionsResultListener(new PluginRegistry.RequestPermissionsResultListener() {
            @Override
            public boolean onRequestPermissionsResult(int i, String[] strings, int[] ints) {
                mPermissionsUtils.dealResult(i, strings, ints);
                return false;
            }
        });
    }

    @Override
    public void onMethodCall(MethodCall methodCall, MethodChannel.Result result) {
        // 先申请权限
        mPermissionsUtils.setPermissionsListener(new PermissionsListener() {
            @Override
            public void onDenied(String[] deniedPermissions) {
                Log.i("permission", "onDenied call.method = ${call.method}");

                result.error("失败", "权限被拒绝", "");
            }

            @Override
            public void onGranted() {
                switch (methodCall.method){
                    case "getAllImage":
                        getAllImage(methodCall, result);
                        break;
                    default:
                        result.notImplemented();
                }
            }
        });
        mPermissionsUtils.withActivity(mRegistrar.activity());
        mPermissionsUtils.getPermissions(mRegistrar.activity(), 3001, Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE);
    }

    private void getAllImage(MethodCall methodCall, MethodChannel.Result result) {
        List<String> list = new ArrayList<String>();

//        int pageIndex = methodCall.argument("pageIndex");
        int pageIndex = 0;

        Log.d("liuyang", "" + methodCall.argument("pageIndex"));

        String[] projection = {MediaStore.Images.ImageColumns.DATA, MediaStore.Images.ImageColumns.BUCKET_DISPLAY_NAME};
        String sortOrder = MediaStore.Images.Media.DATE_TAKEN + " DESC limit " + PAGE_SIZE + " offset " + pageIndex * PAGE_SIZE;
        //执行分页
        String selection = null;
//        if (!ALL_PHOTO.equals(s)) {
//            selection = MediaStore.Images.ImageColumns.BUCKET_DISPLAY_NAME + " = '" + s + "' ";
//        }

        Cursor cursor = mContext.getContentResolver().query(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,
                projection, selection, null, sortOrder);
        try {
            if (cursor != null) {
                while (cursor.moveToNext()) {
                    // 获取图片的路径
                    String path = cursor.getString(cursor.getColumnIndex(MediaStore.Images.ImageColumns.DATA));
                    list.add(path);
                }

                result.success(list);
            }
        } catch (Exception e) {
//            LOGGER.e(TAG, e.toString());
            result.error("AlbumManagerPlugin", e.getMessage(), "");
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
    }
}
```

Flutter端的代码实现：
```dart
class AlbumManagerPlugin {

    static const MethodChannel _channel = MethodChannel('plugins.wuba.com/album_manager');

    static Future<List<AssetEntity>> getAllAssetList(int pageIndex) async {
        Map<dynamic, dynamic> map = Map<dynamic, dynamic>();
        map['pageIndex'] = pageIndex;
        List<dynamic> paths = await _channel.invokeMethod('getAllImage', map);
        return _castAsset(paths);
    }

    static Future<List<AssetEntity>> _castAsset(List<dynamic> paths) async {
        List<AssetEntity> result = <AssetEntity>[];
        for (var i = 0; i < paths.length; i++) {
            result.add(AssetEntity(path: paths[i]));
        }
        return result;
    }
}
```

细节点：
1. Native的扩展能力定义为Plugin，Plugin可以独立发布为一个库，里面即有native代码也有dart代码，不用像ReactNative，需要单独合并native的代码，但带的问题是：dependencies库都是直接原码
2. 通过MethodChannel进行Flutter与Native通信，可以传递参数，如何传递一组参数了，通过源码分析：Map对象

**分页显示图片**
1. 通过GridView显示图片，实现分页加载
2. 默认的图片加载策略是LRU，体验与内存表现都很不好

下面的代码没有实现分页与图片加载策略的优化：
```dart
class AlbumGrid extends StatefulWidget {
    @override
    _AlbumGridState createState() => _AlbumGridState();
}

class _AlbumGridState extends State<AlbumGrid> {
    List<AssetEntity> list = new List<AssetEntity>();
    int currentPage = -1;
    @override
    void initState() {
        super.initState();

        // 加载第一页数据
        _initData(0);
    }
    void _initData(int nextPage) async {
        List<AssetEntity> newPage = await AlbumManagerPlugin.getAllAssetList(nextPage);
        this.setState((){
            list.addAll(newPage);
            currentPage = nextPage;
        });
    }
    @override
    Widget build(BuildContext context) {
        return GridView.builder(
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                mainAxisSpacing: 4.0,
                crossAxisSpacing: 4.0
            ),
            padding: EdgeInsets.all(4.0),
            itemBuilder: _itemBuilder,
            itemCount: list.length,
        );
    }
    Widget _itemBuilder(BuildContext context, int index) {
        AssetEntity entity = list[index];

        return Image.file(
            File(entity.path),
            fit: BoxFit.cover,
        );
    }
}
```

# 结论

Flutter框架在设计上，整体优于其他跨平台框架，实现使用时，也是非常的方便，有如下感受：
1. 开发调试非常的快，比Android的instant run强很多，也稳定很多
2. dependencies依赖管理比ReactNative强，native扩展能力是一个独立的plugin库，便于管理依赖
3. 基于MVVM框架，在自定义UI组件及动画方面，结构清楚，容易理解
4. 实现相同的功能，代码量远小于使用java实现

由于Flutter的社区不太完善，时间太短，生态不完善，相当于2011年开发Android一样，缺少大量成熟的基础库，大量的基础能力都需要从头到尾开发，下面是上述实践过程中发现的一些点：
1. 渐变Button，图片Button
2. GridView或ListView的图片加载策略（Fling时不加载，scrolling或idle时加载）
3. 崩溃日志收集
3. 大量的基础Plugin：加载相册，授权，地图，视频等等
4. ...

在已经集成ReactNative的58App里，已经基本满足部分业务的动态能力，再花大量的成本完美Flutter的基础，花大量的成本去推动业务线使用，短期来看，投入产出比太低。

但从长期来看，在跨平台框架上，我更加看好Flutter，在设计与使用体验上，Flutter确实都优于其他框架，但Flutter最终能否成为主流，还是要看Google的推广力度。

持续关注跨平台框架的动态，ReactNative也在向Flutter学习，改进其性能差的一面，Flutter的基础库也在不断的完善中

此demo的代码：[wuba_gallery](https://github.com/handsomeliuyang/wuba_gallery)

# 参考
1. [React Native 混合开发(Android篇)](http://www.devio.org/2018/08/26/React-Native-Hybrid-Android/)

