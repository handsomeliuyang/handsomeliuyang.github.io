---
title: Gatsby搭建博客之旅
date: 2018-03-19 17:25:39
categories: 前端
tags: 
---
## Gatsby简介

> Blazing-fast static site generator for React （React的快速静态网站生成器）

**几大特点：**
> 1.Modern web tech without the headache（不再为web技术落后而头痛）
>> Enjoy the power of the latest web technologies – React.js , Webpack , modern JavaScript and CSS and more — all setup and waiting for you to start building. (受最新Web前端技术的强大功能--React.js，Webpack，现代JavaScript和CSS等等，所有这一切都将启动并等待您的开始。)
>
> 2.Bring your own data (使用你自定义的数据)
>> Gatsby’s rich data plugin ecosystem lets you build sites with the data you want — from one or many sources: Pull data from headless CMSs, SaaS services, APIs, databases, your file system & more directly into your pages using GraphQL .(Gatsby丰富的数据插件生态系统允许您使用您想要的数据构建网站 - 来自一个或多个来源：使用GraphQL将数据从无头CMS，SaaS服务，API，数据库，文件系统等更直接地导入您的页面)
>
> 3.Scale to the entire internet (轻松发布到互联网)
>> Gatsby.js is Internet Scale. Forget complicated deploys with databases and servers and their expensive, time-consuming setup costs, maintenance, and scaling fears. Gatsby.js builds your site as “static” files which can be deployed easily on dozens of services.（Gatsby.js是互联网化的。 你可以不用理会数据库和服务器的复杂部署，以及昂贵，耗时的设置成本，维护和缩放恐惧。 Gatsby.js将您的网站构建为“静态”文件，可以轻松部署在数十种服务上）
>
> 4.Future-proof your website (使您的网站面向未来)
>> Don't build a website with last decade's tech. The future of the web is mobile, JavaScript and APIs—the JAMstack. Every website is a web app and every web app is a website. Gatsby.js is the universal JavaScript framework you’ve been waiting for.(不要用过去十年的技术建立一个网站。 网络的未来是移动的，JavaScript和API - JAMstack。 每个网站是一个Web应用程序，每个Web应用程序是一个网站。 Gatsby.js是你一直在等待的通用JavaScript框架。)
> 
> 5.Static Progressive Web Apps (静态PWA)
>> Gatsby.js is a static PWA (Progressive Web App) generator. You get code and data splitting out-of-the-box. Gatsby loads only the critical HTML, CSS, data, and JavaScript so your site loads as fast as possible. Once loaded, Gatsby prefetches resources for other pages so clicking around the site feels incredibly fast.(Gatsby.js是一个静态PWA（Progressive Web App）生成器。 您可以将代码和数据分开。 Gatsby只加载关键的HTML，CSS，数据和JavaScript，以便您的网站加载尽可能快。 一旦加载，Gatsby预取其他网页的资源，所以点击网站感觉非常快。)
> 
> 6.Speed past the competition (超越竞争)
>> Gatsby.js builds the fastest possible website. Instead of waiting to generate pages when requested, pre-build pages and lift them into a global cloud of servers — ready to be delivered instantly to your users wherever they are.(Gatsby.js建立最快的网站。 不需要等待请求时生成页面，而是预先生成页面，并将其提升到全球服务器云端 - 随时随地传送给用户，无论他们身在何处。)

**工作原理：**

![](/Gatsby搭建博客之旅/gatsby流程.png)

## HelloWord

按官网教程很容易创建一个简单的HelloWord。[详见](https://www.gatsbyjs.org/docs/)

常用命令：

1. gatsby new xxx // 创建一个新的项目
2. gatsby develop // 构建开发站点
3. gatsby serve // 测试发布构建
4. gatsby build // 发布构建

**效果如下：**  
![](/Gatsby搭建博客之旅/gatsby-init.gif)

## 技术点

React，Webpack，ES6这三种技术就不重点介绍了

### SASS

>Sass 是对 CSS 的扩展，让 CSS 语言更强大、优雅。 它允许你使用变量、嵌套规则、 mixins、导入等众多功能， 并且完全兼容 CSS 语法。 Sass 有助于保持大型样式表结构良好， 同时也让你能够快速开始小型项目， 特别是在搭配 Compass 样式库一同使用时。

[更多请参考](http://sass.bootcss.com/docs/sass-reference/)

### GraphQL
>GraphQL is a query language for APIs and a runtime for fulfilling those queries with your existing data. GraphQL provides a complete and understandable description of the data in your API, gives clients the power to ask for exactly what they need and nothing more, makes it easier to evolve APIs over time, and enables powerful developer tools.(GraphQL是在API能提供的数据范围内，提供查询能力的语言。GraphQL在您的API中提供了对数据的完整和可理解的描述，使客户能够准确地询问他们需要什么，并且更容易随时间发展API，并支持强大的开发人员工具。)

[更多请参考](https://graphql.org/)

**Rest请求过程：**  
![](/Gatsby搭建博客之旅/Rest请求.png)

**GraphQL请求过程：**
![](/Gatsby搭建博客之旅/GraphQL请求.png)

GraphQL的特点：
1. <font color="#ff0000">入口统一，合并请求</font>：不管请求什么资源，url都是一样的。这精简了不同场景下形态各异的API数量。
2. <font color="#ff0000">自定义返回值</font>：在REST中，资源的返回结构与返回数量是由服务端决定；在GraphQL，服务端只负责定义哪些资源是可用的，由客户端自己决定需要得到什么资源，避免让API消费者取到对它来说并没有用的冗余数据。
3. <font color="#ff0000">数据的关联性</font>：在query里，通过id，可以把多个数据源或Api直接关联起来
4. <font color="#ff0000">方便的接口调试工具</font>：GraphiQL工具，文档与调试统一，[GraphiQL](https://github.com/graphql/graphiql) / [live demo](http://graphql.org/swapi-graphql/)
![](/Gatsby搭建博客之旅/graphiql.png)

注意：GraphQL是一种标准，但其具体的实现里，有些标准的特性并没有被实现。如下所描述的一样：
>从官方的定义来说，GraphQL 是一种针对 API 的查询语言；在我看来，GraphQL 是一种标准，而与标准相对的便是实现。就像 EcmaScript 与 JavaScript 的关系，从一开始你就需要有这样一种认知：GraphQL 只定义了这种查询语言语法如何、具体的语句如何执行等。但是，你在真正使用某种 GraphQL 的服务端实现时，是有可能发现 GraphQL 标准中所描述的特性尚未被实现；或者这种 GraphQL 的实现扩展了 GraphQL 标准所定义的内容。
>
>举例来说，就像 ES 2017 标准正式纳入了 async/await，而从实现的角度上说，IE 没有实现这一标准，而 Edge 16 和 Chrome 62 则实现了这一标准（数据来源于 caniuse）说回 GraphQL 标准，与之相对的有相当多的服务器端实现。他们的大多遵循 GraphQL 标准来实现，但也可能稍有差别，这一切需要你自己去探索。

### PWA

>Progressive Web App, 简称 PWA，是提升 Web App 的体验的一种新方法，能给用户原生应用的体验。
>
>PWA 能做到原生应用的体验不是靠特指某一项技术，而是经过应用一些新技术进行改进，在安全、性能和体验三个方面都有很大提升，PWA 本质上是 Web App，借助一些新技术也具备了 Native App 的一些特性，兼具 Web App 和 Native App 的优点。

[更多请参考](https://lavas.baidu.com/pwa)

## Gatsby搭建博客

注意：node需要安装6.x版本，Markdown插件gatsby-transformer-remark，在node 8.x与9.x会运行失败 [node下载](https://nodejs.org/en/download/)

一个博客主要包括下面几部分：
1. 主页，包括作者介绍，文章列表
3. Post页面(文章正文页)
4. 归档页，Categories页，Tags页，关于页

### 工程目录

![](/Gatsby搭建博客之旅/gatsby工程目录.png)

### 第三方库

1. [lost](https://github.com/peterramsing/lost)：Lost Grid是一个强大的网格系统，可以方便实现表格拆分
2. [moment](https://github.com/moment/moment)：解析，验证，操作和显示日期
3. [react-media](https://github.com/ReactTraining/react-media)：适配不同屏幕

### 主页

![](/Gatsby搭建博客之旅/主页.png)

#### Layout
在我们这个demo里，首页与Post没有相同的部分，如footer，header，所以Layout里，非常的简单：  
```jsx
import React from 'react'
import Helmet from 'react-helmet'
import "./style.scss";

class Layout extends React.Component {
    render(){
        const {children} = this.props;

        return (
            <div className="layout">
                <Helmet defaultTitle="Blog by LiuYang"/>
                {children()}
            </div>
        );
    }
}

export default Layout;
```

如果有共同的footer与header，则应该在layout里实现

#### 首页整体布局
包括左边Sidebar和右边的文章列表，按组件思维考虑，我们应该创建三个组件或者二个组件：  
![](/Gatsby搭建博客之旅/首页组件.png)

下面是创建二个组件的首页布局代码：  
```jsx
class IndexRoute extends React.Component {
    render(){
        const {title, subtitle} = this.props.data.site.siteMetadata;
        const {edges:posts} = this.props.data.allMarkdownRemark;
        return (
            <div>
                <Helmet>
                    <title>{title}</title>
                    <meta name="description" content={subtitle}/>
                </Helmet>
                <Sidebar {...this.props}/>
                <div className="content">
                    <div className="content__inner">
                        {
                            posts
                                .filter(({node:post}) => post.frontmatter.title.length > 0)
                                .map(({node:post})=>{
                                    return (
                                        <Post data={post} key={post.fields.slug}/>
                                    );
                                })
                        }
                    </div>
                </div>
            </div>
        );
    }
}
```

#### 适应不同尺寸的屏幕

常见屏幕大小有：
1. lg：宽度大于1100px的屏幕
2. md：宽度在[960px--1100px]之间的屏幕
3. sm：宽度在[685px--960px]之间的屏幕
4. xs：宽度在[0px--685px]之间的屏幕

在不同屏幕下，首页布局也要有相应的变化，利用css的@media实现不同屏幕的适配：[CSS @media Rule](https://www.w3schools.com/cssref/css3_pr_mediaquery.asp)  
```jsx
// _breakpoints.scss
@mixin breakpoint-sm {
    @media screen and (min-width: 685) {
        @content
    }
}
@mixin breakpoint-md {
    @media screen and (min-width: 960) {
        @content
    }
}

// index.js的scss
.content {
    &__inner {
        padding:25px 20px;
    }
}
@include breakpoint-sm {
    .content {
        lost-column: 7/12;
        &__inner {
            padding: 30px 20px;
        }
    }
}
@include breakpoint-md {
    .content {
        lost-column: 2/3;
        &__inner {
            padding: 40px 35px;
        }
    }
}
```
注意上面的样式是叠加的，下面的会覆写掉面上样式。

#### 空格实现

在html页面里，想实现空隔效果，可以有下面几种方案：
1. 通过空格的特殊字符实现
2. 全角下的空格
3. 通过css样式实现，占位div，再设置其margin值

#### 博客相关的gatsby插件

1. [gatsby-source-filesystem](https://www.gatsbyjs.org/packages/gatsby-source-filesystem/?=gatsby-source-filesystem)：读取本地文件
2. [gatsby-transformer-remark](https://www.gatsbyjs.org/packages/gatsby-transformer-remark/?=gatsby-transformer-remark)：使用Remark解析Markdown文件
3. [gatsby-remark-images](https://www.gatsbyjs.org/packages/gatsby-remark-images/?=gatsby-remark-images)：用于解析图片
4. [gatsby-plugin-postcss-sass](https://www.gatsbyjs.org/packages/gatsby-plugin-postcss-sass/#gatsby-plugin-postcss-sass)：支持sass

默认通过GraphQL无法查询到文件相关的数据，当安装了gatsby-source-filesystem插件后，可以查询到File相关的数据：
![](/Gatsby搭建博客之旅/graphql_file.png)

安装了gatsby-transformer-remark插件后，就可以查询Markdown相关的数据了：
![](/Gatsby搭建博客之旅/graphql_markdown.png)
markdown的node结点的parent是file结点，即markdown是基于上一次插件的结果产生的，减少重复制造轮子

### Post页面
![](/Gatsby搭建博客之旅/Post页面.png)

页面的思路与主页的思路一样，使用组件化的思路设计，唯一的不同点是代码高亮显示

主页是一个固定页，但Post页面有很多，如果批量生成？使用gatsby的扩展点及Api来实现，整体流程如下所示：
![](/Gatsby搭建博客之旅/gatsby模板.png)

```jsx
exports.createPages = ({graphql, boundActionCreators})=>{
    const {createPage} = boundActionCreators;

    return new Promise((resolve, reject)=>{
        const postTemplate = path.resolve('./src/templates/post-template.js');

        // 查询所有的markdown，并创建相应的页面
        resolve(
            graphql(`{
                allMarkdownRemark(
                    limit: 1000
                ) {
                    edges {
                        node {
                            fields {
                                slug
                            }
                            frontmatter {
                                category
                            }
                        }
                    }
                }
            }`).then((result)=>{
                if (result.errors) {
                    console.log(result.errors);
                    reject(result.errors)
                }

                // 创建对应的markdown页面
                result.data.allMarkdownRemark.edges.forEach((edge) => {
                    createPage({
                        path: edge.node.fields.slug, // required
                        component: slash(postTemplate),
                        context: {
                            slug: edge.node.fields.slug,
                        },
                    });
                });

                resolve();
            })
        )
    });
};
```

## Gatsby与Hexo的对比

调研Gatsby的初衷是想把博客实现由Hexo替换为Gatsby，Hexo与Gatsby都是静态网站生成器，主要差别是使用的技术不一样，Gatsby使用的都是最新技术，但最后还是继续使用了Hexo，主要原因是：Hexo提供了很多的Themes，能快速复用这些Themes。

此Demo的地址：[Gatsby-demo](https://github.com/handsomeliuyang/handsomeliuyang.github.io/tree/gatsby)

## 参考

1. [中文gatsby介绍](http://www.fly63.com/article/detial/388)
2. [gatsbyjs](https://www.gatsbyjs.org/)
3. [约定优于配置](https://zh.wikipedia.org/wiki/%E7%BA%A6%E5%AE%9A%E4%BC%98%E4%BA%8E%E9%85%8D%E7%BD%AE)
4. [阻碍你使用 GraphQL 的十个问题](http://jerryzou.com/posts/10-questions-about-graphql/)
5. [GraphQL is the better REST](https://www.howtographql.com/basics/1-graphql-is-the-better-rest/)
6. [对比GraphQL与REST——两种HTTP API的差异](https://www.jianshu.com/p/2ad286397f7a)
7. [GraphQL vs RESTful API 的一些想法](https://blog.tonyseek.com/post/graphql-vs-restful/)
8. [gatsby-starter-lumen](https://github.com/alxshelepenok/gatsby-starter-lumen)