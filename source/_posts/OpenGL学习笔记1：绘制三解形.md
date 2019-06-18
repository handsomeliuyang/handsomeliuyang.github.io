---
title: OpenGL学习笔记1：绘制三角形
date: 2019-06-17 09:06:28
categories: OpenGL
tags: [OpenGL]
---
# 学习教程
> 零基础开始学习OpenGL的最佳教程learnOpenGL：https://learnopengl-cn.github.io/intro/

此笔记的学习章节：
1. [OpenGL](https://learnopengl-cn.github.io/01%20Getting%20started/01%20OpenGL/)
2. [创建窗口](https://learnopengl-cn.github.io/01%20Getting%20started/02%20Creating%20a%20window/)
3. [你好，窗口](https://learnopengl-cn.github.io/01%20Getting%20started/03%20Hello%20Window/)
4. [你好，三角形](https://learnopengl-cn.github.io/01%20Getting%20started/04%20Hello%20Triangle/)

# OpenGL介绍
关键点：
1. OpenGL仅仅是一个规范，具体实现方是显卡的生产商。所以常常需要升级显示的驱动程序。
2. OpenGL自身是一个巨大的状态机(State Machine)，OpenGL的上下文-Context管理这些状态，通过修改状态，改变渲染的图像

# Xcode环境搭建
关键点：
1. GLFW编译：
    1. 下载GLFW的[源码](https://www.glfw.org/download.html) ---- GLWF用于创建OpenGL的Context，及创建显示窗口
    2. [下载](https://cmake.org/download/)并安装CMake
    3. 运行CMake生成Xcode的工程文件
    4. 启动Xcode，直接点击【运行】编译GLFW的源码
    5. 需要的文件：
        1. 编译后的静态库：.a，路径：build/src/Debug/libglfw3.a
        2. 头文件：include目录下的.h文件，路径：glfw-3.3/include/GLFW
2. 引入GLAD：因为OpenGL只是一个标准/规范，具体实现为显卡驱动，需要在运行时，进行动态的链接，GLAD封装了此过程。
    1. 打开GLAD的[在线服务](http://glad.dav1d.de/)，进行如下配置：
        1. 将语言(Language)设置为C/C++，
        2. 在API选项中，选择3.3以上的OpenGL(gl)版本
        3. 之后将模式(Profile)设置为Core，并且保证生成加载器(Generate a loader)的选项是选中的。
        4. 点击生成(Generate)按钮来生成库文件
    5. 下载zip，提取文件：
        1. 头文件：include/
        2. 源码文件：glad.c
3. Xcode的Demo：
    1. 通过xcode创建一个command line项目，c++
    2. 创建lib目录，把.a, .h文件拖到目录中
        1. GLFW的静态库：libglfw3.a
        2. GLAD的源文件：glad.c
    3. 引入libglfw3.a依赖的库，【Build Phases】--> 【Link Binary With Libraries】里添加库：Cocoa.framework, IOKit.framework, CoreVideo.framework
    4. 在本地创建libs/目录，把GLFW和GLAD的头文件移入，移入后的目录结构：
    ![](/OpenGL学习笔记1：绘制三解形/20190617081604675.png)
    5. 设置Xcode的头文件查找路径：【Build Settings】--> 【Header Search Paths】的Debug和Release里添加include的路径
    6. 引入方式：
    ```c
    #include <stdio.h>
    #include <iostream>
    #include <glad/glad.h>
    #include <glfw3.h>
    ```

# Demo：绘制三角形
## 窗口
关键点：
1. 通过GLFW实例化窗口
2. 监听窗口变化，动态调整OpenGL的视口的大小
3. 初始化GLAD，即绑定OpenGL的函数指针
4. 创建渲染循环

```cpp
// 定义常量
const unsigned int SCR_WIDTH = 800;
const unsigned int SCR_HEIGHT = 600;

int main(int argc, const char * argv[]) {
    // 创建GLFW
    glfwInit();
    // 配置GLFW：主版本号(Major)为3
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    // 配置GLFW：次版本号(Minor)为3
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    // 配置GLFW：使用核心模式(Core-profile)
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    // mac需要添加此句
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);

    // 创建窗口
    GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "LearnOpenGL", NULL, NULL);
    if (window == NULL){
        std::cout << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);
    // 监听GLFW的窗口变化
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

    // 在调用OpenGL Api之前，需要通过GLAD初始化函数指针
    if(!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)){
        std::cout << "Failed to initialize GLAD" << std::endl;
        return -1;
    }

    // Render Loop
    while(!glfwWindowShouldClose(window)){
        // input
        processInput(window);

        // 交换缓存，调用事件
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    glfwTerminate();
    return 0;
}

void framebuffer_size_callback(GLFWwindow* window, int width, int height){
    // 设置视口，前两个参数设置左下角的位置
    glViewport(0, 0, width, height);
}

void processInput(GLFWwindow *window){
    // 点击返回按钮后，关闭窗口
    if(glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS){
        glfwSetWindowShouldClose(window, true);
    }
}
```

## 绘制三角形
关键点：
1. OpenGL的主要任务是：3D坐标转换为2D坐标，并转变为实际的有颜色的像素。
    1. 原因：在OpenGL中，任何事物处于3D空间中，但屏幕却是2D的
    2. 转换过程称为：图形渲染管线（Graphics Pipeline）
2. 图形渲染管线：由几个独立的阶段组成，每个阶段将会把前一个阶段的输出做为输入，这些阶段可以称为着色器（Shader），Shader运行在GPU上，部分Shader可以由开发者自己配置，由OpenGL着色器语言(OpenGL Shading Language, GLSL)写成的，如下图所示：
    ![](/OpenGL学习笔记1：绘制三解形/20190618090215071.png)
    1. Vertex Shader：把3D坐标转为另一种3D坐标
    2. Primitive Assembly（图元装配）阶段：装配成指定图元的形状
    3. Geometry Shader（几何着色器）：可以通过新的顶点，构建其他图元
    4. Rasterization Stage（光栅化阶段）：图元映射为最终屏幕上相应的像素，同时对超出视图外的像素执行裁切(Clipping)
    5. Fragment Shader（片段着色器）：计算一个像素的最终颜色，需要考虑光照、阴影、光的颜色等等因素
    6. Testing And Blending（测试与混合）：通过Alpha考虑混合效果
3. 默认情况下，OpenGL没有提供顶点着色器和一个片段着色器，需要自定义
4. 项点坐标输入的显示流程：
    1. 输入的3D坐标可以任意的，但只有在标准化设备坐标(Normalized Device Coordinates)范围内的坐标才会最终呈现在屏幕上，即（x、y和z）上都为-1.0到1.0的范围内
    2. 标准化设备坐标转换为屏幕空间坐标(Screen-space Coordinates)，即通过glViewport函数指定的
    3. 屏幕空间坐标又会被变换为片段，输入到片段着色器中
5. 顶点数据传输给OpenGL的过程：
    1. 创建 VAO(Vertex Array Object), VBO(Vertex Buffer Object), EBO(Index Buffer Object)：
        1. 创建VAO：glGenVertexArrays
        2. 创建VBO和EBO：glGenBuffers
    2. 绑定缓存类型，并传数据：
        1. 绑定VAO：glBindVertexArray
        2. 绑定VBO和EBO：glBindBuffer
        3. 传数据：glBufferData
    3. 设置顶点属性指针，顶点如何解析：
        1. 顶点属性指针：glVertexAttribPointer
        2. 开关：glEnableVertexAttribArray
6. 创建与编译着色器的过程：
    1. 创建着色器对象(Shader Object)，绑定source，编译，判断：
        1. 创建：glCreateShader
        2. 使用着色器语言GLSL(OpenGL Shading Language)编写顶点着色器
        3. 绑定source：glShaderSource
        4. 编译：glCompileShader
        5. 判断：
            1. glGetShaderiv
            2. glGetShaderInfoLog
    2. 创建着色器程序(Shader Program), 绑定所有的着色器对象(shader object)，链接着色器程序，对接每个输出与输入
        1. 创建：glCreateProgram
        2. 绑定：glAttachShader
        3. 链接：glLinkProgram
        4. 判断：
            1. glGetProgramiv
            2. glGetProgramInfoLog
        5. 删除着色器对象：glDeleteShader
7. 绘制三角形的过程：
    1. 设置着色器程序：glUseProgram
    2. 设置顶点数组对象VAO：glBindVertexArray
    3. 调用画图形的API，设置图元着色器的状态：glDrawArrays
8. 绘制距形的过程：
    1. 由多个三角形组成为距形
    2. 为了减少重复顶点数据，使用索引缓存数据来按顺序绘制三角形
        1. EBO，GL_ELEMENT_ARRAY_BUFFER
    3. 调用使用索引缓存数据的绘制方法：glDrawElements
3. 设置绘制模式：
    1. 线框模式：glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);

```cpp
// 定义常量
const unsigned int SCR_WIDTH = 800;
const unsigned int SCR_HEIGHT = 600;

const char *vertexShaderSource = "#version 330 core\n"
    "layout (location = 0) in vec3 aPos;\n" // create a variable aPos of type vec3
    "void main()\n"
    "{\n"
    "   gl_Position = vec4(aPos.x, aPos.y, aPos.z, 1.0);\n" // Assign a value to the predefined variable gl_Position, gl_Position is the output of this Shader
    "}\0";

const char *fragmentShaderSource = "#version 330 core\n"
    "out vec4 FragColor;\n" // create a out variable of type vec4
    "void main()\n"
    "{\n"
    "   FragColor = vec4(1.0f, 0.5f, 0.2f, 1.0f);\n"
    "}\n\0";

int main(int argc, const char * argv[]) {

    // 创建GLFW
    glfwInit();
    // 配置GLFW：主版本号(Major)为3
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    // 配置GLFW：次版本号(Minor)为3
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    // 配置GLFW：使用核心模式(Core-profile)
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

    // 经过测试，在macOS-10.14.1版本里
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);

    // 创建窗口
    GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "LearnOpenGL", NULL, NULL);
    if (window == NULL){
        std::cout << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);
    // 监听GLFW的窗口变化
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

    // 在调用OpenGL Api之前，需要通过GLAD初始化函数指针
    if(!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)){
        std::cout << "Failed to initialize GLAD" << std::endl;
        return -1;
    }

    // build and compile out shader program
    // ------------------------------------
    // vertex shader
    // create empty vertex shader
    int vertexShader = glCreateShader(GL_VERTEX_SHADER);
    // insert vertex shader source to shader object, the second parameter indicates the number of strings
    glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
    // compile the shader object that attached the source
    glCompileShader(vertexShader);
    // check for shader compile errors
    int success;
    char infoLog[512];
    glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &success);
    if (!success) {
        glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);
        std::cout << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
    }
    // Frame Shader
    // create empty frame shader object
    int fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
    // insert frame shader source to shader object, the second parameter indices the number of strings
    glShaderSource(fragmentShader, 1, &fragmentShaderSource, NULL);
    // compile the frame shader that attached the source
    glCompileShader(fragmentShader);
    // check for shader compile errors
    glGetShaderiv(fragmentShader, GL_FRAGMENT_SHADER, &success);
    if (!success) {
        glGetShaderInfoLog(fragmentShader, 512, NULL, infoLog);
        std::cout << "ERROR::SHADER::FRAGMENT::COMPILATION_FAILED\n" << infoLog << std::endl;
    }
    // link shader objects to shader program
    // create a shader program
    int shaderProgram = glCreateProgram();
    // attached a compiled shader object to a shader program
    glAttachShader(shaderProgram, vertexShader);
    glAttachShader(shaderProgram, fragmentShader);
    // links all attached shader object in one shader program
    // During the linking step, each output is matched to each input of shaders and whenever something is not right linking fails.
    glLinkProgram(shaderProgram);
    // check for linking errors
    glGetProgramiv(shaderProgram, GL_LINK_STATUS, &success);
    if (!success) {
        glGetProgramInfoLog(shaderProgram, 512, NULL, infoLog);
        std::cout << "ERROR::SHADER::PROGRAM::LINKING_FAILED\n" << infoLog << std::endl;
    }
    // removes shader object, clearing all allocated memory
    glDeleteShader(vertexShader);
    glDeleteShader(fragmentShader);

    // set up vertex data and buffer and configure vertex attributes
    // -------------------------------------------------------------
    // 3D coordinates, using one-dimensional array storage
    float vertices[] = {
        0.5f,  0.5f, 0.0f, // top right
        0.5f, -0.5f, 0.0f, // bottom right
        -0.5f, -0.5f, 0.0f, // bottom left
        -0.5f,  0.5f, 0.0f  // top left
    };
    unsigned int indices[] = {
        0, 1, 3,
        1, 2, 3
    };

    // Create VAO(Vertex Array Object), VBO(Vertex Buffer Object), EBO(Index Buffer Object)
    // VAO automatically associates VBO and EBO
    unsigned int VAO, VBO, EBO;
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);
    glGenBuffers(1, &EBO);

    // When using OpenGL to draw graphics, use vertex array objects, vertex array object associate vertex buffer object and vertex attributes
    glBindVertexArray(VAO);

    // binds a vertex buffer object to array buffer type
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    // stores vertex data in initialized memory bound to vertex buffer object
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

    // binds a index buffer object to element array buffer type
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
    // stores index data in initialized memory bound to index buffer object
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);

    // specifies how OpenGL should interpret the vertex buffer data
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void *)0);
    glEnableVertexAttribArray(0);

    // safely unbind
    glBindBuffer(GL_ARRAY_BUFFER, 0);
    glBindVertexArray(0);

    // sets the polygon rasterization mode of how OpenGL should draw its primitives.
    glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);

    // Render Loop
    while(!glfwWindowShouldClose(window)){
        // input
        processInput(window);

        // Clear the screen with specified color
        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        // Using a shader program
        glUseProgram(shaderProgram);
        // bind the vertex array object
        glBindVertexArray(VAO);
        // Draw a triangle using a vertex array object
        //        glDrawArrays(GL_TRIANGLES, 0, 3);
        // renders the vertices found in the VBO at the order specified in the indices in the EBO
        glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);

        // 交换缓存，调用事件
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glDeleteBuffers(1, &EBO);

    glfwTerminate();
    return 0;
}

void framebuffer_size_callback(GLFWwindow* window, int width, int height){
    // 设置视口，前两个参数设置左下角的位置
    glViewport(0, 0, width, height);
}

void processInput(GLFWwindow *window){
    // 点击返回按钮后，关闭窗口
    if(glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS){
        glfwSetWindowShouldClose(window, true);
    }
}
```

# C++的知识点
关键点：
1. 编译后的机器码与操作系统和CPU的指令集有关，最佳的方式是从源代码编译生成二进制文件
2. CMake是一个工程文件生成工具。用户可以使用预定义好的CMake脚本，根据自己的选择（像是Visual Studio, XCode, Eclipse）生成不同IDE的工程文件
3. Linux下的静态库以.a结尾(Winodws下为.lib)
4. Linux下的动态库以.so 或 .so.y结尾，其中y代表版本号(Windows下为.dll)
5. C++的include：
    1. <> 系统目录空间
    2. "" 用户目录空间
6. 宏定义：#define <宏名> <字符串>
7. 指针，*，&的区别
    1. *，表示指针变量地址所指向的值
    2. & 表示取变量的地址
