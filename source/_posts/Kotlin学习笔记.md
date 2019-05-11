---
title: Kotlin学习笔记
date: 2019-05-07 14:47:09
categories: Android
tags: [Kotlin]
---

# Kotlin优势

1. 更安全，避免NPE（NullPointerException），强制判断再使用
2. 更多的语言特性（如java8新特性，类扩展等等），使用代码更简洁
3. 与Java互调，能使用Java所有的工具库（<font color="#ff0000">原因：</font>Kotlin编译为JVM上运行的字节码，与java的原生字节码基本一致，部份情况下，性能更强）

# Kotlin基础类型
Kotlin是强类型语言，即确定类型后，就不能再修改其类型。JavaScript就是弱类型语言

## 类型
抛弃了Java的基本类型，都是引用类型：
1. 整数：Byte-1, Short-2, Int-4, Long-8
2. 浮点型：Float-4, Double-8
3. 字符型：Char，’a’
4. Boolean类型：Boolean
5. 字符串：String，”abc”
6. <font color="#ff0000">字符串模板：</font>”图书价格是: ${bookPrice }”
7. <font color="#ff0000">类型别名：</font>typealias 类型别名=已有类型

## 变量定义

语法：var|val 变量名[:类型] [= 初始值]
```kotlin
// 读写变量
var name: String = "ly"
// 只读变量
val age: Int = 18
```

val表示只读变量，不同的变量类型，其初始值有一定的区别：
1. 局部变量：只要在第一次使用之前初始化值就行
2. 类属性：可以声明时，或构造函数里初始化

```kotlin
class MainActivity : AppCompatActivity() {
    val age: Int // = 18
    constructor() {
        this.age = 18
    }
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        val tempVar: String
        ...
        tempVar = "初始值"
    }
}
```

## Null安全
通过如下语法保证Null安全：
1. 类属性没有默认值，强制设置初始值
2. var a:String 不支持null值
2. var a:String? 支持null值，但不能直接调用其方法与属性

```kotlin
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        var a:String = null // 编译报错
        var a:String? = null // 编译通过
        if(savedInstanceState != null) {
            a = "HelloWorld"
        }
        Log.d("liuyang", "${a.length}") // 编译报错
    }

}
```

**可空变量使用姿式：**
1. 先判空再使用
    ```kotlin
    if(a != null){
        Log.d("liuyang", "${ a.length }")
    }
    ```
2. 安全调用
    ```kotlin
    Log.d("liuyang", "${ a?.length }") // 当a==null时，返回null
    ```
3. Elvis运算，对安全调用的补充，允许修改为null时的返回值
    ```kotlin
    Log.d("liuyang", "${ a?.length ?: "" }")
    ```
4. 强制调用，可能引发NPE异常 --- <font color="#ff0000">不推荐</font>
    ```kotlin
    Log.d("liuyang", "${ a!!.length }")
    ```

# Kotlin运算符
两个关键点：
1. 运算符通过方法实现，即运算符都是编译时使用，编译后都是方法
2. 支持运算符重载

```kotlin
class Animal(name: String, age: Int) {
    var name: String
    var age: Int
    init {
        this.name = name
        this.age = age;
    }
    // 运算符重载
    operator fun plus(other: Animal): Animal{
        this.name = this.name + other.name
        this.age = this.age + other.age
        return this;
    }

}

var animal: Animal = Animal("animal", 2);
var animal2: Animal = Animal("animal2", 1);
var animal3: Animal
// 下面两个写法是一样的
animal3 = animal.plus(animal2);
animal3 = animal + animal2 // 编译为字节码的代码：animal.plus(animal2);
```

**常用运算符对应表**

运算符     | 对应方法
----      | ---
a - b     | a.minus(b)
a + b     | a.plus(b)
a * b     | a.times(b)
a / b     | a.div(b)
a[i]      | a.get(i)
a[i]=b    | a.set(i, b)
<font color="#ff0000">a == b</font>    | a?.equals(b) ?: (b === null)
a != b    | !(a?.equals(b) ?: (b === null)))
a in b    | b.contains(a)
a !in b   | !b.minus(a)

**三个等号===**

=== 三个等号的意思，则比较的是内存地址，如下：
```kotlin
var a = "字符串"
var b = a
var c = a
print(b === c) // 结果为true
```
但对于Int类型的变量有差异，有兴趣的同学可以进一步再了解

# Kotlin流程控制
关键点：
1. 没有三目运算符，if表达式支持返回值
    ```kotlin
    // 不支持三目运算符
    // min = (a > b) ? a : b
    
    // 通过if替换
    min = if (a > b) a else b
    ```
2. when 替换 switch
    ```kotlin
    var score = 'B'
    when (score){
        'A' -> println("优秀")
        'B' -> println("良好")
        'C' -> println("中")
        'D' -> println("及格")
        else -> println("不及格")
    }
    ```
3. for的语法：for (常量名 in 对象) {}
    ```kotlin
    // 遍历1-5
    for(i in 1..5){
        println(i)
    }
    
    var list: Array<String> = arrayOf("a", "b", "c");
    for(key in list){
        println("${key}");
    }
    //下面的写法不支持
    //for(int i=0; i<list.length; i++){
    //    println("${list[i]}");
    //}
    ```

# Kotlin的数组和集合

## Array，Set，List
1. 创建对象
    1. xxxOf(参数) --- 长度固定
    2. mutableXXXOf(参数) --- 长度可变（Array除外）
2. 常用功能
    1. 长度：xxx.size属性
    2. 包含："java" in xxx 对应方法：xxx.contains("java")
    3. ...
3. 遍历
    1. 遍历值：for (book in books) { }
    2. 遍历下标：for (i in books.indices) {}
    3. 遍历下标与值：for ( (index, value) in books.withindex() ) { }

```kotlin
// 创建数组
var array: Array<String>
array = arrayOf("a", "b", "c");
array = Array<String>(3, {index-> "a${index}"})

// 创建List
var list: List<String>
list = listOf("a", "b", "c")        // 长度不可变
list.add("d") // 无此方法，编译报错
list = mutableListOf("a", "b", "c") // 长度可变
list.add("d") // 编译成功
list = arrayListOf("a", "b", "c")   // ArrayList

// 创建Set
var set: Set<String>
set = setOf("a", "b", "c")          // 长度不可变
set.add("d") // 无此方法，编译报错
set = mutableSetOf("a", "b", "c")   // 长度可变
set.add("d") // 编译成功
set = hashSetOf("a", "b", "c")      // HashSet
set = linkedSetOf("a", "b", "c")    // LinkedHashSet

// 遍历值
for (value in array) {
    Log.d("liuyang", "${value}")
}
// 遍历下标
for (index in array.indices){
    Log.d("liuyang", "${array[index]}")
}
// 遍历下标与值
for ((index, value) in array.withIndex()){
    Log.d("liuyang", "${index},${value}")
}
```

## Map
1. 创建对象
    1. mapOf(”Java” to 86, “xxx” to xx) --- 长度固定
    2. mutableMapOf(”Java” to 86, “xxx” to xx) --- 长度可变
2. 常用功能
    1. 长度：map.size属性
    2. 包含：key in map 对应方法：map.contains(key)
3. 遍历
    1. 遍历Entry：for (en in map.entries) { en.key  en.value}
    2. 解构遍历key，value：for ( (key, value) in map) {}
    3. 遍历key：for (key in map.keys ) {}

```kotlin
// 创建Map
var map: Map<String, Int>
map = mapOf("Java" to 86, "Kotlin" to 87)         // 长度不可变
// map.put("Flutter", 88) // 无此方法，编译报错
map = mutableMapOf("Java" to 86, "Kotlin" to 87)  // 长度可变
map.put("Flutter", 88) // 编译成功
map = hashMapOf("Java" to 86, "Kotlin" to 87)     // HashMap
map = linkedMapOf("Java" to 86, "Kotlin" to 87)   // LinkedHashMap

// 遍历Entry
for (en in map.entries) {
    Log.d("liuyang", "${en.key},${en.value}")
}
// 解构遍历key，value
for ((key, value) in map) {
    Log.d("liuyang", "${key},${value}")
}
// 遍历key
for (key in map.keys) {
    Log.d("liuyang", "${key},${map[key]}")
}
```

# Kotlin的函数或方法
关键点：
1. 独立存在称为函数（function），存在类里的称为方法（method）
2. <font color="#ff0000">语法：</font>
    ```kotlin
    fun 函数名(参数名 : 参数类型)[:返回值类型]{
        // 函数体
    }
    
    注意：
    1. 无法返回值：省略 或 :Unit（相当于Java的void）
    2. 参数：支持命名参数，默认值，可变参数(vararg)
    ```
5. 函数可当变量的类型：var myfun : (Int , Int) -> Int = ::pow
6. 函数在字节码里，通过类来实现
7. 匿名函数的语法：fun(参数名 : 参数类型)[:返回值类型]{ }
8. 内联函数：
    1. 语法：inline fun 函数名(参数名:参数类型)[:返回值类型]{ }
    2. 意义：提升代码量很少，但调用很频繁的函数开销
    3. 原理：增加代码来减少函数调用的时间开销，适用于代码量非常少的函数，如单表达式

```kotlin
// 函数
fun add(a: Int, b: Int): Int {
    return a + b
}

// 函数调用
var c: Int = add(1, 2)
var d: Int = add( b = 1, a = 2)
// 创建一个函数类型
var e: (Int, Int) -> Int = ::add
var f: Int = e(1, 2)
//var g: Int = e(a=1, b=2) // 编译不通过
```

# Lambda表达式
关键点
1. 语法：
    ```kotlin
    { 参数名 : 参数类型 ->  函数体 }
    
    注意：
    1. 最后一行默认return
    2. 如果只有一个参数，可以省略参数，使用it代替
    3. 显示添加return语句，不是返回其本身，而是返回其所在的函数
    ```
2. 意义：
    1. 简化局部函数
    2. 简化函数式接口（函数式接口：只包含一个抽象方法的接口）
3. 使用注意点：
    1. 方法的参数是函数或函数式接口时：
        1. 只一个参数：可省略括号
        2. 最后一参数时：Lambda表达式可写在圆括号外面
    2. 与局部函数或匿名内部类一样，可以访问所在函数的局部变量 — 注意：是变量的副本
    3. 支持解构，括号里的参数表示是解析的变量，如下两种写法：
        1. map.mapValues { entry ->”${entry.key}-${entry.value}!”} // 正常参数
        2. map.mapValues { (key, value) -> ”${key}-${value}!” } // 解构

```kotlin
class MainActivity : AppCompatActivity() {

    var clickTime: Int = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        var text: TextView = findViewById(R.id.textView2)
        var btn: Button = findViewById(R.id.btn)

        // OnClickListener是一个函数式接口（只有onClick(View)的方法）
        // setOnClickListener(OnClickListener) 此方法只有一个函数式接口参数，可省略括号
        btn.setOnClickListener { view ->
            text.setText("${text.text} ${++clickTime}")
        }

        // postDelayed(Runnable, long) 有两个参数，且Runnable参数不在最后，不能省略
        btn.postDelayed({
            text.setText("${text.text} ${++clickTime}")
        }, 1000)

    }

}
```

# Kotlin的面向对象：类
## 构造器
关键点：
1. 分为主构造器与次构造器，互为重载方法，其语法如下：
    ```kotlin
    // 主构造器，可以省略constructor
    class Animal(name: String, age: Int) {
        var name: String
        var age: Int

        // 初始化块，相当于主构造器的函数体，注意：可以有多个初始化块
        init {
            this.name = name
            this.age = age;
        }

        // 次构造器，必须调用主构造器
        constructor() :this("", 0) {

        }
        // 次构造器，必须调用主构造器
        constructor(name: String): this(name, 0) {

        }
        // 次构造器，必须调用主构造器
        constructor(age: Int): this("", age) {

        }

        operator fun plus(other: Animal): Animal{
            this.name = this.name + other.name
            this.age = this.age + other.age
            return this;
        }

    }
    ```
2. 主构造器的参数使用var|val修饰时，即表示形参，也表示类的属性
    ```kotlin
    // 主构造器，可以省略constructor
    class Animal(var name: String, var age: Int) {
    //    var name: String
    //    var age: Int
    //
    //    init {
    //        this.name = name
    //        this.age = age;
    //    }
    
        operator fun plus(other: Animal): Animal{
            this.name = this.name + other.name
            this.age = this.age + other.age
            return this;
        }
    }
    ```
3. 意义：把构造器中相同的逻辑放在初始化块中，个性化的放在次构造器中

## 属性
关键点：
1. 语法与变量一样
2. 对属性，默认生成getter，setter方法（val属性只提供getter），编译为字节码后生成如下成员：
    1. backing field： xxx属性
    2. getter方法：    getXXX()
    3. setter方法：    setXXX()
3. getter,setter方法可重载，在重载方法里，通过field访问backing field（为防止死循环）
4. 注意：
    1. val属性会出现两种情况：--- 判断依据：getter方法里没有调用field，就是计算属性
        1. 只有getter方法 --- 称为计算属性
        2. backing field 和 getter方法 --- 只读属性
    2. private属性，默认不会生成getter, setter方法，但如果重写getter，setter方法后，会生成
6. 意义：很方便实现数据监听机制，类型Vue的MVVM框架

```kotlin
// 只读属性
val fur: String = "red"
    get() {
        return "fur=${field}" // 拦截fur变量，添加前缀
    }

// 计算属性
val nameAndAge: String
    get(){
        // 没有使用field属性，所以不会生成backing field
        return "${this.name}-${this.age}"
    }
```
## 类的方法
方法与函数基本一致，略

## 对象
关键点：
1. 创建对象省略new关键字，如：var animal: Animal = Animal()
2. 访问属性，本质是调用getter，setter方法：
    ```kotlin
    var animal: Animal = Animal()
    var name: String = animal.name // 实现是调用animal.getName()
    animal.age = 3 // 实际是调用animal.setAge(3)
    ```
3. 支持解构：（解构：相当于一个运算符，通过operator重载）
    ```kotlin
    // Animal通过重载，支持解构
    class Animal constructor(name: String, age: Int) {
        var name: String
        var age: Int
        init {
            this.name = name
            this.age = age;
        }
        // 重载解构
        operator fun component1(): String{
            return this.name
        }
        // 重载解构
        operator fun component2(): Int{
            return this.age
        }

        operator fun plus(other: Animal): Animal{
            this.name = this.name + other.name
            this.age = this.age + other.age
            return this;
        }
    }

    // 使用场景1
    var animal: Animal = Animal("", 1)
    var (name, age) = animal

    // 使用场景2
    var list:List<Animal> = mutableListOf();
    for((name, age) in list){
        printlin("${name}-${age}")
    }
    ```
4. 数据类：
    1. 语法：data class XXX()
    2. 意义：用于替换Java的Bean，自动提供解构方法，使用很方便
    ```kotlin
    // 通过数据类定义Animal
    data class Animal(val name: String, val age: Int)
    
    // 自动支持解构
    var animal:Animal = Animal("", 1)
    var (name, age) = animal
    ```
5. import支持起别名
    1. 意义：方便包名不同，名称相同的类的使用
    2. 语法：import xxx as 别名

## 权限
关键点：
1. 类，方法，属性默认情况下：final public，通过open修饰后，才能被继承与重写
3. 注意：在Kotlin里，final表示的含义与java有区别，只表示不能继承与重写，不表示只读，只读与常量的写法：
    1. 只读：val 变量名 —》java里的final 变量名
    2. 常量：const val 变量名 —》java里的static final 变量名   //同时只能定义在top-level，属于文件，不属于类

```kotlin
// 定义常量，需处于top-level
// 相当于java里的：static final String TAG = "liuyang"
const val TAG: String = "liuyang"

class Animal constructor(name: String, age: Int) {
    // 只读属性
    // 相当于java里的：final String description = "Animal Class"
    val description: String = "Animal Class"
}
```

## 继承与多态
关键点：
1. 继承：
    1. 语法：class SubClass : Superclass {}
    2. 顶级父类是Any，不是Object，区别：方法较少
    3. 构造器的执行顺序：
        1. 父类的主构造器（即初始化块）
        2. 父类的次构造器（前题是子类调了相应的次构造器）
        3. 子类的主构造器（即初始化块）
        4. 子类的次构造器
5. 重写（方法和属性）
    1. 方法重写：override fun xxx() {}
    2. 属性重写：override var xxx: String = “图片”
7. 使用：
    1. 类型判断：is 或 !is —>java里的instanceOf
    2. 强制转换：
        1. xxx as 类：强制转换，可能崩溃
        2. xxx as? 类：安全的强制转换，转换失败返回null

```kotlin
open class Animal constructor(name: String, age: Int) {

    var name: String
    var age: Int
    init {
        this.name = name
        this.age = age;
    }
    open fun showDescription(): String{
        return "Animal description is ${this.name}-${this.age}"
    }
}

// 继承Animal，并调用其主构造器
class Dog(age: Int): Animal("dog", age) {

    // 重写父类的showDescription()方法
    override fun showDescription(): String {
        return "Dog description is ${this.name}-${this.age}"
    }
}

// 使用
var animal: Animal = Dog(3)
        
// 按java的思路的写法，不然会崩溃
if(animal is Dog) {
    var dog: Dog = animal as Dog
}
// 更简单写法
var dog: Dog? = animal as? Dog
```

## 类的扩展
关键点：
1. 语法：
    1. 方法扩展：fun Raw.info() { }
    2. 属性扩展：var Raw.fullName: String get(){} -- <font color="#ff0000">注意：</font>由于只是添加了getter，setter方法，没有backing field，所以只能是计算属性
2. 扩展的意义：
    1. 扩展可动态地为己有的类添加方法或属性，方式不在限定于继承或动态代理来实现
    2. 扩展能以更好的形式组织一些工具方法，更好的面向对象的代码风格，如Collections.sort()，应该是list.sort()
3. 扩展的实现机制：Java是静态语言，类定义后，不支持扩展，kotlin的扩展不是真正的修改类，而是创建了一个函数，通过编译时，进行替换为调用对应的函数实现

```kotlin
var list: List<Int> = mutableListOf(5, 4, 2, 1)

// 给List类扩展sort排序方法
fun List<Int>.sort(){
    Collections.sort(this)
}
list.sort()

Log.d("liuyang", "${list}") // 输出结果为：[1, 2, 4, 5]
```

## 抽象与接口
关键点：
1. 抽象类：通过abstract修饰的类
2. 接口：
    1. 语法：interface修饰，没有构造器与初始化块
    2. 方法：除了抽象方法外，还可包含有非抽象方法
    3. 属性：没有backing field，无法保存数据，默认都是抽象属性，但通过提供getter方法，可以改为非抽象属性

```kotlin
interface Action {
    // 只读属性定义了 getter 方法，非抽象属性
    val description: String
        get() {
            return ""
        }

    // 读写属性没有定义 getter、setter 方法，抽象属性
    var name: String

    // 抽象方法
    fun eat(food: String)

    // 非抽象方法
    fun print(vararg msgs: String) {
        for (msg in msgs) {
            println(msg)
        }
    }
}
```

## 对象表达式 && 对象声明 && 伴生对象
关键点：
1. 对象表达式：
    1. 作用：用于创建匿名内部类（区别在于：可以实现多个接口）
    2. 语法：object[: 0~N 个父类型] { //对象表达式的类体部分 }
    3. 注意：接口是函数式接口时，可以使用Lambda表达式，进一步简写，不一定要用对象表达式
2. 对象声明：
    1. 作用：用于创建单例，无法再创建新的对象
    2. 语法：object ObjectName[: 0咽个父类型]{ } ObjectName是单例的名称
3. 伴生对象
    1. 作用：用于实现Java里的静态成员，Kotlin为了保证面向对象的纯度，通过对象来实现静态成员的能力
    2. 语法：在类中定义的对象声明，可使用 companion修饰，这样该对象就变成了伴生对象
    3. 注意：
        1. 一个类只能定义一个伴生对象
        2. 伴生对象的对象名称可以省略

```kotlin
var btn: Button = findViewById(R.id.btn)
// 对象表达式实现匿名内部类
btn.setOnClickListener(object: View.OnClickListener {
    override fun onClick(v: View?) {
        text.setText("${text.text} ${++clickTime}")
    }
})
// OnClickListener是函数式接口，可使用Lambda表达式
btn.setOnClickListener { view ->
    text.setText("${text.text} ${++clickTime}")
}

// 对象志明---单例
object FoodManager {
    var foods: MutableList<String>
    init{
        foods = mutableListOf<String>()

        // 初始化食物池
        for (i in 1..9) {
            foods.add("food${i}")
        }
    }
}
var foods = FoodManager.foods // 使用对象声明

// 伴生对象---静态成员
interface Outputable{
    fun output(msg: String)
}
class MyClass{
    // 定义的MyClass的伴生对象
    companion object: Outputable{
        val name = ”name属性值” 
        
        //重写父接口中的抽象方法
        override fun output(msg: String) {
            for(i in 1..6){
                println (”<h$(i}>${ msg}</h${i}>”)
            }
        }
    }
}

fun main(args: Array<String>) {
    // 调用伴生对象里的方法与属性，与调用静态成员一样
    MyClass.output("fkit.org")
    println(MyClass.name)
}

```

## 类委托 && 属性委托
关键点：
1. 类委托
    1. 用处：让多个对象共享同一个委托对象，代理模式的应用，继承的一种替代，让本类需要实现的部分方法委托给其他对象
    2. 语法：接口 by 对象
2. 属性委托
    1. 用处：多个类的类似属性统一交给委托对象集中实现
    2. 语法：var属性名:属性类型 by 对象

```kotlin
interface Outputable {
    var type: String
    fun output(msg: String)
}
// 定义一个DefaultOutput类实现Outputable接口
class DefaultOutput: Outputable {
    override var type: String = "输出设备"
    override fun output(msg: String) {
        for(i in 1..6){
            println("<h${i}>${msg}</h${i}>")
        }
    }
}
// 指定b为委托对象，也可以通过继承DefaultOutput来实现，java里还可以通过Proxy来实现
class Printer(b: DefaultOutput): Outputable by b
// 接口被委托后，还可以重写方法，重写后，就会调用自己重新的方法了
class Printer(b: DefaultOutput): Outputable by b {
    // 重写被委托的方法
    override fun output(msg: String) {
        javax.swing.JOptionPane . showMessageDialog(null, msg);
    }
}

// 属性委托
class PropertyDelegation {
    var name: String by MyDelegation()
}
class MyDelegation {
    private var _backValue = "默认值"
    operator fun getValue(thisRef: PropertyDelegation, property: KProperty<*>): String {
        println("${thisRef}的${property.name}属性执行getter方法")
        return _backValue
    }
    operator fun setValue(thisRef: PropertyDelegation, property: KProperty<*>, newValue: String){
        println("${thisRef}的${property.name}属性执行setter方法")
        _backValue = newValue
    }
}
```

# Kotlin的异常处理
关键点：
1. 与java的区别：Kotlin抛弃了checked异常，所有异常都是runtime异常，可捕获也可不捕获
2. finally块里的return语句会导致try catch里的return语句失效

# Kotlin的泛型
关键点：
1. 泛型的语法与Java的类似：open class Apple<T>{ }
2. 型变：
    1. 用处：当实际类型是泛型的子类时，Kotlin使用型变替换了Java的通配符
    2. 分为：声明处型变，类型投影等等，就不详细介绍了，网上有很多资源

**与Java的泛型的对比**

```kotlin
// Java的基本泛型
class Foo<T> {}
// 对应Kotlin的写法
class Foo<T> {}

// Java的通配符
class Foo<T extends View> {}
// 对应Kotlin的写法
class Foo<out T: View> {}
```

# Kotlin的注解
流程与Java类似，三个过程：
1. 注解定义：annotation class Test(val name: String)
2. 注解使用：@Test(name=“xx") class MyClass{ } --- 注意：属性名为value时，可以省略属性名value
3. 读取注解：val anArr = Test: :info .annotations

**修饰注解：元注解**
1. @Retention：注解的保留时间，SOURCE，BINARY，RUNTIME
2. @Target：修饰哪些程序单元，即范围。CLASS，FUNCTION，FIELD
3. @MustBeDocumented：此注解将会被提取到Api文档里
4. @Repeatable：可重复注解

# Kotlin与Java互调的注意点

看如下例子：
```kotlin
// java类
public class Utils {
    public static String format(String text) {
        return text.isEmpty() ? null : text;
    }
}

// kotlin调用此java类的三种方式
fun doSth(text: String) {
    // 方式一：指定为不为null类型
    val f: String = Utils.format(text) // 能通过编译
    println ("f.len : ${f.length}") // 运行时可能会报错
    
    // 方式二：不指定类型，让其做类型推断
    val f = Utils.format(text) // 能通过编译
    println ("f.len : ${f.length}") // 运行时可能会报错
    
    // 方式三：指定为可null类型
    val f: String? = Utils.format(text) // 能通过编译
    println ("f.len : ${f.length}") // 编译报错
    println ("f.len : ${f?.length}") // 编译成功，运行时不会报错
}
```

调用方法的正确姿势：（应该养成如下编译习惯）
1. 了解方法的返回值文档，了解其是否会返回null --- 不管是调用Java方法还是Kotlin方法
2. 变量指定类型，而不是使用推断类型（推断有时不是那么的智能）

# 参考
1. 书籍：疯狂Kotlin讲义
2. [Kotlin官方文档](https://kotlinlang.org/docs/reference/basic-types.html)
2. [深入浅出 Java 8 Lambda 表达式](http://blog.oneapm.com/apm-tech/226.html)
3. [抛弃 Java 改用 Kotlin 的六个月后，我后悔了](https://blog.csdn.net/csdnnews/article/details/80746096)
