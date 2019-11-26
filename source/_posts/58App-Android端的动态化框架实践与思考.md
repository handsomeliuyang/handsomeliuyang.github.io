---
title: 58App/Android端的动态化框架实践与思考
date: 2019-11-22 20:16:45
categories: Android
tags: [Android]
---

# 业务与动态化要求
58业务需求特点：多端的快速开发，多套跨平台框架，业务跨App迁移。为了满足此业务要求，整体技术框架的实现手段有：
1. 业务层：转译框架，如WubaRN-M，京东-taro-react标准，MPVue-vue规划，Wepy-类vue规范，滴滴-Mpx-小程序语法等等
2. 跨平台框架层：Hybrid，ReactNative，小程序，Flutter等等
3. 基础能力层：统一Plugin

![](/58App-Android端的动态化框架实践与思考/20191126045232976.png)

# 58App动态化实践
每种技术都有期优缺点，无法做到完全统一，在实际的App里，一般都是多套框架并存，不同的业务采用不同的技术方案，58App里主要有三种技术方案：
1. WubaRN：基于ReactNative的二次封装，主要用于追求动态和较高体验要求的需求
2. Hybrid：JS-Native框架，主要用于运营活动等需求
3. 阿里的Tangram框架：用于列表等Native页面的布局动态化

由于Hybrid框架比较简单，重点分析一下WubaRN与Tangram框架

## WubaRN
![](/58App-Android端的动态化框架实践与思考/20191126045250000.png)

基于ReactNative主要的封装点：
1. 业务组件与模板工程
    1. 抹平UI组件的平台差异，扩展Native能力
    2. 统一技术栈，提供模板工程
2. 包大小瘦身及解决Bug
    1. 减少平台支持版本，保留armeabi-v7a；统一Okhttp与Fresco
    2. 通过AOP修改字符码，解决原生Bug
3. 实现热更新
    1. Bundle拆分：Common Bundle内置，Business Bundle动态下发
    2. 分步加载：优化加载Common Bundle，具体业务再加载Business Bundle

ReactNative受制于其实现原理，在低端手机里，如果出现白屏，卡顿现象。如下所实现框架图：

![](/58App-Android端的动态化框架实践与思考/20191126045303449.png)

主要特点：
1. 三个线程：
    1. UI Thread：Native的UI渲染
    2. Shadow Thread：yoga引擎，基于flexbox的语法糖转换为各端的扁平化框架
    3. Javascript Thread：React执行环境，业务逻辑与diff操作执行环境
2. 通信方式：Json格式序列化，通过React Native Bridge

产出的问题：
1. 列表滑动白屏：快速滑动，通信量大，过渡依赖Bridge
2. 转输大数据慢：如图像的base64字符串信息
3. 无线同步通信：通信都是异步
4. Javascritp Thread帧率低：Javascript解释执行，同时需要执行业务逻辑与diff操作，在低端手机里，快速滑动时，掉帧严重

ReactNative的最新版本也在重新整体底层实现：
1. Fabric：
    1. 将Native API直接暴露给JavaScript，不通过bridge
    2. 允许 UI 线程与JS线程同步
2. Fiber：利用requestIdleCallback()，实现动画优先
3. 使用RecyclerView替换FlatList，实现ItemView的复用

## 布局动态化—Tangram
> Tangram，七巧板，几块简单的积木就能拼出大千世界。我们用Tangram来命名这套界面方案，也是希望他能像七巧板一样可以通过几块积木就搭出丰富多彩的界面

![](/58App-Android端的动态化框架实践与思考/20191126050338349.png)

其在性能与灵活性上取了一个折中解决方案：
1. 设计原则：牺牲灵活性的情况下，追求极致性能
2. 切入点：
    1. Native列表高性的同时，缺少灵活性
    2. 动态框架的内存与滑动控制的性能瓶颈
3. 目标：通过构建页面结构化描述，实现页面可运营的目的

其主要的应用场景：
1. 常规业务：如业务稳定的列表等
    1. 需求较稳定，对性能与稳定性有很高的要求
    2. 对局部样式有动态化要求，如标签等等
2. 基础业务：如首页
    1. 需求稳定，对性能与稳定性有很高的要求
    2. 对局部样式有动态化要求，如推荐样式

其高性能的原因：
1. 基于Native的列表实现的基础上，解决灵活性，如RecyclerView
2. 页面渲染：大量的计算工作在VM中完成，并缓存在VM组成的树形结构里
3. 回收和复用：基于组件与控件实现回收复用

![](/58App-Android端的动态化框架实践与思考/20191126050351207.png)

但淘宝开源Trangram时，没有开源所有的工具，缺少一些模块：
1. 模板管理后台：负责发布、更新（版本、平台、组件版本、生效优先级）
2. 页面生成工具（类似索尔平台）

# 其他动态化框架分析
除58App正在使用的技术外，还有其他跨平台的技术：
1. 小程序：微信小程序，百度小程序等等
2. 全包型：Flutter，Qt
3. 转译框架：taro，MPVue，Wepy，Mpx等等

对于每一种技术选择一个来讲解其实现原理

## 小程序-百度小程序
![](/58App-Android端的动态化框架实践与思考/20191126050404831.png)

通过对百度小程序的已开源的源码分析，其整体框架如上图所示：
1. 逻辑层
    1. 小程序Api：App()，Page()，布局标签
    2. App()：创建App对象
    3. Page()：存储在Map中，页面显示时，创建Page对象
2. 渲染层
    1. MVVM框架San渲染
    2. 编译期间，小程序标签转化为San的标签
    3. Page()对应San的Page组件，Template为Swan.xml转译的内容
3. 交互
    1. 渲染层接收用户的交互事件，由统一的函数处理后，通过消息总线传递到逻辑层的Page对象，再调用对应的函数
    2. 逻辑层依据用户操作，执行业务操作，修改data数据，通过消息总线传递到渲染层的组件里，San.Page组件会自动更新界面

不管是逻辑层与渲染层，其内部实现都还是通过H5来实现，其提升性能的思路：
1. 把逻辑层与渲染层分离
2. 异步请求都由native来执行
3. 编译期转换标签

受制当前的实现机制，有一些短板：
1. 无法内嵌Native的View
2. 通信机制：异步且序列化传递数据
    1. 传递大数据较慢
    2. setState()过于频繁时，影响性能

## 全包型—Flutter
![](/58App-Android端的动态化框架实践与思考/20191126050450876.png)

Flutter借鉴了ReactNative的设计思路，采用响应式编程，同时实现统一跨平台样式，高性能
1. 高性能：
    1. Debug为字节码，Release为机器码
    2. 不依赖OEM Widgets
    3. 不依赖Bridge
2. 开发效率：
    1. 声明式布局，一切都是Widget
    2. 热加载（hot reload）
    3. 不依赖OEM，基于Skia，统一UI

真正体验后：
1. 感受：
    1. 开发调试非常的快，比Instant Run强
    2. 依赖库管理强，Plugin库
    3. MVVM框架，声明式布局，便于组件化
    4. 代码精简，相比Java
2. 不足：
    1. iOS不支持热更新（思路：Dart转Javascript）
    2. 生态不完善，缺少必须的基础能力
        1. 渐变Button，图片Button
        2. 崩溃日志收集
        3. 基础Plugin：相册，授权，视频等等
    6. 定制开发学习成本高（RenderObject, CostomPaintObject）

## 转译框架—Taro

![](/58App-Android端的动态化框架实践与思考/20191126050507685.png)

Taro的设计目标：
1. 用React写小程序，实现“工业化”
    1. PostCSS，Sass， Less
    2. NPM 支持
    3. ES6/ES7 语法糖
    4. TypeScript 的强类型约束
    5. React 的组件开发
    6. Redux 的状态管理
2. 多端，统一语法
    1. 多端转换：运行时和编译时
    2. 抹平多端差异：基础Api与基础组件

![](/58App-Android端的动态化框架实践与思考/20191126050524898.png)
![](/58App-Android端的动态化框架实践与思考/20191126050533235.png)

Taro是类React语法：以小程序为标准，对React语法删减，有如下限制：
1. JSX的限制：
    1. render()之外不支持jsx
    2. map 中不支持if 表达式
    3. 只支持Array.map
    4. props中不支持匿名函数
    5. props中不支持对象展开符
    6. props不支持 JSX 元素
2. 不支持无状态组件，都必须使用class定义

转译框架带来的问题：
1. 问题定位难：多一层转译
2. 基础API与基础组件的维护

# 思考

现阶段没有真正能满足所有需求的框架，处于混合时期：依据不同的场景，采用不同的框架
1. 移动端：
    1. 首页：布局动态化
    2. 列表，详情：Web技术型，如ReactNative
    3. 活动：Hybrid，小程序
2. 多端：编译框架，如Taro

![](/58App-Android端的动态化框架实践与思考/20191126050722611.png)

从长远看，真正有可能实现统一的框架：Flutter（全包型）

最关键的还是：持续关注，持续学习