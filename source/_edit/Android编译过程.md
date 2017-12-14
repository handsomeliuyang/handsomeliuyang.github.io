

# 参考

1. [Use Java 8 language features](https://developer.android.com/studio/write/java8-support.html#supported_features)
2. [Android编译流程和Gradle使用](http://www.jianshu.com/p/eaaddfe34d11)
3. [Android编译及Dex过程源码分析](http://mouxuejie.com/blog/2016-06-21/multidex-compile-and-dex-source-analysis/)

编译工具链：jdk的1.7与1.8，1.8的高级特性的调研
1. https://developer.android.com/guide/platform/j8-jack.html#configuration
    1. 旧版 javac 工具链： javac + dx 工具链
javac (.java → .class) → dx (.class → .dex)
    2. 新版 Jack 工具链：
Jack (.java → .jack → .dex)
2. https://zhuanlan.zhihu.com/p/24708104
3. Jack工具链尝试失败：https://www.zhihu.com/question/41208849