---
title: LeetCode Merge K Sorted Lists
date: 2019-01-23 09:34:38
categories: 算法
tags: ['leetcode', '算法']
---

# 题目
Given K sorted linked lists of size N each, merge them and print the sorted output.

Example:
```
Input: k = 3, n =  4
list1 = 1->3->5->7
list2 = 2->4->6->8
list3 = 0->9->10->11

Output: 
0->1->2->3->4->5->6->7->8->9->10->11
```

# 理解
此题目还有很多种变种，如不固定每个list的长度。不管如何变化，其算法都是一样，选择固定长度的题目，主要是方便时间复杂度的计算

# 解决
## Compare one by one
步骤：
1. 创建空链表
2. 比较每个list的head元素，取出最小元素，并移动此list的head元素
3. 把取出的最小元素链接到空链表里

代码如下所示：
```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int x) { val = x; }
 * }
 */
class Solution {
    public int compare(ListNode[] lists){
        int minIndex = -1;
        for(int i=0; i<lists.length; i++){
            if(lists[i] == null) {
                continue;
            }

            if(minIndex == -1 || lists[i].val < lists[minIndex].val){
                minIndex = i;
            }
        }

        return minIndex;
    }

    public ListNode mergeKLists(ListNode[] lists) {
        ListNode output = new ListNode(0);
        ListNode outputEnd = output;
        
        while(true){
            // 比较head大小
            int index = compare(lists);
            if(index == -1) {
                return output.next;
            }
            outputEnd.next = lists[index];
            outputEnd = lists[index];
            lists[index] = lists[index].next;
        }
    }
}
```

复杂度：
1. 时间复杂度：
    1. 第一层while循环的次数为： K\*N 次
    2. compare()里的for循环次数 K 次
    3. 时间复杂度为：O(K\*N\*K)
2. 空间复杂度：O(1)

## 最小堆

通过最小堆优化上面的compare()函数，在写代码之前，我们需要了解最小堆的一些特性：
1. 堆可以用数组来表示
2. 下标从0开始编号，位置i的元素有如下特性：
    1. 其parent(i) = (i-1)/2;
    2. left_child(i) = 2\*i + 1;
    3. right_child(i) = 2\*i + 2;
3. 修改顶点元素后，恢复其堆的特性的时间复杂度为：O(logK)

代码如下所示：
```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int x) { val = x; }
 * }
 */
class Solution {
    public int getLeft(int i) {
        return 2 * i + 1;
    }
    public int getRight(int i){
        return 2 * i + 2;
    }
    public void minHeapify(ListNode[] minHeap, int i){
        int size = minHeap.length;
        
        while(true){
            int min = i;
            int left = getLeft(i);
            int right = getRight(i);

            if(left < size && minHeap[left] != null && 
               (minHeap[min] == null || minHeap[min].val > minHeap[left].val)) {
                min = left;
            }
            if(right < size && minHeap[right] != null && 
               (minHeap[min] == null || minHeap[min].val > minHeap[right].val)){
                min = right;
            }

            if(min == i) {
                break;
            }
            ListNode temp = minHeap[i];
            minHeap[i] = minHeap[min];
            minHeap[min] = temp;
            i = min;
        }
    }
    
    public ListNode[] initMinHeap(ListNode[] lists){
        
        ListNode[] minHeap = lists;
    
        // 遍历所有非叶子结点，构建最小堆
        int size = minHeap.length;
        
        for(int i=(size-1)/2; i>=0; i--){
            minHeapify(lists, i);
        }
        
        return minHeap;
    }
    public ListNode getMin(ListNode[] minHeap){
        return minHeap[0];
    }
    public void replaceMin(ListNode[] minHeap, ListNode node){
        
        minHeap[0] = node;
        
        minHeapify(minHeap, 0);
    }

    public ListNode mergeKLists(ListNode[] lists) {
        if(lists.length == 0){
            return null;
        }
        
        ListNode output = new ListNode(0);
        ListNode outputEnd = output;
        
        // 初始化最小堆
        ListNode[] minHeap = initMinHeap(lists);

        while(true){
            // 比较head大小
            ListNode minNode = getMin(minHeap);
            if(minNode == null) {
                return output.next;
            }
            outputEnd.next = minNode;
            outputEnd = minNode;
            
            replaceMin(minHeap, minNode.next);
        }
    }
}
```

复杂度：
1. 时间复杂度：O(K\*N\*logK)
2. 空间复杂度：O(K)

## Divide And Conquer(分治法)
此算法的思路：
1. 两两分组合并，形成一个新的数组
2. 再重复步骤1，直到只剩一个元素

如下所示：
![](/LeetCodeMergeKSortedLists/分治法.png)

代码省略...

关键来思考其时间复杂度的计算方法：
1. Merging的次数为：logK
2. listi, listj合并的时间复杂度为0(n)
3. 总时间复杂度为=(K/2)\*O(N)+(K/2^2)\*O(N)+...+(K/2^logK)\*O(N)
4. 假定(K/2^i)\*O(N) 约等于 O(K\*N)
5. 总时间复杂度约等于O(K\*N\*logK)



