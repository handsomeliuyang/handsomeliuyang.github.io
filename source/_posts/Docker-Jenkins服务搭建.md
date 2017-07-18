---
title: Docker-Jenkins服务搭建
date: 2017-07-14 13:28:44
categories: Server
tags: [jenkins,docker]
---

# Docker介绍

Docker 是一个开源的应用容器引擎，基于 Go 语言 并遵从Apache2.0协议开源。可以让开发者打包他们的应用以及依赖包到一个轻量级、可移植的容器中，然后发布到任何流行的 Linux 机器上，也可以实现虚拟化。
容器是完全使用沙箱机制，相互之间不会有任何接口（类似 iPhone 的 app）,更重要的是容器性能开销极低。

## Docker理解

![](docker理解.png)

1. Dockerfile面向开发，Docker 镜像成为交付标准，Docker 容器则涉及部署与运维
2. Docker类似于一个虚拟机，实现资源和系统环境的隔离
2. Docker镜像类似于Ghost系统，为了方便快速使用，已经完成了服务的所有配置。
3. DockerFile是一个脚本，用于生成Docker镜像的脚本
4. Docker镜像不仅可以从DockerFile生成，也可以从Docker容器生成，但最好是通过DockerFile来生成，方便后期维护。
5. 我们创建新的镜像都是从系统镜像开始创建的，如centos:7，centos：6

# 通过Docker部署Jenkins的好处

Docker解决现在的迁移服务(如Android的Jenkins)存在的问题：

1. 服务器的系统版本不一致，容易出现新问题，如缺少一些库，或软件版本过底  
    Docker：容器里的操作系统版本与主机的系统版本没有关系，不受主机的系统版本影响
2. 多个服务部署在同一台机器上，关联的软件出现相互影响  
    Docker：每个容器之间相互不影响，完全透明，类似虚拟机
3. 需要写服务部署文档，软件版本之间的关系，但新系统有可能不支持这些老版本的软件  
    Docker：DockerFile就是整个部署文档，安装的软件与主机的系统没有关系
4. 服务卸载的成本很高，很容易出现卸载不完全的问题  
    Docker：只需要删除容器，其安装的软件都可以清除
5. 服务升级很不方便，需要一台新机器或搭建虚拟机来实现  
    Docker：容器升级操作系统版本非常简单，成本非常低，修改From的关联版本就行
6. 本地文件管理比较乱，容易相互影响  
    Docker：容器之间的文件相互不影响

# Docker入门介绍

## Docker安装

在centos上安装Docker的注意点：

1. 最低支持centos7.0系统才能安装docker
2. centos6.5以上也可以安装，但安装方法与centos7.0以上的安装方法不一样
3. 具体教程可以网上查找

## 常用命令

### DockerFile生成Docker镜像

```commandline
docker build -t 镜像名称 DockerFile所在的目录

// 例子
docker build -t btown-jenkins .
```
### 从Docker镜像创建Docker容器

```commandline
docker run [-d|-it] -p 主机端口:容器里的端口 -v 主机目录:容器里的目录 -v 主机目录:容器里的目录 镜像名称 bash

// 例子
docker run -it --name btown-jenkins -p 7000:8080 -v /data0/btown_jenkins_home/jobs:/var/lib/jenkins/jobs -v /data0/btown_jenkins_home/logs:/var/lib/jenkins/logs -v /data0/btown_jenkins_home/nodes:/var/lib/jenkins/nodes -v /data0/btown_jenkins_home/secrets:/var/lib/jenkins/secrets -v /data0/btown_jenkins_home/users:/var/lib/jenkins/users -v /data0/btown_jenkins_home/workspace:/var/lib/jenkins/workspace btown-jenkins bash
```

1. -d：此容器在后台运行
2. -it：当前控制台与容器交互
3. --name：创建的容器的名称
4. -p：端口映射，把主机的端口映射到容器里的端口
5. -v：目录映射，把容器里的目录映射到主机里的目录
6. bash：进入容器后的命令，bash表示直接进入shell状态

### 数据备份

默认情况下，容器运行期间产生的文件，都处于沙箱当中，当容器删除后，也会自动删除，这会造成一些问题：

1. 服务生成的数据很不方便备份
2. 容器挂了后，就无法恢复数据了
3. 容器会变的非常的大
4. 无法共享容器间的数据

#### Docker 容器文件系统

![](Docker容器文件系统.png)

1. Dockerfile  中的每一条命令，都在 Docker 镜像中以一个独立镜像层的形式存在
2. Docker 镜像是由 Dockerfile 构建而成，但并不是每一层 Docker 镜像中都含有相应的文件系统文件
3. Docker 容器的文件系统中不仅包含 Docker 镜像，还包含初始层（Init Layer）与可读写层（Read-Write Layer）。
    1. 初始化层（Init Layer）：初始层中大多是初始化容器环境时，与容器相关的环境信息，如容器主机名，主机 host 信息以及域名服务文件等。
    2. 可读写层（Read-Write Layer）：这一层的作用非常大，Docker 的镜像层以及顶上的两层加起来，Docker 容器内的进程只对可读写层拥有写权限，其他层对进程而言都是只读的（Read-Only）
4. Docker 容器有能力在可读写层看到VOLUME文件等内容，但那都仅仅是挂载点，真实内容位于宿主机上

#### Volume 命令

为了能够保存（持久化）数据以及共享容器间的数据，Docker提出了Volume的概念。简单来说，Volume就是目录或者文件，它可以绕过默认的联合文件系统，而以正常的文件或者目录的形式存在于宿主机上。

有两种方式初始化Volume：

1. 不指定主机上的目录
    ```dockerfile
    docker run -it --name btown-jenkins -v /data btown-jenkins bash
    ```
    此命令会将/data挂载到容器中，并绕过联合文件系统，我们可以在主机上直接操作该目录，通过docker inspect命令找到Volume在主机上的存储位置：
    ```dockerfile
    docker inspect -f {{.Volumes}} btown-jenkins
    ```
    类似的输出为：
    ```dockerfile
    map[/data:/var/lib/docker/vfs/dir/cde167197ccc3e138a14f1a4f...b32cec92e79059437a9] 
    ```
2. 指定主机上的目录：
    ```dockerfile
    docker run -it --name btown-jenkins -v /home/data:/data btown-jenkins bash
    ```
    命令将挂载主机的/home/data目录到容器内的/data目录上

通过Volume挂载关键数据目录后，就可以解决上面出现的问题了

### 其他常用命令

1. 查看所有镜像：docker images
2. 删除镜像：docker rmi xxx
3. 查看所有容器：docker ps -a
4. 删除容器：docker rm xxx
5. 退出容器：exit，CTRL+D
6. 重新连接容器：
    1. docker attach xxx
    2. docker exec -it xxx bash
    3. 差别：使用docker exec连接容器后，现执行exit退出容器，容器不会停止
7. 启动|停止容器：docker start|stop

## DockerFile脚本语言

Dockerfile 是一个类似 Makefile 的工具，主要用来自动化构建镜像。

先看一个例子：
```dockerfile
# 系统版本 由于需要glibc-2.14版本以上，所以要使用centos:7
FROM centos:7.3.1611
# 作者信息
MAINTAINER liuyang@58ganji.com

# 安装基础库
RUN yum -y update
RUN yum -y install wget

# 安装 Oracle Java 7 JDK，安装成功的目录：/usr/java/jdk1.7
RUN mkdir -p /data0/soft
ADD ./jdk-7u80-linux-x64.rpm /data0/soft/jdk-7u80-linux-x64.rpm
RUN rpm -ivh /data0/soft/jdk-7u80-linux-x64.rpm

# 设置jdk的环境变量
ENV JAVA_HOME /usr/java/jdk1.7.0_80
ENV PATH $PATH:$JAVA_HOME/jre/bin:$JAVA_HOME/bin

# 复制ssh key
COPY ./ssh.tar /data0/soft/ssh.tar
RUN cd /data0/soft && tar xvf ssh.tar
RUN cp -r -f /data0/soft/.ssh /var/lib/jenkins/
RUN chmod -R 777 /var/lib/jenkins/.ssh

EXPOSE 8080

ENTRYPOINT service jenkins start
```

### 格式
Dockerfile 中所有的命令都是以下格式：<font color='#ff0000'>INSTRUCTION argument</font>

指令(INSTRUCTION)不分大小写，但是推荐大写。

### FROM 命令
<font color='#ff0000'>FROM &lt;image name&gt;</font>，例如 <font color='#ff0000'>FROM ubuntu</font>

所有的 Dockerfile 都用该以 FROM 开头，FROM 命令指明 Dockerfile 所创建的镜像文件以什么镜像为基础，FROM 以后的所有指令都会在 FROM 的基础上进行创建镜像；可以在同一个 Dockerfile 中多次使用 FROM 命令用于创建多个镜像。

### MAINTAINER 命令

<font color='#ff0000'>MAINTAINER &lt;author name&gt;</font> 用于指定镜像创建者和联系方式。

### RUN 命令

<font color='#ff0000'>RUN &lt;command&gt;</font> 用于容器内部执行命令。每个 RUN 命令相当于在原有的镜像基础上添加了一个改动层，原有的镜像不会有变化。

### ADD 命令

<font color='#ff0000'>ADD &lt;src&gt; &lt;dst&gt;</font> 用于从将 &lt;src&gt; 文件复制到 &lt;dst&gt;   
文件：&lt;src&gt; 是相对被构建的源目录的相对路径，可以是文件或目录的路径，也可以是一个远程的文件 url，&lt;dst&gt; 是容器中的绝对路径。

***注意***：如果源文件是压缩文件（如.tar,.zip等等），会自动解压，如果不想自动解压，可以使用copy命令

### COPY指令

COPY指令和ADD指令功能和使用方式类似。只是COPY指令不会做自动解压工作。

### ENV 命令

设置环境变量，参考 export 的用法咧：  
ENV LC_ALL en_US.UTF-8

### EXPOSE 命令

<font color='#ff0000'>EXPOSE &lt;port&gt; \[&lt;port&gt;...]</font> 命令用来指定对外开放的端口。

```dockerfile
EXPOSE 80
EXPOSE 8080
# 不推荐这样写，会固定死映射端口，最好通过创建容器时来指定
EXPOSE 8000:8080  
```

注意：除EXPOSE 8000:8080是提前指定了映射端口外，其他的相当于一个声明而已，具体端口映射还是在创建容器时指定的。

### ENTRYPOINT 命令

<font color='#ff0000'>ENTRYPOINT command param1 param2</font> 用来指定启动容器时，执行的命令

# 生成DockerFile的流程

由于每个重新执行一次DockerFile文件的时间很长，所以写DockerFile的最佳方案：

1. 创建一个最初的容器，再执行成功一个命令后，就添加到DockerFile文件里，等全部OK后，DockerFile也就创建完了
2. 再整体执行DockerFile文件，查看创建镜像是否成功

# Docker的容器的性能

具体内容请查看：[docker与虚拟机性能比较](http://blog.csdn.net/cbl709/article/details/43955687)

![](docker与虚拟机比较.png)

1. docker比虚拟机的优势：
    1. docker有着比虚拟机更少的抽象层
    2. docker利用的是宿主机的内核，而不需要Guest OS
    3. docker计算效率与主机一样，没有损耗，但虚拟机的计算能力损耗在50%左右  
        ![](计算效率.png)
    4. docker与虚拟机内存访问效率要高  
        ![](虚拟内存.png)
    5. docker与虚拟机启动时间及资源耗费要高
2. docker的劣势：
    1. 资源隔离方面不如虚拟机，docker是利用cgroup实现资源限制的，只能限制资源消耗的最大值，而不能隔绝其他程序占用自己的资源
    2. 安全性问题。docker目前并不能分辨具体执行指令的用户，只要一个用户拥有执行docker的权限，那么他就可以对docker的容器进行所有操作，不管该容器是否是由该用户创建。比如A和B都拥有执行docker的权限，由于docker的server端并不会具体判断docker cline是由哪个用户发起的，A可以删除B创建的容器，存在一定的安全风险。 
    3. docker目前还在版本的快速更新中，细节功能调整比较大。一些核心模块依赖于高版本内核，存在版本兼容问题

# 参考

1. [Docker 教程](http://www.runoob.com/docker/docker-tutorial.html)
2. [一图看尽 docker 容器文件系统](http://guide.daocloud.io/dcs/docker-9153976.html)
3. [docker与虚拟机性能比较](http://blog.csdn.net/cbl709/article/details/43955687)
