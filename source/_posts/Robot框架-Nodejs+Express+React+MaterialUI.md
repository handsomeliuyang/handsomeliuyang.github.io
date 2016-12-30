---
title: 前端学习系列：基于React的Robot框架的踩坑之旅
date: 2016-12-30 13:00:00
categories: 前端
tags: [Robot, React]
---

# 背景

上次给大家介绍Robot平台框架，其特点：

1. 由nodejs+express+react+bootstrap实现
2. UI使用开源UI库：[charisma](https://github.com/usmanhalalit/charisma)
3. React通过browserify+babel打包处理

效果如下：
![](robot界面.png)

其中遇到的一些问题：

1. 前端界面框架没有真正的React化，只使用很少一部分，html页面里，还有大量的js引用配置，css引用配置
	
	```javascript
	// html引用css部分
	<link href="../../other_js_lib/charisma/css/charisma-app.css" rel="stylesheet">
	<link href='../../other_js_lib/charisma/bower_components/fullcalendar/dist/fullcalendar.css' rel='stylesheet'>
	<link href='../../other_js_lib/charisma/bower_components/fullcalendar/dist/fullcalendar.print.css' rel='stylesheet' media='print'>
	<link href='../../other_js_lib/charisma/bower_components/chosen/chosen.min.css' rel='stylesheet'>
	<link href='../../other_js_lib/charisma/bower_components/colorbox/example3/colorbox.css' rel='stylesheet'>
	<link href='../../other_js_lib/charisma/bower_components/responsive-tables/responsive-tables.css' rel='stylesheet'>
	<link href='../../other_js_lib/charisma/bower_components/bootstrap-tour/build/css/bootstrap-tour.min.css' rel='stylesheet'>
	<link href='../../other_js_lib/charisma/css/jquery.noty.css' rel='stylesheet'>
	<link href='../../other_js_lib/charisma/css/noty_theme_default.css' rel='stylesheet'>
	<link href='../../other_js_lib/charisma/css/elfinder.min.css' rel='stylesheet'>
	<link href='../../other_js_lib/charisma/css/elfinder.theme.css' rel='stylesheet'>
	<link href='../../other_js_lib/charisma/css/jquery.iphone.toggle.css' rel='stylesheet'>
	<link href='../../other_js_lib/charisma/css/uploadify.css' rel='stylesheet'>
	<link href='../../other_js_lib/charisma/css/animate.min.css' rel='stylesheet'>
	
	// html中大量引用js的部分
	<!-- select or dropdown enhancer -->
	<script src="../../other_js_lib/charisma/bower_components/chosen/chosen.jquery.min.js"></script>
	<!-- plugin for gallery image view -->
	<script src="../../other_js_lib/charisma/bower_components/colorbox/jquery.colorbox-min.js"></script>
	<!-- notification plugin -->
	<script src="../../other_js_lib/charisma/js/jquery.noty.js"></script>
	<!-- library for making tables responsive -->
	<script src="../../other_js_lib/charisma/bower_components/responsive-tables/responsive-tables.js"></script>
	<!-- tour plugin -->
	<script src="../../other_js_lib/charisma/bower_components/bootstrap-tour/build/js/bootstrap-tour.min.js"></script>
	<!-- star rating plugin -->
	<script src="../../other_js_lib/charisma/js/jquery.raty.min.js"></script>
	<!-- for iOS style toggle switch -->
	<script src="../../other_js_lib/charisma/js/jquery.iphone.toggle.js"></script>
	<!-- autogrowing textarea plugin -->
	<script src="../../other_js_lib/charisma/js/jquery.autogrow-textarea.js"></script>
	<!-- multiple file upload plugin -->
	<script src="../../other_js_lib/charisma/js/jquery.uploadify-3.1.min.js"></script>
	<!-- history.js for cross-browser state change on ajax -->
	<script src="../../other_js_lib/charisma/js/jquery.history.js"></script>
	<!-- application script for Charisma demo -->
	<script src="../../other_js_lib/charisma/js/charisma.js"></script>
	```
2. html过多，每个一个界面就会有一个html页面  
	![](robot1html数量.png)
3. React界面大的方向使用的是Component开发模式，但每个组件内，还是大最使用最原生的方式开发，下面是其中一个组件的render()方法内部代码：  
	![](robot1render方法.png)
4. 界面很不好，由于css与js逻辑代码分离，在没有缓存时，经常出现先看到没有样式的界面，再看到整体界面，整体视觉效果很不好
5. 使用的是browserify的express的中间件：browserify-middleware，虽然能解决开发期间每次执行手动执行转换的功能，但问题是修改界面后，每次都手动需新才行。
6. 没有适配移动端，在手机版本上的体验很差
7. 还有很多其他的，都是由上面的问题衍生出来的

# 调研

为了解决上面的问题，花了几天时间进行调研，主要的调研点：

1. browserify是否可以对css进行模块化支持？  
	结论：webpack更加合适
2. webpack的使用，有没有类似browserify-middleware功能？  
	结论：webpack-dev-server
3. 双服务器配置：nodejs+express与webpack-dev-server的理解与如何工作？  
	结论：思维需要变化，下面会具体介绍  
4. React的UI库：[Material-UI](http://www.material-ui.com/#/)的使用？  
	结论：官网demo例子只有基本组件的使用，学了后，还是无法创造出想要的效果
	
# Robot最新框架

## 技术集
1. 后端：
	1. Nodejs
		1. nodemon
	2. Express
2. 前端:
	1. React
		1. react-router
	2. Material-UI
		1. react-tap-event-plugin
3. 打包工具：
	1. webpack
		1. style-loader
		2. babel-loader
		3. webpack-dev-server
	2. babel
		1. babel-preset-es2015
		2. babel-preset-react
		3. babel-preset-stage-1

## 框架目录结构
![](robot目录.png)

## 框架界面
<iframe height= 300 width= 100% src="robot界面视频.mp4" frameborder=0 allowfullscreen></iframe>

## 具体技术点
### 后端Server

1. 使用nodejs+express创建后台服务。网上很多教程
2. 关键点：
	1. server端的日志输出，把所有请求都通过日志输出
		
		```javascript
		// 通过使用给express里添加morgan，就可以实现
		var logger = require('morgan');
		var app = express();
		app.use(logger('dev'));
		```
	2. 实现Server的404异常，利用express的中间件机制原理，实现404找不到页面异常
		![](express中间件.png)
		
		```javascript
		// 工具中间件
		app.use(logger('dev'));
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended: false }));
		app.use(cookieParser());
		
		// 业务中间件
		app.use('/', index);
		app.use('/users', users);
		
		// catch 404 and forward to error handler
		app.use(function(req, res, next) {
		  var err = new Error('Not Found');
		  err.status = 404;
		  next(err);
		});
		
		// error handler
		app.use(function(err, req, res, next) {
		  // set locals, only providing error in development
		  res.locals.message = err.message;
		  res.locals.error = req.app.get('env') === 'development' ? err : {};
		
		  // render the error page
		  res.status(err.status || 500);
		  res.render('error');
		});
		```
	3. [nodemon](https://nodemon.io/)实现改动server端代码后，实现自动重新加载

### webpack打包配置
#### 高级特性
在写React模块时，为了更加方便编写，使用了一些高级特性： 
 
1. ES6语法
	
	```javascript
	// es6的模块化引入
	import React, {Component} from 'react';
	
	// es6的类定义
	class Master extends Component {
	
	}
	
	// 模块化导出
	export default XXX;
	```
2. JSX标记

	```jsx
	return (
		<div>
			...
		</div>
	);
	
	```
3. class类的成员变量定义
	
	```javascript
	// 注意：在es6的规范中，并不支持成员变量，static变量直接在class里定义，只能如下定义
	class Master extends Component {
		constructor(){
			this.state = {
				navDrawerOpen: false
			};
		}
	}
	
	// 但我们希望使用下面的语法规则
	class Master extends Component {
		state = {
			navDrawerOpen: false
		};
	}
	```

上面的高级特性，现在主流的浏览器都还不支持，为了使用，我们就需要进行转换：

1. webpack
	* bable-loader // 用于加载babel
		* bable
			* babel-preset-es2015 // 转换es6语法
			* babel-preset-react // 转换jsx语法
			* babel-preset-stage-1 // 转换成员变量语法

#### 开发环境配置

1. 通过自己搭后台服务与webpack的watch来实现
	![](webpack开发方式一.png)
2. 	webpack-dev-server，HotModuleReplacementPlugin实现热更新 --- 推荐方式
	![](webpack开发方式二.png)
3. webpack-dev-server.config.js的具体配置([webpack-dev-server配置](https://webpack.github.io/docs/webpack-dev-server.html))：
	
	```javascript
	const webpack = require('webpack');
	const path = require('path');
	// 开发期间把www做为了输出目录，不与正式环境情况发生冲突
	const buildPath = path.resolve(__dirname, 'src/www');
	
	module.exports = {
	    entry: [
	        'webpack/hot/dev-server', // 热修复配置，这个需要一起合并到app.js里
	        path.resolve(__dirname, 'src/app/app.js') // app的入口
	    ],
	    output: {
	        path: buildPath,
	        filename: 'app.js'
	        //publicPath: buildPath // 不用特别指定publicPath路径
	    },
	    // 这个是webpack-dev-server的运行参数
	    devServer: {
	        contentBase: path.resolve(__dirname, 'src/www'),
	        hot:true, // 热修复
	        inline: true, // 使用热修复，必须是inline模式
	        port: 8080 // 创建的服务器的port，自由配置
	    },
	    resolve: {
	        extensions: ['', '.js', '.jsx', '.css', '.json']
	    },
	    plugins: [
	        // 让webpack-dev-server支持热更新
	        new webpack.HotModuleReplacementPlugin()
	    ],
	    module: {
	        loaders: [
	            {
	                test: /\.js$/,
	                loader: 'babel-loader',
	                exclude: /node_modules/,
	                query: {
	                    "presets": [
	                        "react", // 为了支持jsx的语法
	                        "es2015", // 为了支持es6的语法
	                        "stage-1" // 为了支持class的成员变量与静态变量
	                    ]
	                }
	            },
	            {
	                test: /\.css$/,
	                loader: 'style-loader!css-loader'
	            }
	        ]
	    }
	};
	
	```
4. 通过下面命令运行webpack-dev-server，开发环境配置完成，即可实现修改了js文件后，主动推送更新浏览器
	
	```
	// 先在package.json里配置
	"scripts": {
		"start": "nodemon ./bin/www",
		"browser:development": "webpack-dev-server --config client/webpack-dev-server.config.js --progress --colors --inline"
	}
	
	// 命令行里运行
	npm run browser:development
	```
5. 通过这种方式启动的webpack-dev-server后，通过ctrl-z能停掉服务，但无法释放所占用的8080端口号，需求如下操作，kill掉此端口的占用，才能再次启动。
	
	```
	// 查找端口被哪些服务占用
	lsof -i:8080
	// kill掉此进程
	kill -9 进程pid
	```

### 前端框架

#### 基于React的开发思路变化

**传统开发模式：**
![](传统开发模式.png)

**React开发模式：**
![](React开发模式.png)

#### app前端入口
```javascript
import React from 'react';
import {render} from 'react-dom';
import injectTapEventPlugin from 'react-tap-event-plugin';

import {Router, browserHistory} from 'react-router';
import {createHashHistory} from 'history';
import AppRoutes from './AppRoutes.js';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

// {/*没有弄懂这两个配置参数*/}
render(
    <Router
        history={browserHistory}
        onUpdate={() => window.scrollTo(0, 0)}
        >
        {AppRoutes}
    </Router>,
    document.getElementById('app')
);
```
app的入口职责很简单：

1. 路由配置
2. 通用处理，如material-ui库里的事件初始化：injectTapEventPlugin();

app的此入口相当于Android里的Application

#### app的前端路由
在android里，一个界面跳转到另外的界面，是通过协议intent与startActivity()方法来实现跳转，其中的核心实现是由系统自己封装掉了

在前端，界面之前跳转的协议都是URL，再通过window.location.href重新向server请求并加载新页面。

在React的模式下，跳转协议也是URL，但这个URL不用经过server请求，而是重新加载新模块实现，如下图所示：
![](路由效果.gif)

要想实现此效果，不使用React-Router开源框架，我们的写法为：

```javascript
var React = require('react');

var About = React.createClass({
  render: function () {
    return(
      <div>
        <h2>About</h2>
        <p>这里将会出现N多介绍文字balabala</p>
      </div>
  );}
});

var blogs = React.createClass({
  render: function () {
    return(
      <div>
        <h2>blogs</h2>
        <a href="＃">文章A</a>
        <br />
        <a href="＃">文章B</a>
        <br />
        <a href="＃">文章C</a>
        <br />
        <a href="＃">文章D</a>
      </div>
  );}
});

var Home = React.createClass({
  render: function () {
    return(
      <div>
        <h2>Home</h2>
        <p>这里是首页</p>
      </div>
  );}
});

var App = React.createClass({
  render () {
    var Child;
    switch (this.props.route) {
      case 'about': Child = About; break;
      case 'blogs': Child = blogs; break;
      default:      Child = Home;
    }

    return (
      <div>
        <h1>App</h1>
        <Child/>
      </div>
    )
  }
});

function render () {
  var route = window.location.hash.substr(1);
  React.render(<App route={route} />, document.body);
}
window.addEventListener('hashchange', render);
render();
```
这样实现，也比较容易，但当我们要进行复杂的路由时，就会变的非常麻烦了，所以我们需要使用[react-router](https://github.com/ReactTraining/react-router/)。

我们的路由配置AppRoutes.js的代码如下：

```javascript
import React from 'react';
import {Route, IndexRoute} from 'react-router';

import Master from './components/Master'
import Home from './components/pages/Home';

const AppRouters = (
    <Route path="/" component={Master}> // 其Master为整体框架
        <IndexRoute component={Home} /> // Home表示首页，注意是：嵌入到框架里的部份
    </Route>
);

export default AppRouters;
```
![](React的框架.png)

更多配置请点击：[ReactRouteConfig](https://github.com/ReactTraining/react-router/blob/master/docs/guides/RouteConfiguration.md)

#### Master.js框架的实现

##### Material-UI理解 [官网](http://www.material-ui.com/#/)
1. Material-UI提供了一套组件库。[具体请点击](http://www.material-ui.com/#/components/app-bar)
2. Material-UI还提供了一套样式主题库，颜色库。[具体请点击](http://www.material-ui.com/#/customization/themes)

##### Material-UI作用
1. 使用其提供的组件，可以开发出与Android原生的Design设计库一致的效果
2. 使用其样式及主题，统一所有的控件与界面的风格，方便统一风格切换
3. 能方便PC，App的适配，提供的控件及源码里有适配的解决方案
4. 对React-Native而言，方便统一PC，M，Android，Ios四端的风格样式

##### Master.js代码分析
```javascript
import React, {Component} from 'react';

// 使用Material-UI的控件
import {AppBar, MuiThemeProvider} from 'material-ui';
// 使用Material-UI的样式主题
import {getMuiTheme, colors, spacing} from 'material-ui/styles';
// 使用Material-UI对屏幕适配
import withWidth, {MEDIUM, LARGE} from 'material-ui/utils/withWidth';

// 封装的抽屉Drawer
import AppNavDrawer from './AppNavDrawer.js';
// 用于对屏暮大小适配的包装模块
import FullWidthSection from './FullWidthSection.js';

// Material-UI主题
const muiTheme = getMuiTheme();
// 此框架页面的一些特殊样式，即样式主题无法满足的自定义部分
const styles = {
    appBar: {
        position: 'fixed',
        // Needed to overlap t  he examples
        zIndex: muiTheme.zIndex.appBar + 1,
        top: 0, left: 0, right: 0
    },
    root: {
        paddingTop: spacing.desktopKeylineIncrement,
        minHeight: 400,
    },
    content: {
        margin: spacing.desktopGutter,
    },
    footer: {
        backgroundColor: colors.grey900,
        textAlign: 'center',
        position: 'fixed',
        left:0, right:0
    },
    p: {
        margin: '0 auto',
        padding: 0,
        color: colors.lightWhite,
        maxWidth: 356,
    },
    p2: {
        margin: '0 auto',
        padding: 0,
        paddingTop: '5px',
        color: colors.red800,
        maxWidth: 356,
    },
};

class Master extends Component {
    // React控件的state初始值
    // 所有的界面变化，都应该通过state来控件，而不是直接操作对应的dom元素
    state = {
        navDrawerOpen: false // 表明抽屉默认是关闭的
    };

    // 处理Drawer的状态变化
    handleChangeRequestNavDrawer = (open)=> {
        this.setState({
            navDrawerOpen: open
        });
    };

    // 成员变量，用于处理AppBar左边图片点击事件
    handleTouchTapLeftIconButton = ()=> {
        this.setState({
            navDrawerOpen: !this.state.navDrawerOpen
        });
    };

    // 框架界面
    render(){
        return (
            <MuiThemeProvider> // 这个是使用Material-UI必须要添加的，用于提供Material-UI主题样式
                <div>
                    <AppBar
                        onLeftIconButtonTouchTap={this.handleTouchTapLeftIconButton}
                        title="Robot"
                        style={styles.appBar}/>
						// 子素元位置
                    {
                        <div style={muiTheme.prepareStyles(styles.root)}>
                            <div style={muiTheme.prepareStyles(styles.content)}>
                                {this.props.children}
                            </div>
                        </div>
                    }

                    <AppNavDrawer
                        onRequestChangeNavDrawer={this.handleChangeRequestNavDrawer}
                        open={this.state.navDrawerOpen}/>
						// 用于适配屏幕宽度的
                    <FullWidthSection style={styles.footer}>
                        <p style={muiTheme.prepareStyles(styles.p)}>
                            {'58同城-用户增长部-无线技术部 '}
                        </p>
                        <p style={muiTheme.prepareStyles(styles.p2)}>
                            {' Android组 '}
                        </p>
                    </FullWidthSection>
                </div>
            </MuiThemeProvider>
        );
    }
}

export default withWidth()(Master);
```

# 参考
1. [React-Router](https://github.com/ReactTraining/react-router/)
2. [React 实践记录 03 React router](http://www.cnblogs.com/Leo_wl/p/4780758.html)
2. [webpack](https://webpack.github.io/docs/webpack-dev-server.html)
3. [material-ui](http://www.material-ui.com/#/)
4. [express](http://expressjs.com/en/4x/api.html#app.use)
5. [Static Properties in ES Class](https://nighca.me/2015/12/29/Static-Properties-in-ES-Class/)





