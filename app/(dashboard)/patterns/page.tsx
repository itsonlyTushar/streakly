"use client";

import { useEffect, useState } from "react";
import {
  Layers,
  Search,
  ArrowDownWideNarrow,
  CheckCircle2,
  Circle,
  Check,
  Cable,
  Layers3,
  Rows3,
  TreePine,
  Workflow,
  ListTree,
  Repeat2,
  SquareFunction,
  DollarSign,
  Binary,
  TreePalm,
  Sigma,
  Grid3x3,
  Network,
  CalendarRange,
  FileDown,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";

interface Problem {
  id: number;
  title: string;
}

interface Pattern {
  id: number;
  name: string;
  problems: Problem[];
  recipe?: string;
}

interface Category {
  key: string;
  title: string;
  icon: LucideIcon;
  color: string;
  patterns: Pattern[];
}

const CATEGORIES: Category[] = [
  {
    key: "array-string",
    title: "Array & String Patterns",
    icon: Layers,
    color: "violet",
    patterns: [
      {
        id: 1,
        name: "Two Pointers",
        problems: [
          { id: 167, title: "Two Sum II - Input Array Is Sorted" },
          { id: 125, title: "Valid Palindrome" },
          { id: 283, title: "Move Zeroes" },
          { id: 26, title: "Remove Duplicates from Sorted Array" },
          { id: 15, title: "3Sum" },
          { id: 11, title: "Container With Most Water" },
          { id: 977, title: "Squares of a Sorted Array" },
          { id: 42, title: "Trapping Rain Water" },
          { id: 18, title: "4Sum" },
          { id: 844, title: "Backspace String Compare" },
          { id: 75, title: "Sort Colors" },
          { id: 16, title: "3Sum Closest" },
          { id: 925, title: "Long Press Name" },
          { id: 392, title: "Is Subsequence" },
          { id: 344, title: "Reverse String" },
          { id: 345, title: "Reverse Vowels of a String" },
          { id: 680, title: "Valid Palindrome II" },
          { id: 88, title: "Merge Sorted Array" }
        ],
      },
      {
        id: 2,
        name: "Sliding Window (Fixed + Variable)",
        problems: [
          { id: 643, title: "Maximum Average Subarray I" },
          { id: 3, title: "Longest Substring Without Repeating Characters" },
          { id: 209, title: "Minimum Size Subarray Sum" },
          { id: 424, title: "Longest Repeating Character Replacement" },
          { id: 567, title: "Permutation in String" },
          { id: 76, title: "Minimum Window Substring" },
          { id: 239, title: "Sliding Window Maximum" },
          { id: 1004, title: "Max Consecutive Ones III" },
          { id: 904, title: "Fruit Into Baskets" },
          { id: 438, title: "Find All Anagrams in a String" },
          { id: 992, title: "Subarrays with K Different Integers" },
          { id: 1208, title: "Get Equal Substrings Within Budget" },
          { id: 1423, title: "Maximum Points You Can Obtain from Cards" },
          { id: 1438, title: "Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit" },
          { id: 1838, title: "Frequency of the Most Frequent Element" }
        ],
      },
      {
        id: 3,
        name: "Prefix Sum",
        problems: [
          { id: 560, title: "Subarray Sum Equals K" },
          { id: 1480, title: "Running Sum of 1d Array" },
          { id: 303, title: "Range Sum Query - Immutable" },
          { id: 974, title: "Subarray Sums Divisible by K" },
          { id: 724, title: "Find Pivot Index" },
          { id: 525, title: "Contiguous Array" },
          { id: 238, title: "Product of Array Except Self" },
          { id: 523, title: "Continuous Subarray Sum" },
          { id: 304, title: "Range Sum Query 2D - Immutable" },
          { id: 1109, title: "Corporate Flight Bookings" },
          { id: 528, title: "Random Pick with Weight" },
          { id: 930, title: "Binary Subarrays With Sum" },
          { id: 1248, title: "Count Number of Nice Subarrays" },
          { id: 1732, title: "Find the Highest Altitude" }
        ],
      },
      {
        id: 4,
        name: "Prefix + Suffix Products",
        problems: [
          { id: 238, title: "Product of Array Except Self" },
          { id: 1991, title: "Find the Middle Index in Array" },
          { id: 152, title: "Maximum Product Subarray" },
          { id: 135, title: "Candy" },
          { id: 42, title: "Trapping Rain Water" },
          { id: 2906, title: "Construct Product Matrix" },
          { id: 2256, title: "Minimum Average Difference" },
          { id: 724, title: "Find Pivot Index" }
        ],
        recipe:
          "prefix[i] = prefix[i-1] * arr[i-1]\nsuffix[i] = suffix[i+1] * arr[i+1]\nanswer[i] = prefix[i] * suffix[i]",
      },
      {
        id: 5,
        name: "Kadane's Algorithm",
        problems: [
          { id: 53, title: "Maximum Subarray" },
          { id: 152, title: "Maximum Product Subarray" },
          { id: 918, title: "Maximum Sum Circular Subarray" },
          { id: 198, title: "House Robber" },
          { id: 1191, title: "K-Concatenation Maximum Sum" },
          { id: 1749, title: "Maximum Absolute Sum of Any Subarray" },
          { id: 2321, title: "Maximum Score Of Spliced Array" },
          { id: 121, title: "Best Time to Buy and Sell Stock" },
          { id: 1186, title: "Maximum Subarray Sum with One Deletion" }
        ],
      },
      {
        id: 6,
        name: "Hashing / Frequency Map",
        problems: [
          { id: 1, title: "Two Sum" },
          { id: 242, title: "Valid Anagram" },
          { id: 217, title: "Contains Duplicate" },
          { id: 49, title: "Group Anagrams" },
          { id: 349, title: "Intersection of Two Arrays" },
          { id: 347, title: "Top K Frequent Elements" },
          { id: 387, title: "First Unique Character in a String" },
          { id: 128, title: "Longest Consecutive Sequence" },
          { id: 205, title: "Isomorphic Strings" },
          { id: 454, title: "4Sum II" },
          { id: 350, title: "Intersection of Two Arrays II" },
          { id: 447, title: "Number of Boomerangs" },
          { id: 554, title: "Brick Wall" }
        ],
      },
      {
        id: 7,
        name: "Sorting-based Greedy",
        problems: [
          { id: 56, title: "Merge Intervals" },
          { id: 252, title: "Meeting Rooms" },
          { id: 253, title: "Meeting Rooms II" },
          { id: 435, title: "Non-overlapping Intervals" },
          { id: 406, title: "Queue Reconstruction by Height" },
          { id: 452, title: "Minimum Number of Arrows to Burst Balloons" },
          { id: 621, title: "Task Scheduler" },
          { id: 1353, title: "Maximum Number of Events That Can Be Attended" },
          { id: 455, title: "Assign Cookies" },
          { id: 1029, title: "Two City Scheduling" },
          { id: 1710, title: "Maximum Units on a Truck" }
        ],
      },
      {
        id: 8,
        name: "Cyclic Sort",
        problems: [
          { id: 268, title: "Missing Number" },
          { id: 448, title: "Find All Numbers Disappeared in an Array" },
          { id: 287, title: "Find the Duplicate Number" },
          { id: 41, title: "First Missing Positive" },
          { id: 442, title: "Find All Duplicates in an Array" },
          { id: 645, title: "Set Mismatch" },
          { id: 1528, title: "Shuffle String" },
          { id: 765, title: "Couples Holding Hands" }
        ],
      },
      {
        id: 9,
        name: "Floyd's Cycle Detection (Tortoise and Hare)",
        problems: [
          { id: 141, title: "Linked List Cycle" },
          { id: 287, title: "Find the Duplicate Number" },
          { id: 142, title: "Linked List Cycle II" },
          { id: 202, title: "Happy Number" },
          { id: 457, title: "Circular Array Loop" },
          { id: 160, title: "Intersection of Two Linked Lists" }
        ],
      },
      {
        id: 10,
        name: "In-place Reversal/Rotation",
        problems: [
          { id: 189, title: "Rotate Array" },
          { id: 48, title: "Rotate Image" },
          { id: 151, title: "Reverse Words in a String" },
          { id: 344, title: "Reverse String" },
          { id: 61, title: "Rotate List" },
          { id: 541, title: "Reverse String II" },
          { id: 917, title: "Reverse Only Letters" },
          { id: 557, title: "Reverse Words in a String III" }
        ],
      },
      {
        id: 11,
        name: "Array Index Shifting",
        problems: [
          { id: 27, title: "Remove Element" },
          { id: 26, title: "Remove Duplicates from Sorted Array" },
          { id: 283, title: "Move Zeroes" },
          { id: 80, title: "Remove Duplicates from Sorted Array II" },
          { id: 88, title: "Merge Sorted Array" },
          { id: 1089, title: "Duplicate Zeros" },
          { id: 905, title: "Sort Array By Parity" },
          { id: 922, title: "Sort Array By Parity II" },
          { id: 941, title: "Valid Mountain Array" }
        ],
      },
      {
        id: 12,
        name: "String Matching (Brute Force / Naive Pattern Search)",
        problems: [
          { id: 28, title: "Find the Index of the First Occurrence in a String" },
          { id: 459, title: "Repeated Substring Pattern" },
          { id: 438, title: "Find All Anagrams in a String" },
          { id: 686, title: "Repeated String Match" },
          { id: 214, title: "Shortest Palindrome" },
          { id: 1392, title: "Longest Happy Prefix" }
        ],
        recipe:
          "KMP is the optimized O(n+m) version — exists, not expected of you yet at fresher level.",
      },
      {
        id: 13,
        name: "Vertical/Horizontal Scanning",
        problems: [
          { id: 14, title: "Longest Common Prefix" },
          { id: 28, title: "Find the Index of the First Occurrence in a String" },
          { id: 925, title: "Long Press Name" },
          { id: 392, title: "Is Subsequence" }
        ],
      },
    ],
  },
  {
    key: "searching",
    title: "Searching Patterns",
    icon: Search,
    color: "sky",
    patterns: [
      {
        id: 14,
        name: "Binary Search (Standard)",
        problems: [
          { id: 704, title: "Binary Search" },
          { id: 74, title: "Search a 2D Matrix" },
          { id: 374, title: "Guess Number Higher or Lower" },
          { id: 278, title: "First Bad Version" },
          { id: 35, title: "Search Insert Position" },
          { id: 367, title: "Valid Perfect Square" },
          { id: 34, title: "Find First and Last Position of Element in Sorted Array" }
        ],
      },
      {
        id: 15,
        name: "Modified Binary Search (Rotated Array)",
        problems: [
          { id: 33, title: "Search in Rotated Sorted Array" },
          { id: 81, title: "Search in Rotated Sorted Array II" },
          { id: 153, title: "Find Minimum in Rotated Sorted Array" },
          { id: 154, title: "Find Minimum in Rotated Sorted Array II" }
        ],
      },
      {
        id: 16,
        name: "Boundary Binary Search (\"don't return early\")",
        problems: [
          { id: 34, title: "Find First and Last Position of Element in Sorted Array" },
          { id: 35, title: "Search Insert Position" },
          { id: 1150, title: "Check If a Number Is Majority Element in a Sorted Array" },
          { id: 278, title: "First Bad Version" },
          { id: 658, title: "Find K Closest Elements" },
          { id: 162, title: "Find Peak Element" }
        ],
      },
      {
        id: 17,
        name: "Binary Search on Answer",
        problems: [
          { id: 875, title: "Koko Eating Bananas" },
          { id: 1552, title: "Magnetic Force Between Two Balls" },
          { id: 1011, title: "Capacity To Ship Packages Within D Days" },
          { id: 410, title: "Split Array Largest Sum" },
          { id: 1283, title: "Find the Smallest Divisor Given a Threshold" },
          { id: 1482, title: "Minimum Number of Days to Make m Bouquets" },
          { id: 2187, title: "Minimum Time to Complete Trips" },
          { id: 887, title: "Super Egg Drop" }
        ],
      },
      {
        id: 18,
        name: "Exponential / Unbounded Binary Search",
        problems: [
          { id: 702, title: "Search in a Sorted Array of Unknown Size" },
          { id: 658, title: "Find K Closest Elements" }
        ],
      },
      {
        id: 19,
        name: "Peak Finding (Slope-based Binary Search)",
        problems: [
          { id: 162, title: "Find Peak Element" },
          { id: 852, title: "Peak Index in a Mountain Array" },
          { id: 1901, title: "Find a Peak Element II" },
          { id: 1095, title: "Find in Mountain Array" }
        ],
      },
    ],
  },
  {
    key: "sorting",
    title: "Sorting Patterns",
    icon: ArrowDownWideNarrow,
    color: "amber",
    patterns: [
      {
        id: 20,
        name: "Comparison Sorts",
        problems: [
          { id: 912, title: "Sort an Array" },
          { id: 147, title: "Insertion Sort List" },
          { id: 75, title: "Sort Colors" },
          { id: 148, title: "Sort List" },
          { id: 274, title: "H-Index" }
        ],
      },
      {
        id: 21,
        name: "Divide and Conquer Sorts",
        problems: [
          { id: 912, title: "Sort an Array" },
          { id: 148, title: "Sort List" },
          { id: 169, title: "Majority Element" },
          { id: 215, title: "Kth Largest Element in an Array" },
          { id: 973, title: "K Closest Points to Origin" }
        ],
      },
      {
        id: 22,
        name: "Modified Merge Sort (Inversion Counting)",
        problems: [
          { id: 315, title: "Count of Smaller Numbers After Self" },
          { id: 493, title: "Reverse Pairs" },
          { id: 775, title: "Global and Local Inversions" },
          { id: 327, title: "Count of Range Sum" }
        ],
      },
      {
        id: 23,
        name: "Heap Sort",
        problems: [
          { id: 912, title: "Sort an Array" },
          { id: 215, title: "Kth Largest Element in an Array" },
          { id: 973, title: "K Closest Points to Origin" }
        ],
        recipe:
          "Heap primer: a complete binary tree stored in an array. Max-heap → every parent ≥ its children. For index i: children at 2i+1, 2i+2, parent at (i-1)/2.",
      },
      {
        id: 24,
        name: "Bucket Sort / Counting by Frequency",
        problems: [
          { id: 347, title: "Top K Frequent Elements" },
          { id: 451, title: "Sort Characters By Frequency" },
          { id: 692, title: "Top K Frequent Words" },
          { id: 274, title: "H-Index" },
          { id: 220, title: "Contains Duplicate III" },
          { id: 164, title: "Maximum Gap" }
        ],
      },
    ],
  },
  {
    key: "linked-list",
    title: "Linked List Patterns",
    icon: Cable,
    color: "teal",
    patterns: [
      {
        id: 25,
        name: "Fast & Slow Pointers (Floyd's, on real nodes)",
        problems: [
          { id: 141, title: "Linked List Cycle" },
          { id: 876, title: "Middle of the Linked List" },
          { id: 234, title: "Palindrome Linked List" },
          { id: 142, title: "Linked List Cycle II" },
          { id: 143, title: "Reorder List" },
          { id: 160, title: "Intersection of Two Linked Lists" },
          { id: 202, title: "Happy Number" }
        ],
      },
      {
        id: 26,
        name: "In-place Reversal",
        problems: [
          { id: 206, title: "Reverse Linked List" },
          { id: 25, title: "Reverse Nodes in k-Group" },
          { id: 92, title: "Reverse Linked List II" },
          { id: 2074, title: "Reverse Nodes in Even Groups" },
          { id: 24, title: "Swap Nodes in Pairs" },
          { id: 1721, title: "Swapping Nodes in a Linked List" },
          { id: 328, title: "Odd Even Linked List" }
        ],
      },
      {
        id: 27,
        name: "Dummy Node Technique",
        problems: [
          { id: 19, title: "Remove Nth Node From End of List" },
          { id: 21, title: "Merge Two Sorted Lists" },
          { id: 23, title: "Merge k Sorted Lists" },
          { id: 82, title: "Remove Duplicates from Sorted List II" },
          { id: 86, title: "Partition List" },
          { id: 2, title: "Add Two Numbers" },
          { id: 203, title: "Remove Linked List Elements" }
        ],
      },
      {
        id: 28,
        name: "Merge Two Sorted Lists",
        problems: [
          { id: 21, title: "Merge Two Sorted Lists" },
          { id: 23, title: "Merge k Sorted Lists" },
          { id: 88, title: "Merge Sorted Array" },
          { id: 148, title: "Sort List" }
        ],
      },
      {
        id: 29,
        name: "Two Pointers with a Gap",
        problems: [
          { id: 19, title: "Remove Nth Node From End of List" },
          { id: 61, title: "Rotate List" },
          { id: 1721, title: "Swapping Nodes in a Linked List" }
        ],
      },
    ],
  },
  {
    key: "stack",
    title: "Stack Patterns",
    icon: Layers3,
    color: "indigo",
    patterns: [
      {
        id: 30,
        name: "Monotonic Stack",
        problems: [
          { id: 496, title: "Next Greater Element I" },
          { id: 739, title: "Daily Temperatures" },
          { id: 901, title: "Online Stock Span" },
          { id: 503, title: "Next Greater Element II" },
          { id: 84, title: "Largest Rectangle in Histogram" },
          { id: 42, title: "Trapping Rain Water" },
          { id: 402, title: "Remove K Digits" },
          { id: 316, title: "Remove Duplicate Letters" },
          { id: 85, title: "Maximal Rectangle" },
          { id: 907, title: "Sum of Subarray Minimums" },
          { id: 1475, title: "Final Prices With a Special Discount in a Shop" },
          { id: 456, title: "132 Pattern" },
          { id: 581, title: "Shortest Unsorted Continuous Subarray" },
          { id: 1944, title: "Number of Visible People in a Queue" }
        ],
      },
      {
        id: 31,
        name: "Parentheses / Bracket Matching",
        problems: [
          { id: 20, title: "Valid Parentheses" },
          { id: 921, title: "Minimum Add to Make Parentheses Valid" },
          { id: 22, title: "Generate Parentheses" },
          { id: 32, title: "Longest Valid Parentheses" },
          { id: 1249, title: "Minimum Remove to Make Valid Parentheses" },
          { id: 856, title: "Score of Parentheses" },
          { id: 1190, title: "Reverse Substrings Between Each Pair of Parentheses" },
          { id: 301, title: "Remove Invalid Parentheses" },
          { id: 678, title: "Valid Parenthesis String" },
          { id: 1541, title: "Minimum Insertions to Balance a Parentheses String" }
        ],
      },
      {
        id: 32,
        name: "Min/Max Auxiliary Stack",
        problems: [
          { id: 155, title: "Min Stack" },
          { id: 716, title: "Max Stack" },
          { id: 394, title: "Decode String" }
        ],
      },
      {
        id: 33,
        name: "Expression Evaluation (Infix/Postfix)",
        problems: [
          { id: 224, title: "Basic Calculator" },
          { id: 150, title: "Evaluate Reverse Polish Notation" },
          { id: 227, title: "Basic Calculator II" },
          { id: 772, title: "Basic Calculator III" },
          { id: 770, title: "Basic Calculator IV" },
          { id: 1006, title: "Clumsy Factorial" }
        ],
      },
    ],
  },
  {
    key: "queue",
    title: "Queue Patterns",
    icon: Rows3,
    color: "cyan",
    patterns: [
      {
        id: 34,
        name: "Monotonic Deque",
        problems: [
          { id: 239, title: "Sliding Window Maximum" },
          { id: 1425, title: "Constrained Subsequence Sum" },
          { id: 862, title: "Shortest Subarray with Sum at Least K" },
          { id: 1499, title: "Max Value of Equation" },
          { id: 918, title: "Maximum Sum Circular Subarray" }
        ],
      },
      {
        id: 35,
        name: "Queue via Two Stacks",
        problems: [
          { id: 232, title: "Implement Queue using Stacks" },
          { id: 225, title: "Implement Stack using Queues" },
          { id: 641, title: "Design Circular Deque" }
        ],
      },
      {
        id: 36,
        name: "Level-Order Processing (BFS via Queue)",
        problems: [
          { id: 102, title: "Binary Tree Level Order Traversal" },
          { id: 994, title: "Rotting Oranges" },
          { id: 103, title: "Binary Tree Zigzag Level Order Traversal" },
          { id: 117, title: "Populating Next Right Pointers in Each Node II" },
          { id: 199, title: "Binary Tree Right Side View" },
          { id: 513, title: "Find Bottom Left Tree Value" }
        ],
      },
    ],
  },
  {
    key: "trees",
    title: "Tree Patterns",
    icon: TreePine,
    color: "lime",
    patterns: [
      {
        id: 37,
        name: "DFS Traversals (Pre/In/Post-order)",
        problems: [
          { id: 144, title: "Binary Tree Preorder Traversal" },
          { id: 94, title: "Binary Tree Inorder Traversal" },
          { id: 145, title: "Binary Tree Postorder Traversal" },
          { id: 105, title: "Construct Binary Tree from Preorder and Inorder Traversal" },
          { id: 106, title: "Construct Binary Tree from Inorder and Postorder Traversal" },
          { id: 114, title: "Flatten Binary Tree to Linked List" },
          { id: 98, title: "Validate Binary Search Tree" }
        ],
      },
      {
        id: 38,
        name: "BFS / Level Order Traversal",
        problems: [
          { id: 102, title: "Binary Tree Level Order Traversal" },
          { id: 103, title: "Binary Tree Zigzag Level Order Traversal" },
          { id: 199, title: "Binary Tree Right Side View" },
          { id: 637, title: "Average of Levels in Binary Tree" },
          { id: 107, title: "Binary Tree Level Order Traversal II" },
          { id: 116, title: "Populating Next Right Pointers in Each Node" },
          { id: 314, title: "Binary Tree Vertical Order Traversal" },
          { id: 987, title: "Vertical Order Traversal of a Binary Tree" }
        ],
      },
      {
        id: 39,
        name: "Post-order Aggregation (Tree DP)",
        problems: [
          { id: 104, title: "Maximum Depth of Binary Tree" },
          { id: 543, title: "Diameter of Binary Tree" },
          { id: 124, title: "Binary Tree Maximum Path Sum" },
          { id: 110, title: "Balanced Binary Tree" },
          { id: 250, title: "Count Univalue Subtrees" },
          { id: 337, title: "House Robber III" },
          { id: 863, title: "All Nodes Distance K in Binary Tree" },
          { id: 298, title: "Binary Tree Longest Consecutive Sequence" }
        ],
      },
      {
        id: 40,
        name: "BST Property Exploitation",
        problems: [
          { id: 98, title: "Validate Binary Search Tree" },
          { id: 700, title: "Search in a Binary Search Tree" },
          { id: 530, title: "Minimum Absolute Difference in BST" },
          { id: 230, title: "Kth Smallest Element in a BST" },
          { id: 108, title: "Convert Sorted Array to Binary Search Tree" },
          { id: 99, title: "Recover Binary Search Tree" },
          { id: 450, title: "Delete Node in a BST" },
          { id: 235, title: "Lowest Common Ancestor of a Binary Search Tree" }
        ],
      },
      {
        id: 41,
        name: "Root-to-Leaf Backtracking",
        problems: [
          { id: 113, title: "Path Sum II" },
          { id: 257, title: "Binary Tree Paths" },
          { id: 112, title: "Path Sum" },
          { id: 129, title: "Sum Root to Leaf Numbers" },
          { id: 437, title: "Path Sum III" }
        ],
      },
      {
        id: 42,
        name: "Lowest Common Ancestor (Return-Up Recursion)",
        problems: [
          { id: 236, title: "Lowest Common Ancestor of a Binary Tree" },
          { id: 235, title: "Lowest Common Ancestor of a Binary Search Tree" },
          { id: 1644, title: "Lowest Common Ancestor of a Binary Tree II" },
          { id: 1650, title: "Lowest Common Ancestor of a Binary Tree III" },
          { id: 1123, title: "Lowest Common Ancestor of Deepest Leaves" }
        ],
      },
      {
        id: 43,
        name: "Serialize / Deserialize via Traversal Order",
        problems: [
          { id: 297, title: "Serialize and Deserialize Binary Tree" },
          { id: 449, title: "Serialize and Deserialize BST" },
          { id: 536, title: "Construct Binary Tree from String" },
          { id: 652, title: "Find Duplicate Subtrees" }
        ],
      },
    ],
  },
  {
    key: "graphs",
    title: "Graph Patterns",
    icon: Workflow,
    color: "rose",
    patterns: [
      {
        id: 44,
        name: "Graph Representation (Adjacency List/Matrix)",
        problems: [
          { id: 133, title: "Clone Graph" },
          { id: 1791, title: "Find Center of Star Graph" },
          { id: 1557, title: "Minimum Number of Vertices to Reach All Nodes" },
          { id: 997, title: "Find the Town Judge" }
        ],
      },
      {
        id: 45,
        name: "BFS Shortest Path (Unweighted)",
        problems: [
          { id: 1091, title: "Shortest Path in Binary Matrix" },
          { id: 127, title: "Word Ladder" },
          { id: 752, title: "Open the Lock" },
          { id: 542, title: "01 Matrix" },
          { id: 815, title: "Bus Routes" },
          { id: 864, title: "Shortest Path to Get All Keys" }
        ],
      },
      {
        id: 46,
        name: "DFS + Visited Set",
        problems: [
          { id: 200, title: "Number of Islands" },
          { id: 733, title: "Flood Fill" },
          { id: 323, title: "Number of Connected Components in an Undirected Graph" },
          { id: 695, title: "Max Area of Island" },
          { id: 841, title: "Keys and Rooms" },
          { id: 332, title: "Reconstruct Itinerary" },
          { id: 130, title: "Surrounded Regions" },
          { id: 417, title: "Pacific Atlantic Water Flow" },
          { id: 797, title: "All Paths From Source to Target" }
        ],
      },
      {
        id: 47,
        name: "Topological Sort (Kahn's / DFS-based)",
        problems: [
          { id: 207, title: "Course Schedule" },
          { id: 210, title: "Course Schedule II" },
          { id: 269, title: "Alien Dictionary" },
          { id: 444, title: "Sequence Reconstruction" },
          { id: 851, title: "Loud and Rich" },
          { id: 310, title: "Minimum Height Trees" }
        ],
      },
      {
        id: 48,
        name: "Union-Find (Disjoint Set Union)",
        problems: [
          { id: 547, title: "Number of Provinces" },
          { id: 684, title: "Redundant Connection" },
          { id: 1319, title: "Number of Operations to Make Network Connected" },
          { id: 261, title: "Graph Valid Tree" },
          { id: 721, title: "Accounts Merge" },
          { id: 128, title: "Longest Consecutive Sequence" },
          { id: 952, title: "Largest Component Size by Common Factor" },
          { id: 778, title: "Swim in Rising Water" }
        ],
      },
      {
        id: 49,
        name: "Dijkstra's Algorithm",
        problems: [
          { id: 743, title: "Network Delay Time" },
          { id: 1631, title: "Path With Minimum Effort" },
          { id: 1514, title: "Path with Maximum Probability" },
          { id: 778, title: "Swim in Rising Water" },
          { id: 1928, title: "Minimum Cost to Reach Destination in Time" },
          { id: 2092, title: "Find All People With Secret" }
        ],
      },
      {
        id: 50,
        name: "Multi-source BFS",
        problems: [
          { id: 994, title: "Rotting Oranges" },
          { id: 286, title: "Walls and Gates" },
          { id: 1162, title: "As Far from Land as Possible" },
          { id: 317, title: "Shortest Distance from All Buildings" },
          { id: 934, title: "Shortest Bridge" }
        ],
      },
      {
        id: 51,
        name: "Bipartite Check (Graph Coloring)",
        problems: [
          { id: 785, title: "Is Graph Bipartite?" },
          { id: 886, title: "Possible Bipartition" }
        ],
      },
    ],
  },
  {
    key: "heap",
    title: "Heap / Priority Queue Patterns",
    icon: ListTree,
    color: "fuchsia",
    patterns: [
      {
        id: 52,
        name: "Top K Elements (Fixed-size Heap)",
        problems: [
          { id: 215, title: "Kth Largest Element in an Array" },
          { id: 347, title: "Top K Frequent Elements" },
          { id: 703, title: "Kth Largest Element in a Stream" },
          { id: 373, title: "Find K Pairs with Smallest Sums" },
          { id: 658, title: "Find K Closest Elements" },
          { id: 973, title: "K Closest Points to Origin" },
          { id: 451, title: "Sort Characters By Frequency" }
        ],
      },
      {
        id: 53,
        name: "Two Heaps (Running Median)",
        problems: [
          { id: 295, title: "Find Median from Data Stream" },
          { id: 480, title: "Sliding Window Median" },
          { id: 502, title: "IPO" }
        ],
      },
      {
        id: 54,
        name: "K-way Merge",
        problems: [
          { id: 23, title: "Merge k Sorted Lists" },
          { id: 632, title: "Smallest Range Covering Elements from K Lists" },
          { id: 88, title: "Merge Sorted Array" },
          { id: 373, title: "Find K Pairs with Smallest Sums" },
          { id: 378, title: "Kth Smallest Element in a Sorted Matrix" }
        ],
      },
    ],
  },
  {
    key: "recursion-backtracking",
    title: "Recursion & Backtracking Patterns",
    icon: Repeat2,
    color: "orange",
    patterns: [
      {
        id: 55,
        name: "Subsets / Power Set (Include-Exclude)",
        problems: [
          { id: 78, title: "Subsets" },
          { id: 90, title: "Subsets II" },
          { id: 17, title: "Letter Combinations of a Phone Number" },
          { id: 320, title: "Generalized Abbreviation" },
          { id: 131, title: "Palindrome Partitioning" },
          { id: 22, title: "Generate Parentheses" }
        ],
      },
      {
        id: 56,
        name: "Permutations (Swap or Used-array)",
        problems: [
          { id: 46, title: "Permutations" },
          { id: 47, title: "Permutations II" },
          { id: 31, title: "Next Permutation" },
          { id: 784, title: "Letter Case Permutation" },
          { id: 60, title: "Permutation Sequence" },
          { id: 267, title: "Palindrome Permutation II" }
        ],
      },
      {
        id: 57,
        name: "Combination Sum (Choose with/without Repetition)",
        problems: [
          { id: 39, title: "Combination Sum" },
          { id: 40, title: "Combination Sum II" },
          { id: 216, title: "Combination Sum III" },
          { id: 77, title: "Combinations" },
          { id: 377, title: "Combination Sum IV" }
        ],
      },
      {
        id: 58,
        name: "Constraint Satisfaction Backtracking",
        problems: [
          { id: 51, title: "N-Queens" },
          { id: 37, title: "Sudoku Solver" },
          { id: 212, title: "Word Search II" },
          { id: 52, title: "N-Queens II" },
          { id: 1239, title: "Maximum Length of a Concatenated String with Unique Characters" }
        ],
      },
      {
        id: 59,
        name: "Grid Backtracking (Word Search)",
        problems: [
          { id: 79, title: "Word Search" },
          { id: 212, title: "Word Search II" },
          { id: 980, title: "Unique Paths III" },
          { id: 1219, title: "Path with Maximum Gold" },
          { id: 1254, title: "Number of Closed Islands" }
        ],
      },
    ],
  },
  {
    key: "dynamic-programming",
    title: "Dynamic Programming Patterns",
    icon: SquareFunction,
    color: "red",
    patterns: [
      {
        id: 60,
        name: "1D DP (Fibonacci-style)",
        problems: [
          { id: 70, title: "Climbing Stairs" },
          { id: 198, title: "House Robber" },
          { id: 746, title: "Min Cost Climbing Stairs" },
          { id: 213, title: "House Robber II" },
          { id: 1137, title: "N-th Tribonacci Number" },
          { id: 91, title: "Decode Ways" },
          { id: 139, title: "Word Break" }
        ],
      },
      {
        id: 61,
        name: "0/1 Knapsack",
        problems: [
          { id: 416, title: "Partition Equal Subset Sum" },
          { id: 494, title: "Target Sum" },
          { id: 474, title: "Ones and Zeroes" },
          { id: 1049, title: "Last Stone Weight II" },
          { id: 805, title: "Split Array With Same Average" },
          { id: 956, title: "Tallest Billboard" }
        ],
      },
      {
        id: 62,
        name: "Unbounded Knapsack",
        problems: [
          { id: 322, title: "Coin Change" },
          { id: 518, title: "Coin Change II" },
          { id: 377, title: "Combination Sum IV" },
          { id: 279, title: "Perfect Squares" },
          { id: 1449, title: "Form Largest Integer With Digits That Add up to Target" }
        ],
      },
      {
        id: 63,
        name: "Longest Common Subsequence (2D Grid DP)",
        problems: [
          { id: 1143, title: "Longest Common Subsequence" },
          { id: 72, title: "Edit Distance" },
          { id: 115, title: "Distinct Subsequences" },
          { id: 583, title: "Delete Operation for Two Strings" },
          { id: 712, title: "Minimum ASCII Delete Sum for Two Strings" },
          { id: 97, title: "Interleaving String" },
          { id: 1092, title: "Shortest Common Supersequence" }
        ],
      },
      {
        id: 64,
        name: "Longest Increasing Subsequence",
        problems: [
          { id: 300, title: "Longest Increasing Subsequence" },
          { id: 354, title: "Russian Doll Envelopes" },
          { id: 673, title: "Number of Longest Increasing Subsequence" },
          { id: 368, title: "Largest Divisible Subset" },
          { id: 1671, title: "Minimum Number of Removals to Make Mountain Array" },
          { id: 1964, title: "Find the Longest Valid Obstacle Course at Each Position" }
        ],
      },
      {
        id: 65,
        name: "Palindromic DP",
        problems: [
          { id: 5, title: "Longest Palindromic Substring" },
          { id: 516, title: "Longest Palindromic Subsequence" },
          { id: 647, title: "Palindromic Substrings" },
          { id: 1312, title: "Minimum Insertion Steps to Make a String Palindrome" },
          { id: 730, title: "Count Different Palindromic Subsequences" },
          { id: 132, title: "Palindrome Partitioning II" }
        ],
      },
      {
        id: 66,
        name: "State Machine DP (Buy/Sell Stock)",
        problems: [
          { id: 309, title: "Best Time to Buy and Sell Stock with Cooldown" },
          { id: 714, title: "Best Time to Buy and Sell Stock with Transaction Fee" },
          { id: 122, title: "Best Time to Buy and Sell Stock II" },
          { id: 123, title: "Best Time to Buy and Sell Stock III" },
          { id: 188, title: "Best Time to Buy and Sell Stock IV" },
          { id: 121, title: "Best Time to Buy and Sell Stock" }
        ],
      },
      {
        id: 67,
        name: "Bitmask DP (DP on Subsets)",
        problems: [
          { id: 847, title: "Find Shortest Path Visiting All Nodes" },
          { id: 294, title: "Can I Win" },
          { id: 473, title: "Matchsticks to Square" },
          { id: 526, title: "Beautiful Arrangement" },
          { id: 698, title: "Partition to K Equal Sum Subsets" },
          { id: 1125, title: "Smallest Sufficient Team" },
          { id: 1681, title: "Minimum Incompatibility" }
        ],
      },
      {
        id: 68,
        name: "Interval DP (Matrix Chain style)",
        problems: [
          { id: 312, title: "Burst Balloons" },
          { id: 1547, title: "Minimum Cost to Cut a Stick" },
          { id: 664, title: "Strange Printer" },
          { id: 546, title: "Remove Boxes" },
          { id: 1039, title: "Minimum Score Triangulation of Polygon" },
          { id: 375, title: "Guess Number Higher or Lower II" }
        ],
      },
      {
        id: 69,
        name: "Top-Down Memoized Recursion",
        problems: [
          { id: 509, title: "Fibonacci Number" },
          { id: 139, title: "Word Break" },
          { id: 91, title: "Decode Ways" },
          { id: 62, title: "Unique Paths" },
          { id: 329, title: "Longest Increasing Path in a Matrix" },
          { id: 403, title: "Frog Jump" }
        ],
      },
    ],
  },
  {
    key: "greedy",
    title: "Greedy Patterns",
    icon: DollarSign,
    color: "pink",
    patterns: [
      {
        id: 70,
        name: "Interval Scheduling Maximization",
        problems: [
          { id: 435, title: "Non-overlapping Intervals" },
          { id: 1024, title: "Video Stitching" },
          { id: 452, title: "Minimum Number of Arrows to Burst Balloons" },
          { id: 646, title: "Maximum Length of Pair Chain" },
          { id: 1235, title: "Maximum Profit in Job Scheduling" }
        ],
      },
      {
        id: 71,
        name: "Sort + Two-Pointer Greedy Assignment",
        problems: [
          { id: 134, title: "Gas Station" },
          { id: 455, title: "Assign Cookies" },
          { id: 881, title: "Boats to Save People" },
          { id: 948, title: "Bag of Tokens" },
          { id: 826, title: "Most Profit Assigning Work" },
          { id: 1029, title: "Two City Scheduling" }
        ],
      },
      {
        id: 72,
        name: "Heap-based Greedy Merging",
        problems: [
          { id: 1046, title: "Last Stone Weight" },
          { id: 1167, title: "Minimum Cost to Connect Ropes" },
          { id: 1049, title: "Last Stone Weight II" },
          { id: 1834, title: "Single-Threaded CPU" },
          { id: 1882, title: "Process Tasks Using Servers" }
        ],
      },
    ],
  },
  {
    key: "bit-manipulation",
    title: "Bit Manipulation Patterns",
    icon: Binary,
    color: "slate",
    patterns: [
      {
        id: 73,
        name: "XOR Tricks",
        problems: [
          { id: 136, title: "Single Number" },
          { id: 268, title: "Missing Number" },
          { id: 137, title: "Single Number II" },
          { id: 260, title: "Single Number III" },
          { id: 389, title: "Find the Difference" },
          { id: 421, title: "Maximum XOR of Two Numbers in an Array" }
        ],
      },
      {
        id: 74,
        name: "Bitmasking for Subsets/State",
        problems: [
          { id: 78, title: "Subsets" },
          { id: 90, title: "Subsets II" },
          { id: 784, title: "Letter Case Permutation" },
          { id: 187, title: "Repeated DNA Sequences" }
        ],
      },
      {
        id: 75,
        name: "Counting Set Bits (Brian Kernighan's)",
        problems: [
          { id: 191, title: "Number of 1 Bits" },
          { id: 338, title: "Counting Bits" },
          { id: 1356, title: "Sort Integers by The Number of 1 Bits" }
        ],
      },
    ],
  },
  {
    key: "trie",
    title: "Trie Patterns",
    icon: TreePalm,
    color: "blue",
    patterns: [
      {
        id: 76,
        name: "Trie Construction & Search",
        problems: [
          { id: 208, title: "Implement Trie (Prefix Tree)" },
          { id: 211, title: "Design Add and Search Words Data Structure" },
          { id: 648, title: "Replace Words" },
          { id: 421, title: "Maximum XOR of Two Numbers in an Array" },
          { id: 677, title: "Map Sum Pairs" }
        ],
      },
      {
        id: 77,
        name: "Trie + DFS for Word Search",
        problems: [
          { id: 212, title: "Word Search II" },
          { id: 140, title: "Word Break II" }
        ],
      },
    ],
  },
  {
    key: "math",
    title: "Math Patterns",
    icon: Sigma,
    color: "purple",
    patterns: [
      {
        id: 78,
        name: "GCD / LCM (Euclidean Algorithm)",
        problems: [
          { id: 1979, title: "Find Greatest Common Divisor of Array" },
          { id: 365, title: "Water and Jug Problem" },
          { id: 1447, title: "Simplified Fractions" },
          { id: 914, title: "X of a Kind in a Deck of Cards" },
          { id: 1819, title: "Number of Different Subsequences GCDs" }
        ],
      },
      {
        id: 79,
        name: "Sieve of Eratosthenes",
        problems: [
          { id: 204, title: "Count Primes" },
          { id: 2523, title: "Closest Prime Numbers in Range" },
          { id: 2761, title: "Prime Pairs With Target Sum" }
        ],
      },
      {
        id: 80,
        name: "Fast Exponentiation (Binary Exponentiation)",
        problems: [
          { id: 50, title: "Pow(x, n)" },
          { id: 372, title: "Super Pow" }
        ],
      },
      {
        id: 81,
        name: "Modular Arithmetic",
        problems: [
          { id: 1497, title: "Check If Array Pairs Are Divisible by k" },
          { id: 974, title: "Subarray Sums Divisible by K" },
          { id: 532, title: "K-diff Pairs in an Array" },
          { id: 1015, title: "Smallest Integer Divisible by K" }
        ],
      },
    ],
  },
  {
    key: "matrix",
    title: "Matrix Patterns",
    icon: Grid3x3,
    color: "yellow",
    patterns: [
      {
        id: 82,
        name: "Matrix Traversal Patterns",
        problems: [
          { id: 54, title: "Spiral Matrix" },
          { id: 59, title: "Spiral Matrix II" },
          { id: 498, title: "Diagonal Traverse" },
          { id: 885, title: "Spiral Matrix III" },
          { id: 1329, title: "Sort the Matrix Diagonally" }
        ],
      },
      {
        id: 83,
        name: "In-place Matrix Rotation",
        problems: [
          { id: 48, title: "Rotate Image" },
          { id: 1886, title: "Determine Whether Matrix Can Be Obtained By Rotation" }
        ],
      },
      {
        id: 84,
        name: "Search in a Sorted Matrix",
        problems: [
          { id: 240, title: "Search a 2D Matrix II" },
          { id: 74, title: "Search a 2D Matrix" },
          { id: 378, title: "Kth Smallest Element in a Sorted Matrix" }
        ],
      },
    ],
  },
  {
    key: "segment-fenwick",
    title: "Segment Tree / Fenwick Tree Patterns",
    icon: Network,
    color: "green",
    patterns: [
      {
        id: 85,
        name: "Segment Tree (Range Query + Point Update)",
        problems: [
          { id: 307, title: "Range Sum Query - Mutable" },
          { id: 308, title: "Range Sum Query 2D - Mutable" },
          { id: 1649, title: "Create Sorted Array through Instructions" },
          { id: 315, title: "Count of Smaller Numbers After Self" },
          { id: 699, title: "Falling Squares" }
        ],
      },
      {
        id: 86,
        name: "Fenwick Tree (Binary Indexed Tree)",
        problems: [
          { id: 307, title: "Range Sum Query - Mutable" },
          { id: 315, title: "Count of Smaller Numbers After Self" },
          { id: 493, title: "Reverse Pairs" },
          { id: 327, title: "Count of Range Sum" }
        ],
      },
      {
        id: 87,
        name: "Lazy Propagation",
        problems: [
          { id: 850, title: "Rectangle Area II" },
          { id: 715, title: "Range Module" },
          { id: 699, title: "Falling Squares" },
          { id: 2276, title: "Count Integers in Intervals" }
        ],
      },
      {
        id: 88,
        name: "Sparse Table (Static Range Queries)",
        problems: [
          { id: 303, title: "Range Sum Query - Immutable" },
          { id: 424, title: "Longest Repeating Character Replacement" },
          { id: 239, title: "Sliding Window Maximum" }
        ],
      },
    ],
  },
  {
    key: "intervals",
    title: "Interval Patterns",
    icon: CalendarRange,
    color: "neutral",
    patterns: [
      {
        id: 89,
        name: "Merge Overlapping Intervals",
        problems: [
          { id: 56, title: "Merge Intervals" },
          { id: 252, title: "Meeting Rooms" },
          { id: 253, title: "Meeting Rooms II" },
          { id: 435, title: "Non-overlapping Intervals" }
        ],
      },
      {
        id: 90,
        name: "Insert Interval",
        problems: [
          { id: 57, title: "Insert Interval" },
          { id: 56, title: "Merge Intervals" }
        ],
      },
      {
        id: 91,
        name: "Meeting Rooms II (Min-Heap Overlap Count)",
        problems: [
          { id: 253, title: "Meeting Rooms II" },
          { id: 732, title: "My Calendar Three" },
          { id: 1094, title: "Car Pooling" }
        ],
      },
      {
        id: 92,
        name: "Interval Intersection (Two Pointers)",
        problems: [
          { id: 986, title: "Interval List Intersections" },
          { id: 56, title: "Merge Intervals" }
        ],
      },
      {
        id: 93,
        name: "Sweep Line (Boundary Events)",
        problems: [
          { id: 759, title: "Employee Free Time" },
          { id: 1094, title: "Car Pooling" },
          { id: 218, title: "The Skyline Problem" },
          { id: 1851, title: "Minimum Interval to Include Each Query" },
          { id: 850, title: "Rectangle Area II" }
        ],
      },
    ],
  },
];

const COLOR_CLASSES: Record<string, { active: string; idle: string; badge: string }> = {
  violet: {
    active: "bg-violet-500 text-white shadow-md shadow-violet-500/20",
    idle: "bg-violet-500/10 text-violet-500",
    badge: "bg-violet-500/15 text-violet-500",
  },
  sky: {
    active: "bg-sky-500 text-white shadow-md shadow-sky-500/20",
    idle: "bg-sky-500/10 text-sky-500",
    badge: "bg-sky-500/15 text-sky-500",
  },
  amber: {
    active: "bg-amber-500 text-white shadow-md shadow-amber-500/20",
    idle: "bg-amber-500/10 text-amber-500",
    badge: "bg-amber-500/15 text-amber-500",
  },
  teal: {
    active: "bg-teal-500 text-white shadow-md shadow-teal-500/20",
    idle: "bg-teal-500/10 text-teal-500",
    badge: "bg-teal-500/15 text-teal-500",
  },
  indigo: {
    active: "bg-indigo-500 text-white shadow-md shadow-indigo-500/20",
    idle: "bg-indigo-500/10 text-indigo-500",
    badge: "bg-indigo-500/15 text-indigo-500",
  },
  cyan: {
    active: "bg-cyan-500 text-white shadow-md shadow-cyan-500/20",
    idle: "bg-cyan-500/10 text-cyan-500",
    badge: "bg-cyan-500/15 text-cyan-500",
  },
  lime: {
    active: "bg-lime-500 text-white shadow-md shadow-lime-500/20",
    idle: "bg-lime-500/10 text-lime-500",
    badge: "bg-lime-500/15 text-lime-500",
  },
  rose: {
    active: "bg-rose-500 text-white shadow-md shadow-rose-500/20",
    idle: "bg-rose-500/10 text-rose-500",
    badge: "bg-rose-500/15 text-rose-500",
  },
  fuchsia: {
    active: "bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20",
    idle: "bg-fuchsia-500/10 text-fuchsia-500",
    badge: "bg-fuchsia-500/15 text-fuchsia-500",
  },
  orange: {
    active: "bg-orange-500 text-white shadow-md shadow-orange-500/20",
    idle: "bg-orange-500/10 text-orange-500",
    badge: "bg-orange-500/15 text-orange-500",
  },
  red: {
    active: "bg-red-500 text-white shadow-md shadow-red-500/20",
    idle: "bg-red-500/10 text-red-500",
    badge: "bg-red-500/15 text-red-500",
  },
  pink: {
    active: "bg-pink-500 text-white shadow-md shadow-pink-500/20",
    idle: "bg-pink-500/10 text-pink-500",
    badge: "bg-pink-500/15 text-pink-500",
  },
  slate: {
    active: "bg-slate-500 text-white shadow-md shadow-slate-500/20",
    idle: "bg-slate-500/10 text-slate-500",
    badge: "bg-slate-500/15 text-slate-500",
  },
  blue: {
    active: "bg-blue-500 text-white shadow-md shadow-blue-500/20",
    idle: "bg-blue-500/10 text-blue-500",
    badge: "bg-blue-500/15 text-blue-500",
  },
  purple: {
    active: "bg-purple-500 text-white shadow-md shadow-purple-500/20",
    idle: "bg-purple-500/10 text-purple-500",
    badge: "bg-purple-500/15 text-purple-500",
  },
  yellow: {
    active: "bg-yellow-500 text-white shadow-md shadow-yellow-500/20",
    idle: "bg-yellow-500/10 text-yellow-500",
    badge: "bg-yellow-500/15 text-yellow-500",
  },
  green: {
    active: "bg-green-500 text-white shadow-md shadow-green-500/20",
    idle: "bg-green-500/10 text-green-500",
    badge: "bg-green-500/15 text-green-500",
  },
  neutral: {
    active: "bg-neutral-500 text-white shadow-md shadow-neutral-500/20",
    idle: "bg-neutral-500/10 text-neutral-500",
    badge: "bg-neutral-500/15 text-neutral-500",
  },
};

const STORAGE_KEY = "streakly:patterns:completed";

export default function PatternsPage() {
  const [activeId, setActiveId] = useState<number>(1);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCompleted(new Set(JSON.parse(raw)));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(completed)));
  }, [completed, hydrated]);

  const toggleCompleted = (id: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-pattern-id");
            if (id) setActiveId(Number(id));
          }
        });
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );

    document
      .querySelectorAll("[data-pattern-id]")
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const handleJump = (id: number) => {
    setActiveId(id);
    document
      .querySelector(`[data-pattern-id="${id}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const totalPatterns = CATEGORIES.reduce(
    (sum, cat) => sum + cat.patterns.length,
    0
  );
  const doneCount = completed.size;
  const progressPct = totalPatterns > 0 ? Math.round((doneCount / totalPatterns) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 px-4 font-v-body print:pb-4 print:px-0">
      <header className="hidden print:block space-y-1 pb-4 border-b border-border">
        <h1 className="text-2xl font-black tracking-tighter">Pattern Library</h1>
        <p className="text-xs text-muted-foreground">
          {totalPatterns} core DSA patterns · {doneCount}/{totalPatterns} learned · exported {new Date().toLocaleDateString()}
        </p>
      </header>

      <header className="space-y-3 pt-2 print:hidden">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-primary text-sm font-black uppercase tracking-widest">
              <Layers className="h-4 w-4" />
              Reference Vault
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
              Pattern Library
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              {totalPatterns} core DSA patterns, grouped by category.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-border bg-card text-primary hover:border-primary/40 hover:scale-105 active:scale-95 shadow-sm shrink-0"
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </button>
        </div>
        <div className="flex items-center gap-3 max-w-md">
          <div className="flex-1 h-2 rounded-full bg-secondary/50 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-black uppercase tracking-wider text-emerald-500">
            {doneCount}/{totalPatterns} learned
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-start print:block">
        {/* Local sidebar */}
        <aside className="lg:sticky lg:top-6 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 print:hidden">
          {CATEGORIES.map((category) => {
            const colors = COLOR_CLASSES[category.color];
            const Icon = category.icon;
            return (
              <div key={category.key} className="space-y-1">
                <div className="flex items-center gap-2 px-2 mb-2">
                  <div
                    className={`h-6 w-6 rounded-md flex items-center justify-center ${colors.idle}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-black text-[11px] uppercase tracking-wider text-muted-foreground">
                    {category.title}
                  </span>
                </div>
                <nav className="space-y-0.5">
                  {category.patterns.map((pattern) => {
                    const isActive = activeId === pattern.id;
                    const isDone = completed.has(pattern.id);
                    return (
                      <div
                        key={pattern.id}
                        onClick={() => handleJump(pattern.id)}
                        className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? `${colors.badge}`
                            : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                        }`}
                      >
                        <button
                          type="button"
                          aria-label={isDone ? "Mark as not learned" : "Mark as learned"}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCompleted(pattern.id);
                          }}
                          className={`shrink-0 h-3.5 w-3.5 rounded-[4px] border flex items-center justify-center transition-colors ${
                            isDone
                              ? "bg-emerald-500 border-emerald-500"
                              : "border-current/30 hover:border-emerald-500"
                          }`}
                        >
                          {isDone && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                        </button>
                        <span className={`truncate ${isDone ? "line-through opacity-50" : ""}`}>
                          {pattern.name}
                        </span>
                      </div>
                    );
                  })}
                </nav>
              </div>
            );
          })}
        </aside>

        {/* Content */}
        <div className="space-y-10">
          {CATEGORIES.map((category) => {
            const colors = COLOR_CLASSES[category.color];
            const Icon = category.icon;
            const doneInCategory = category.patterns.filter((p) =>
              completed.has(p.id)
            ).length;
            const categoryComplete = doneInCategory === category.patterns.length;
            return (
              <section key={category.key} className="space-y-4">
                <div className="flex items-center gap-3 border-b border-border/50 pb-3 print:break-after-avoid">
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center ${colors.idle}`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight">
                      {category.title}
                    </h2>
                    <div
                      className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${
                        categoryComplete ? "text-emerald-500" : "text-muted-foreground"
                      }`}
                    >
                      {categoryComplete ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                      {doneInCategory}/{category.patterns.length} learned
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {category.patterns.map((pattern) => {
                    const isDone = completed.has(pattern.id);
                    return (
                      <div
                        key={pattern.id}
                        data-pattern-id={pattern.id}
                        className={`rounded-2xl border bg-card shadow-sm p-5 scroll-mt-6 transition-colors print:break-inside-avoid print:shadow-none ${
                          isDone ? "border-emerald-500/30 bg-emerald-500/[0.03]" : "border-border"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            aria-label={isDone ? "Mark as not learned" : "Mark as learned"}
                            onClick={() => toggleCompleted(pattern.id)}
                            title={isDone ? "Mark as not learned" : "Mark as learned"}
                            className={`shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-colors ${
                              isDone
                                ? "bg-emerald-500 text-white"
                                : `${colors.badge} hover:bg-emerald-500/20 hover:text-emerald-500`
                            }`}
                          >
                            {isDone ? (
                              <Check className="h-3.5 w-3.5" strokeWidth={3} />
                            ) : (
                              pattern.id
                            )}
                          </button>
                          <div className="space-y-2 min-w-0">
                            <h3
                              className={`font-black text-sm ${
                                isDone ? "line-through text-muted-foreground/60" : ""
                              }`}
                            >
                              {pattern.name}
                            </h3>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {pattern.problems.map((problem) => {
                                const slug = problem.title
                                  .toLowerCase()
                                  .replace(/[^a-z0-9\s-]/g, "")
                                  .trim()
                                  .replace(/\s+/g, "-");
                                return (
                                  <a
                                    key={problem.id}
                                    href={`https://leetcode.com/problems/${slug}/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary/30 hover:bg-primary/5 hover:border-primary/30 transition-all text-xs font-bold text-muted-foreground hover:text-primary active:scale-95 shadow-sm"
                                  >
                                    <span className="text-primary font-black">#{problem.id}</span>
                                    <span>{problem.title}</span>
                                    <ExternalLink className="h-3 w-3 opacity-50" />
                                  </a>
                                );
                              })}
                            </div>
                            {pattern.recipe && (
                              <pre className="text-[11px] font-mono bg-secondary/40 border border-border/40 rounded-lg px-3 py-2 whitespace-pre-wrap text-muted-foreground/90">
                                {pattern.recipe}
                              </pre>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
