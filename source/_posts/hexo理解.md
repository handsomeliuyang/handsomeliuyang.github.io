---
title: hexo理解
date: 2016-03-16 11:03:16
categories: hexo
tags: 
---

# Hexo是什么
> A fast, simple & powerful blog framework, powered by Node.js. 基于Node.js的一个快速、简洁且高效的博客框架。

我理解的Hexo是：

1. 是一个Node.js的命令行脚本工具
2. 一个把markdown编译为html页面，生成一个静态Web网站的静态博客框架

## 命令行脚本工具

使用Node.js除了用来开发Web应用外，还可以用于开发命令行脚本工具，Hexo就是一个使用Node.js开发命令行脚本工具：
```shell
npm install XXX -g // 脚本Module只能通过全局方式添加
```

关于Nodejs开发命令行工具的教程：[使用Node写命令行工具](http://javascriptplayground.com/blog/2015/03/node-command-line-tool)

## 静态博客框架

Hexo的框架使用node.js，把markdown, ejs翻译为纯Html页面，这些纯Html页面只需要布署到Web服务器上就行了。 

# Hexo的源码，官网，Module

1. Hexo的源码：<https://github.com/hexojs/hexo>
2. Hexo的官网：<https://hexo.io/>
3. Hexo在npm上的Module：<https://www.npmjs.com/package/hexo>

# Hexo版本

Hexo现在的版本主要有2.x及3.x，这两个版本有比较大的差别，其主要差别如下：

1. 3.x里多了hexo-cli模块，从hexo里分离了，其中全部是命令行的工具。// 这个就是我之前想不通的，为什么会有如下两种：
```
npm install hexo -g // 这个是2.x的安装方式，不过3.x也可以用
npm install hexo-cli -g // 这个就是3.x的标准安装方式
```
2. 3.x里把hexo模块分为Generators, deployers, server几种模块 // 这就是为什么在2.x里，可以直接使用hexo deployer，而在3.x里你要先安装deployers的模块，才能执行hexo deployer
3. 更多差别，请查看：<https://github.com/hexojs/hexo/wiki/Breaking-Changes-in-Hexo-3.0>

*特别注意：*有些themes主题只支持hexo 2.x，要注意选择。

# Hexo与Github的关系

1. Hexo会生成一个静态的web网站
2. Github Pages就是相当于一个web服务器
3. Github本身的git相当于FTP命令，让我们把web网站资源上传到web服务器上
