---
title: 托管博客到Coding
date: 2016-03-16 22:01:41
categories: hexo
tags:
---

# 原因
github上push代码，访问速度都比较慢，所以决定迁移到国内的Git托管服务：Coding

# 迁移Repository步骤：

1. 进入Coding站点：<https://coding.net>，申请帐号
2. 创建一个Project，如下设置：
    1. 项目名称为**用户名**
    2. 设置为公开
    3. 使用【导入仓库】功能，把github上的仓库导入进来
3. 从master分支创建一个**coding-pages**分支，并设置其为默认分支
4. 并已**coding-pages**为分支，打开Pages服务
5. 即可以访问自己的博客：http://用户名.coding.me
6. 修改hexo里的_config.yml文件里的布署，修改如下：
```
deploy:
  type: git
  repository: git@git.coding.net:handsomeliuyang/handsomeliuyang.git
  branch: coding-pages
```