"use client";

import { useState } from "react";
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
  Flame,
  ChevronDown,
  ChevronUp,
  Copy,
  PenTool,
} from "lucide-react";
import { format, addDays, isPast } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { Switch } from "@/components/ui/switch";
import { useAuthGuard } from "@/components/auth-guard";
import { CanvasDraw } from "@/components/notebook/canvas-draw";
import { useToast } from "@/components/ui/toast";

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
  "Bit Manipulation",
];

const COMPLEXITIES = ["O(1)", "O(log N)", "O(N)", "O(N log N)", "O(N^2)", "O(2^N)", "O(N!)"];

export default function DSAPage() {
  const { data: items = [], isLoading } = useDSAItems();
  const addMutation = useAddDSAItem();
  const updateMutation = useUpdateDSAItem();
  const deleteMutation = useDeleteDSAItem();
  const { requireAuth } = useAuthGuard();
  const { toast } = useToast();

  // Form states
  const [isOpenAddForm, setIsOpenAddForm] = useState(false);
  const [problemName, setProblemName] = useState("");
  const [problemUrl, setProblemUrl] = useState("");
  const [difficulty, setDifficulty] = useState<DSADifficulty>("Medium");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [timeComplexity, setTimeComplexity] = useState("O(N)");
  const [spaceComplexity, setSpaceComplexity] = useState("O(1)");
  const [intuition, setIntuition] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [hasSrs, setHasSrs] = useState(true);

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

  // Focus Session states
  const [inFocusSession, setInFocusSession] = useState(false);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [revealDetails, setRevealDetails] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [whiteboardData, setWhiteboardData] = useState<string>("");

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

  const handleStartFocusSession = () => {
    setInFocusSession(true);
    setSessionIndex(0);
    setRevealDetails(false);
    setShowWhiteboard(false);
    setWhiteboardData("");
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

      // Advance session index if in focus session
      if (inFocusSession) {
        if (sessionIndex < dueItems.length - 1) {
          setSessionIndex((prev) => prev + 1);
          setRevealDetails(false);
          setShowWhiteboard(false);
        } else {
          setInFocusSession(false);
          toast({ title: "Focus Session Complete! Outstanding work.", variant: "success" });
        }
      }
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

      // Advance session index if in focus session
      if (inFocusSession) {
        if (sessionIndex < dueItems.length - 1) {
          setSessionIndex((prev) => prev + 1);
          setRevealDetails(false);
          setShowWhiteboard(false);
        } else {
          setInFocusSession(false);
          toast({ title: "Focus Session Complete!", variant: "success" });
        }
      }
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

  // Metrics calculations
  const totalSolved = items.length;
  const easySolved = items.filter((i) => i.difficulty === "Easy").length;
  const mediumSolved = items.filter((i) => i.difficulty === "Medium").length;
  const hardSolved = items.filter((i) => i.difficulty === "Hard").length;

  const dueItems = items.filter(
    (item) =>
      item.nextReviewDate &&
      isPast(item.nextReviewDate.toDate()) &&
      item.reviewCount < SRS_INTERVALS.length
  );

  // Topics solved count
  const topicsMap: { [key: string]: number } = {};
  items.forEach((item) => {
    item.topics.forEach((t) => {
      topicsMap[t] = (topicsMap[t] || 0) + 1;
    });
  });

  // Calculate consistency streak (basic check for last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(new Date(), -i);
    return {
      date: d,
      dateString: format(d, "yyyy-MM-dd"),
      dayOfWeek: format(d, "EEE"),
      solved: items.some((item) => {
        const itemDate = item.createdAt?.toDate();
        return itemDate && format(itemDate, "yyyy-MM-dd") === format(d, "yyyy-MM-dd");
      }),
    };
  }).reverse();

  const currentStreak = last7Days.reduce((acc, day) => (day.solved ? acc + 1 : acc), 0);

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
          <Terminal className="h-10 w-10 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24 px-4 font-v-body">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary text-sm font-black uppercase tracking-widest">
            <Terminal className="h-4 w-4 animate-pulse" />
            Active Revision Vault
          </div>
          <h1 className="text-5xl font-black tracking-tighter">
            DSA Tracker
          </h1>
          <p className="text-muted-foreground font-medium max-w-sm">
            Track solved problems, record core intuitions, and review via Spaced Repetition.
          </p>
        </div>

        <div className="flex gap-4">
          {dueItems.length > 0 && (
            <button
              onClick={handleStartFocusSession}
              className="flex items-center gap-2.5 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-500/25 border border-amber-400/20"
            >
              <Sparkles className="h-4 w-4" />
              Practice Queue ({dueItems.length} Due)
            </button>
          )}

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

      {/* Grid: Metrics, Streak & Topic Mastery */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Metric Solved */}
        <div className="bg-gradient-to-br from-card to-secondary/10 border border-border/60 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total Solved</span>
          <div className="flex items-baseline gap-2 py-4">
            <span className="text-6xl font-black tracking-tighter">{totalSolved}</span>
            <span className="text-xs text-muted-foreground font-bold">problems</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] font-black uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-1 rounded-md">
              E: {easySolved}
            </span>
            <span className="text-[10px] font-black uppercase bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-1 rounded-md">
              M: {mediumSolved}
            </span>
            <span className="text-[10px] font-black uppercase bg-rose-500/10 border border-rose-500/20 text-rose-500 px-2 py-1 rounded-md">
              H: {hardSolved}
            </span>
          </div>
        </div>

        {/* Streak / Consistency */}
        <div className="bg-gradient-to-br from-card to-secondary/10 border border-border/60 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Consistency Log</span>
            <div className="flex items-center gap-1.5 text-xs text-orange-500 font-black uppercase">
              <Flame className="h-4 w-4" />
              {currentStreak} Day Streak
            </div>
          </div>
          <div className="flex justify-between py-6">
            {last7Days.map((day) => (
              <div key={day.dateString} className="flex flex-col items-center gap-2">
                <span className="text-[9px] font-black text-muted-foreground/40 uppercase">{day.dayOfWeek}</span>
                <div
                  className={`h-7 w-7 rounded-lg border transition-all ${
                    day.solved
                      ? "bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/20"
                      : "bg-secondary/20 border-border/40"
                  }`}
                  title={day.solved ? `Solved on ${day.dateString}` : "No solves"}
                />
              </div>
            ))}
          </div>
          <span className="text-[9px] font-black text-muted-foreground/30 uppercase text-center block">Streak updates instantly upon solves</span>
        </div>

        {/* Topic Mastery breakdown */}
        <div className="md:col-span-2 bg-gradient-to-br from-card to-secondary/10 border border-border/60 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 block">Topic Distribution</span>
          <div className="grid grid-cols-2 gap-4 max-h-[110px] overflow-y-auto pr-2">
            {Object.entries(topicsMap).length === 0 ? (
              <div className="col-span-2 text-xs text-muted-foreground font-medium italic py-6 text-center">
                Add solved problems to see topic coverage
              </div>
            ) : (
              Object.entries(topicsMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([topic, count]) => {
                  const percentage = Math.min(100, Math.round((count / totalSolved) * 100));
                  return (
                    <div key={topic} className="space-y-1">
                      <div className="flex justify-between text-xs font-black uppercase tracking-wider text-muted-foreground">
                        <span>{topic}</span>
                        <span>{count} solved</span>
                      </div>
                      <div className="h-2 w-full bg-secondary/40 rounded-full overflow-hidden border border-border/20">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </section>

      {/* Add New Problem Form - Premium Drawer / Collapsible block */}
      {isOpenAddForm && (
        <section className="bg-gradient-to-br from-card to-secondary/15 border border-border/60 rounded-3xl p-6 md:p-8 shadow-2xl shadow-primary/5 relative animate-in slide-in-from-top-4 fade-in duration-300">
          <form onSubmit={handleAddProblem} className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
            <div className="md:col-span-12 border-b border-border/40 pb-2 mb-2">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Vault a solved problem
              </h2>
            </div>

            {/* Problem Name */}
            <div className="md:col-span-6">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
                Problem Name *
              </label>
              <input
                required
                type="text"
                value={problemName}
                onChange={(e) => setProblemName(e.target.value)}
                placeholder="e.g., 3Sum"
                className="w-full bg-background border border-border/60 rounded-xl px-4 py-3.5 text-base font-bold focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all"
              />
            </div>

            {/* Platform URL */}
            <div className="md:col-span-6">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
                Problem URL
              </label>
              <input
                type="url"
                value={problemUrl}
                onChange={(e) => setProblemUrl(e.target.value)}
                placeholder="e.g., https://leetcode.com/problems/3sum/"
                className="w-full bg-background border border-border/60 rounded-xl px-4 py-3.5 text-base font-medium focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all"
              />
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
        </section>
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

          <div className="text-xs font-bold text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg border border-border/50 self-end md:self-auto uppercase tracking-wider">
            {filteredItems.length} of {items.length} Vaulted
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
            <div className={`h-2.5 w-2.5 rounded-full bg-amber-500 ${dueItems.length > 0 ? "animate-pulse" : ""}`} />
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

        {/* The DSA Problems Table */}
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
                      <tr
                        key={item.id}
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
                              <input
                                type="url"
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                className="bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                                placeholder="LeetCode URL"
                              />
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
                                            ? "border-amber-500 bg-amber-500/5 animate-pulse"
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Collapsible detail rows rendered underneath the table rows */}
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isExpanded = expandedIds.has(item.id);
            if (!isExpanded) return null;

            return (
              <div
                key={`detail-${item.id}`}
                className="bg-secondary/10 border border-border/40 rounded-2xl p-6 space-y-4 animate-in slide-in-from-top-2 duration-300"
              >
                <div className="w-full">
                  {/* Intuition section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4" />
                      The Intuition / Approach
                    </h4>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {item.intuition || "No approach logged for this problem yet. Add one in edit mode."}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Focus revision modal with Whiteboard sketchpad */}
      {inFocusSession && dueItems.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-card to-secondary/30 border border-border/80 rounded-3xl p-8 max-w-4xl w-full shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6 max-h-[90vh]">
            
            {/* Main Problem card details */}
            <div className="flex-1 flex flex-col justify-between space-y-8 min-h-[400px]">
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => setShowWhiteboard(!showWhiteboard)}
                  className={`p-2 rounded-xl border transition-all ${
                    showWhiteboard
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary text-muted-foreground border-border hover:bg-secondary/80"
                  }`}
                  title="Toggle Whiteboard Sketchpad"
                >
                  <PenTool className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setInFocusSession(false)}
                  className="p-2 bg-secondary text-muted-foreground border border-border rounded-xl hover:bg-destructive hover:text-white transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Title / Info header */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full">
                    Due Revision {sessionIndex + 1} of {dueItems.length}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      dueItems[sessionIndex].difficulty === "Easy"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                        : dueItems[sessionIndex].difficulty === "Medium"
                        ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                        : "bg-rose-500/10 border border-rose-500/20 text-rose-500"
                    }`}
                  >
                    {dueItems[sessionIndex].difficulty}
                  </span>
                </div>

                <h3 className="text-3xl font-black tracking-tight leading-none text-foreground py-1">
                  {dueItems[sessionIndex].problemName}
                </h3>

                <div className="flex flex-wrap gap-1.5">
                  {dueItems[sessionIndex].topics.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-secondary text-muted-foreground rounded text-[9px] font-black uppercase">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Central core review area */}
              <div className="flex-1 overflow-y-auto pr-2 py-4 space-y-4">
                {dueItems[sessionIndex].problemUrl && (
                  <a
                    href={dueItems[sessionIndex].problemUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
                  >
                    Solve on Platform
                    <ExternalLink className="h-4.5 w-4.5" />
                  </a>
                )}

                <div className="border border-border/50 rounded-2xl p-5 bg-secondary/10 space-y-3">
                  {!revealDetails ? (
                    <button
                      onClick={() => setRevealDetails(true)}
                      className="w-full py-8 text-center border border-dashed border-border/50 hover:bg-secondary/15 rounded-xl font-black text-xs uppercase tracking-widest text-muted-foreground flex flex-col items-center justify-center gap-3 transition-colors"
                    >
                      <BookOpen className="h-6 w-6 text-primary animate-bounce" />
                      Reveal Intuition
                    </button>
                  ) : (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Complexity Goals:</div>
                        <div className="flex gap-4 font-mono text-xs">
                          <span>Time: {dueItems[sessionIndex].timeComplexity || "O(?)"}</span>
                          <span>Space: {dueItems[sessionIndex].spaceComplexity || "O(?)"}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Intuition:</div>
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {dueItems[sessionIndex].intuition || "No intuition stored."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center gap-3 border-t border-border/40 pt-4">
                <button
                  onClick={() => handleReviewForgot(dueItems[sessionIndex])}
                  disabled={updateMutation.isPending}
                  className="flex-1 py-4 bg-destructive/15 text-destructive border border-destructive/20 rounded-2xl hover:bg-destructive hover:text-white transition-all text-xs font-black uppercase tracking-widest active:scale-95"
                >
                  Got Stuck
                </button>
                <button
                  onClick={() => handleReviewSuccess(dueItems[sessionIndex])}
                  disabled={updateMutation.isPending}
                  className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20"
                >
                  Coded Successfully!
                </button>
              </div>
            </div>

            {/* Sketchpad Side-Drawer within focus session modal */}
            {showWhiteboard && (
              <div className="w-full md:w-[420px] border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6 flex flex-col animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <PenTool className="h-4 w-4" />
                    Sketchpad / Dry-Run
                  </div>
                  <span className="text-[8px] text-muted-foreground font-medium uppercase">Draw trees & pointers here</span>
                </div>
                <div className="flex-1 bg-background rounded-2xl overflow-hidden border border-border min-h-[300px] md:min-h-0 relative">
                  <CanvasDraw
                    initialData={whiteboardData}
                    onSave={setWhiteboardData}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
