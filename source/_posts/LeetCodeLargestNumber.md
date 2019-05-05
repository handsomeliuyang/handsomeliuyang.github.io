---
title: LeetCode Largest Number
date: 2019-04-26 08:42:51
categories: 算法
tags: [leetcode, 算法]
---

# 题目
Given a list of non negative integers, arrange them such that they form the largest number.

Example 1:
```
Input: [10,2]
Output: "210"
```

Example 2:
```
Input: [3,30,34,5,9]
Output: "9534330"
```

Note: The result may be very large, so you need to return a string instead of an integer.

# 解决
看到此题目后的直接思路是：按位排序，再合并为字符串，如[3,30,34,5,9]
1. 先按首位3, 3, 3, 5, 9排序：[9,5,3,30,34]
2. 再排序3, 30, 34, 取其第二位排序（如没有第二位，假定与第一位一样）：[34, 3, 30]
3. 最后的排序结果：[9, 5, 34, 3, 30]

实现代码的思路: 此思路与基数排序的过程类似，代码如下：
```java
class Solution {
    public String largestNumber(int[] nums) {
        // 思路：利用基数排序类似的思想排序
        
        ArrayList<Integer> array = new ArrayList<Integer>();
        for(int i=0; i<nums.length; i++){
            array.add(nums[i]);
        }
        
        ArrayList<Integer> result = RadixSort(array, 1);
        
        StringBuffer buffer = new StringBuffer();
        for(int i=result.size()-1; i>=0; i--){
            buffer.append(result.get(i));
        }
        
        return buffer.toString();
    }
    
    public ArrayList<Integer> RadixSort(ArrayList<Integer> array, int digit){
        // 分配桶
        ArrayList<ArrayList<Integer>> bucket = new ArrayList<ArrayList<Integer>>();
        for(int i=0; i<=9; i++){
            bucket.add(new ArrayList<Integer>());
        }
        
        // 入桶
        int div = 10 ^ digit;
        for(int i=0; i<array.size(); i++){
            
            int value = array.get(i);
            while(value >= div){
                value = value / div;
            }
            value = value % 10;
            
            bucket.get(value).add(array.get(i));
        }
        
        ArrayList<Integer> result = new ArrayList<Integer>();
        for(int i=0; i<bucket.size(); i++){
            int size = bucket.get(i).size();
            
            if(size == 0) {
                continue;
            }
            else if(size == 1){
                result.add(bucket.get(i).get(0));
            }
            else {
                boolean isFinish = true;
                for(int j=0; j<bucket.get(i).size(); j++){
                    if(bucket.get(i).get(j) > div){
                        isFinish = false;
                    }
                }
                if(isFinish) {
                    result.addAll(bucket.get(i));
                } else {
                    // 先递归排序
                    ArrayList<Integer> sorted = RadixSort(bucket.get(i), digit+1);
                    result.addAll(sorted);
                }
            }
        }
        
        return result;
    }
}
```

此算法的问题是：无法处理大数据，计算int div = 10 ^ digit;时，很容易出现div越界的问题，虽然也能解决，但复杂程序太大了。

优化两个数字的比较过程：
1. 如数字int a, int b
2. 先转换为String：String aStr, String bStr
3. 比较：aStrbStr, bStraStr

剩下的就是一个排序的过程了，有很多排序算法可以选择，这里直接使用Java的Arrays.sort()方法，其里使用快速排序与归并排序，时间复杂度为O(n*logn)
```java
class Solution {
    private class LargestNumberComparator implements Comparator<String> {
        @Override
        public int compare(String str1, String str2){
            String order1 = str1+str2;
            String order2 = str2 + str1;
            return order2.compareTo(order1); // 此处是重点，要理解compareTo()方法
        }
    }
    
    public String largestNumber(int[] nums) {
        
        // 转换为字符串数组
        String[] numStrs = new String[nums.length];
        for(int i=0; i<nums.length; i++){
            numStrs[i] = String.valueOf(nums[i]);
        }
        
        // 对字符串数组进行排序
        Arrays.sort(numStrs, new LargestNumberComparator());
        
        // 特例：全为0的情况
        if(numStrs[0].equals("0")){
            return "0";
        }
        
        // 拼接为字符串输出
        StringBuffer buffer = new StringBuffer();
        for(int i=0; i<numStrs.length; i++){
            buffer.append(numStrs[i]);
        }
        return buffer.toString();
    }
}
```


