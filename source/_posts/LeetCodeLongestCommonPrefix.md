---
title: LeetCode Longest Common Prefix
date: 2019-01-11 09:56:38
categories: 算法
tags: ["leetcode","算法"]
---

# 题目
Write a function to find the longest common prefix string amongst an array of strings.

If there is no common prefix, return an empty string "".

Example 1:
```
Input: ["flower","flow","flight"]
Output: "fl"
```

Example 2:
```
Input: ["dog","racecar","car"]
Output: ""
Explanation: There is no common prefix among the input strings.
```

# 理解
此题目非常好理解，就是求最长前缀

# 解决

## Vertical scanning（垂直扫描）

最容易想到的解决方案，就是垂直扫描，注意代码的写法：
1. 不需要额外的空间来保存Prefix字符串
2. 注意全匹配情况

代码如下所示：
```java
class Solution {
    public String longestCommonPrefix(String[] strs) {
        
        if(strs == null || strs.length == 0){
            return "";
        }
        
        int len = strs[0].length();
        int index = 0;
        
        while(index < len){
            
            char curChar = strs[0].charAt(index);
            
            for(int i=1; i<strs.length; i++){
                
                if(index >= strs[i].length() || curChar != strs[i].charAt(index)){
                    return strs[0].substring(0, index); // 不用单独出空间保持prefix字符串
                }
                
            }
            
            index++;
        }
        
        return strs[0]; // 全匹配情况
    }
}
```

复杂度：
1. 时间复杂度：O(m*n), 其中m表示字符串的长度，n表示字符串的数量
2. 空间复杂度：O(1)

## Binary search(二分搜索)
可以通过二分搜索法来查看index下标，代码如下：
```java
class Solution {
    public String longestCommonPrefix(String[] strs) {
        
        if(strs == null || strs.length == 0){
            return "";
        }
        
        int len = strs[0].length();
        
        int iMin = 1;
        int iMax = len;
        int index = -1;
        
        while(iMin <= iMax){
            
            index = (iMin+iMax) / 2;
            
            if(isCommonPrefix(strs, index)){
                iMin = index + 1;
            } else {
                iMax = index - 1;
            }
        }
        
        return strs[0].substring(0, (iMin+iMax)/2);
    }
    
    public boolean isCommonPrefix(String[] strs, int len){
        String str1 = strs[0].substring(0, len);
        for(int i=1; i<strs.length; i++){
            if(!strs[i].startsWith(str1)) {
                return false;
            }
        }
        return true;
    }
}
```

注意二分搜索法的写法：
1. iMin, iMax, index都从1开始，不要从0开始
2. 最后确定的位置为(iMin + iMax)/2，而不是直接使用index值

复杂度：
1. 时间复杂度：由于isCommonPrefix()函数的时间复杂度为O(m*n)，二分搜索法的时间复杂度为O(logm), 时间复杂度为O(m*n*logm)
2. 空间复杂度：O(1)

## Trie(Prefix tree， 前缀树，字典树)
>Trie这个术语来自于retrieval。根据词源学，trie的发明者Edward Fredkin把它读作英语发音：/ˈtriː/ “tree”。但是，其他作者把它读作英语发音：/ˈtraɪ/ “try”。

由字符串组：{“a”, “to”, “tea”, “ted”, “ten”, “i”, “in”, “inn”}，构建的Trie的结构为：
![](/LeetCodeLongestCommonPrefix/trie.png)

从上图可知，trie树的特点：
1. 根节点不包含字符，除根节点外的每一个子节点都包含一个字符
2. 从根节点到某一个节点，路径上经过的字符连接起来，为该节点对应的字符串
3. 每个节点的所有子节点包含的字符互不相同

Trie利用空间换时间，适合解决下述问题：
1. 频繁求解字符串组的前缀
2. 有相似前缀的字符串组，如搜索：
![](/LeetCodeLongestCommonPrefix/google搜索.png)

对于此问题，如果提前利用字符串组构建Trie，可以提升频繁求前缀的性能，如下case：
1. ["flower","flow","flight"]构建的Trie，其时间复杂度为O(m*n)
![](/LeetCodeLongestCommonPrefix/trie-demo.png)
2. 再通过Trie查找公共前缀，时间复杂度为O(m)

代码如下所示：--- 注意：此代码是从leetcode直接拷贝的
```java
public String longestCommonPrefix(String q, String[] strs) {
    if (strs == null || strs.length == 0)
         return "";  
    if (strs.length == 1)
         return strs[0];
    Trie trie = new Trie();      
    for (int i = 1; i < strs.length ; i++) {
        trie.insert(strs[i]);
    }
    return trie.searchLongestPrefix(q);
}

class TrieNode {

    // R links to node children
    private TrieNode[] links;

    private final int R = 26;

    private boolean isEnd;

    // number of children non null links
    private int size;    
    public void put(char ch, TrieNode node) {
        links[ch -'a'] = node;
        size++;
    }

    public int getLinks() {
        return size;
    }
    //assume methods containsKey, isEnd, get, put are implemented as it is described
   //in  https://leetcode.com/articles/implement-trie-prefix-tree/)
}

public class Trie {

    private TrieNode root;

    public Trie() {
        root = new TrieNode();
    }

//assume methods insert, search, searchPrefix are implemented as it is described
//in  https://leetcode.com/articles/implement-trie-prefix-tree/)
    private String searchLongestPrefix(String word) {
        TrieNode node = root;
        StringBuilder prefix = new StringBuilder();
        for (int i = 0; i < word.length(); i++) {
            char curLetter = word.charAt(i);
            if (node.containsKey(curLetter) && (node.getLinks() == 1) && (!node.isEnd())) {
                prefix.append(curLetter);
                node = node.get(curLetter);
            }
            else
                return prefix.toString();

         }
         return prefix.toString();
    }
}
```
