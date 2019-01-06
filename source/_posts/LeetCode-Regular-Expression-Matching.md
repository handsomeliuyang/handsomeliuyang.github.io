---
title: LeetCode Regular Expression Matching
date: 2018-12-29 09:50:48
categories: 算法
tags: ['leetcode', '算法']
---

# 题目
Given an input string (s) and a pattern (p), implement regular expression matching with support for '.' and '*'.
```
'.' Matches any single character.
'*' Matches zero or more of the preceding element.
```

The matching should cover the entire input string (not partial).

**Note:**
* s could be empty and contains only lowercase letters a-z.
* p could be empty and contains only lowercase letters a-z, and characters like . or *.

**Example 1:**
```
Input:
s = "aa"
p = "a"
Output: false
Explanation: "a" does not match the entire string "aa".
```

**Example 2:**
```
Input:
s = "aa"
p = "a*"
Output: true
Explanation: '*' means zero or more of the precedeng element, 'a'. Therefore, by repeating 'a' once, it becomes "aa".
```

**Example 3:**
```
Input:
s = "ab"
p = ".*"
Output: true
Explanation: ".*" means "zero or more (*) of any character (.)".
```

**Example 4:**
```
Input:
s = "aab"
p = "c*a*b"
Output: true
Explanation: c can be repeated 0 times, a can be repeated 1 time. Therefore it matches "aab".
```

**Example 5:**
```
Input:
s = "mississippi"
p = "mis*is*p*."
Output: false
```

# 理解
正则表达式大家都使用过，'.'和'*'都是最长使用的，主要是注意如下几种特殊情况：
```
// 特殊情况1：
Input:
s = "aaa"
p = "a*a"
Output: true

// 特殊情况2：
Input:
s = "aa"
p = "a*"
Output: true

// 特殊情况3：
Input:
s = ""
p = "c*c*"
Output: true

// 特殊情况4：
Input:
s = ""
p = ".*"
Output: true
```

# 解决

## 递归算法
可能性太多，最简单的方案是通过递归来解决，匹配都是从左到右逐一匹配，递归函数的关键是两点：
1. 临界条件
2. 递归函数

代码如下：
```java
class Solution {
    public boolean isMatch(String s, String p) {
        if(s == null || p == null) {
            return false;
        }
        // 递归的临界条件，此临界条件把s为空串也考虑进去了
        if(p.length() == 0){
            return s.length() == 0;
        }
        /**
        // 最早写的临界条件，此临界判断，没有考虑两种临界条件：
        // 1. s = "" p = "c*c*" 2. s = "aaa" p = "a*a"
        if(s.length() == 0) {
            return p.length() == 0 || (p.length() == 2 && p.charAt(1) == '*');
        }
        else if(p.length() == 0){
            return false;
        }
        **/
        
        // 递归函数
        
        // 第一字符判断，考虑到了s为空串的情况
        boolean firstMatch = !(s.length() == 0) && (p.charAt(0) == '.' || s.charAt(0) == p.charAt(0));
        
        if(p.length() >= 2 && p.charAt(1) == '*') {
            /**
            之前我的一种写法：
            return firstMatch ? isMatch(s.substring(1),p) : isMatch(s, p.substring(2))
            这种写法没有考虑到特殊情况：s = "aaa" p = "a*a"，按我们的临界条件判断，两种情况都应该去尝试，所以都进行尝试
            **/
            return (firstMatch && isMatch(s.substring(1), p)) || isMatch(s, p.substring(2));
        }
        
        return firstMatch && isMatch(s.substring(1), p.substring(1));
    }
}
```

复杂度：

使用代入法，我自己理解的时间复杂度为O(2^s.length())或O(2^p.length())，官方的时间复杂度与空间复杂度没有理解：
![](/LeetCode-Regular-Expression-Matching/官方复杂度.png)

## 动态规划

动态规划是一种“大转小”解决问题的思想，上面的函数函数，可以理解为状态转移方程，求解一般是把其中小的问题的答案保存起来，减少重复计算。

条件：
1. 字符串S, 模式串P
2. S[i] 表示字符串：S0,S1,...,Si
3. P[j] 表示字符串：P0,P1,...,Pj
4. boolean[][] dp; dp[i][j]表示match(S[i], P[j])的匹配结果

由上面的递归函数得知dp[i][j]的结果可能如下：
1. dp[i][j] = (firstMath && dp[i+1][j]) || dp[i][j+2]; // 当P.charAt(j+1) == '*'
2. dp[i][j] = firstMatch && dp[i+1][j+1];

从上可知，问题是由小问题转大问题，那就逆序遍历S与P，代码如下：
```java
class Solution {
    
    public boolean isMatch(String S, String P) {
        boolean[][] dp = new boolean[S.length()+1][P.length()+1];
        dp[S.length()][P.length()] = true;
        
        for(int i=S.length()-1; i>=0; i--){
            for(int j=P.length()-1; j>=0; j--){
                
                boolean firstMatch = i<S.length() && (P.charAt(j) == '.' || S.charAt(i) == P.charAt(j));
                if(j < P.length()-1 && P.charAt(j+1) == '*'){
                    dp[i][j] = (firstMatch && dp[i+1][j]) || dp[i][j+2];
                } else {
                    dp[i][j] = firstMatch && dp[i+1][j+1];
                }
            }
        }
        
        return dp[0][0];
    }
}
```

复杂度：
1. 时间复杂度：O(S.length() * P.length())
2. 空间复杂度：O(S.length() * P.length())

