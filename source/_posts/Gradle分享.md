---
title: Gradle分享
date: 2016-03-16 18:15:29
categories: Android
tags: [Android, Gradle]
---

# Gradle是什么

1. Gradle是一个自动化构建工具，用来替换ant及maven。
2. Gradle的特点：
    1. 具有表达性的语言和强大的API（Gradle的表达性语言称为DSL）
    2. Gradle就是Groovy，但高于Groovy
    3. 灵活的约定（所有的配置属性都有其默认值，但也可以全部进行配置）
    4. 和其他构建工具的集成（可以与Ant，Maven集成，迁移成功比较低）
    5. 强大的依赖管理（Gradle没有其专有的依赖管理工具，但其兼容Ivy及Maven）
    6. 扩展非常方便
3. Groovy与Java的关系：
![](/img_markdown/1.png)

# Gradle的脚本里的语法

## Gradle脚本例子

脚本build.gradle, 如：
```gradle
task hello1 << {
    println 'hello1'
}
```
上面的代码使用DSL定义了一个Task

1. 问题：什么是DSL，其与groovy的关系是什么？
    解答：
    1. DSL分为两类：外部DSL和内部DSL。外部DSL是一种独立的可解析的语言，举一个最常见的是例子，SQL，它专注于数据库的操作。内部DSL是通用语言所暴露的用来执行特定任务的API，它利用语言本身的特性，将API以特殊的形式（或者格式）暴露出来的，如Gradle。
    2. Gradle是内部DSL，其实就是一套API，对应其Groovy的对象。定义DSL的目的，是使Gradle看上去更像脚本语言。
    3. Gradle基于Groovy但大于Groovy，它是经过“定制”的Groovy，是经过“定制”的面向对象语言，所以，由始至终，Gradle都离不开对象这个概念。
2. 上面的Gradle脚本转化为对应的Groovy对象来理解：
    1. 有一个Project对象，其有一个task方法，返回一个Task对象，如Project.task(String name)
    2. hello1是一个String的参数
    3. 符号“<<”是操作符重载。Task.leftShift(Closure action)，用来给task的action列表中添加一个action。
3. 转化为Groovy代码的写法：
```gradle
task("hello1").leftShift({
    println 'hello world'
})
```

## Gradle的DSL与API对应

既然DSL是一套API，用来对应Groovy里的对象的，那主要有哪些对象了。
    1. DSL文档：https://docs.gradle.org/current/dsl/，Java文档：https://docs.gradle.org/current/javadoc/
    2. Gradle对象，运行脚时，第一个创建的对象
    3. 每个build.gradle脚本对应Project对象
    4. 每个task都是interface Task的子类，上面创建的hello1是DefaultTask的对象
    5. 在build.gradle里可以使用DSL写代码，也可以使用Java语法或Groovy语法来写代码。
    
## 定义Task的几种方法

1. 使用DSL方式来定义
![](/img_markdown/2.png)
    特点：
    1. 都是DefaultTask类的子类
    2. 都是相当于调用doLast()方法，把闭包传入一个队列里，当task的方法执行完后，再进行调用，和Android的Hander比较类似。
    3. 注意：上面都不是方法定义，都是方法调用，
2. 自定义Task类和方法
![](/img_markdown/3.png)
    特点：
    1. 由于Gradle使用的是Groovy，所以只有在定义类时，才能定义方法，其他DSL里的，都是调用方法。
    2. 由于Gradle是一种脚本语言，其运行时，不用手动将java类转化为class文件，才能执行，而是可以直接编译，解释执行。
    
## Android-Gradle插件相关：

1. Android插件的DSL：http://google.github.io/android-gradle-dsl/

# Gradle的生命周期

## gradle运行例子

当我们有一个build.gradle的脚本，内容如下：
```gradle
task helloWorld << {
    println 'hello, world'
}
```
执行Task:
```shell
$ gradle -q helloWorld
hello, world
```

## Gradle的底层运行过程：
![](/img_markdown/4.png)

# Task相关

1. 为了方便对编译过程进行干预，每个Task都有一个doFirst()和doLast()方法，可以不断的给Task的两个执行对列添加闭包对象，等Task执行时，再依次执行，如下图所示：
![](/img_markdown/5.png)
2. 可以访问DefaultTask里的任何属性，在Groovy里，属性会自动创建对应的getXXX()，setXXX()方法
3. 默认创建的task对象，都是DefaultTask类的对象，可以修改其对象类型，如下：
![](/img_markdown/6.png)
4. Task之间可以创建其依赖，等特其他Task执行完之后，再进行执行，定义依赖：
![](/img_markdown/7.png)
5. 理解Task的配置阶段及执行阶段
![](/img_markdown/8.png)
6. task的inputs及outputs

判断一个Task是否执行，是通过判断其inputs及outputs是否有改动，如果有改动时，才会执行。
定议Task的的inputs和outputs是在定义Task类时，通过注解添加的，对应DefaultTask里有两个属性：inputs: TaskInputs  outputs: TaskOutputs
通过gradle xxx -d可以看到task的inputs及outputs

# 依赖管理
1. 为什么要引入依赖管理？
    没有引入依赖管理时，我们会遇到的一些问题：
    1. Eclipse开发Android阶段，对于jar的引入，需要手动去下载
    2. 依赖的jar如果还关系其他jar，也需要进行引入
    3. 如果jar有变动时，通知使用方去修改，也比较麻烦
    4. 经常出现依赖jar版本不合适的问题
    依赖管理就是为了解上面这些问题，而引入的。
2. Gradle的依赖管理，Maven仓库，本地依赖缓存
![](/img_markdown/9.png)
    总结：
    1. Android-Cradle插件的Maven仓库地址：http://mvnrepository.com/artifact/com.android.tools.build/gradle
    2. 58同城的Maven仓库地址：http://artifactory.58corp.com:8081/artifactory/webapp/browserepo.html?6
    3. 本地的依赖缓存的地址：.gradle/caches/modules-2/files-2.1
        1. 查看本地缓存地址的方法：输出configurations里的dependency对象，就可以知道其保存地址
        2. 通过gradle xxx -d输出完整地址，仔细去读里面的日志，也可以知道其保存地址
3. 外部模块依赖
    外部模块依赖的属性：
    1. group：用来标识一个公司，组织或者项目，通常的做法是：公司的域名反写。如：com.wuba.wuxian.lib
    2. name：一个模块的名称，一个group内要唯一。如：WubaCommonsLib
    3. version：版本号，如：2.0.0，3.6.3-Final，2.0.0-SNAPSHOT等等。所以版本号不是int类型，是String类型
    4. classifier：如果group,name,version都一样时，用于区分的。如jar的源码，javadoc等等
    如例子：
    1. com.wuba.wuxian.lib:WubaCommonsLib:2.0.0-SNAPSHOT
    2. com.wuba.wuxian.lib:WubaCommonsLib:2.0.0-javadoc
    3. com.wuba.wuxian.lib:WubaCommonsLib:2.0.0-sources
4. 依赖冲突的解决方案
    冲突出现的情况
    1. a库和b库都关系同一个c库
    解决方案：gradle的依赖管理会自动使用最新的c库，不会使用两次c库
    2. a库关联b库，同时关联c的源码，b库关系c库的aar
    问题原因：c的源码库及c库的aar不是同一个库，会当作不同的库进行处理，因为其group不一样
    解决方案：
    1. 只引入b库的aar，不引入b库的关联库c，如下所示：
    ![](/img_markdown/10.png)
    2. 使用排除法，排除b库的c库就行，如下所示：
    ![](/img_markdown/11.png)
    3. 更多的配置文档：<https://docs.gradle.org/current/javadoc/>里的DependencyHandler
5. 灵活的版本号及本地缓存更新
    如果想一直使用最新版本，可以使用动态版本本声明：com.wuba.wuxian.lib:WubaCommonsLib:2.0.0+，但希望不要这样使用，如果最新的版本，其兼容有问题，这样会影响现有代码运行。
    如果正在开发调试WubaCommonsLib期间，这时，定义版本号时，可以使用快照版本号，-SNAPSHOT。把版本号定义为-SNAPSHOT时，gradle的依赖管理，会使用最新的快照库
    如果本地版本库有缓存后，如果想使用最新的依赖版本，这时，就要修改本地缓存策略，如下所示：
    ![](/img_markdown/12.png)

# 参与文档：
1. Gradle深入与实战：<http://benweizhu.github.io/blog/2015/03/31/deep-into-gradle-in-action-6/>
2. 《实战Gradle》



