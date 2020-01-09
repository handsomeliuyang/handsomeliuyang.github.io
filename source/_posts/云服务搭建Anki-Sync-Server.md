---
title: 云服务搭建Anki Sync Server
date: 2020-01-08 19:53:36
categories: Server
tags: [docker]
---

# 背景
> 知识的学习过程：懂，熟，巧

1. 懂：通过看视频，看文章，写分享很容易达到懂的状态
2. 熟：重复，重复，再重复
3. 巧：实践，实践，再实践

除了经常用到的知识外，很多知识点，我们都处于懂的阶段，之前的学过的知识，之前写过的分享，只要长时间不使用，就记不清了，导致相同的知识总是处于学习，忘记，再学习的过程。

> 英国哲学家培根说：“一切知识的获得都是记忆”

要熟练，就要记忆，而要记忆就要重复，如何高效率的重复呢？[Anki](http://www.ankichina.net/anki20.html)就是一个使记忆变得容易的学习软件

其具有如下特点：
1. 科学安排复习间隔：艾宾浩斯遗忘曲线
2. 通过主动召回测试，提升学习效率：卡片（问题|答案）
3. 支持图像、音频、视频和LaTeX
4. 跨端且开源，支持windows，mac，linux，android，iphone。注意：iphone未开源且收费，其他都免费且开源

Anki由于是小众软件，没有商业化，所以其同步过程在国内很慢，而且经常还失败，同时有些卡片内容不想同步到server，就有想自己搭建Anki Sync Server的想法。

由于AnkiWeb没有开源，网上有个牛人把自己实现了一套Anki Sync Server。
1. github地址为：[tsudoko/anki-sync-server](https://github.com/tsudoko/anki-sync-server)
2. docker安装：[kuklinistvan/docker-anki-sync-server](https://github.com/kuklinistvan/docker-anki-sync-server)

# Anki Sync Server安装过程
1. 安装docker：curl -sSL https://get.daocloud.io/docker | sh
2. 启动docker服务：service docker start
3. 创建两个目录：
    ```shell
    mkdir anki-data // 用于存放Anki的数据
    mkdir anki-docker // 用于存放anki docker的shell脚本
    ```
4. 参考[kuklinistvan/docker-anki-sync-server](https://github.com/kuklinistvan/docker-anki-sync-server)创建run.sh脚本：
    ```
    cd anki-docker
    vim run.sh
    ---------
    // run.sh的内容如下：
    export DOCKER_USER=root
    export ANKI_SYNC_DATA_DIR=/root/liuyang/anki_sync_server/anki-data
    export HOST_PORT=27701
    
    mkdir -p "$ANKI_SYNC_DATA_DIR"
    chown "$DOCKER_USER" "$ANKI_SYNC_DATA_DIR"
    chmod 700 "$ANKI_SYNC_DATA_DIR"
    
    docker run -itd \
        --mount type=bind,source="$ANKI_SYNC_DATA_DIR",target=/app/data \
        -p "$HOST_PORT":27701 \
        --name anki-container \
        --restart always \
        kuklinistvan/anki-sync-server:tsudoku-2.1.9
    ---------
    ```
5. 添加用户：
    ```shell
    # 进入docker容器
    docker exec -it anki-container /bin/sh
    
    # 查看添加用户的命令帮助
    /app/anki-sync-server # ./ankisyncctl.py --help
    
    # 添加新用户及设置其密码
    /app/anki-sync-server # ./ankisyncctl.py adduser <username>
    Enter password for <username>: 
    
    # 列表所有的用户
    /app/anki-sync-server # ./ankisyncctl.py lsuser
    
    # 修改用户的密码
    /app/anki-sync-server # ./ankisyncctl.py passwd <username>
    Enter password for <username>:
    ```

# Android端配置

1. 对应的Android Apk的下载地址：链接:https://pan.baidu.com/s/1CemVYTOOZe0odjkYuKgKMg  密码:pesp
2. 进入【设置】-->【高级设置】-->【自定义同步服务器】如下配置
    1. 同步地址：http://云服务器的外网ip:27701/
    2. 媒体文件同步地址：http://云服务器的外网ip:27701/msync
3. 进入【设置】-->【AnkiDroid】-->【登录】：输入上面创建的账号与密码

# 桌面PC端Anki配置

1. 对应软件下载地址：
    1. mac：链接:https://pan.baidu.com/s/1xmdO5-IjlPOQnJ-vGLI_tA  密码:2689
    2. window：链接:https://pan.baidu.com/s/1f4KTJsm-MBNJkxUGAD4dqA  密码:oz3i
2. 启动软件，进入【工具】--> 【附加组件】--> 点击【获取插件】，输入代码：2124817646，点击【OK】，安装成功SyncRedirector插件
3. 双击【SyncRedirector】，进行如下配置：
    ```
    {
        "msyncUrl": "http://云服务器的外网ip:27701/msync/",
        "syncUrl": "http://云服务器的外网ip:27701/sync/"
    }
    ```
4. 重启Anki
5. 【文件】-->【切换配置方案】，添加刚才创建的用户名，点击同步，输入刚才创建的用户名和密码

# 参考
1. [利用群晖Synology进行Anki同步](https://zhuanlan.zhihu.com/p/70269217)
2. [kuklinistvan/docker-anki-sync-server](https://github.com/kuklinistvan/docker-anki-sync-server)



