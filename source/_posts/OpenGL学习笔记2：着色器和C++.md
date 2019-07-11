---
title: OpenGL学习笔记2：着色器和C++
date: 2019-07-10 09:04:38
categories: OpenGL
tags: [OpenGL,C++]
---

# C++笔记
关键点：
1. C++单个文件的编译及运行：
    1. 安装编译器：GNU的gcc编译器
    2. 编译：g++ hello.cpp，生成a.out可执行文件
    3. 运行：./a.out
2. 数据类型：大部分与Java类似，差异点如下：
    1. 布尔类型：bool
    2. 字符：
        1. char, 1字节，-128~127
        2. unsigned，1字节，0~256
    3. 整型：
        1. short int，2字节
        2. int，4字节
        3. long int，8字节
    4. 浮点型：
        1. float，4字节
        2. double，8字节
        3. long double，16字节
    5. 计算类型真正所占大小：sizeof(int|float|double)
    6. 类型声明：typedef type newname
    7. 枚举：enum enum-name {} var-list;
3. 声明：函数需声明才能调用
    1. 变量声明：extern int c;
    2. 函数声明：int func();
4. 定义常量的方法：
    1. 使用 #define 预处理器
    2. 使用 const 关键字
5. 位运算符：
    1. 与：&
    2. 或：| 
    3. 异或： ^
    4. 非：~
    5. 左移右移：<<  >>
6. 函数：支持默认值及重载
7. c风格的字符串：通过char[]数组实现，以’\0’结尾
8. C++风格的字符串：string
9. 指针：
    1. 指针变量：type *name;
    2. &：表示取地址符
    3. *：取值符，表示取指针变量的指针值所指向的变量值
10. 创建对象：
    1. Person p(1, 2); // 声明时，对象已经创建
    2. Person* p; p = new Person(); // 动态内存，与java类似
11. 引用：
    1. 引用变量是变量的别名，必须定义时，赋值，且无法再修改
    2. 语法：int i = 17; int& r = i;
12. 数据结构：struct，访问成员的方法：
    1. 变量：book.title
    2. 指针：book->title
13. 面向对象：class（类）
    1. 语法：
        1. 权限：public:
        2. 命名空间：namespace --- 相当于包名，与文件名和路径无关
            1. 定义：namespace name {// 代码}
            2. 使用：
                1. using namespace name;
                2. name::fun;
        3. 继承：class Rectangle: public Shape（public的作用：统一修改基类里的公有和保护成员在子类里的权限，一般都为public）
        4. 支持运算符重载，java不支持
        5. 抽象方法：virtual修饰的方法
        6. 没有接口关键字，接口通过抽象类实现
    2. 多继承
14. 异常处理：捕获所有的异常，方式：catch(…)，或者使用std::exception
15. 动态内存：
    1. 栈：局变量都在栈里分配
    2. 堆：动态内存，通过new 或 malloc() 分配
    3. 与java的差异：Object obj;的内存分配：
        1. 出现在函数内部，在栈上创建对象
        2. 类的成员变量，取决于类的对象如何创建：
            1. Class *pClass = new Class; // 堆
            2. Class class; // 栈
    4. 栈和堆的区别：
        1. 生命周期：函数执行后，要保留生命周期，只能选择堆，但堆内存不会自动回收
        2. 性能：在堆里创建，会出现磁盘碎片
        3. 大小：栈的大小有限制，堆可以很大
16. 模板：相当于java的泛型
    1. 分为函数模板与类模板
    2. 模板的关键字：template <type T>
17. 预处理：在编译器时期，完成的指令
    1. 创建宏：#define
    2. 条件编译：#ifndef xxx，只对部分代码编译
18. 信号处理：
    1. 进程之间，可以通过信号来传递指令，比如结束当前进程
    2. 监听信号：signal()，在main()函数里，监听并添加监听处理类
    3. 发送信号：raise()，接收方是本进程的监听，通过ctrl+C可以对本进程发送中断程序的信号
19. 多线程：C++本身不支持多线程能力，依赖操作系统支持
20. 常用库及功能：
    1. cmath库：
        2. x的y次方：pow(double, double)
        3. 平方根：sqrt(double)
        4. 绝对值：abs(int)
        5. 向下取余：floor(double)
    2. 随机数：伪随机
        1. 设置种子：srand()
        2. 生成随机数：rand()
    3. c风格字符串的操作：
        1. 复制：std::strcpy(s1, s2)
        2. 连接：std::strcat(s1, s2)
        3. 长度：std::strlen(s1)
        4. 比较：std::strcmp(s1, s2)
        5. 字符串查找：std::strstr(s1, s2)，返回一个指针，指向字符串 s1 中字符串 s2 的第一次出现的位置
    4. iostream库：
        1. 标准输出：std::cout << “” << std::endl; 
        2. 标准输入：std::cin >> name
        3. 标准错误：std::cerr << "" << std::endl;
    5. 文件操作，fstream库：
        1. ofstream：输出文件流
        2. ifstream：输入文件流
        3. fstream：同时具有ofstream, ifstream的功能
        4. 文件操作流程：
            1. 打开文件：
                1. 只写打开：ofstream outfile；outfile.open("afile.dat");
                2. 只读打开：ifstream infile; infile.open("afile.dat");
            2. 读文件：infile >> data
            3. 写文件：outfile << data << endl;

# 着色器
关键点：
1. 着色器是使用一种叫GLSL的类C语言写成的
2. 着色器的结构：
    1. 版本声明：#version version_number
    2. 变量：in type xxx; out type xxx; uniform type xxx;
    3. main函数
3. 顶点差色器的输入为顶点属性（Vertex Attribute）：
    1. 一般情况的上线为16个包含4分量的顶点属性
    2. 与硬件有关，通过GL_MAX_VERTEX_ATTRIBS查询：glGetIntegerv(GL_MAX_VERTEX_ATTRIBS, &nrAttributes);
4. 着色器语言除C的基本数据类型外，还包含向量(Vector)和矩阵(Matrix)
    1. Vector相关的api：
        1. 访问4个属性：vec.x, vec.y, vec.z, vec.w
        2. 重组：vec2, vec3, vec4
5. GLSL输入与输出：
    1. 两个着色器之间，输入和输出的类型和名称一样，就会自动匹配 ---- 与顺序无关
    2. 顶点着色器的输入：通过layout来指定输入变量
    3. 片段着色器的输出：vec4颜色输出变量，指定片段最终的颜色
6. GLSL的uniform：
    1. 作用：CPU直接向GPU的着色器发送数据的方式
    2. uniform是全局唯一
    3. 着色器里的定义：uniform type xxx;
    4. opengl代码设置uniform的值：
        1. 获取地址：glGetUniformLocation(shaderProgram, "uniform名称")
        2. 使用着色器程序后，设置值：
            1. glUseProgram(shaderProgram);
            2. glUniform4f(location, 0.0f, greenValue, 0.0f, 1.0f);
7. 改变三角形颜色的方法：
    1. 通过uniform传值给片段着色器
    2. 顶点数据里，添加颜色数据，再通过顶点着色器传给片段着色器
8. 注意：片段着色器每次处理一个顶点，而不是一个图形

# 参考
1. [着色器](https://learnopengl-cn.github.io/01%20Getting%20started/05%20Shaders/)
2. [opengl的api文档](http://docs.gl/gl3/glGetProgram)