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
  type LucideIcon,
} from "lucide-react";

interface Pattern {
  id: number;
  name: string;
  description: string;
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
        description:
          "Converging/parallel indices. Pair sums, palindromes, move zeroes, remove duplicates.",
      },
      {
        id: 2,
        name: "Sliding Window (Fixed + Variable)",
        description:
          "Contiguous subarray/substring tracking. Max sum of size k, longest substring with constraint.",
      },
      {
        id: 3,
        name: "Prefix Sum",
        description:
          "Precomputed cumulative sums for O(1) range queries. Subarray sum = K, running sum.",
      },
      {
        id: 4,
        name: "Prefix + Suffix Products",
        description:
          "Two passes, one left-to-right one right-to-left, combined. Product of Array Except Self is the canonical problem.",
        recipe:
          "prefix[i] = prefix[i-1] * arr[i-1]\nsuffix[i] = suffix[i+1] * arr[i+1]\nanswer[i] = prefix[i] * suffix[i]",
      },
      {
        id: 5,
        name: "Kadane's Algorithm",
        description: "Max/min subarray sum via running comparison.",
      },
      {
        id: 6,
        name: "Hashing / Frequency Map",
        description:
          "O(1) lookups via dict/set. Anagrams, two-sum, duplicates.",
      },
      {
        id: 7,
        name: "Sorting-based Greedy",
        description: "Sort then single pass. Merge intervals, meeting rooms.",
      },
      {
        id: 8,
        name: "Cyclic Sort",
        description:
          "For arrays with values in range 1..n, place each at its index. Missing/duplicate number problems in O(1) space.",
      },
      {
        id: 9,
        name: "Floyd's Cycle Detection (Tortoise and Hare)",
        description:
          "Treat array values as pointers to next index, detect a cycle like a linked list. Find the Duplicate Number is the classic use: slow/fast pointers meet inside the cycle, then a second phase finds the entry point (the duplicate).",
      },
      {
        id: 10,
        name: "In-place Reversal/Rotation",
        description: "Reverse segments to rotate. Rotate array by k.",
      },
      {
        id: 11,
        name: "Array Index Shifting",
        description:
          "Manually shifting elements right/left to make room or close gaps. Insert Element at Index, Delete from Static Array. Not glamorous, but a distinct mechanical skill — looping from the end backward to avoid overwriting data you haven't moved yet.",
      },
      {
        id: 12,
        name: "String Matching (Brute Force / Naive Pattern Search)",
        description:
          "For strStr() and substring search: slide a window of haystack, compare to needle char by char.",
        recipe:
          "KMP is the optimized O(n+m) version — exists, not expected of you yet at fresher level.",
      },
      {
        id: 13,
        name: "Vertical/Horizontal Scanning",
        description:
          "For Longest Common Prefix: either compare character-by-character across all strings at each position (vertical), or shrink one candidate prefix against each string in turn (horizontal).",
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
        description: "Classic divide-in-half search over a sorted array.",
      },
      {
        id: 15,
        name: "Modified Binary Search (Rotated Array)",
        description:
          "Determine which half is sorted, check if target lies in it.",
      },
      {
        id: 16,
        name: "Boundary Binary Search (\"don't return early\")",
        description:
          "First/last occurrence, count occurrences, ceiling/floor of a number, insert position.",
      },
      {
        id: 17,
        name: "Binary Search on Answer",
        description:
          "Search space is a range of possible answers, not the array. Koko Eating Bananas, Aggressive Cows — literally the same template: minimize the maximum / maximize the minimum via a feasibility check.",
      },
      {
        id: 18,
        name: "Exponential / Unbounded Binary Search",
        description:
          "For searching in an array of unknown size: start with bound = 1, double it until you overshoot the target, then binary search within that range.",
      },
      {
        id: 19,
        name: "Peak Finding (Slope-based Binary Search)",
        description:
          "Compare arr[mid] to arr[mid+1] to decide which direction the peak lies.",
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
        description:
          "Bubble, Selection, Insertion — the O(n²) family.",
      },
      {
        id: 21,
        name: "Divide and Conquer Sorts",
        description:
          "Merge Sort, Quick Sort — the O(n log n) family.",
      },
      {
        id: 22,
        name: "Modified Merge Sort (Inversion Counting)",
        description:
          "Count Elements Smaller Than Current on Right and the classic \"count inversions\" problem both use a modified merge step: while merging two sorted halves, every time you take an element from the right half before the left half is exhausted, it's smaller than all remaining left elements — count those.",
      },
      {
        id: 23,
        name: "Heap Sort",
        description:
          "Build a max-heap, repeatedly extract the max and place at the end.",
        recipe:
          "Heap primer: a complete binary tree stored in an array. Max-heap → every parent ≥ its children. For index i: children at 2i+1, 2i+2, parent at (i-1)/2.",
      },
      {
        id: 24,
        name: "Bucket Sort / Counting by Frequency",
        description:
          "Group elements by a property (frequency, range bucket) then collect. Used for Top K Frequent Elements as an O(n) alternative to heaps.",
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
        description:
          "Slow moves 1 step, fast moves 2. Detect cycle, find the middle node, check palindrome by reaching the midpoint.",
      },
      {
        id: 26,
        name: "In-place Reversal",
        description:
          "Rewire next pointers with prev/curr/next trackers. Reverse the whole list, reverse in groups of k, reverse a sublist between positions m and n.",
      },
      {
        id: 27,
        name: "Dummy Node Technique",
        description:
          "Prepend a placeholder node before head so deletions/insertions at the head don't need special-case code. Remove Nth From End, Merge Two Sorted Lists.",
      },
      {
        id: 28,
        name: "Merge Two Sorted Lists",
        description:
          "Walk both lists with two pointers, splice the smaller head onto the result each step. The building block for Merge K Sorted Lists (pair them up or use a heap).",
      },
      {
        id: 29,
        name: "Two Pointers with a Gap",
        description:
          "Advance one pointer n steps ahead first, then move both together — when the lead pointer hits the end, the trailing pointer is at the target. Nth Node From End.",
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
        description:
          "Keep the stack strictly increasing or decreasing; pop while the incoming element breaks the order. Next Greater Element, Daily Temperatures, Stock Span.",
      },
      {
        id: 31,
        name: "Parentheses / Bracket Matching",
        description:
          "Push opening brackets, pop and compare on closing brackets — mismatch or leftover stack means invalid. Valid Parentheses, Minimum Add to Make Valid.",
      },
      {
        id: 32,
        name: "Min/Max Auxiliary Stack",
        description:
          "Maintain a second stack tracking the running min (or max) alongside the main stack for O(1) getMin(). Min Stack.",
      },
      {
        id: 33,
        name: "Expression Evaluation (Infix/Postfix)",
        description:
          "Use a stack to hold operands/operators and resolve precedence on the fly. Basic Calculator, Evaluate Reverse Polish Notation.",
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
        description:
          "Double-ended queue kept in increasing/decreasing order; evict from the back when order breaks, evict from the front when out of window range. Sliding Window Maximum/Minimum in O(n).",
      },
      {
        id: 35,
        name: "Queue via Two Stacks",
        description:
          "Push onto stack A; for dequeue, drain A into stack B (reversing order) if B is empty, then pop from B. Amortized O(1) per operation.",
      },
      {
        id: 36,
        name: "Level-Order Processing (BFS via Queue)",
        description:
          "Enqueue a start set, then process level-by-level by snapshotting the queue's current size before draining it. Binary Tree Level Order, Rotting Oranges.",
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
        description:
          "Recurse left, process, recurse right (in whatever order the traversal name implies). Also doable iteratively with an explicit stack.",
      },
      {
        id: 38,
        name: "BFS / Level Order Traversal",
        description:
          "Queue-based, one level at a time. Zigzag Level Order, Right Side View, Level Averages.",
      },
      {
        id: 39,
        name: "Post-order Aggregation (Tree DP)",
        description:
          "Compute each child's result first, then combine at the parent on the way back up. Max Depth, Diameter of Binary Tree, Max Path Sum.",
      },
      {
        id: 40,
        name: "BST Property Exploitation",
        description:
          "Inorder traversal of a BST yields sorted order; use min/max bounds passed down recursion to validate a BST, or compare against node.val to search in O(h).",
      },
      {
        id: 41,
        name: "Root-to-Leaf Backtracking",
        description:
          "Carry the running path/sum down the recursion, add the current node before recursing, remove it after — the classic backtrack-on-return shape. Path Sum, All Root-to-Leaf Paths.",
      },
      {
        id: 42,
        name: "Lowest Common Ancestor (Return-Up Recursion)",
        description:
          "Recurse into both children; if a node finds one of the two targets, it returns itself upward. The parent where both sides return non-null is the LCA.",
      },
      {
        id: 43,
        name: "Serialize / Deserialize via Traversal Order",
        description:
          "Encode with a preorder DFS using explicit null markers for missing children; decode by consuming the same token stream in the same traversal order.",
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
        description:
          "Build the adjacency list/matrix from edges first — nearly every graph problem starts here before any traversal logic.",
      },
      {
        id: 45,
        name: "BFS Shortest Path (Unweighted)",
        description:
          "Level-by-level BFS guarantees the first time you reach a node is via the shortest path, since all edges have equal weight.",
      },
      {
        id: 46,
        name: "DFS + Visited Set",
        description:
          "Recurse into neighbors, marking visited to avoid revisiting. Number of Islands, Flood Fill, Connected Components.",
      },
      {
        id: 47,
        name: "Topological Sort (Kahn's / DFS-based)",
        description:
          "Kahn's: repeatedly remove zero in-degree nodes with a queue. DFS-based: postorder-append nodes, then reverse. Course Schedule, Build Order.",
      },
      {
        id: 48,
        name: "Union-Find (Disjoint Set Union)",
        description:
          "Path compression + union by rank/size to answer \"are these connected?\" near O(1) amortized. Cycle detection in undirected graphs, Number of Provinces, Kruskal's MST.",
      },
      {
        id: 49,
        name: "Dijkstra's Algorithm",
        description:
          "Min-heap of (distance, node), always expand the closest unvisited node next, relax neighbor distances. Shortest path with non-negative weights.",
      },
      {
        id: 50,
        name: "Multi-source BFS",
        description:
          "Seed the BFS queue with every source node at distance 0 simultaneously instead of just one. Rotting Oranges, Walls and Gates.",
      },
      {
        id: 51,
        name: "Bipartite Check (Graph Coloring)",
        description:
          "BFS/DFS while assigning alternating colors (0/1) to neighbors; a conflict (neighbor already same color) means the graph isn't bipartite.",
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
        description:
          "Maintain a heap capped at size k, pushing and popping to keep only the k largest/smallest seen so far. Kth Largest Element, Top K Frequent Elements.",
      },
      {
        id: 53,
        name: "Two Heaps (Running Median)",
        description:
          "Max-heap holds the lower half, min-heap holds the upper half; rebalance sizes after every insert so the median is always at one/both tops. Find Median from Data Stream.",
      },
      {
        id: 54,
        name: "K-way Merge",
        description:
          "Push the head element of each of the k sorted lists into a min-heap; pop the smallest, push its successor. Merge K Sorted Lists, Smallest Range Covering K Lists.",
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
        description:
          "At each element, recurse once including it and once excluding it — a binary choice tree producing all 2^n subsets.",
      },
      {
        id: 56,
        name: "Permutations (Swap or Used-array)",
        description:
          "Build every ordering by either swapping elements into place per recursion depth, or tracking a used[] set and picking unused elements each step.",
      },
      {
        id: 57,
        name: "Combination Sum (Choose with/without Repetition)",
        description:
          "Recurse with a running target and a start index; passing the same index allows reuse (unbounded), passing index+1 forbids it (bounded, dedupe with sorting + skip-equal).",
      },
      {
        id: 58,
        name: "Constraint Satisfaction Backtracking",
        description:
          "Place a candidate, recurse, undo the placement if the recursive branch fails — the core place/recurse/unplace loop. N-Queens, Sudoku Solver.",
      },
      {
        id: 59,
        name: "Grid Backtracking (Word Search)",
        description:
          "DFS from each cell, temporarily marking the current cell visited (e.g. overwrite then restore) so the same path can't reuse a cell, restoring it when backtracking out.",
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
        description:
          "dp[i] is built from a small window of previous states like dp[i-1] and dp[i-2]. Climbing Stairs, House Robber.",
      },
      {
        id: 61,
        name: "0/1 Knapsack",
        description:
          "For each item, choose to take it or skip it: dp[i][w] = max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i]). Each item usable at most once.",
      },
      {
        id: 62,
        name: "Unbounded Knapsack",
        description:
          "Same take-or-skip shape as 0/1 Knapsack, but items can be reused, so the \"take\" transition stays on row i instead of moving to i-1. Coin Change, Rod Cutting.",
      },
      {
        id: 63,
        name: "Longest Common Subsequence (2D Grid DP)",
        description:
          "dp[i][j] compares two sequences — match extends the diagonal, mismatch takes the best of dropping one character from either side. LCS, Edit Distance, Distinct Subsequences.",
      },
      {
        id: 64,
        name: "Longest Increasing Subsequence",
        description:
          "O(n²): dp[i] = 1 + max(dp[j]) for all j<i with arr[j]<arr[i]. O(n log n): maintain a \"tails\" array and binary-search each element's insertion point (patience sorting).",
      },
      {
        id: 65,
        name: "Palindromic DP",
        description:
          "dp[i][j] = true if substring i..j is a palindrome, built from dp[i+1][j-1]. Alternative: expand around every center in O(n²) without the table. Longest Palindromic Substring.",
      },
      {
        id: 66,
        name: "State Machine DP (Buy/Sell Stock)",
        description:
          "Track parallel states across days — e.g. \"holding a stock\" vs \"not holding\" — and transition between them each day. Best Time to Buy/Sell Stock with Cooldown/Fee.",
      },
      {
        id: 67,
        name: "Bitmask DP (DP on Subsets)",
        description:
          "dp[mask][i] where mask encodes which items/cities are already used. Travelling Salesman, Assignment problems — exponential but tractable for small n.",
      },
      {
        id: 68,
        name: "Interval DP (Matrix Chain style)",
        description:
          "dp[i][j] over a subrange, trying every split point k between i and j and combining the two halves' results. Matrix Chain Multiplication, Burst Balloons.",
      },
      {
        id: 69,
        name: "Top-Down Memoized Recursion",
        description:
          "Write the brute-force recursive solution first, then cache (memoize) results by the recursion's changing parameters — the general technique underlying every pattern above.",
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
        description:
          "Sort intervals by end time, greedily keep an interval if it starts after the last kept one ends. Maximum Non-overlapping Intervals, Activity Selection.",
      },
      {
        id: 71,
        name: "Sort + Two-Pointer Greedy Assignment",
        description:
          "Sort one or both arrays, then walk with two pointers making the locally best pairing at each step. Gas Station, Job Sequencing, Assign Cookies.",
      },
      {
        id: 72,
        name: "Heap-based Greedy Merging",
        description:
          "Repeatedly combine the two cheapest/smallest items via a min-heap. Huffman Encoding style problems, Minimum Cost to Connect Ropes.",
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
        description:
          "a ^ a = 0 and a ^ 0 = a, so XOR-ing a list cancels every paired value, leaving the odd one out. Single Number, Missing Number, swap without a temp variable.",
      },
      {
        id: 74,
        name: "Bitmasking for Subsets/State",
        description:
          "Represent a set's membership as bits of an integer: set a bit with mask | (1<<i), clear with mask & ~(1<<i), check with mask & (1<<i).",
      },
      {
        id: 75,
        name: "Counting Set Bits (Brian Kernighan's)",
        description:
          "n & (n-1) clears the lowest set bit — loop until n becomes 0 and count iterations to get the popcount in O(set bits) instead of O(bit width).",
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
        description:
          "Each node holds children keyed by character plus an end-of-word flag. Insert/search/startsWith all walk one character at a time from the root.",
      },
      {
        id: 77,
        name: "Trie + DFS for Word Search",
        description:
          "Build a trie of the target words, then DFS the grid while simultaneously walking the trie — prune a branch the moment the trie has no matching child. Word Search II.",
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
        description:
          "gcd(a, b) = gcd(b, a % b), base case gcd(a, 0) = a. lcm(a, b) = a * b / gcd(a, b).",
      },
      {
        id: 79,
        name: "Sieve of Eratosthenes",
        description:
          "Mark multiples of each prime starting from 2 as composite, up to N, in O(N log log N) — precompute all primes up to N in one pass instead of checking each number individually.",
      },
      {
        id: 80,
        name: "Fast Exponentiation (Binary Exponentiation)",
        description:
          "Compute a^b in O(log b) by squaring the base and halving the exponent each step, multiplying into the result only when the current exponent bit is 1.",
      },
      {
        id: 81,
        name: "Modular Arithmetic",
        description:
          "Take % mod after every multiplication/addition to avoid overflow in large-number problems; (a*b) % m = ((a % m) * (b % m)) % m.",
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
        description:
          "Spiral order (shrink boundaries after each side), diagonal traversal, boundary traversal — all just disciplined index bookkeeping over rows/cols.",
      },
      {
        id: 83,
        name: "In-place Matrix Rotation",
        description:
          "Rotate 90° by transposing the matrix (swap arr[i][j] with arr[j][i]) then reversing each row (or column, depending on direction).",
      },
      {
        id: 84,
        name: "Search in a Sorted Matrix",
        description:
          "If rows and columns are both sorted, start from the top-right (or bottom-left) corner: move left if too big, down if too small — O(m+n) staircase search.",
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
        description:
          "A recursive binary tree over the array where each node stores an aggregate (sum/min/max) of its range. Both query and update run in O(log n), unlike a static Prefix Sum which can't handle updates efficiently.",
      },
      {
        id: 86,
        name: "Fenwick Tree (Binary Indexed Tree)",
        description:
          "An array-based structure that uses the lowbit trick i & (-i) to jump between the indices responsible for a range, giving O(log n) prefix-sum updates and queries with far less code/overhead than a segment tree.",
      },
      {
        id: 87,
        name: "Lazy Propagation",
        description:
          "For range updates (not just point updates): mark a node with a pending update instead of immediately recursing into children, and only push the pending update down when that subtree is actually visited later.",
      },
      {
        id: 88,
        name: "Sparse Table (Static Range Queries)",
        description:
          "For immutable arrays with no updates: precompute overlapping-range answers for power-of-2 lengths in O(n log n), then answer any range-min/max query in O(1) by combining two overlapping precomputed ranges.",
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
        description:
          "Sort intervals by start time, then walk through merging the current interval into the last kept one whenever they overlap (current.start <= last.end).",
      },
      {
        id: 90,
        name: "Insert Interval",
        description:
          "Walk the sorted list: append everything that ends before the new interval starts, merge everything that overlaps the new interval into it, then append the rest untouched.",
      },
      {
        id: 91,
        name: "Meeting Rooms II (Min-Heap Overlap Count)",
        description:
          "Sort by start time, push end times onto a min-heap. For each meeting, if the earliest-ending room already freed up (heap top <= current start) pop it, then push the current end time — final heap size is rooms needed.",
      },
      {
        id: 92,
        name: "Interval Intersection (Two Pointers)",
        description:
          "Walk two sorted interval lists with two pointers; the overlap of the current pair is [max(starts), min(ends)] when that range is valid, then advance whichever interval ends first.",
      },
      {
        id: 93,
        name: "Sweep Line (Boundary Events)",
        description:
          "Convert each interval into a +1 event at its start and a -1 event at its end, sort all events by position, then sweep left to right accumulating a running counter to find max overlap count or free gaps. Employee Free Time, Car Pooling.",
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
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {pattern.description}
                            </p>
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
