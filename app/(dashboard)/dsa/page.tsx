"use client";

import { useState, Fragment, useEffect } from "react";
import Link from "next/link";
import {
  Code,
  Plus,
  Search,
  Trash2,
  Edit2,
  Save,
  X,
  Check,
  ExternalLink,
  BookOpen,
  Terminal,
  Clock,
  ArrowRight,
  History,
  Sparkles,
  Trophy,
  ChevronDown,
  ChevronUp,
  Copy,
  Info,
  Kanban,
  List,
  Play,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { DSAKanbanBoard } from "@/components/dsa/dsa-kanban-board";
import { Timestamp } from "firebase/firestore";
import { Switch } from "@/components/ui/switch";
import { useAuthGuard } from "@/components/auth-guard";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { CodeBlock, CodeTextarea } from "@/components/ui/code-block";

import {
  useDSAItems,
  useAddDSAItem,
  useUpdateDSAItem,
  useDeleteDSAItem,
} from "@/hooks/use-dsa";
import { DSADifficulty } from "@/lib/schemas/dsa.schema";
import { SRS_INTERVALS, calculateNextReviewDate, getInitialReviewDate } from "@/lib/srs-utils";

const PRESET_TOPICS = [
  "Arrays",
  "String",
  "Two Pointers",
  "Sliding Window",
  "Binary Search",
  "Linked List",
  "Stack",
  "Queue",
  "Trees",
  "Graphs",
  "Heap",
  "Recursion",
  "Backtracking",
  "Dynamic Programming",
  "Greedy",
  "Sorting",
  "Hashmaps",
  "Bit Manipulation",
];

const COMPLEXITIES = ["O(1)", "O(log N)", "O(N)", "O(N log N)", "O(N^2)", "O(2^N)", "O(N!)"];

const generateLeetCodeUrl = (name: string) => {
  if (!name) return "";
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric characters with -
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
  return `https://leetcode.com/problems/${slug}/`;
};

export default function DSAPage() {
  const { data: items = [], isLoading } = useDSAItems();
  const addMutation = useAddDSAItem();
  const updateMutation = useUpdateDSAItem();
  const deleteMutation = useDeleteDSAItem();
  const { requireAuth } = useAuthGuard();
  const { toast } = useToast();

  // View states
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  // Form states
  const [isOpenAddForm, setIsOpenAddForm] = useState(false);
  const [problemName, setProblemName] = useState("");
  const [problemUrl, setProblemUrl] = useState("");
  const [isUrlPristine, setIsUrlPristine] = useState(true);
  const [difficulty, setDifficulty] = useState<DSADifficulty>("Medium");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [timeComplexity, setTimeComplexity] = useState("O(N)");
  const [spaceComplexity, setSpaceComplexity] = useState("O(1)");
  const [intuition, setIntuition] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [hasSrs, setHasSrs] = useState(true);

  // AI Auto-Fill states
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Load configuration from localStorage on mount and when form toggles
  useEffect(() => {
    if (typeof window !== "undefined") {
      const key = localStorage.getItem("streakly:dsa:gemini_api_key") || "";
      setGeminiApiKey(key);
    }
  }, [isOpenAddForm]);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "due" | "Easy" | "Medium" | "Hard" | "topic">("all");
  const [topicFilter, setTopicFilter] = useState("");

  // Expand states for code snippets
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Copy status
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDifficulty, setEditDifficulty] = useState<DSADifficulty>("Medium");
  const [editTopics, setEditTopics] = useState<string[]>([]);
  const [editTime, setEditTime] = useState("");
  const [editSpace, setEditSpace] = useState("");
  const [editIntuition, setEditIntuition] = useState("");
  const [editSnippet, setEditSnippet] = useState("");

  // Delete states
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleToggleAddForm = () => {
    setIsOpenAddForm(!isOpenAddForm);
  };

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleEditTopicToggle = (topic: string) => {
    setEditTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleAddProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemName.trim()) return;

    requireAuth(() => {
      addMutation.mutate(
        {
          problemName: problemName.trim(),
          problemUrl: problemUrl.trim() || null,
          difficulty,
          topics: selectedTopics,
          timeComplexity: timeComplexity || null,
          spaceComplexity: spaceComplexity || null,
          intuition: intuition.trim() || null,
          codeSnippet: codeSnippet.trim() || null,
          nextReviewDate: hasSrs ? getInitialReviewDate() : null,
        },
        {
          onSuccess: () => {
            setProblemName("");
            setProblemUrl("");
            setIsUrlPristine(true);
            setDifficulty("Medium");
            setSelectedTopics([]);
            setTimeComplexity("O(N)");
            setSpaceComplexity("O(1)");
            setIntuition("");
            setCodeSnippet("");
            setHasSrs(true);
            setIsOpenAddForm(false);
          },
        }
      );
    });
  };

  const handleAiAutofill = async () => {
    if (!problemName.trim()) {
      toast({ title: "Please enter a problem name first.", variant: "error" });
      return;
    }
    if (!geminiApiKey.trim()) {
      toast({ title: "Please configure your Gemini API key.", variant: "error" });
      return;
    }

    setIsAiLoading(true);

    const ATTEMPTS_TO_TRY = [
      // Strictly use 'v1beta' for all attempts because structured JSON responseSchema is natively supported there.
      // 1. Primary Model: Gemini 2.5 Flash (user tier has active quota!)
      { model: "gemini-2.5-flash", apiVersion: "v1beta" },

      // 2. High Resilience fallbacks (standard free models)
      { model: "gemini-1.5-flash", apiVersion: "v1beta" },
      { model: "gemini-1.5-flash-latest", apiVersion: "v1beta" },
      { model: "gemini-1.5-flash-8b", apiVersion: "v1beta" },
      { model: "gemini-1.5-pro", apiVersion: "v1beta" },
      { model: "gemini-1.5-pro-latest", apiVersion: "v1beta" },
    ];

    const prompt = `You are a DSA expert. Given the problem name "${problemName.trim()}", analyze it and provide standard DSA information. Keep the intuition brief and direct (2-3 sentences max). Keep the code snippet clean, optimal, and without unnecessary comments:
1. LeetCode URL (standard problem link)
2. Difficulty (Easy, Medium, Hard)
3. Topics (Choose relevant topics from this list: ${PRESET_TOPICS.join(", ")})
4. Time Complexity (e.g., O(N), O(N log N), O(1))
5. Space Complexity (e.g., O(1), O(N))
6. Intuition (Brief AHA! concept and core algorithmic idea in 2-3 sentences)
7. CodeSnippet (Clear, standard, optimal solution in standard programming language, preferably TypeScript/JavaScript or Python/C++ with minimal comments)`;

    const schema = {
      type: "OBJECT",
      properties: {
        problemUrl: { type: "STRING" },
        difficulty: { type: "STRING", enum: ["Easy", "Medium", "Hard"] },
        topics: { type: "ARRAY", items: { type: "STRING" } },
        timeComplexity: { type: "STRING" },
        spaceComplexity: { type: "STRING" },
        intuition: { type: "STRING" },
        codeSnippet: { type: "STRING" }
      },
      required: ["problemUrl", "difficulty", "topics", "timeComplexity", "spaceComplexity", "intuition", "codeSnippet"]
    };

    let success = false;
    let lastError = null;
    const errorsList: string[] = [];

    for (const attempt of ATTEMPTS_TO_TRY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/${attempt.apiVersion}/models/${attempt.model}:generateContent?key=${geminiApiKey.trim()}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.1,
                maxOutputTokens: 1024,
              },
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          let parsedMsg = errText;
          try {
            const parsedErr = JSON.parse(errText);
            if (parsedErr?.error?.message) {
              parsedMsg = parsedErr.error.message;
            }
          } catch (_) {}
          throw new Error(`Status ${response.status}: ${parsedMsg}`);
        }

        const resData = await response.json();
        const contentText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!contentText) {
          throw new Error("Empty response from model");
        }

        const parsed = JSON.parse(contentText);

        // Populate fields
        if (parsed.problemUrl) setProblemUrl(parsed.problemUrl);
        if (parsed.difficulty) setDifficulty(parsed.difficulty as DSADifficulty);
        
        // Filter parsed topics against PRESET_TOPICS
        if (Array.isArray(parsed.topics)) {
          const matchedTopics = parsed.topics.filter((topic: string) => {
            return PRESET_TOPICS.some(t => t.toLowerCase() === topic.toLowerCase());
          }).map((topic: string) => {
            const original = PRESET_TOPICS.find(t => t.toLowerCase() === topic.toLowerCase());
            return original || topic;
          });
          setSelectedTopics(matchedTopics);
        }

        if (parsed.timeComplexity) setTimeComplexity(parsed.timeComplexity);
        if (parsed.spaceComplexity) setSpaceComplexity(parsed.spaceComplexity);
        if (parsed.intuition) setIntuition(parsed.intuition);
        if (parsed.codeSnippet) setCodeSnippet(parsed.codeSnippet);

        setIsUrlPristine(false);
        success = true;
        toast({ title: `AI successfully generated problem details using ${attempt.model} (${attempt.apiVersion})!`, variant: "success" });
        break; // Stop fallbacks on success
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        console.warn(`Model ${attempt.model} on ${attempt.apiVersion} failed:`, errMsg);
        errorsList.push(`${attempt.model} (${attempt.apiVersion}): ${errMsg}`);
        lastError = err;
      }
    }

    setIsAiLoading(false);

    if (!success) {
      console.error("All AI Auto-Fill attempts failed. Details:", errorsList);
      // Give a concise breakdown of the first failed model + status, rather than a giant unreadable block
      const topErrorMsg = errorsList.length > 0 ? errorsList[0] : "Check your API key and network connection.";
      toast({
        title: "AI generation failed.",
        description: `Top model failure: ${topErrorMsg}. Please check console logs or Profile API configuration.`,
        variant: "error"
      });
    }
  };

  const handleReviewSuccess = async (item: any) => {
    requireAuth(() => {
      const nextReviewCount = item.reviewCount + 1;
      const nextDateValue = calculateNextReviewDate(nextReviewCount);

      updateMutation.mutate({
        itemId: item.id,
        data: {
          reviewCount: nextReviewCount,
          nextReviewDate: nextDateValue ? Timestamp.fromDate(nextDateValue) : null,
        },
      });
    });
  };

  const handleReviewForgot = async (item: any) => {
    requireAuth(() => {
      const nextDateValue = calculateNextReviewDate(0);

      updateMutation.mutate({
        itemId: item.id,
        data: {
          reviewCount: 0,
          nextReviewDate: nextDateValue ? Timestamp.fromDate(nextDateValue) : null,
        },
      });
    });
  };

  const handleDeleteConfirm = async (itemId: string) => {
    requireAuth(() => {
      deleteMutation.mutate(itemId, {
        onSuccess: () => {
          setDeletingId(null);
        },
      });
    });
  };

  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setEditName(item.problemName);
    setEditUrl(item.problemUrl || "");
    setEditDifficulty(item.difficulty);
    setEditTopics(item.topics || []);
    setEditTime(item.timeComplexity || "");
    setEditSpace(item.spaceComplexity || "");
    setEditIntuition(item.intuition || "");
    setEditSnippet(item.codeSnippet || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (itemId: string) => {
    if (!editName.trim()) return;

    requireAuth(() => {
      updateMutation.mutate(
        {
          itemId,
          data: {
            problemName: editName.trim(),
            problemUrl: editUrl.trim() || null,
            difficulty: editDifficulty,
            topics: editTopics,
            timeComplexity: editTime || null,
            spaceComplexity: editSpace || null,
            intuition: editIntuition.trim() || null,
            codeSnippet: editSnippet.trim() || null,
          },
        },
        {
          onSuccess: () => {
            setEditingId(null);
          },
        }
      );
    });
  };

  const toggleExpandRow = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast({ title: "Code copied to clipboard!", variant: "success" });
    setTimeout(() => setCopiedId(null), 2000);
  };



  const dueItems = items.filter(
    (item) =>
      item.nextReviewDate &&
      isPast(item.nextReviewDate.toDate()) &&
      item.reviewCount < SRS_INTERVALS.length
  );



  // Filtering
  const searchedItems = items.filter(
    (item) =>
      item.problemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.intuition?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredItems = searchedItems.filter((item) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "due") {
      const isDue = item.nextReviewDate && isPast(item.nextReviewDate.toDate());
      const isCompleted = item.reviewCount >= SRS_INTERVALS.length;
      return item.nextReviewDate && isDue && !isCompleted;
    }
    if (statusFilter === "Easy" || statusFilter === "Medium" || statusFilter === "Hard") {
      return item.difficulty === statusFilter;
    }
    if (statusFilter === "topic") {
      return item.topics.includes(topicFilter);
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin text-primary">
          <Code className="h-10 w-10" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 px-4 font-v-body">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary text-sm font-black uppercase tracking-widest">
            <Terminal className="h-4 w-4" />
            Active Revision Vault
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
            DSA Tracker
          </h1>
        </div>

        <div className="flex gap-3">
          <Link
            href="/compiler"
            className="flex items-center gap-2 px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-border bg-card text-primary hover:border-primary/40 hover:scale-105 active:scale-95 shadow-sm"
          >
            <Play className="h-4 w-4" />
            Python Compiler
          </Link>
          <button
            onClick={handleToggleAddForm}
            className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border shadow-lg ${
              isOpenAddForm
                ? "bg-secondary text-primary border-border"
                : "bg-primary text-primary-foreground border-primary hover:scale-105 active:scale-95 shadow-primary/10"
            }`}
          >
            {isOpenAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isOpenAddForm ? "Cancel" : "Add Problem"}
          </button>
        </div>
      </header>

      {/* Small Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border/60 p-4 rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Vaulted</span>
          <span className="text-2xl font-black">{items.length}</span>
        </div>
        <div className="bg-card border border-border/60 p-4 rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Mastered</span>
          <span className="text-2xl font-black">{items.filter(i => i.reviewCount >= SRS_INTERVALS.length).length}</span>
        </div>
        <div className="bg-card border border-border/60 p-4 rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Due Review</span>
          <span className="text-2xl font-black">{dueItems.length}</span>
        </div>
        <div className="bg-card border border-border/60 p-4 rounded-2xl flex flex-col gap-1 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Hard Mode</span>
          <span className="text-2xl font-black">{items.filter(i => i.difficulty === "Hard").length}</span>
        </div>
      </div>

      {/* Add New Problem Form - Premium Drawer / Collapsible block */}
      {isOpenAddForm && (
        <div
          className="fixed inset-0 h-screen z-50 flex justify-end bg-background/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsOpenAddForm(false)}
        >
          <aside
            className="relative h-full w-full max-w-3xl overflow-y-auto border-l border-border bg-card p-6 shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpenAddForm(false)}
                className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary"
                aria-label="Close form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          <form onSubmit={handleAddProblem} className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
            <div className="md:col-span-12 border-b border-border/40 pb-3 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Vault a solved problem
              </h2>

              {/* Gemini AI Auto-Fill Button in Header */}
              {geminiApiKey.trim() ? (
                <button
                  type="button"
                  disabled={isAiLoading || !problemName.trim()}
                  onClick={handleAiAutofill}
                  className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-violet-600/30 disabled:to-indigo-600/30 text-white disabled:text-white/40 border border-violet-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] disabled:scale-100 transition-all shadow-md shadow-violet-500/10 cursor-pointer self-start sm:self-auto"
                  title={problemName.trim() ? "Auto-fill problem details with Gemini AI" : "Enter a problem name first to generate details"}
                >
                  {isAiLoading ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Auto-Fill with Gemini AI</span>
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500 hover:text-background text-amber-500 border border-amber-500/20 hover:border-transparent px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all self-start sm:self-auto"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Enable Gemini AI
                </Link>
              )}
            </div>

            {/* Problem Name */}
            <div className="md:col-span-6">
              <div className="flex items-center gap-1.5 ml-1 mb-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Problem Name *
                </label>
                <Tooltip content="Add the exact name of the problem to auto generate the URL" side="top">
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
                </Tooltip>
              </div>
              <input
                required
                type="text"
                value={problemName}
                onChange={(e) => {
                  const val = e.target.value;
                  setProblemName(val);
                  if (val.trim() === "") {
                    setIsUrlPristine(true);
                    setProblemUrl("");
                  } else if (isUrlPristine && !geminiApiKey.trim()) {
                    setProblemUrl(generateLeetCodeUrl(val));
                  }
                }}
                placeholder="e.g., 3Sum"
                className="w-full bg-background border border-border/60 rounded-xl px-4 py-3.5 text-base font-bold focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all"
              />
            </div>

            {/* Platform URL */}
            <div className="md:col-span-6">
              <div className="flex justify-between items-center ml-1 mb-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Problem URL
                </label>
                {problemName.trim() && !geminiApiKey.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setProblemUrl(generateLeetCodeUrl(problemName));
                      setIsUrlPristine(false);
                    }}
                    className="text-[9px] font-black uppercase tracking-wider text-primary hover:text-primary/80 flex items-center gap-1 transition-all"
                    title="Generate standard LeetCode URL from Problem Name"
                  >
                    <Sparkles className="h-3 w-3" />
                    Auto LeetCode URL
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="url"
                  value={problemUrl}
                  onChange={(e) => {
                    setProblemUrl(e.target.value);
                    setIsUrlPristine(false);
                  }}
                  placeholder="e.g., https://leetcode.com/problems/3sum/"
                  className="w-full bg-background border border-border/60 rounded-xl pl-4 pr-12 py-3.5 text-base font-medium focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all"
                />
                {problemName.trim() && !geminiApiKey.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setProblemUrl(generateLeetCodeUrl(problemName));
                      setIsUrlPristine(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-all"
                    title="Generate LeetCode URL from Problem Name"
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Difficulty */}
            <div className="md:col-span-4">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2 bg-background p-1 border border-border/60 rounded-xl">
                {(["Easy", "Medium", "Hard"] as DSADifficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                      difficulty === d
                        ? d === "Easy"
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                          : d === "Medium"
                          ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                          : "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Complexity */}
            <div className="md:col-span-4">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
                Time Complexity
              </label>
              <select
                value={timeComplexity}
                onChange={(e) => setTimeComplexity(e.target.value)}
                className="w-full bg-background border border-border/60 rounded-xl px-4 py-3.5 text-sm font-bold focus:border-primary outline-none transition-all"
              >
                {COMPLEXITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Space Complexity */}
            <div className="md:col-span-4">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
                Space Complexity
              </label>
              <select
                value={spaceComplexity}
                onChange={(e) => setSpaceComplexity(e.target.value)}
                className="w-full bg-background border border-border/60 rounded-xl px-4 py-3.5 text-sm font-bold focus:border-primary outline-none transition-all"
              >
                {COMPLEXITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Preset Topics multi-select */}
            <div className="md:col-span-12">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-2 block">
                Core Topics / Patterns
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-background border border-border/60 rounded-xl max-h-[120px] overflow-y-auto">
                {PRESET_TOPICS.map((topic) => {
                  const isSelected = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleTopicToggle(topic)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary"
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intuition / Explanation */}
            <div className="md:col-span-12">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
                The Intuition (The AHA! Concept)
              </label>
              <textarea
                value={intuition}
                onChange={(e) => setIntuition(e.target.value)}
                placeholder="Sort first, then anchor left pointer i, and use traditional two pointers for left + right elements to find sum === -nums[i]..."
                className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm font-medium focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all min-h-[140px] resize-none"
              />
            </div>

            {/* Solution / Code Snippet */}
            <div className="md:col-span-12">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
                Solution / Code Snippet
              </label>
              <CodeTextarea
                value={codeSnippet}
                onChange={setCodeSnippet}
              />
            </div>

            {/* Spaced Repetition toggle */}
            <div className="md:col-span-12 flex items-center justify-between bg-background border border-border/60 p-4 rounded-xl">
              <div className="space-y-0.5">
                <div className="text-xs font-black uppercase tracking-widest text-primary">Enable Spaced Repetition</div>
                <div className="text-xs text-muted-foreground">Automatically schedule reviews at 1, 3, 7, and 30 day milestones.</div>
              </div>
              <Switch checked={hasSrs} onCheckedChange={setHasSrs} />
            </div>

            {/* Submit */}
            <div className="md:col-span-12 flex justify-end">
              <button
                type="submit"
                disabled={addMutation.isPending || !problemName.trim()}
                className="px-12 py-4 bg-primary text-primary-foreground rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
              >
                {addMutation.isPending ? "Adding to Vault..." : "Enshrine Problem"}
              </button>
            </div>
          </form>
          </aside>
        </div>
      )}

      {/* Vault Table & List filters */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems by name, topics, intuition..."
              className="w-full h-12 pl-12 pr-4 bg-secondary/30 rounded-xl border border-border/50 focus:ring-2 ring-primary/20 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-4 self-end md:self-auto">
            <div className="flex items-center bg-secondary/30 rounded-xl p-1 border border-border/50">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                  viewMode === "table"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                  viewMode === "kanban"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
                title="Kanban View"
              >
                <Kanban className="h-4 w-4" />
              </button>
            </div>
            <div className="text-xs font-bold text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg border border-border/50 uppercase tracking-wider">
              {filteredItems.length} of {items.length} Vaulted
            </div>
          </div>
        </div>

        {/* Filters pills */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border/40">
          <button
            onClick={() => { setStatusFilter("all"); setTopicFilter(""); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10"
                : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary hover:text-foreground"
            }`}
          >
            All
          </button>

          <button
            onClick={() => { setStatusFilter("due"); setTopicFilter(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === "due"
                ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/10"
                : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary hover:text-foreground"
            }`}
          >
            <div className={`h-2.5 w-2.5 rounded-full bg-amber-500 ${dueItems.length > 0 ? "" : ""}`} />
            Due for Review
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${statusFilter === "due" ? "bg-white/20 text-white" : "bg-secondary-foreground/10 text-muted-foreground"}`}>
              {dueItems.length}
            </span>
          </button>

          {/* Difficulties */}
          {(["Easy", "Medium", "Hard"] as DSADifficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => { setStatusFilter(diff); setTopicFilter(""); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                statusFilter === diff
                  ? diff === "Easy"
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-lg"
                    : diff === "Medium"
                    ? "bg-amber-500 text-white border-amber-500 shadow-lg"
                    : "bg-rose-500 text-white border-rose-500 shadow-lg"
                  : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary"
              }`}
            >
              {diff}
            </button>
          ))}

          {/* Preset topic select dropdown filter */}
          <div className="relative">
            <select
              value={topicFilter}
              onChange={(e) => {
                if (e.target.value) {
                  setStatusFilter("topic");
                  setTopicFilter(e.target.value);
                } else {
                  setStatusFilter("all");
                  setTopicFilter("");
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border outline-none bg-transparent ${
                statusFilter === "topic"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground border-border/40 hover:bg-secondary"
              }`}
            >
              <option value="" className="text-foreground bg-background">Filter by Topic...</option>
              {PRESET_TOPICS.map((topic) => (
                <option key={topic} value={topic} className="text-foreground bg-background">{topic}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Render View */}
        {viewMode === "kanban" ? (
          <DSAKanbanBoard items={filteredItems} />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border shadow-md bg-card">
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-secondary/40 border-b border-border">
                  <th className="p-4 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-r border-border/50 w-[45px]"></th>
                  <th className="p-4 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-r border-border/50">
                    Problem & Topics
                  </th>
                  <th className="p-4 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-r border-border/50 w-[140px]">
                    Complexity
                  </th>
                  <th className="p-4 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-r border-border/50 w-[240px]">
                    Revision Timeline
                  </th>
                  <th className="p-4 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground w-[120px] text-right px-8">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-20 text-center text-muted-foreground font-medium italic">
                      No problems found in your active vault selection.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isExpanded = expandedIds.has(item.id);
                    const isDue = item.nextReviewDate && isPast(item.nextReviewDate.toDate());
                    const isCompleted = item.reviewCount >= SRS_INTERVALS.length;

                    return (
                      <Fragment key={item.id}>
                        <tr
                          className="hover:bg-secondary/5 transition-all group/row"
                        >
                        {/* Table layout detail row rendering toggle */}
                        <td className="p-4 text-center border-r border-border/50 align-middle">
                          <button
                            onClick={() => toggleExpandRow(item.id)}
                            className="p-1 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>

                        {/* Problem info & tags */}
                        <td className="p-4 align-top border-r border-border/50">
                          {editingId === item.id ? (
                            <div className="flex flex-col gap-3 max-w-lg">
                              <input
                                autoFocus
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-background border border-border/60 rounded-lg px-3 py-1.5 text-sm font-bold outline-none focus:border-primary"
                                placeholder="Problem Name"
                              />
                              <div className="relative flex items-center w-full">
                                <input
                                  type="url"
                                  value={editUrl}
                                  onChange={(e) => setEditUrl(e.target.value)}
                                  className="w-full bg-background border border-border/60 rounded-lg pl-3 pr-8 py-1.5 text-xs outline-none focus:border-primary"
                                  placeholder="LeetCode URL"
                                />
                                {editName.trim() && (
                                  <button
                                    type="button"
                                    onClick={() => setEditUrl(generateLeetCodeUrl(editName))}
                                    className="absolute right-2 text-primary hover:text-primary/80 transition-colors"
                                    title="Generate LeetCode URL from Edit Name"
                                  >
                                    <Sparkles className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {(["Easy", "Medium", "Hard"] as DSADifficulty[]).map((d) => (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => setEditDifficulty(d)}
                                    className={`px-3 py-1 rounded text-[10px] font-black uppercase ${
                                      editDifficulty === d
                                        ? d === "Easy"
                                          ? "bg-emerald-500 text-white"
                                          : d === "Medium"
                                          ? "bg-amber-500 text-white"
                                          : "bg-rose-500 text-white"
                                        : "bg-secondary text-muted-foreground"
                                    }`}
                                  >
                                    {d}
                                  </button>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-1 p-2 bg-background border rounded-lg max-h-[80px] overflow-y-auto">
                                {PRESET_TOPICS.map((topic) => (
                                  <button
                                    key={topic}
                                    type="button"
                                    onClick={() => handleEditTopicToggle(topic)}
                                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                      editTopics.includes(topic)
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-muted-foreground"
                                    }`}
                                  >
                                    {topic}
                                  </button>
                                ))}
                              </div>
                              <textarea
                                value={editIntuition}
                                onChange={(e) => setEditIntuition(e.target.value)}
                                placeholder="The Intuition / Approach"
                                className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-primary min-h-[80px] resize-y"
                              />
                              <CodeTextarea
                                value={editSnippet}
                                onChange={setEditSnippet}
                                placeholder="Solution / Code Snippet"
                                minHeight="80px"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveEdit(item.id)}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-wider"
                                >
                                  <Save className="h-3 w-3" /> Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-muted-foreground rounded-lg text-[10px] font-black uppercase tracking-wider"
                                >
                                  <X className="h-3 w-3" /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    item.difficulty === "Easy"
                                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                                      : item.difficulty === "Medium"
                                      ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                                      : "bg-rose-500/10 border border-rose-500/20 text-rose-500"
                                  }`}
                                >
                                  {item.difficulty}
                                </span>
                                <span className="font-bold text-lg leading-tight hover:text-primary transition-colors">
                                  {item.problemName}
                                </span>

                                {item.problemUrl && (
                                  <a
                                    href={item.problemUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-primary transition-colors"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                )}

                                {/* Delete conf toggle */}
                                {deletingId === item.id ? (
                                  <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/20 rounded-lg px-2 py-0.5 ml-2 animate-in zoom-in duration-200">
                                    <span className="text-[9px] font-black text-destructive uppercase">Delete?</span>
                                    <button
                                      onClick={() => handleDeleteConfirm(item.id)}
                                      disabled={deleteMutation.isPending}
                                      className="p-0.5 hover:bg-destructive hover:text-white rounded text-destructive"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingId(null)}
                                      className="p-0.5 hover:bg-secondary rounded text-muted-foreground"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center opacity-0 group-hover/row:opacity-100 transition-opacity gap-0.5 ml-2">
                                    <button
                                      onClick={() => handleStartEdit(item)}
                                      className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-primary"
                                      title="Edit problem details"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingId(item.id)}
                                      className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                                      title="Delete problem"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {item.topics.map((t) => (
                                  <span
                                    key={t}
                                    className="px-2 py-0.5 bg-secondary/55 text-muted-foreground/80 rounded-md text-[9px] font-black uppercase tracking-wider border border-border/20"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Complexities */}
                        <td className="p-4 align-top border-r border-border/50 text-sm font-bold text-muted-foreground">
                          {editingId === item.id ? (
                            <div className="flex flex-col gap-2">
                              <select
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                                className="bg-background border rounded px-1.5 py-1 text-xs"
                              >
                                {COMPLEXITIES.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                              <select
                                value={editSpace}
                                onChange={(e) => setEditSpace(e.target.value)}
                                className="bg-background border rounded px-1.5 py-1 text-xs"
                              >
                                {COMPLEXITIES.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/30">Time:</span>
                                <span className="font-mono text-xs">{item.timeComplexity || "O(?)"}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/30">Space:</span>
                                <span className="font-mono text-xs">{item.spaceComplexity || "O(?)"}</span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Revision timeline */}
                        <td className="p-4 align-top border-r border-border/50">
                          {item.nextReviewDate ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-4">
                                {SRS_INTERVALS.map((day, idx) => {
                                  const isDone = item.reviewCount > idx;
                                  const isCurrent = item.reviewCount === idx;

                                  return (
                                    <div key={day} className="flex flex-col items-center gap-1" title={`Review at Day ${day}`}>
                                      <span className={`text-[8px] font-black ${isCurrent && isDue ? "text-amber-500" : isDone ? "text-primary" : "text-muted-foreground/30"}`}>
                                        D{day}
                                      </span>
                                      <div
                                        className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                                          isDone
                                            ? "bg-primary border-primary shadow-sm"
                                            : isCurrent && isDue
                                            ? "border-amber-500 bg-amber-500/5"
                                            : "border-border bg-secondary/15"
                                        }`}
                                      >
                                        {isDone && <Check className="h-3 w-3 text-primary-foreground" />}
                                        {isCurrent && !isDone && <div className={`h-1.5 w-1.5 rounded-full ${isDue ? "bg-amber-500" : "bg-primary/40"}`} />}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="text-[10px] font-black text-muted-foreground/50">
                                {isCompleted ? (
                                  <span className="text-emerald-500">Mastered</span>
                                ) : (
                                  `Next review: ${format(item.nextReviewDate.toDate(), "MMM d")}`
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground/30 italic">No cycles set</div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 align-middle text-right px-8">
                          {item.nextReviewDate && !isCompleted ? (
                            isDue ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleReviewForgot(item)}
                                  disabled={updateMutation.isPending}
                                  className="px-2.5 py-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive hover:text-white transition-all text-[10px] font-black uppercase active:scale-95"
                                  title="Struggled? Reset path."
                                >
                                  Stuck
                                </button>
                                <button
                                  onClick={() => handleReviewSuccess(item)}
                                  disabled={updateMutation.isPending}
                                  className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase shadow-lg shadow-emerald-500/10"
                                >
                                  Got it
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleReviewSuccess(item)}
                                disabled={updateMutation.isPending}
                                className="px-3 py-1.5 bg-secondary text-muted-foreground/45 rounded-lg text-[9px] font-black uppercase hover:opacity-100 hover:bg-primary hover:text-primary-foreground transition-all"
                              >
                                Mark step
                              </button>
                            )
                          ) : (
                            <span className="text-[9px] font-black text-muted-foreground/30 uppercase">Achieved</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-secondary/10 transition-all animate-in fade-in duration-200">
                          <td colSpan={5} className="p-6 border-t border-border/40">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Intuition */}
                              <div className="space-y-2">
                                <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                                  <BookOpen className="h-4 w-4" />
                                  The Intuition / Approach
                                </h4>
                                <p className="text-sm font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                  {item.intuition || "No approach logged for this problem yet. Add one in edit mode."}
                                </p>
                              </div>

                              {/* Code Snippet - Syntax Highlighted */}
                              {item.codeSnippet && (
                                <div className="space-y-2">
                                  <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                                    <Code className="h-4 w-4" />
                                    Solution
                                  </h4>
                                  <CodeBlock code={item.codeSnippet} maxHeight="300px" />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>

    </div>
  );
}
