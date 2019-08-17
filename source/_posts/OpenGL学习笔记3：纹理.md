---
title: OpenGL学习笔记3：纹理
date: 2019-08-17 11:56:19
categories: 
tags:
---

# 纹理
关键点：
1. 纹理Texture的作用：通过指定顶点的颜色来设置效果，实现成本非常大，通过Textures（一张2D图片）来实现，成本就会低很多
2. 映射过程：为顶点指定Textures上的纹理坐标（Texture Coordinate）
3. 纹理坐标：坐标原点在**左下角**，范围[0, 1]
4. 纹理映射过程称为：Sampling（采样）
5. 纹理Texture的Paramete有两种：
    1. Texture Wrapping（纹理环绕方式）
        1. 如默认值为GL_REPEAT
        2. 设置方式是按坐标轴设置，2D的是s,t, 如果是使用3D纹理那么还有一个r
        3. 代码：
            1. glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
            2. glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
    2. Texture Filtering（纹理过滤），用于处理放大或缩小后的处理方式
        1. 放大后出现素颗粒效果：GL_NEAREST（邻近过滤，默认过滤方式）
        2. 放大后出现虚化效果：GL_LINEAR（线性过滤，计算近似值）
    3. 最佳设置方式：
        1. 缩小时邻近过滤：glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
        2. 放大时线性过滤：glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
6. 当物体距离观察者越来越远时，物体越来越小，使用高清纹理Sampling，出现采样困难和内存浪费问题
    1. 解决方案：Mipmap（多级渐远纹理），其原理：距离观察者的距离超过一定的阈值，会使用不同的纹理图
    2. Mipmap可以设置不同的纹理过滤效果，用于解决两个不同级别的多级渐远纹理层之间会产生生硬边界
7. 纹理图片加载：
    1. 方式：通过stb_image.h库，把图片加载内存中
    2. 注意：图片的原点坐标在左上角，但纹理在左下角，图片默认会倒立，可通过stb_image的方法纠正：stbi_set_flip_vertically_on_load(true);
8. 纹理生成：
    1. 方式：通过api：glTexImage2D生成纹理
9. 传递给着色器：
    1. 方式：通过激活纹理单元
        1. glActiveTexture(GL_TEXTURE1);
        2. 着色器：uniform sampler2D texture1
    2. 目的：同时支持多个Texture，一般至少可以支持0...16个纹理

# 参考
1. [纹理](https://learnopengl-cn.github.io/01%20Getting%20started/06%20Textures/)
2. [Textures](https://learnopengl.com/Getting-started/Textures)
3. [opengl的api文档](http://docs.gl/gl3/glTexImage2D)
