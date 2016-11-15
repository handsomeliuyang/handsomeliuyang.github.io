---
title: React实现MergeRequest管理
date: 2016-11-15 19:33:06
categories: nodejs
tags: [React]
---

## 什么是React
React是一个前端框架，与其类似的有vue、angular 2.x等等。改变前端开发模式，让前端开发更加方便，让前端也使用面向对象的方案来开发。相关的一些特点可以看其官方文档

## ES6,JSX

JavaScript是一个统称，其标准的名称为：**ECMAScript**。ES6, ES5是两个不同的标准，现在的主流浏览器都完全支持**ES5**的语法，不支持最新标准**ES6**。ES6有很多的新特性，更适合面向对象的开发模式，如下所示：

```javascript
//es5
var MyComponent = React.createClass({
    render: function() {
        return (
            <div></>
        );
    }
});
module.exports = MyComponent;
//es6
class MyComponent extends React.Component {
    render() {
        return (
            <div></>
        );
    }
}
export MyComponent Apply;
```
ES6才支持模块化，ES5不支持，如下：

```javascript
import React from 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(
  <h1>Hello, world!</h1>,
  document.getElementById('root')
);
```
为了更方便开发及代码可读性，React里引入了模板语法：JSX，对比如下所示：

```
// 使用JSX的写法
class Hello extends React.Component {
  render() {
    return <div>Hello {this.props.toWhat}</div>;
  }
}

ReactDOM.render(
  <Hello toWhat="World" />,
  document.getElementById('root')
);

// 使用原生的Javascript的写法，注意同时使用了ES6
class Hello extends React.Component {
  render() {
    return React.createElement('div', null, `Hello ${this.props.toWhat}`);
  }
}

ReactDOM.render(
  React.createElement(Hello, {toWhat: 'World'}, null),
  document.getElementById('root')
);
```
ES6，JSX原生浏览器都不支持，就需要进行预编译（即转码）。React推荐使用Babel
>Babel是一个javascript的转换器，类似于gradle一样，支持各种插件。

>FaceBook开发了一个用于转换JSX的Babel插件：babel-preset-react。

>转换ES6的Babel插件为：babel-preset-es2015

>更多请点周：[Babel官网](https://babeljs.io/)

为了让浏览器能运行React的代码，有两种方案：

一：实时编译，即让浏览器来编译，配置很简单，如下所示

```javascript
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.23/browser.min.js"></script>
```

特点：这种方式为浏览器编译，因为实时编译会很慢，所以适合代码量比较小的

二：本地编译，即在Server端或本地提前编译好，这样就需要使用打包工具：browserify或webpack，React推荐使用Browserify（[browserify官网](http://browserify.org/)）。下面使用的是延时方案，即用户访问资源时，才进行转换，如下所示：

```javascript
var express = require('express');
var browserify = require('browserify-middleware');
var router = express.Router();

// 把Browserify的环境切换为正式环境，其配置如下：
/*process.env.NODE_ENV = 'production';
browserify.settings.mode = 'production';*/

var shared = ['react', 'react-dom'];
router.get('/react/base_bundle.js', browserify(shared));

// 为了不总是配置，直接进行环境配置
browserify.settings.external = shared;
browserify.settings.transform = 'babelify';

router.get('/react/app_bundle.js', browserify('client/merge_manager/app.js'));
```

特点：方便，不用手动转换，除代码变动后的首次访问慢之外，没有性能问题，浏览器也不用转换运行

## JSX的属性与Html的属性
JSX是一个模块语法，是为了代码的可读性，但与html并不完全一样，其中最大的区别，有如下几点：

1.JSX支持表达式，但只支持一个表达式，不支持代码块：

```javascript
// 直接访问变量
<img src={user.avatarUrl} />
<img src={'http://www.58.com' + '/a.png'} />

// 循环
const todos = ['finish doc', 'submit pr', 'nag dan to review'];
return (
	<ul>
  		{todos.map((message) => <Item key={message} message={message} />)}
	</ul>
);
```
2.class属性由于是ES6里的关键字，所以需要使用className，如下：

```javascript
<div className="button">
</div>
```
3.html的属性的命名都是小写，但JSX里的属性都是驼峰命名法，如下所示：

```javascript
<div className="xxx" tabIndex="xxx">
</div>
```
4.样式style，JSX把style当作字典对象来处理的，不能当字符来处理：

```javascript
<div style={{color:'blue', backgroundImage:'xxx'}}>
</div>
```

## 模块化

javascript的ES5是不支持模块的，即类不能分文件，即不能运行如下代码：

```
// CommonJs，nodejs才支持
var React = require('react');
var ReactDOM = require('react-dom');
var TopBar = require('../common/header.js');
var SideBar = require('../common/sidebar_nav.js');
var Footer = require('../common/footer.js');

// ES6才支持，ES5不支持
import React from 'react';
import ReactDOM from 'react-dom';
```
由于运行前，会使用Babel进行转换，所以React开发时，可以支持模块化，即可以使用Nodejs支持的CommonJs，也可以使用ES6的import模式。React推荐使用CommonJs的方式。

## React与传统html开发思想对比
### 传统开发
html为界面，js为逻辑，分开开发，如下所示：

```html
<body>
	<div>
		...
	</div>
</body>

<script>
	// js代码
</script>
```
模板语言：[EJS](http://www.embeddedjs.com/)。为了插件业务数据，实现业务后台的MVC

```javascript
<body>
	<div>
		<% if (!locals.username) { %>
	    	<ul class="nav navbar-nav navbar-right">
	     		<li><a href="/login"><%= locals.username %></a></li>
	    	</ul>
    	<% } %>
	</div>
</body>
```
### React开发
基于组件，一个控件的界面与逻辑都在一起，控件可以复用，与Native的开发模式比较类似，如下所示：

```javascript
class Clock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {date: new Date()};
  }

  // 组件已经与Dom上绑定完了
  componentDidMount() {

  }

  // 组件与Dom解绑
  componentWillUnmount() {

  }

  render() {
    return (
      <div>
        <h1>Hello, world!</h1>
        <h2>It is {this.state.date.toLocaleTimeString()}.</h2>
      </div>
    );
  }
}
```
1. 上面使用的是ES6的语法，与Android的Fragment比较像，界面与业务逻辑都在此类里完成
2. 上面的方法为React组件的生命周期方法

数据的获取方式：与传统方式不一样，而是通过Ajax来请求，与Native开发一下，界面与Service只通过接口来交互，但没有使用Server端的模板语言EJS

## React的生命周期
![](React生命周期.png)
关键点：

1.我们开发的Api就是这些生命周期方法

2.this.props.xx，this.state.xx是两个数据相关的对象，共中props对象只读，而state是可以修改

```javascript
<SideBar activeKey='merge_manager' /> // 只能通过这种方式修改props

this.setState(xxx) // 修改State数据，组件并进行刷新
```

3.在组件绑定到Dom里后，就可以通过jquery的方法，可以获取组件的dom元素

```javascript
componentDidMount: function(){
  	$('#target-branch-select').chosen({width: "100%"});
   	$('#assignee-select').chosen({width: "100%"});
   	$('#title-select').chosen({width: "100%"});
	$('#author-select').chosen({width: "100%"});
},
```

## React的生命周期与Android的生命周期对比
```javascript
var InitEnvir = React.createClass({
	render: funcation(){
		console.log('render...');
		return (
			<div>
			</div>
		);
	},
	componentDidMount: funcation(){	
		console.log('componentDidMount begin...');
		this.setState({newData});
		console.log('componentDidMount end...');
	}
});
```
上面代码的执行结果为：

| Android机制 | React机制 |
| :------:| :------: |
| render...<br/>componentDidMount begin...<br/> componentDidMount end...<br/> render... | render...<br/>componentDidMount begin...<br/>render...<br/>componentDidMount end... |

这个是Android机制与React机制最大的差别，Android的UI线程，有一个MainLoop队列。

## React实现页面框架
![](MergeRequest.png)

## DataTables框架
表格数据使用的是DataTables组件([datatables官网](https://datatables.net/))

由于数据量不大，使用的是前端排序，查询，过滤。数据量尽量不要超过1000。如果对于大数据，就需要Server进行配合

## 参考文档

1. [React文档](https://facebook.github.io/react/docs/hello-world.html)
2. [React入门 (1)—使用指南（包括ES5和ES6对比）](http://www.cnblogs.com/Mrs-cc/p/4969755.html)
