---
title: Hexo搭建个人博客
date: 2016-03-16 14:08:36
categories: hexo
tags:
---

# 搭建过程

1. Github配置
    1. 在Github上申请一个帐号
    2. 创建一个repository，其命名规则有两种
        1. <你的用户名>.github.io // 那你的博客地址就是 http://<你的用户名>.github.io **推荐**
        2. <任意名称>  // 那你的博客地址将是：http://<你的用户名>.github.io/<任意名称>
    3. 使用ssh连接，配置ssh的公钥和私钥，以后连接github不用再输入密码
2. Hexo安装
    1. 请按最新官网安装并配置Hexo，具体请看：<https://hexo.io/>
    2. 使用如下命令，搭建本地Server：
    ``` shell
    hexo clean  // 清除刚刚创建的静态web网页
    hexo g  // hexo generator的缩写，生成静态web网页，生成的目录是：public
    hexo s  // hexo server的缩写，生成本地web服务器，可以访问，查看效果
    ```
    
3. 开发环境
    1. 下载webstorm
    2. 给webstorm安装markdown插件
    3. 通过webstorm加载hexo
4. Hexo的目录结构
![](/img_markdown/13.png)
5. Hexo的配置
    1. 在_config.yml里设置如下参数：
        1. title
        2. subtitle
        3. description
        4. author
        5. email
        6. language
    2. 在_config.yml里配置github的服务器及主分支：
    ```
    deploy:
      type: git
      repository: git@github.com:xxx
      branch: master
    ```
    3. 在_config.yml里配置主题和对css文件等等的压缩
    ```
    theme: jacman // 这个是我使用的主题，你可以在网上下载更多的主题
    stylus:
      compress: true // 对样式文件进行压缩
    ```
    4. 按官网教程安装Hexo后，执行hexo d命令会报错，是由于缺少Module库，执行下面的命令：
    ```shell
    npm install hexo-deployer-git --save
    ```
    安装之后，就可以执行hexo d进行部署了  
6. 写博客
    1. 使用如下命令创建新的文章：
    ```shell
    hexo new "文章名称"
    ```
    2. 在source文件下，创建一个存放图片目录，如img，在文章里引用的地址为：/img/图片名
    3. 在目录source/_posts目录下找到文件，并编辑
    4. 文章可以设置categories(类别)和tags(标签)，**注意**：tags下面只能是3个横线，多了少了都不行
7. 查看效果
```shell
hexo clean
hexo g
hexo s
[空行]
hexo d // hexo deployer的缩写 发布到Github
```

# Hexo备份

**使用Github来备份**
1. 在github上创建一个hexo的分支
2. 把本地的hexo项目上传到hexo分支里，但注意配置.gitignore文件，如下：

```
.DS_Store
Thumbs.db
db.json
*.log
node_modules/
public/
.deploy*/
.idea
```

# 添加新功能

1. 改主题，我使用的是jacman
2. 添加关于，使用如下命令
```
hexo new page "about" // 这样创建md文件，才能使用/about来引用到
```
3. 添加百度统计，用于统计网站流量
4. 添加站内搜索
5. 添加评价，推荐使用**多说**
6. 添加百度搜索、google搜索
7. 添加sitemap.xml，供搜索引擎的爬虫使用

# hexo发布新文章

方法一：

1. 创建文章，命令如下：
```shell
hexo new "文章名称"
```
2. 在source/_posts目录下，就会创建此文章，编译完成后，部署，命令如下：
```shell
hexo clean
hexo d -g // 相当于先执行hexo g 再执行hexo d
```

方法二：

1. 新创建草稿，命令如下：
```shell
hexo new draft "文章名称"
```
2. 在source/_drafts目录下，会创建相应的文章，编写文章，草稿文章默认情况下，不会被部署到站点里
3. 把草稿发布为文章，命令如下：
```shell
hexo publish "草稿文章名称"
```


