---
title: MPVue源码分析
date: 2018-06-07 14:34:35
categories: "前端"
tags:
---

# Demo
使用Vue实现一个消息逆转的demo：
```html
<div id="app">
  <p>{{ message }}</p>
  <button v-on:click="reverseMessage">逆转消息</button>
</div>
```

```javascript
var app = new Vue({
    el: '#app',
    data: {
    	message: 'Hello Vue.js!'
  	},
  	methods: {
    	reverseMessage: function () {
            this.message = this.message.split('').reverse().join('')
    	}
  	}
})
```
You can [try it on CodePen](https://codepen.io/handsomeliuyang/pen/RJGejj?editors=1010).

同样的效果，使用小程序实现的代码为：

1. 小程序的整体结构如下所示：
    :![](/MPVue源码分析/小程序的代码结构.png)
2. App相关的代码：
    ```javascript
    // app.js文件
    App({
      onLaunch: function () {
        console.log("App onLaunch...");
      },
      onShow: function(){
        console.log("App onShow...");
      },
      onHide: function(){
        console.log("App onHide...");
      },
      onError: function(){
        console.log("App onError...");
      }
    })
    ```
    ```json
    // app.json
    {
      "pages":[
        "pages/index/index"
      ],
      "window":{
        "backgroundTextStyle":"light",
        "navigationBarBackgroundColor": "#fff",
        "navigationBarTitleText": "WeChat",
        "navigationBarTextStyle":"black"
      }
    }
    ```
    ```css
    // app.wxss
    .container {
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 200rpx 0;
      box-sizing: border-box;
    } 
    ```
3. Page相关的代码：
    ```html
    <!--index.wxml-->
    <view class="container">
      <view class="usermotto">
        <text class="user-motto">{{message}}</text>
        <button bindtap="reverseMessage">逆转消息</button>
      </view>
    </view>
    ```
    ```javascript
    //index.js
    Page({
      data: {
        message: 'Hello Wechat!'
      },
      //生命周期函数
      onLoad: function(){
        console.log("Page onLoad...");
      },
      onReady: function(){
        console.log("Page onReady...");
      },
      //事件处理函数
      reverseMessage: function(){
        // this.data.message = this.data.message.split('').reverse().join('')
        this.setData({ message: this.data.message.split('').reverse().join('') })
      }
    })
    ```
    ```css
    /**index.wxss**/
    .usermotto {
      margin-top: 100px;
    }
    ```
    
# 小程序简介

Vue与小程序都可以看成javascript的高级抽象，类似于java里的各种框架，想让基于Vue开发的代码运行在小程序里，就把Vue的低层映射到小程序的Api，而不是Web端的Dom。

先来分析小程序的框架体系：
1. 目录结构：包括App相关的三个文件，每个Page包括三个文件
2. 代码结构：
    1. xxx.wxml布局文件，小程序特定的基础组件，如view，button, text
    2. xxx.js逻辑文件，类似于Vue对象的Page对象与App对象
    3. xxx.wxss样式文件，与css一致，但支持样式属性列表不一样
4. 类MVVM的响应式框架：V(wxml)，ViewModel(Page.data，Page.func)
    1. Page.data与wxml对应，通过setData()修改data数据，并自动更新View

# Vue的实现原理
Vue运行期间，分为三个阶段：
1. 初始化，生成Vue对象，让其具备如下属性与方法，如下所示：  
    ![](/MPVue源码分析/Vue对象.png)
2. vm.$mount()后，建立整个响应式框架，并首次渲染Dom
3. 事件响应，即用户交互

整个响应式框架如下图所示：
![](/MPVue源码分析/Vue框架.png)

# MPVue的实现
通过上面的小程序框架与Vue的实现原理介绍，基于Vue写的代码，要在小程序上运行，需要做如下工作：
1. 编译期间生成小程序目录结构与代码结构
    1. 生成app相关的三个文件：app.js, app.json, app.wxss
    2. 生成Page相关的三个文件：xxx.js, xxx.wxml, xxx.wxss
        1. xxx.js的转换成本最低，基本不用变化，因为都是基于javascript语言写的
        2. xxx.wxml：把Vue的template转换为小程序的基础组件，同时对组件的属性进行映射处理，成本较高
        3. xxx.wxss：把Vue里的样式，直接转换过来就行，成本较低
2. 对Vue运行时做修改，如下图所示：
    ![](/MPVue源码分析/mpvue框架.png)

部分核心代码：
1. 初始化流程：
    ![](/MPVue源码分析/mpvue初始化流程.png)
2. 更新流程：
    ![](/MPVue源码分析/mpvue更新流程.png)
    
# MPVue源码介绍
直接对着代码来分享

# 参考
1. [小程序框架](https://developers.weixin.qq.com/miniprogram/dev/framework/MINA.html)
2. [read-vue-source-code](https://github.com/numbbbbb/read-vue-source-code)
3. [Vue.js](https://cn.vuejs.org/v2/guide/index.html)


