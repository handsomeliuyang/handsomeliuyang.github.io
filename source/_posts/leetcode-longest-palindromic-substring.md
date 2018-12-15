---
title: LeetCode Longest Palindromic Substring
date: 2018-12-06 10:12:25
categories: 算法
tags: [leetcode, 算法]
---

# 题目
Given a string s, find the longest palindromic substring in s. You may assume that the maximum length of s is 1000.

Example 1:
```
Input: "babad"
Output: "bab"
Note: "aba" is also a valid answer.
```
Example 2:
```
Input: "cbbd"
Output: "bb"
```

# 理解
求字符串s中，最大的回文子串，具有对称性的字符串称为回文串。

# 解决
## Brute Force(暴力破解)
这个思路非常简单，找到字符串s中，所有可能的子串，一一判断其是否是回文串，同时记录最大的回文子串，如下所示：
```java
class Solution {
    public boolean isPalindromicString(String s, int i, int j){
        while(i<j) {
            if(s.charAt(i) != s.charAt(j)) {
                return false;
            }
            i++;
            j--;
        }
        return true;
    }
    
    public String longestPalindrome(String s) {
        int longestStart = 0;
        int longestEnd = 0;
        int longestLen = 0;
        
        int len = s.length();
        if(len == 0) {
            return "";
        }
        
        for(int i=0; i<len; i++){
            for(int j=i+longestLen; j<len; j++){
                if(isPalindromicString(s, i, j)){
                    if((j-i+1) > longestLen) {
                        longestLen = j-i+1;
                        longestStart = i;
                        longestEnd = j;
                    }
                }
            }
        }
        
        return s.substring(longestStart, longestEnd+1);
        
    }
}
```

复杂度
1. 时间复杂度：O(n^3)
2. 空间复杂度：O(1)

## Dynamic Programming(动态规划)
利用回文串的对称性的特点，可以得出如下结论：
```
字符串S，P(i,j)表示子串Si...Sj是否是回文串，其可能值为：
1. P(i,j) = true; // 表示子串Si...Sj是回文串
2. P(i,j) = false; // 表示子串Si...Sj不是回文串

结论：P(i,j) = P(i+1, j-1) && Si == Sj
```

上面的结论就是一个动态规则里的状态转移方程，可以使用动态规划的思路来减少重复比较，步骤：
1. 先计算长度为1和2的回文串，并把结果保存下来
2. 利用上面的结果，计算长度为3的回文串，保存结果，依次类推

转换为代码的关键是：
1. 保存每个子串的回文串结果，长度为n的字符串S，其子串有n^2，使用二维数组来存储
2. 遍历子串时，要按长度从小到大来遍历

```java
class Solution {
    public String longestPalindrome(String s) {
        if(s == null || s.length() <= 1) {
            return s;
        }
        int n = s.length();
        boolean p[][] = new boolean[n][n];
        
        // 初始化结果，设置长度值小于0，1的子串其回文结果为true
        for(int i=0; i<n; i++){
            for(int j=0; j<n; j++) {
                if(j > i) {
                    p[i][j] = false;
                } else {
                    p[i][j] = true;
                }
            }
        }
        
        int maxLen = 1; // 不会遍历长度为1
        int maxLeft = 0;
        int maxRight = 0;
        
        for(int subLen = 2; subLen<=n; subLen++){// 子串的长度，长度为1都已经计算过了，从2开始
            for(int i=0; (i+subLen-1)<n; i++){ // 子串的起点index
                int j = i+subLen-1;
                // 依据状态转移方程，更新二维数据p
                p[i][j] = p[i+1][j-1] && s.charAt(i) == s.charAt(j);
                
                if(p[i][j]) {
                    if(subLen >= maxLen) {
                        maxLen = subLen;
                        maxLeft = i;
                        maxRight = j;
                    }
                }
            }
        }
        
        return s.substring(maxLeft, maxRight+1);
    }
}
```

复杂度：
1. 时间复杂度：O(n^2);
2. 空间复杂度：O(n^2);

## Expand Around Center(优化后的动态规划)

理论上，我们可以实现时间复杂度为O(n^2)，空间复杂度为O(1)的动态规划算法。

利用回文串的特点，对字符串S的子串进行归类：---- 回文串有可能是偶数，也有可能是奇数
1. [Si], [S(i-1),Si,Si+1], ... , [S(i-n), ... , Si, S(i+n)]
2. [Si, S(i+1)], [S(i-1), Si, Si+1, S(i+2)], ..., [S(i-n),..., Si, Si+1, ..., S(i+n)]

这样进行归类后，如果先把一类的子串放在一起计算，就只需要两个变量来记录上一个子串的结果，不用记录所有的子串结果，代码实现如下所示：
```java
class Solution {
    public int expandAroundCenter(String s, int l, int r){
        int expandL = l;
        int expandR = r;
        while(expandL>=0 && expandR<s.length() && s.charAt(expandL) == s.charAt(expandR)){
            expandL--;
            expandR++;
        }
        // 注意，此时expandR, expandL是不满足回文串的index，所以是-1
        return expandR - expandL - 1;
    }
    
    public String longestPalindrome(String s) {
        if(s==null || s.length()<=1){
            return s;
        }
        
        int n = s.length();
        
        int maxLen = 0;
        int maxStart = 0;
        int maxEnd = 0;
        
        for(int i=0; i<n; i++){
            int len = expandAroundCenter(s, i, i);
            int len2 = expandAroundCenter(s, i, i+1);
            
            if(len >= maxLen) {
                maxLen = len;
                maxStart = i - len/2;
                maxEnd = i + len/2;
            }
            if(len2 >= maxLen) {
                maxLen = len2;
                maxStart = i - len2/2 + 1;
                maxEnd = i + len2/2;
            }
        }
        
        return s.substring(maxStart, maxEnd+1);
    }
}
```

复杂度：
1. 时间复杂度：O(n^2)
2. 空间复杂度：O(1)

## Manacher's Algorithm(最优算法)

时间复杂度为O(n)的算法，其步骤如下：
1. 字符串转换，S to T，如S = “abaaba”, T = “#a#b#a#a#b#a#”  
    1. S的回文子串有可能为偶数，也有可能为奇数；T的回文子串一定是奇数
        1. abccba --->  #a#b#c#c#b#a#
        2. abcdcba ---> #a#b#c#d#c#b#a#
    2. T的最长回文串去掉字符串‘#’后，就是S的最长回文子串
2. int[] P = new int[T.length]; P[i]表示以Ti为中心回文串的长度（不包含Ti的长度）
    ```
    T = # a # b # a # a # b # a #
    P = 0 1 0 3 0 1 6 1 0 3 0 1 0
    ```
    如上所示，只要计算出P的值，最长回文子串，就是数组里的最大值
3.  利用回文串的对称性，推导快速计算P的数学公式：
    1. 假设字符串S=“babcbabcbaccba”，转换后的T，及已经计算了部分结果的数组P，如下所示：  
    ![](/leetcode-longest-palindromic-substring/20181211095308958.png)
        1. L，C，R分别表示回文串“#a#b#c#b#a#b#c#b#a#”的最左边临界点，中间值，最右边临界点
        2. i'是以C为中心i的对称点（mirror）
    2. 计算P[i]的值，由于回文串的对称性，可快速得出：P[i]=P[i']=1
    3. 上面的公式，无法适合计算P[C+1]...P[R]之间的所有值，如下图所示：  
    ![](/leetcode-longest-palindromic-substring/20181211100718788.png)
        1. P[15] != P[7]，因为P[7] > R - i，即7 > 20-15
        2. 虽然P[15] != P[7], 由于P[7]>R-i，所以P[15]>=R-i
    3. 最终的计算公式：
        ```
        if P[i'] <= R - i
        then P[i] = P[i']
        else P[i] >= R - i (通过以Ti为中心，两边扩大比较获取P[i]的值)
        ```
    4. 为了最大程度使用上面的公式，有更大的右边界时，要更新右边界

具体的代码如下：
```java
class Solution {
    public String preProcess(String s){
        StringBuffer sb = new StringBuffer("^");
        for(int i=0; i<s.length(); i++){
            sb.append("#").append(s.charAt(i));
        }
        sb.append("#$");
        return sb.toString();
    }
    public String longestPalindrome(String s) {
        if(s==null || s.length()<=1){
            return s;
        }
        
        // 预处理
        String T = preProcess(s);
        int n = T.length();
        
        int[] P = new int[n];
        
        int R = 0;
        int C = 0;
        
        for(int i=1; i<n-1; i++){ // 逐一求P的值
            
            int mirror_i = 2*C-i; // mirror_i = c-(i-c) = 2c-i
            
            // 注意：R>i一定要判断
            P[i] = R > i ? Math.min(P[mirror_i], R-i) : 0;
            
            while(T.charAt(i+P[i]+1) == T.charAt(i-P[i]-1)){
                P[i]++;
            }
            
            // 更新R值
            if((i+P[i]) > R){
                C = i;
                R = i+P[i];
            }    
        }
        
        int maxLen = 0;
        int centerIndex = 0;
        for(int i=1; i<n-1; i++){
            if(P[i] >= maxLen) {
                maxLen = P[i];
                centerIndex = i;
            }
        }
        
        // StringBuffer result = new StringBuffer();
        // if(T.charAt(max_index) != '#') {
        //     result.append(T.charAt(max_index));
        // }
        // int i=1;
        // do{
        //     if(T.charAt(max_index+i) != '#') {
        //         result.insert(0, T.charAt(max_index-i));
        //         result.append(T.charAt(max_index+i));
        //     }
        //     i++;
        // }while(i<=max);
        // return result.toString();
        return s.substring((centerIndex-maxLen)/2, (centerIndex-maxLen)/2 + maxLen);
    }
}
```

复杂度：
1. 时间复杂度：看上去有两个循环，for和while，但注意while循环的遍历次数之和为n，所以时间复杂度为O(2n)=O(n)
2. 空间复杂度：O(n)

## Longest Common Substring(最长公共子串)

利用回文串的特点，求字符串S与逆反字符串S‘的最长公共子串，就是其最长回文子串，如下所示：
```
1. S="caba", S'="abac"
2. 最长公共子串 C = “aba”，其最长回文子串 P = “aba”
```

有一个特例除外，如下所示：
```
1. S = "abacdfgdcaba", S' = "abacdgfdcaba".
2. 最长公共子串 C = “abacd”，但其最长回文子串 P = “aba”
```

要排除上面的特殊，排除方法：把逆反S’中C再逆反后的下标与S中的C的下标进行比较，不相等则排除掉

求S与S‘中的最长公共子串C，可以采用动态规划，具体请查看：[Leetcode-Long-Common-String](https://handsomeliuyang.github.io/2018/12/15/Leetcode-longest-common-substring/)

代码如下所示：
```java
class Solution {
    
    public String longestPalindrome(String S) {
        if(S==null || S.length()<=1){
            return S;
        }
        
        int n = S.length();
        
        StringBuffer SReverseBuffer = new StringBuffer();
        for(int i=n-1; i>=0; i--){
            SReverseBuffer.append(S.charAt(i));
        }
        
        String SReverse = SReverseBuffer.toString();
        
        int[][] LCStuff = new int[n][n];
        
        int LCSLen = 0;
        int endIndex = 0;
        
        for(int i=0; i<n; i++){
            for(int j=0; j<n; j++){
                if(S.charAt(i) == SReverse.charAt(j)) {
                    
                    if(i==0 || j==0) {
                        LCStuff[i][j] = 1;
                    } else {
                        LCStuff[i][j] = LCStuff[i-1][j-1] + 1;
                    }
                    
                    if(LCSLen < LCStuff[i][j]){
                        // 判断是否是真正的回文
                        if((i-LCStuff[i][j]+1) == (n-(j+1))) {
                            LCSLen = LCStuff[i][j];
                            endIndex = i;
                        }
                    }
                    
                } else {
                    LCStuff[i][j] = 0;
                }
            }
        }
        return S.substring(endIndex-LCSLen+1, endIndex+1);
        
    }
}
```

复杂度：
1. 时间复杂度：O(n^2)
2. 空间复杂度：O(n^2)

# 参考
1. [solution](https://leetcode.com/problems/longest-palindromic-substring/solution/)
2. [Longest Palindromic Substring Part II](https://articles.leetcode.com/longest-palindromic-substring-part-ii/)
