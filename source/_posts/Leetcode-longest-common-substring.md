---
title: LeetCode Longest Common Substring
date: 2018-12-15 11:00:06
categories: 算法
tags: [leetcode,算法]
---

# 题目
Given two strings ‘X’ and ‘Y’, find the length of the longest common substring.

**Examples :**
```
Input : X = "GeeksforGeeks", y = "GeeksQuiz"
Output : 5
The longest common substring is "Geeks" and is of
length 5.

Input : X = "abcdxyz", y = "xyzabcd"
Output : 4
The longest common substring is "abcd" and is of
length 4.

Input : X = "zxabcdezy", y = "yzabcdezx"
Output : 6
The longest common substring is "abcdez" and is of
length 6.
```

# 理解
求字符串X，Y的公共最长子串，这些子串要求连续性，类似的问题是求公共最长子序列

# 解决

设 m = X.length(), n = Y.length();

## Brute Force(暴力法)
思路：
1. 遍历所有X的子串，时间复杂度为O(m^2)
    ```
    for(int i=0; i<X.length(); i++){
        for(int j=0; j<X.length(); j++){
            String sub = X.substring(i, j+1);
        }
    }
    ```
2. 求子串是否也是Y的子串，即子串在Y中的位置，可选择KMP算法，时间复杂为O(n)
3. 满足条件的最大长度的子串就是最长公共子串。最终时间复杂度为：O(n * m^2)

## Dynamic Programming(动态规划)
思路：
1. 设 X = "abcdxyz", Y = "xyzabcd"
2. 先求解如下子符串组的公共后缀：
    ```
    1. X_6="abcdxyz", Y_6="xyzabcd" ===> 公共后缀长度：0
    2. ...
    3. X_3="abcd", Y_6="xyzabcd" ===> 公共后缀长度：4
    4. ...
    5. X_0="a", Y_0="x" ===> 公共后缀长度：0
    ```
3. 上面所有子符串组的最长公共后缀，就是最长的公共子串：”abcd“

求X，Y的公共最长子串问题，转换为求所有子串的最长公共后缀的问题，公共后缀问题，有如下状态转移方程：
```
The longest common suffix has following optimal substructure property
   LCSuff(X, Y, m-1, n-1) = LCSuff(X, Y, m-2, n-2) + 1 if X[m-1] = Y[n-1]
                        0  Otherwise (if X[m-1] != Y[n-1])

The maximum length Longest Common Suffix is the longest common substring.
   LCSubStr(X, Y, m-1, n-1)  = Max(LCSuff(X, Y, i, j)) where 1 <= i < m
                                                     and 1 <= j < n
```

代码实现：
```java
public class LongestCommonSubSequence { 
    public int LCSubStr(String X, String Y) { 
        if(X == null || X.length() == 0){
            return 0;
        }
        if(Y == null || Y.length() == 0){
            return 0;
        }
        
        int m = X.length();
        int n = Y.length();
    
        int LCStuff[][] = new int[m][n]; 
        int maxLCSLen = 0;  // 最长公共后缀长度
        
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                if (X[i] == Y[j]) { 
                    
                    if(i==0 || j==0){
                        LCStuff[i][j] = 1;
                    } else {
                        LCStuff[i][j] = LCStuff[i - 1][j - 1] + 1; 
                    }
                    
                    maxLCSLen = Math.max(maxLCSLen, LCStuff[i][j]); 
                } else {
                    LCStuff[i][j] = 0; 
                }
            } 
        } 
        return maxLCSLen; 
    } 
}
```

复杂度：
1. 时间复杂度：O(m * n)
2. 空间复杂度：O(m * n)

# 参考
1. [Longest Common Substring | DP-29](https://www.geeksforgeeks.org/longest-common-substring-dp-29/)