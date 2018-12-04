---
title: LeetCode之Median of Two Sorted Arrays
date: 2018-12-03 23:22:56
categories: 算法
tags: [算法,leetcode]
---

# 题目
There are two sorted arrays nums1 and nums2 of size m and n respectively.

Find the median of the two sorted arrays. The overall run time complexity should be O(log (m+n)).

You may assume nums1 and nums2 cannot be both empty.

Example 1:
```
nums1 = [1, 3]
nums2 = [2]

The median is 2.0
```

Example 2:
```
nums1 = [1, 2]
nums2 = [3, 4]

The median is (2 + 3)/2 = 2.5
```

# 理解
求两个有序数组合并后，其中位数，如下所例子：
```
nums1 = [1, 3]
nums2 = [2]
合并后：[1,2,3]
中位数：2

nums1 = [1, 2]
nums2 = [3, 4]
合并后：[1,2,3,4]
中位数：(2+3)/2.0 = 2.5
```

# 解决过程
有序数组A，B，其长度为m，n，把其分为两部分：
```
     left_part               right_part
A[0],A[1],...A[i-1] | A[i],A[i+1],...A[m-1]
B[0],B[1],...B[j-1] | B[j],B[j+1],...B[n-1]
```
如果满足下面三个条件：
```
1. 当n+m为偶数时，Length(left_part) == Length(right_part)
2. 当n+m为奇数时，Length(left_part) == Length(right_part) + 1
3. B[j-1] <= A[i] && A[i-1] <= B[j]
```
相应的中位数结果：
```
1. 当n+m为偶数时，median = (max(left_part) + min(right_part))/2
2. 当n+m为奇数时，由于Length(left_part) > Length(right_part)，所以median = max(left_part)
```
把i，j代入推导：
```
1. if (n+m)%2 == 0, then i+j = m-i + n-j
2. if (n+m)%2 == 1, then i+j = m-i + n-j + 1 // 假设right_part比left_part多一个元素
3. 0 <=i<= m, j=(n+m)/2-i 或 j=(n+m+1)/2-i
4. 当n+m为偶数时，由(n+m)/2 == (n+m+1)/2，得出：0<=i<=m, j=(n+m+1)/2-i
```
因此求中位数，即求在满足如下条件下的i值：
```
1. 0 <= i <= m
2. j = (n+m+1)/2 - i
3. A[i-1] <= B[j] && B[j-1] <= A[i]
```
因为0<= j <=n进行推导：
```
1. (n+m+1)/2 - i >= 0, 代入i的最大值m
2. (n-m+1)/2 >= 0
3. n >= m
```
如果最快的从有序数组A里，找到满足条件的i，最快速的办法：二分搜索法。
```java
class Solution {
    public double findMedianSortedArrays(int[] A, int[] B){
        int m = A.length;
        int n = B.length;
        
        // 保证 n>=m
        if(m>n){
            int[] temp=A; A=B; B=temp;
            int tmp=m; m=n; n=tmp;
        }
        
        // 二分搜索法
        int iMin = 0;
        int iMax = m;
        while(iMin <= iMax){ // 二分搜索法的关键，不能是<
            int i = (iMin+iMax)/2;
            int j = (m+n+1)/2 - i;
            if(j>0 && i<m && B[j-1] > A[i]){ 
                iMin = i+1; // 二分法的关键，需要+1，不然会进入死循环
            } else if(i>0 && j<n && A[i-1]>B[j]){
                iMax = i-1; // 二分法的关键，需要-1，不然会进入死循环
            } else {
                // 找到此i值了
                int maxLeft=0;
                if(i==0) {
                    maxLeft = B[j-1];
                } else if(j==0) {
                    maxLeft = A[i-1];
                } else {
                    maxLeft = Math.max(A[i-1], B[j-1]);
                }
                
                if((m+n)%2==1) return maxLeft;
                
                int minRight = 0;
                if(i==m){
                    minRight = B[j];
                } else if(j==n) {
                    minRight = A[i];
                } else {
                    minRight = Math.min(A[i], B[j]);
                }
                
                return (maxLeft + minRight)/2.0;
            }
        }
        return 0.0;
    }
}
```

边界判断优化：i<m => j>0 and i>0 => j<n，推导过程：

```
m<=n,i<m ==> j=(n+m+1)/2-i > (n+m+1)/2-m >= (2m+1)/2-m >= 1/2 >= 0
m<=n,i>0 ==> j=(n+m+1)/2-i < (n+m+1)/2 <= 2n+1/2 <= n
```

# 复杂度分析
1. 时间复杂度：O(log(min(m,n)))，推导过程如下：
    1. 二分搜索遍历过程：m, m/2, m/(2^2), ... m/(2^k)
    2. m/(2^k) = 1 ==> 2^k = m ==> k=log(m)，k即是while循环的次数
    3. m <= n ==> log(min(m,n) ==> O(log(min(m,n)))
    4. **注意**：在算法里，logX的底数默认为2，而不是数学里的10
5. 空间复杂度：O(1)
