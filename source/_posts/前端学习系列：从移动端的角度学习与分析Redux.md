---
title: 前端学习系列2：从移动端的角度学习与分析Redux
date: 2017-01-15 16:00:00
categories: 前端
tags: [Robot, React, nodejs]
---

# 遇到的问题

通过上往篇文章[前端学习系列：基于React的Robot框架的踩坑之旅](https://handsomeliuyang.github.io/2016/12/30/Robot%E6%A1%86%E6%9E%B6-Nodejs+Express+React+MaterialUI/)介绍，已经搭建起React的整体环境，但在进行具体业务开发时，还是遇到如下问题：

1. 所有界面操作，如网络请求，点击事件等等都在同一个组件里完成，出现组件过于庞大的问题
2. 子组件与父组件只能通过回调方法进行通信，没有一个消息总线机制（如：子组件想决定框架Master里的title，除了通过回调方法，尽没有找到其他方法）
3. 无法进行单元测试，基本只能整体测试，无法对其的界面与数据进行分别测试
4. 关键日志无法添加，就像Android开发里也一样，关键日志只能通过手动去添加

# Redux动机

通过调研，最终选择Redux。Redux主要用来解决如下问题：

1. 界面的变化在React理解为state的变化，当功能复杂时，state的变化非常之多，state在什么时候，由于什么原因，如何变化已然不受控制。这时我们遇到问题，进行重现也变的非常困难。---- <font color="#ff0000">做Android开发，也有同感，当QA遇到一个比较难复现的bug时，RD就很难定位问题。</font>
2. React开发时，state的变化与异步是混在一起的（异步可以理解为业务逻辑，如用户交互，网络请求，具体业务功能等等）。只有把state的变化与异步进行分离，才能很好的进行管理。---- <font color="#ff0000">客户端开发，为什么会有MVC，MVVM，MVP等等框架，其实也是同样的出发点，尽量把展示与数据进行分离</font>

# 运行todos例子

1. 下载redux的原码。[github的地址](https://github.com/reactjs/redux)
2. 安装node，注意node的版本号一定要>4.0。因为0.x版本不支持es6等等高级语法。或者进行node版本升级，[node升级教程](http://www.jianshu.com/p/31d4f9a7f401
)
3. 进入todos的目录，执行以下命令，安装dependencies
	
	```
	node install
	```
	
4. 运行
	
	```
	node start
	```

# Redux实现
>注意：项目中的代码都是以redux的官方例子todos，为基础进行改造的

Redux里的state其实就是一个对象，或者可以理解为一个json数据，如下所示：

```json
{
	todos: [
		{
			text: 'Eat food',
			completed: true
  		}, 
  		{
    		text: 'Exercise',
    		completed: false
  		}
	],
  	visibilityFilter: 'SHOW_COMPLETED'
}
```

Redux的核心思想很容易理解，只有三大概率：Action，Reducer，Store。其关系如下：
![](redux框架.png)

1. React组件通过Store监听state的变化
2. 调用方通过调用Store的dispatch()方法发送动作action
3. Store通过Reducer把action对象转换为state对象
4. Store更新内部保存的state对象，并广播监听者进行界面刷新与变化

具体代码如下：

```javascript
import React, {Component} from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'

// reducers，用来把action转换为state
const reducers = (state = [], action) => {
  	switch (action.type) {
    	case 'ADD_TODO':
      		return {
      			todos: [
		        	...state,
		        	{
				        text: action.text
			      	}
      			]
      		}
	    default:
	    	return state
  }
}
// 创建store，全局只有一个store单例
const store = createStore(reducers)

class App extends Component {

	constructor(props) {
    	super(props);

    	// 当前组件的state的默认值
    	this.state = {todos:[]};

    	// 对state进行订阅
		store.subscribe(()=>{
			let reduxState = store.getState();
			console.log("redux's state", reduxState);

			let currentTodos = store.getState().todos;

		  	if (this.state.todos !== currentTodos) {
		  		this.setState({todos:currentTodos});
		  	}
		});
  	}

	addTodo = (text) => ({
	  	type: 'ADD_TODO',
	  	text
	});

	render(){
		let input;
		const { todos } = this.state;
		return (
			<div>
			    <div>
			    	<form onSubmit={e => {
			      		e.preventDefault()
		        		if (!input.value.trim()) {
			          		return
			        	}
			        	// 发送action
			        	store.dispatch(this.addTodo(input.value))
			        	input.value = ''
			      	}}>
			        	<input ref={node => {
			          		input = node
			        	}} />
			        	<button type="submit">
			          		Add Todo
		        		</button>
			      	</form>
			    </div>
			    <ul>
				    {todos.map(todo =>
				    	<li key={todo.text}>
    						{todo.text}
  						</li>
				    )}
				</ul>
			</div>
		);
	}
}

render(
	<App />,
	document.getElementById('root')
)
```

运行效果如下：
![](todos例子.png)

# Redux扩展

## reducer的拆分

reducer的作用是把action转换为state，当app变大后，需要对reducer进行拆分。

![](redux_reducer.png)

redux的整体特点：

1. Store里保持的state是整体程序app的所有状态
2. 每个action只是处理某一种行为
3. reducer的最简单的拆分方式，就是按不同的type类弄进行拆分

reducer拆分后的代码如下：

```javascript
const reducer_todos = (state = [], action) => {
  	switch (action.type) {
    	case 'ADD_TODO':
      		return [
	        	...state,
	        	{
			        text: action.text
		      	}
  			]
	    default:
	    	return state
  }
}

const initialState = {
	todos:[]
}

const reducer_root = (state = initialState, action) => {
	return Object.assign({}, state, {
		todos: reducer_todos(state.todos, action)
	});
}

// 创建store，全局只有一个store单例
const store = createStore(reducer_root)
```
1. Object.assign()用于拷贝两个对象的值，state对象是不能被修改。不然很容易出现不可预测的异常
2. reducer_root处理好整体拆分后，每个子reducer就只需要处理自己的数据转换。其他的数据自动继承

问题：由于所有界面的state都直接保存在内存里，当某界面离开后，其数据还是会一直保留在Store当中？  
处理方案：如一些页面的数据比较多，同时是不常用的界面，可以在退出此页面时，发送一个action，对数据进行清除。

### combineReducers(reducers)

上面的reducer的拆分方式都是一样的代码，可以提取api对外提供。其实现原理与上面类似，修改后的代码如下：

```javascript
const todos = (state = [], action) => {
  	switch (action.type) {
    	case 'ADD_TODO':
      		return [
	        	...state,
	        	{
			        text: action.text
		      	}
  			]
	    default:
	    	return state
  }
}

const reducer_root = combineReducers({
	todos
});

// 创建store，全局只有一个store单例
const store = createStore(reducer_root)
```

combineReducers()方法处理了三个功能：

1. 生成state的初始值
2. 通过方法名，自动生成key
3. 自动传入state, action参数，并调用方法，重新生成state

## 调用与监听优化

上面的redux的使用方法有如下问题：

1. 会对使用者暴露store对象，store只能在一处初始化，需要传入到每个子组件，如果都是通过组件的props来传递，这个就很麻烦，尤其是当子view及层级比较多的时候
2. 业务方每次都要进行监听，并进行数据转换，把redux的state转换为React的state对象，转换过程，要考虑一些性能问题，由于只要有一个子数据变化，所有监听者都会被触发通知，为了减少无用界面刷新，要做一些特殊处理。

解决方案：进行封装

1. store的传递封装，React里给组件传递对象，除了使用props属性外，还提供了一个全局传递方案：Context。[具体请查看](https://facebook.github.io/react/docs/context.html)
2. 包装一个容器组件，里面封装监听redux，并进行数据转换的工作

改进后的流程图：
![](redux框架_1.png)

### react-redux

在学习react-redux时，需要先了解一下容器组件与展示组件的概念。
![](容器组件与展示组件区别.png)

技术上讲你可以直接使用 store.subscribe() 来编写容器组件。但不建议这么做因为就无法使用 React Redux 带来的性能优化。也因此，不要手写容器组件，都是使用 React Redux 的 connect() 方法来生成。

[react-redux](https://github.com/reactjs/react-redux)的作用就是上面的解决方案的具体实现，我们看一下使用了react-redux的代码

```javascript
import React, {Component} from 'react'
import { render } from 'react-dom'
import { createStore, combineReducers } from 'redux'
import { Provider, connect } from 'react-redux'
// import App from './components/App'
// import reducer from './reducers'

// reducers，用来把action转换为state
const todos = (state = [], action) => {
  	switch (action.type) {
    	case 'ADD_TODO':
      		return [
	        	...state,
	        	{
			        text: action.text
		      	}
  			]
	    default:
	    	return state
  }
}

const reducer_root = combineReducers({
	todos
});

// 创建store，全局只有一个store单例
const store = createStore(reducer_root)

// actions
const addTodo = (text) => ({
  	type: 'ADD_TODO',
  	text
});

class App extends Component {

	constructor(props) {
    	super(props);

    	// 当前组件的state的默认值
    	// this.state = {todos:[]};

    	// 对state进行订阅
		// store.subscribe(()=>{
		// 	let reduxState = store.getState();
		// 	console.log("redux's state", reduxState);

		// 	let currentTodos = store.getState().todos;

		//   	if (this.state.todos !== currentTodos) {
		//   		this.setState({todos:currentTodos});
		//   	}
		// });
  	}

	render(){ // React的界面布局
		let input;
		const { todos, addTodo } = this.props;//this.state;
		return (
			<div>
			    <div>
			    	<form onSubmit={e => {
			      		e.preventDefault()
		        		if (!input.value.trim()) {
			          		return
			        	}
			        	// 发送action
			        	// store.dispatch(this.addTodo(input.value))
			        	addTodo(input.value);
			        	input.value = ''
			      	}}>
			        	<input ref={node => {
			          		input = node
			        	}} />
			        	<button type="submit">
			          		Add Todo
		        		</button>
			      	</form>
			    </div>
			    <ul>
				    {todos.map(todo =>
				    	<li key={todo.text}>
    						{todo.text}
  						</li>
				    )}
				</ul>
			</div>
		);
	}
}

const mapStateToProps = (state, ownProps) => {
	console.log('state value is ', state);
	return {
		todos: state.todos
	};
};

App = connect(mapStateToProps, {
	addTodo
})(App);

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
)
```
要点：

1. react-redux通过提供Provider与connect()方法实现接入层的解耦
2. Provider的作用比较简单，用来实现全局的store对象的传递，里面的实现原理就是通过React的Context来实现的，如下面就是Provider的原码
	![](provider.png)
3. connect()比较复杂，其主要是两件事情：
	1. 把redux的state转换为React组件的props属性
	2. 把action方法进行dispatch包装，再通过React组件的props属性传给React组件
	
	```javascript
	class Connect extends Component {
	
	  initSubscription() {
	    if (shouldHandleStateChanges) {
	      const subscription = this.subscription = new Subscription(this.store, this.parentSub)
	      const dummyState = {}
	
	      subscription.onStateChange = function onStateChange() {
	        this.selector.run(this.props)
	
	        if (!this.selector.shouldComponentUpdate) {
	          subscription.notifyNestedSubs()
	        } else {
	          this.componentDidUpdate = function componentDidUpdate() {
	            this.componentDidUpdate = undefined
	            subscription.notifyNestedSubs()
	          }
	
	          this.setState(dummyState)
	        }
	      }.bind(this)
	    }
	  }	
		
	  render() {
	    const selector = this.selector
	    selector.shouldComponentUpdate = false
	
	    if (selector.error) {
	      throw selector.error
	    } else {
	      return createElement(WrappedComponent, this.addExtraProps(selector.props))
	    }
	  }
	}
	```

把redux的state转换为react的props，比转换为react的state属性的好处：

1. 对于React组件而言，外界有仅只能通过组件的props对此组件进行控制，内部的state不对外进行暴露，一切都是通过外界传入的props参数来进行控制，真正实现业务与界面分离解耦
2. 组件可以做到与Redux解耦，组件能快速脱离Redux，并为一个共用组件

## Middleware中间件
![](中间件.png)

中间件：提供的是位于 action 被发起之后，到达 reducer 之前的扩展点。那么利用中间件，我们就可以做很多的事情，如：

1. 网络请求
2. 实现异步（此异步与android里的线程有差异）
3. 日志记录
4. 。。。

中间件的特点：

1. action的发送是顺序发送的，即第一个中间件处理后，才会传给第二个中间件处理。
2. 中间件的注册是有顺序的
3. 中间件可以决定是否再传递action

通过学习：[中间件实现的具体演化过程](http://cn.redux.js.org/docs/advanced/Middleware.html)可以了解javascript的一些语言特点：Monkey-Patching。相当于Java里的hook，对对象里方法进行proxy。但具体原因不一样：

1. javascript的Monkey-Patching是利用javascript的函数也是一个变量，可以被修改特点来实现的
2. java里的hook，是通过子类可以重写父类的方法来实现的。

# Redux在实际项目中的好处

我在Robot项目里，使用了Redux，我的体验有：

1. 界面与业务分离，写界面时，不用思考业务流程是如何的，只要思考界面与数据的关系。
2. 网络请求代码，业务逻辑与界面解耦
3. 调试问题非常方便，不像之前需要大量添加console.log()。一般可以通过action，state的日志就可以分析出原因，是由后台数据问题，还是界面问题
4. 可实现录制与回放----此好处还没有实现

# 参考
1. [Redux 中文文档](http://cn.redux.js.org/index.html)
2. [Redux](https://github.com/reactjs/redux)
3. [redux例子：real-world](https://github.com/reactjs/redux/tree/master/examples/real-world)

