"use client";

import { useState, Fragment, useEffect, useMemo } from "react";
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
  Layers,
  UnfoldHorizontal,
  Columns2,
  CircleSlash2,
  Repeat2,
  SendToBack,
  SquareFunction,
  DollarSign,
  ArrowDownWideNarrow,
  Binary,
  SquareMinus,
  Layers2,
  LayersPlus,
  GitPullRequestDraft,
  TableOfContents,
  ReplaceAll,
  DatabaseSearch,
  MapPlus,
  TreePalm,
  Cable,
  Merge,
  Dumbbell,
  Shuffle,
  Timer,
  Pause,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { DSAKanbanBoard } from "@/components/dsa/dsa-kanban-board";
import { Timestamp } from "firebase/firestore";
import { Switch } from "@/components/ui/switch";
import { useAuthGuard } from "@/components/auth-guard";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { CodeBlock, CodeTextarea } from "@/components/ui/code-block";
import { cn } from "@/lib/utils";
import { RichEditor, convertToHtmlIfNeeded } from "@/components/ui/rich-editor";
import { marked } from "marked";

import {
  useDSAItems,
  useAddDSAItem,
  useUpdateDSAItem,
  useDeleteDSAItem,
} from "@/hooks/use-dsa";
import { useProfile } from "@/hooks/use-profile";
import { DSADifficulty } from "@/lib/schemas/dsa.schema";
import { SRS_INTERVALS, calculateNextReviewDate, getInitialReviewDate } from "@/lib/srs-utils";

const PRESET_TOPICS = [
  "Arrays",
  "String",
  "Linked List",
  "Stack",
  "Queue",
  "Trees",
  "Graphs",
  "Heap",
  "Hashmaps",
  "Matrix",
  "Trie",
  "Segment Tree",
  "Union Find",
  "Intervals",
  "Math",
];

const PRESET_PATTERNS = [
  "Two Pointers",
  "Sliding Window",
  "Binary Search",
  "Recursion",
  "Backtracking",
  "Dynamic Programming",
  "Greedy",
  "Sorting",
  "Bit Manipulation",
  "Divide & Conquer",
  "BFS",
  "DFS",
  "Heaps",
  "Ques",
  "Subset Combinational",
  "Modified Binary Search",
  "Graph Traversal",
  "Trie",
  "Linked List",
  "Merge Intervals",
];

const ALL_TAGS = [...PRESET_TOPICS, ...PRESET_PATTERNS];

const COMPLEXITIES = ["O(1)", "O(log N)", "O(N)", "O(N log N)", "O(N^2)", "O(2^N)", "O(N!)"];

const generateLeetCodeUrl = (name: string) => {
  if (!name) return "";
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric characters with -
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
  return `https://leetcode.com/problems/${slug}/`;
};

interface ReferenceLinkBadgeProps {
  url: string | null | undefined;
  className?: string;
  maxW?: string;
}

const ReferenceLinkBadge = ({ url, className, maxW = "100px" }: ReferenceLinkBadgeProps) => {
  if (!url) return null;

  let hostname = "Link";
  let faviconUrl = "";
  let isValid = false;

  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    hostname = parsed.hostname.replace("www.", "");
    faviconUrl = `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=16`;
    isValid = true;
  } catch (_) {
    isValid = false;
  }

  const finalUrl = url.startsWith("http") ? url : `https://${url}`;

  return (
    <a
      href={finalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-primary/8 hover:bg-primary/15 text-primary/70 hover:text-primary transition-all text-[9px] font-bold align-middle shrink-0",
        className
      )}
      title={url}
      onClick={(e) => e.stopPropagation()}
    >
      {isValid && faviconUrl && (
        <img
          src={faviconUrl}
          alt=""
          className="h-3 w-3 rounded-sm shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <span className="truncate" style={{ maxWidth: maxW }}>
        {hostname}
      </span>
      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
    </a>
  );
};

const IntuitionDisplay = ({ content }: { content: string | null | undefined }) => {
  if (!content) return null;

  const html = convertToHtmlIfNeeded(content);

  return (
    <div
      className="prose prose-sm dark:prose-invert text-sm font-medium text-muted-foreground leading-relaxed max-w-none break-words"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

function cleanIntuition(text: string): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed === "") return null;
  return trimmed;
}

/* ─── Pattern Icon Map ─────────────────────────────────────────── */

const PATTERN_ICONS: Record<string, LucideIcon> = {
  "Two Pointers": UnfoldHorizontal,
  "Sliding Window": Columns2,
  "Binary Search": CircleSlash2,
  "Recursion": Repeat2,
  "Backtracking": SendToBack,
  "Dynamic Programming": SquareFunction,
  "Greedy": DollarSign,
  "Sorting": ArrowDownWideNarrow,
  "Bit Manipulation": Binary,
  "Divide & Conquer": SquareMinus,
  "BFS": Layers2,
  "DFS": LayersPlus,
  "Heaps": GitPullRequestDraft,
  "Ques": TableOfContents,
  "Subset Combinational": ReplaceAll,
  "Modified Binary Search": DatabaseSearch,
  "Graph Traversal": MapPlus,
  "Trie": TreePalm,
  "Linked List": Cable,
  "Merge Intervals": Merge,
};

/* ─── Patterns Accordion View ──────────────────────────────────── */

interface PatternsViewProps {
  items: any[];
  expandedPatterns: Set<string>;
  onTogglePattern: (pattern: string) => void;
}

function PatternsView({ items, expandedPatterns, onTogglePattern }: PatternsViewProps) {
  // Group items by pattern – a problem can appear under multiple patterns
  const patternGroups = useMemo(() => {
    const groups: Record<string, typeof items> = {};
    for (const pattern of PRESET_PATTERNS) {
      const matching = items.filter((item) =>
        item.topics?.some(
          (t: string) => t.toLowerCase() === pattern.toLowerCase()
        )
      );
      if (matching.length > 0) {
        groups[pattern] = matching;
      }
    }
    return groups;
  }, [items]);

  const patternKeys = Object.keys(patternGroups);

  if (patternKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Layers className="h-10 w-10 text-muted-foreground/20 mb-4" />
        <p className="text-muted-foreground font-medium italic">
          No problems matched any algorithmic pattern in the current filter.
        </p>
        <p className="text-xs text-muted-foreground/50 mt-1">
          Tag your problems with patterns like Two Pointers, Sliding Window, etc.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {patternKeys.map((pattern) => {
        const problems = patternGroups[pattern];
        const isOpen = expandedPatterns.has(pattern);

        return (
          <div
            key={pattern}
            className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden transition-all"
          >
            {/* Accordion Header */}
            <button
              onClick={() => onTogglePattern(pattern)}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/30 transition-colors group/acc"
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${
                  isOpen
                    ? "bg-violet-500 text-white shadow-md shadow-violet-500/20"
                    : "bg-violet-500/10 text-violet-500"
                }`}>
                {(() => {
                  const IconComp = PATTERN_ICONS[pattern] || Layers;
                  return <IconComp className="h-4 w-4" />;
                })()}
                </div>
                <span className="font-black text-sm uppercase tracking-wider">
                  {pattern}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isOpen
                    ? "bg-violet-500/15 text-violet-500"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {problems.length} {problems.length === 1 ? "problem" : "problems"}
                </span>
              </div>
              <div className={`transition-transform duration-200 text-muted-foreground ${isOpen ? "rotate-180" : ""}`}>
                <ChevronDown className="h-4 w-4" />
              </div>
            </button>

            {/* Accordion Body */}
            {isOpen && (
              <div className="border-t border-border/50 divide-y divide-border/30 animate-in fade-in slide-in-from-top-1 duration-200">
                {problems.map((item) => {
                  const isCompleted = item.reviewCount >= SRS_INTERVALS.length;
                  const isDue = item.nextReviewDate && isPast(item.nextReviewDate.toDate()) && !isCompleted;

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-secondary/10 transition-colors"
                    >
                      {/* Difficulty badge */}
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          item.difficulty === "Easy"
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                            : item.difficulty === "Medium"
                            ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                            : "bg-rose-500/10 border border-rose-500/20 text-rose-500"
                        }`}
                      >
                        {item.difficulty}
                      </span>

                      {/* Problem name + link */}
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate">
                            {item.problemName}
                          </span>
                          {item.problemUrl && (
                            <a
                              href={item.problemUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="shrink-0 p-1 hover:bg-secondary rounded text-muted-foreground hover:text-primary transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          <ReferenceLinkBadge url={item.link} />
                        </div>
                        {item.subPattern && (
                          <span className="text-[10px] text-violet-500 font-bold tracking-wide mt-0.5">
                            {item.subPattern}
                          </span>
                        )}
                      </div>

                      {/* Other topic/pattern tags (excluding current pattern) */}
                      <div className="hidden md:flex items-center gap-1 shrink-0">
                        {item.topics
                          ?.filter((t: string) => t.toLowerCase() !== pattern.toLowerCase())
                          .slice(0, 3)
                          .map((t: string) => (
                            <span
                              key={t}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                PRESET_PATTERNS.some((p) => p.toLowerCase() === t.toLowerCase())
                                  ? "bg-violet-500/5 text-violet-400 border-violet-500/15"
                                  : "bg-secondary/50 text-muted-foreground/60 border-border/20"
                              }`}
                            >
                              {t}
                            </span>
                          ))}
                        {(item.topics?.filter((t: string) => t.toLowerCase() !== pattern.toLowerCase()).length ?? 0) > 3 && (
                          <span className="text-[8px] text-muted-foreground/40 font-bold">
                            +{(item.topics?.filter((t: string) => t.toLowerCase() !== pattern.toLowerCase()).length ?? 0) - 3}
                          </span>
                        )}
                      </div>

                      {/* Complexity */}
                      <div className="hidden lg:flex items-center gap-3 shrink-0 text-[10px] text-muted-foreground/50 font-mono">
                        <span>{item.timeComplexity || "O(?)"}</span>
                        <span className="text-border">|</span>
                        <span>{item.spaceComplexity || "O(?)"}</span>
                      </div>

                      {/* Review status */}
                      <div className="shrink-0 w-20 text-right">
                        {isCompleted ? (
                          <span className="text-[9px] font-black uppercase text-emerald-500 flex items-center justify-end gap-1">
                            <Trophy className="h-3 w-3" />
                            Mastered
                          </span>
                        ) : isDue ? (
                          <span className="text-[9px] font-black uppercase text-amber-500 flex items-center justify-end gap-1">
                            <Clock className="h-3 w-3" />
                            Due
                          </span>
                        ) : item.nextReviewDate ? (
                          <span className="text-[9px] font-black uppercase text-muted-foreground/40">
                            {format(item.nextReviewDate.toDate(), "MMM d")}
                          </span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground/20 italic">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DSAPage() {
  const { data: items = [], isLoading } = useDSAItems();
  const addMutation = useAddDSAItem();
  const updateMutation = useUpdateDSAItem();
  const deleteMutation = useDeleteDSAItem();
  const { requireAuth } = useAuthGuard();
  const { toast } = useToast();

  // Practice Mode states
  const [isPracticeOpen, setIsPracticeOpen] = useState(false);
  const [practiceProblems, setPracticeProblems] = useState<any[]>([]);
  const [practiceTimeLeft, setPracticeTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [practiceStage, setPracticeStage] = useState<'preview' | 'solving' | 'completed'>('preview');
  const [practiceResults, setPracticeResults] = useState<{ [id: string]: 'success' | 'failed' | null }>({});
  const [revealIntuition, setRevealIntuition] = useState<{ [id: string]: boolean }>({});
  const [revealCode, setRevealCode] = useState<{ [id: string]: boolean }>({});

  // Practice Mode functions
  const startPracticeSetup = () => {
    if (items.length < 2) {
      toast({
        title: "Not enough problems.",
        description: "You need at least 2 problems in your tracker to practice.",
        variant: "error",
      });
      return;
    }
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 2);
    setPracticeProblems(selected);
    
    const getTimeForDiff = (diff: string) => {
      if (diff === "Easy") return 20 * 60;
      if (diff === "Hard") return 50 * 60;
      return 35 * 60; // Medium
    };
    const totalTime = getTimeForDiff(selected[0].difficulty) + getTimeForDiff(selected[1].difficulty);
    setPracticeTimeLeft(totalTime);
    setPracticeStage('preview');
    setIsTimerRunning(false);
    setRevealIntuition({});
    setRevealCode({});
    setPracticeResults({
      [selected[0].id]: null,
      [selected[1].id]: null,
    });
    setIsPracticeOpen(true);
  };

  const rerollPractice = () => {
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 2);
    setPracticeProblems(selected);
    const getTimeForDiff = (diff: string) => {
      if (diff === "Easy") return 20 * 60;
      if (diff === "Hard") return 50 * 60;
      return 35 * 60;
    };
    const totalTime = getTimeForDiff(selected[0].difficulty) + getTimeForDiff(selected[1].difficulty);
    setPracticeTimeLeft(totalTime);
    setRevealIntuition({});
    setRevealCode({});
    setPracticeResults({
      [selected[0].id]: null,
      [selected[1].id]: null,
    });
  };

  const handleStartSolving = () => {
    setPracticeStage('solving');
    setIsTimerRunning(true);
  };

  const handleGoToComplete = () => {
    setIsTimerRunning(false);
    setPracticeStage('completed');
  };

  const handleFinishPractice = async () => {
    requireAuth(async () => {
      // Loop over the 2 selected problems
      for (const problem of practiceProblems) {
        const status = practiceResults[problem.id];
        const baseDate = problem.dateLearned ? problem.dateLearned.toDate() : (problem.createdAt ? problem.createdAt.toDate() : new Date());
        if (status === 'success') {
          // Increment spaced repetition level
          const nextReviewCount = problem.reviewCount + 1;
          const nextDateValue = calculateNextReviewDate(nextReviewCount, baseDate);
          await updateMutation.mutateAsync({
            itemId: problem.id,
            data: {
              reviewCount: nextReviewCount,
              nextReviewDate: nextDateValue ? Timestamp.fromDate(nextDateValue) : null,
            },
          });
        } else if (status === 'failed') {
          // Reset spaced repetition path
          const nextDateValue = calculateNextReviewDate(0);
          await updateMutation.mutateAsync({
            itemId: problem.id,
            data: {
              reviewCount: 0,
              nextReviewDate: nextDateValue ? Timestamp.fromDate(nextDateValue) : null,
            },
          });
        }
      }
      toast({
        title: "Practice logged successfully!",
        description: "Your Spaced Repetition timeline has been updated.",
        variant: "success",
      });
      setIsPracticeOpen(false);
    });
  };

  // Timer countdown hook
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPracticeOpen && isTimerRunning && practiceStage === 'solving' && practiceTimeLeft > 0) {
      interval = setInterval(() => {
        setPracticeTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPracticeOpen, isTimerRunning, practiceStage, practiceTimeLeft]);

  // Format time remaining
  const formatPracticeTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // View states
  const [viewMode, setViewMode] = useState<"table" | "kanban" | "patterns">("table");

  // Form states
  const [isOpenAddForm, setIsOpenAddForm] = useState(false);
  const [problemName, setProblemName] = useState("");
  const [problemUrl, setProblemUrl] = useState("");
  const [isUrlPristine, setIsUrlPristine] = useState(true);
  const [difficulty, setDifficulty] = useState<DSADifficulty>("Medium");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [subPattern, setSubPattern] = useState("");
  const [timeComplexity, setTimeComplexity] = useState("O(N)");
  const [spaceComplexity, setSpaceComplexity] = useState("O(1)");
  const [intuition, setIntuition] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [referenceLink, setReferenceLink] = useState("");
  const [hasSrs, setHasSrs] = useState(true);
  const [nextReviewDateInput, setNextReviewDateInput] = useState("");
  const [editNextReviewDate, setEditNextReviewDate] = useState("");

  // AI Auto-Fill states
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // LeetCode Sync states
  const { data: profile } = useProfile();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState("");

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

  // Expand states for pattern accordions
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set());

  // Copy status
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDifficulty, setEditDifficulty] = useState<DSADifficulty>("Medium");
  const [editTopics, setEditTopics] = useState<string[]>([]);
  const [editSubPattern, setEditSubPattern] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editSpace, setEditSpace] = useState("");
  const [editIntuition, setEditIntuition] = useState("");
  const [editSnippet, setEditSnippet] = useState("");
  const [editLink, setEditLink] = useState("");

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
      const customNextReviewDate = hasSrs
        ? nextReviewDateInput
          ? (() => {
              const d = new Date(nextReviewDateInput);
              d.setHours(10, 0, 0, 0);
              return d;
            })()
          : getInitialReviewDate()
        : null;

      addMutation.mutate(
        {
          problemName: problemName.trim(),
          problemUrl: problemUrl.trim() || null,
          difficulty,
          topics: selectedTopics,
          subPattern: subPattern.trim() || null,
          timeComplexity: timeComplexity || null,
          spaceComplexity: spaceComplexity || null,
          intuition: cleanIntuition(intuition),
          codeSnippet: codeSnippet.trim() || null,
          nextReviewDate: customNextReviewDate,
          link: referenceLink.trim() || null,
        },
        {
          onSuccess: () => {
            setProblemName("");
            setProblemUrl("");
            setIsUrlPristine(true);
            setDifficulty("Medium");
            setSelectedTopics([]);
            setSubPattern("");
            setTimeComplexity("O(N)");
            setSpaceComplexity("O(1)");
            setIntuition("");
            setCodeSnippet("");
            setReferenceLink("");
            setHasSrs(true);
            setNextReviewDateInput("");
            setIsOpenAddForm(false);
          },
        }
      );
    });
  };

  const queryGeminiForProblem = async (name: string, apiKey: string) => {
    const ATTEMPTS_TO_TRY = [
      { model: "gemini-2.5-flash", apiVersion: "v1beta" },
      { model: "gemini-1.5-flash", apiVersion: "v1beta" },
      { model: "gemini-1.5-flash-latest", apiVersion: "v1beta" },
      { model: "gemini-1.5-flash-8b", apiVersion: "v1beta" },
      { model: "gemini-1.5-pro", apiVersion: "v1beta" },
      { model: "gemini-1.5-pro-latest", apiVersion: "v1beta" },
    ];

    const prompt = `You are a DSA expert. Given the problem name "${name.trim()}", analyze it and provide standard DSA information. Keep the intuition brief and direct (2-3 sentences max). Keep the code snippet clean, optimal, and without unnecessary comments:
1. LeetCode URL (standard problem link)
2. Difficulty (Easy, Medium, Hard)
3. Topics (Choose relevant data structure topics AND algorithmic patterns from these lists:
   - Data Structure Topics: ${PRESET_TOPICS.join(", ")}
   - Algorithmic Patterns: ${PRESET_PATTERNS.join(", ")})
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

    const errorsList: string[] = [];

    for (const attempt of ATTEMPTS_TO_TRY) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/${attempt.apiVersion}/models/${attempt.model}:generateContent?key=${apiKey.trim()}`,
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

        return JSON.parse(contentText);
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        console.warn(`Model ${attempt.model} on ${attempt.apiVersion} failed:`, errMsg);
        errorsList.push(`${attempt.model} (${attempt.apiVersion}): ${errMsg}`);
      }
    }
    
    throw new Error(`All attempts failed: ${errorsList[0] || "Unknown error"}`);
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

    try {
      const parsed = await queryGeminiForProblem(problemName, geminiApiKey);

      // Populate fields
      if (parsed.problemUrl) setProblemUrl(parsed.problemUrl);
      if (parsed.difficulty) setDifficulty(parsed.difficulty as DSADifficulty);
      
      // Filter parsed topics against ALL_TAGS (topics + patterns)
      if (Array.isArray(parsed.topics)) {
        const matchedTopics = parsed.topics.filter((topic: string) => {
          return ALL_TAGS.some(t => t.toLowerCase() === topic.toLowerCase());
        }).map((topic: string) => {
          const original = ALL_TAGS.find(t => t.toLowerCase() === topic.toLowerCase());
          return original || topic;
        });
        setSelectedTopics(matchedTopics);
      }

      if (parsed.timeComplexity) setTimeComplexity(parsed.timeComplexity);
      if (parsed.spaceComplexity) setSpaceComplexity(parsed.spaceComplexity);
      if (parsed.intuition) setIntuition(parsed.intuition);
      if (parsed.codeSnippet) setCodeSnippet(parsed.codeSnippet);

      setIsUrlPristine(false);
      toast({ title: "AI successfully generated problem details!", variant: "success" });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "AI generation failed.",
        description: err.message || "Please check your key or network connection.",
        variant: "error"
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleLeetCodeSync = async () => {
    const leetcodeUsername = profile?.leetcodeUsername?.trim();
    if (!leetcodeUsername) {
      toast({
        title: "LeetCode not configured",
        description: "Please set your LeetCode username in Profile settings first.",
        variant: "error",
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatusText("Connecting to LeetCode...");

    try {
      // 1. Fetch recent submissions from proxy API with auth headers if configured
      const headers: Record<string, string> = {};
      if (profile?.leetcodeSession) {
        headers["x-leetcode-session"] = profile.leetcodeSession;
      }
      if (profile?.leetcodeCsrf) {
        headers["x-leetcode-csrf"] = profile.leetcodeCsrf;
      }

      const res = await fetch(`/api/leetcode/submissions?username=${leetcodeUsername}`, {
        headers,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch from LeetCode");
      }

      const { submissions } = await res.json();
      
      // 2. Filter for Accepted submissions
      const acceptedSubmissions = submissions.filter(
        (sub: any) => sub.statusDisplay === "Accepted"
      );

      if (acceptedSubmissions.length === 0) {
        toast({
          title: "Sync complete",
          description: "No recent solved submissions found on LeetCode.",
          variant: "success",
        });
        setIsSyncing(false);
        return;
      }

      // Find unique solved submissions (by title)
      const uniqueSubmissions: any[] = [];
      const titleMap = new Set<string>();
      for (const sub of acceptedSubmissions) {
        const normalizedTitle = sub.title.toLowerCase().trim();
        if (!titleMap.has(normalizedTitle)) {
          titleMap.add(normalizedTitle);
          uniqueSubmissions.push(sub);
        }
      }

      // 3. Filter out problems that are already in our dsaItems tracker
      const existingTitles = new Set(
        items.map((item) => item.problemName.toLowerCase().trim())
      );

      const newProblems = uniqueSubmissions.filter(
        (sub) => !existingTitles.has(sub.title.toLowerCase().trim())
      );

      if (newProblems.length === 0) {
        toast({
          title: "Sync complete",
          description: "All recent solved LeetCode problems are already in your tracker.",
          variant: "success",
        });
        setIsSyncing(false);
        return;
      }

      setSyncStatusText(`Found ${newProblems.length} new solved problems. Importing...`);

      // 4. Load AI status (Gemini API key in localStorage)
      const geminiKey = typeof window !== "undefined" ? localStorage.getItem("streakly:dsa:gemini_api_key") || "" : "";
      
      let importCount = 0;

      // Sync sequentially to preserve rate limits
      for (let i = 0; i < newProblems.length; i++) {
        const problem = newProblems[i];
        setSyncStatusText(`[${i + 1}/${newProblems.length}] Importing "${problem.title}"...`);

        let problemDetails: any = {
          problemName: problem.title,
          problemUrl: `https://leetcode.com/problems/${problem.titleSlug}/`,
          difficulty: "Medium" as const,
          topics: ["Arrays"],
          subPattern: "",
          timeComplexity: "O(N)",
          spaceComplexity: "O(N)",
          intuition: "Imported from LeetCode solved submissions.",
          codeSnippet: problem.code || `// Solved in ${problem.lang}\n// Trigger AI Auto-Fill to populate solution.`,
          nextReviewDate: getInitialReviewDate(),
          priority: "Unprioritized" as const,
        };

        // If AI is configured, let's run the AI Auto-fill for this problem!
        if (geminiKey) {
          setSyncStatusText(`[${i + 1}/${newProblems.length}] AI Auto-Filling "${problem.title}"...`);
          try {
            const parsed = await queryGeminiForProblem(problem.title, geminiKey);
            if (parsed) {
              const matchedTopics = (parsed.topics || []).filter((topic: string) => {
                return ALL_TAGS.some(t => t.toLowerCase() === topic.toLowerCase());
              }).map((topic: string) => {
                const original = ALL_TAGS.find(t => t.toLowerCase() === topic.toLowerCase());
                return original || topic;
              });

              problemDetails = {
                problemName: problem.title,
                problemUrl: parsed.problemUrl || problemDetails.problemUrl,
                difficulty: (parsed.difficulty as DSADifficulty) || "Medium",
                topics: matchedTopics.length > 0 ? matchedTopics : ["Arrays"],
                subPattern: parsed.subPattern || "",
                timeComplexity: parsed.timeComplexity || "O(N)",
                spaceComplexity: parsed.spaceComplexity || "O(1)",
                intuition: parsed.intuition || "Imported from LeetCode.",
                codeSnippet: problem.code || parsed.codeSnippet || problemDetails.codeSnippet,
                nextReviewDate: getInitialReviewDate(),
                priority: "Unprioritized" as const,
              };
            }
          } catch (aiErr) {
            console.error("AI Auto-fill failed during sync:", aiErr);
            // Fall back to LeetCode defaults
          }
        }

        // Add item using addMutation (mutateAsync)
        await addMutation.mutateAsync({
          ...problemDetails,
        });
        importCount++;
      }

      toast({
        title: "LeetCode Sync Success",
        description: `Successfully imported ${importCount} new problems.`,
        variant: "success",
      });

    } catch (err: any) {
      console.error(err);
      toast({
        title: "Sync failed",
        description: err.message || "An error occurred during LeetCode sync.",
        variant: "error",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReviewSuccess = async (item: any) => {
    requireAuth(() => {
      const nextReviewCount = item.reviewCount + 1;
      const baseDate = item.dateLearned ? item.dateLearned.toDate() : (item.createdAt ? item.createdAt.toDate() : new Date());
      const nextDateValue = calculateNextReviewDate(nextReviewCount, baseDate);

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
    setEditSubPattern(item.subPattern || "");
    setEditTime(item.timeComplexity || "");
    setEditSpace(item.spaceComplexity || "");
    setEditIntuition(item.intuition || "");
    setEditSnippet(item.codeSnippet || "");
    setEditLink(item.link || "");
    setEditNextReviewDate(item.nextReviewDate ? format(item.nextReviewDate.toDate(), "yyyy-MM-dd") : "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditNextReviewDate("");
    setEditLink("");
  };

  const handleSaveEdit = async (itemId: string) => {
    if (!editName.trim()) return;

    requireAuth(() => {
      const parsedDate = editNextReviewDate ? new Date(editNextReviewDate) : null;
      if (parsedDate) {
        parsedDate.setHours(10, 0, 0, 0);
      }

      updateMutation.mutate(
        {
          itemId,
          data: {
            problemName: editName.trim(),
            problemUrl: editUrl.trim() || null,
            difficulty: editDifficulty,
            topics: editTopics,
            subPattern: editSubPattern.trim() || null,
            timeComplexity: editTime || null,
            spaceComplexity: editSpace || null,
            intuition: cleanIntuition(editIntuition),
            codeSnippet: editSnippet.trim() || null,
            nextReviewDate: parsedDate ? Timestamp.fromDate(parsedDate) : null,
            link: editLink.trim() || null,
          },
        },
        {
          onSuccess: () => {
            setEditingId(null);
            setEditNextReviewDate("");
            setEditLink("");
          },
        }
      );
    });
  };

  const toggleExpandRow = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set<string>();
      if (!prev.has(id)) {
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
          <div className="flex items-center gap-2 text-primary text-sm font-black uppercase tracking-widest flex-wrap">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Active Revision Vault
            </div>
            <span className="text-muted-foreground/30 font-normal hidden sm:inline">|</span>
            <Link
              href="/patterns"
              className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all hover:translate-x-0.5"
            >
              Pattern Library
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
            DSA Tracker
          </h1>
        </div>

        <div className="flex gap-3">
          <Tooltip content="Python Compiler" side="bottom">
            <Link
              href="/compiler"
              className="flex items-center justify-center h-12 w-12 rounded-2xl transition-all border border-border bg-card text-primary hover:border-primary/40 hover:scale-105 active:scale-95 shadow-sm"
            >
              <Play className="h-5 w-5" />
            </Link>
          </Tooltip>

          <Tooltip content="Practice Mode" side="bottom">
            <button
              onClick={startPracticeSetup}
              className="flex items-center justify-center h-12 w-12 rounded-2xl transition-all border border-border bg-card text-primary hover:border-primary/40 hover:scale-105 active:scale-95 shadow-sm"
            >
              <Dumbbell className="h-5 w-5" />
            </button>
          </Tooltip>

          <Tooltip content="Sync LeetCode" side="bottom">
            <button
              onClick={handleLeetCodeSync}
              disabled={isSyncing}
              className="flex items-center justify-center h-12 w-12 rounded-2xl transition-all border border-border bg-card text-primary hover:border-primary/40 hover:scale-105 active:scale-95 shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={cn("h-5 w-5", isSyncing && "animate-spin")} />
            </button>
          </Tooltip>

          <Tooltip content={isOpenAddForm ? "Cancel" : "Add Problem"} side="bottom">
            <button
              onClick={handleToggleAddForm}
              className={`flex items-center justify-center h-12 w-12 rounded-2xl transition-all border shadow-lg ${
                isOpenAddForm
                  ? "bg-secondary text-primary border-border"
                  : "bg-primary text-primary-foreground border-primary hover:scale-105 active:scale-95 shadow-primary/10"
              }`}
            >
              {isOpenAddForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Sleek Metrics Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-secondary/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-border/40 text-xs font-bold divide-x divide-border/30 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-black uppercase tracking-widest text-[9px]">Total Vaulted:</span>
          <span className="text-sm font-black text-foreground">{items.length}</span>
        </div>
        <div className="flex items-center gap-2 pl-4">
          <span className="text-emerald-500 font-black uppercase tracking-widest text-[9px]">Mastered:</span>
          <span className="text-sm font-black text-emerald-500">{items.filter(i => i.reviewCount >= SRS_INTERVALS.length).length}</span>
        </div>
        <div className="flex items-center gap-2 pl-4">
          <span className="text-amber-500 font-black uppercase tracking-widest text-[9px]">Due Review:</span>
          <span className="text-sm font-black text-amber-500">{dueItems.length}</span>
        </div>
        <div className="flex items-center gap-2 pl-4">
          <span className="text-rose-500 font-black uppercase tracking-widest text-[9px]">Hard Mode:</span>
          <span className="text-sm font-black text-rose-500">{items.filter(i => i.difficulty === "Hard").length}</span>
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

            {/* Reference Link */}
            <div className="md:col-span-12">
              <div className="flex items-center gap-1.5 ml-1 mb-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Reference Link (Article or YouTube Video)
                </label>
                <Tooltip content="Add a link to an article or YouTube video explaining the problem" side="top">
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
                </Tooltip>
              </div>
              <input
                type="url"
                value={referenceLink}
                onChange={(e) => setReferenceLink(e.target.value)}
                placeholder="e.g. https://www.youtube.com/watch?v=..., https://medium.com/..."
                className="w-full bg-background border border-border/60 rounded-xl px-4 py-3.5 text-base font-medium focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30"
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

            {/* Data Structure Topics */}
            <div className="md:col-span-12">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-2 block">
                Data Structures
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-background border border-border/60 rounded-xl">
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

            {/* Algorithmic Patterns */}
            <div className="md:col-span-12">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-2 block">
                Algorithmic Patterns
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-background border border-border/60 rounded-xl max-h-[140px] overflow-y-auto">
                {PRESET_PATTERNS.map((pattern) => {
                  const isSelected = selectedTopics.includes(pattern);
                  return (
                    <button
                      key={pattern}
                      type="button"
                      onClick={() => handleTopicToggle(pattern)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${
                        isSelected
                          ? "bg-violet-500 text-white border-violet-500"
                          : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary"
                      }`}
                    >
                      {pattern}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-Pattern / Variant */}
            <div className="md:col-span-12">
              <div className="flex items-center gap-1.5 ml-1 mb-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Sub-Pattern / Variant Name (Optional)
                </label>
                <Tooltip content="Add a specific variant or sub-pattern (e.g. 'Three Pointers' under Two Pointers, or '0/1 Knapsack' under DP)" side="top">
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 hover:text-primary cursor-help transition-colors" />
                </Tooltip>
              </div>
              <input
                type="text"
                value={subPattern}
                onChange={(e) => setSubPattern(e.target.value)}
                placeholder="e.g. Three Pointers, 0/1 Knapsack, Fast & Slow Pointers"
                className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all"
              />
            </div>

            {/* Intuition / Explanation */}
            <div className="md:col-span-12">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
                The Intuition (The AHA! Concept)
              </label>
              <RichEditor
                content={intuition}
                onChange={setIntuition}
                placeholder="Sort first, then anchor left pointer i, and use traditional two pointers for left + right elements to find sum === -nums[i]..."
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
            <div className="md:col-span-12 space-y-4 bg-background border border-border/60 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-black uppercase tracking-widest text-primary">Enable Spaced Repetition</div>
                  <div className="text-xs text-muted-foreground">Automatically schedule reviews at 1, 3, 7, and 30 day milestones.</div>
                </div>
                <Switch checked={hasSrs} onCheckedChange={setHasSrs} />
              </div>

              {hasSrs && (
                <div className="pt-3 border-t border-border/40 space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                    Custom First Review / Reminder Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={nextReviewDateInput}
                    onChange={(e) => setNextReviewDateInput(e.target.value)}
                    className="w-full bg-background border border-border/60 rounded-xl px-4 py-3.5 text-sm font-bold focus:border-primary outline-none transition-all"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    If not specified, the first review will be scheduled for tomorrow.
                  </p>
                </div>
              )}
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

      <div className="space-y-6">
        {/* Sleek Dashboard Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-card border border-border/50 p-3 rounded-2xl shadow-sm">
        
        {/* Left Side: Search & Topic Filter */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems..."
              className="w-full h-10 pl-10 pr-4 bg-secondary/35 rounded-xl border border-border/30 focus:border-primary focus:ring-2 ring-primary/10 outline-none transition-all text-sm font-medium"
            />
          </div>
          
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
            className="h-10 px-3 rounded-xl text-xs font-bold border outline-none bg-secondary/35 border-border/30 text-muted-foreground hover:bg-secondary/50"
          >
            <option value="" className="text-foreground bg-background">All Topics</option>
            <optgroup label="📦 Data Structures" className="text-foreground bg-background">
              {PRESET_TOPICS.map((topic) => (
                <option key={topic} value={topic} className="text-foreground bg-background">{topic}</option>
              ))}
            </optgroup>
            <optgroup label="🧩 Patterns" className="text-foreground bg-background">
              {PRESET_PATTERNS.map((pattern) => (
                <option key={pattern} value={pattern} className="text-foreground bg-background">{pattern}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Right Side: Segmented Difficulty Toggles + View Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Difficulty Segmented Control */}
          <div className="flex items-center bg-secondary/40 rounded-xl p-0.5 border border-border/35">
            {[
              { id: "all", label: "All" },
              { id: "due", label: "Due", isDue: true },
              { id: "Easy", label: "Easy" },
              { id: "Medium", label: "Medium" },
              { id: "Hard", label: "Hard" }
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id as any);
                    setTopicFilter("");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    isActive
                      ? tab.id === "Easy"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : tab.id === "Medium"
                        ? "bg-amber-500 text-white shadow-sm"
                        : tab.id === "Hard"
                        ? "bg-rose-500 text-white shadow-sm"
                        : tab.id === "due"
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {tab.isDue && <div className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-white" : "bg-amber-500"}`} />}
                    {tab.label}
                    {tab.isDue && (
                      <span className={`text-[9px] px-1 rounded ${isActive ? "bg-white/20 text-white" : "bg-secondary-foreground/10 text-muted-foreground"}`}>
                        {dueItems.length}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* View Toggles & Count */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-secondary/40 rounded-xl p-0.5 border border-border/35">
              {[
                { id: "table", icon: List, title: "Table" },
                { id: "kanban", icon: Kanban, title: "Kanban" },
                { id: "patterns", icon: Layers, title: "Patterns" }
              ].map((view) => {
                const isActive = viewMode === view.id;
                return (
                  <button
                    key={view.id}
                    onClick={() => setViewMode(view.id as any)}
                    className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-background text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                    }`}
                    title={view.title}
                  >
                    <view.icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>

            <div className="hidden sm:block text-[10px] font-black text-muted-foreground bg-secondary/40 px-3 py-2 rounded-xl border border-border/35 uppercase tracking-widest">
              {filteredItems.length} / {items.length}
            </div>
          </div>

        </div>
      </div>

        {/* Render View */}
        {viewMode === "kanban" ? (
          <DSAKanbanBoard items={filteredItems} />
        ) : viewMode === "patterns" ? (
          <PatternsView
            items={filteredItems}
            expandedPatterns={expandedPatterns}
            onTogglePattern={(pattern) => {
              setExpandedPatterns((prev) => {
                const next = new Set(prev);
                if (next.has(pattern)) next.delete(pattern);
                else next.add(pattern);
                return next;
              });
            }}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border shadow-md bg-card">
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-secondary/40 border-b border-border">
                  <th className="p-4 font-black text-[9px] uppercase tracking-wider text-muted-foreground/60 w-[45px]"></th>
                  <th className="p-4 font-black text-[9px] uppercase tracking-wider text-muted-foreground/60">
                    Problem & Topics
                  </th>
                  <th className="p-4 font-black text-[9px] uppercase tracking-wider text-muted-foreground/60 w-[140px]">
                    Complexity
                  </th>
                  <th className="p-4 font-black text-[9px] uppercase tracking-wider text-muted-foreground/60 w-[240px]">
                    Revision Timeline
                  </th>
                  <th className="p-4 font-black text-[9px] uppercase tracking-wider text-muted-foreground/60 w-[120px] text-right px-8">
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
                        <td className="p-4 text-center align-middle">
                          <button
                            onClick={() => toggleExpandRow(item.id)}
                            className="p-1 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>

                        {/* Problem info & tags */}
                        <td className="p-4 align-top">
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
                              <input
                                type="url"
                                value={editLink}
                                onChange={(e) => setEditLink(e.target.value)}
                                className="w-full bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-primary"
                                placeholder="Reference Link (Article or YouTube Video)"
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
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-1 p-2 bg-background border rounded-lg">
                                  <span className="w-full text-[8px] font-black uppercase tracking-wider text-muted-foreground/50 mb-0.5">📦 Data Structures</span>
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
                                <div className="flex flex-wrap gap-1 p-2 bg-background border rounded-lg max-h-[80px] overflow-y-auto">
                                  <span className="w-full text-[8px] font-black uppercase tracking-wider text-muted-foreground/50 mb-0.5">🧩 Patterns</span>
                                  {PRESET_PATTERNS.map((pattern) => (
                                    <button
                                      key={pattern}
                                      type="button"
                                      onClick={() => handleEditTopicToggle(pattern)}
                                      className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                        editTopics.includes(pattern)
                                          ? "bg-violet-500 text-white"
                                          : "bg-secondary text-muted-foreground"
                                      }`}
                                    >
                                      {pattern}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <input
                                type="text"
                                value={editSubPattern}
                                onChange={(e) => setEditSubPattern(e.target.value)}
                                placeholder="Sub-Pattern / Variant (e.g. 0/1 Knapsack)"
                                className="w-full bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-primary"
                              />
                              <RichEditor
                                content={editIntuition}
                                onChange={setEditIntuition}
                                placeholder="The Intuition / Approach"
                              />
                              <CodeTextarea
                                value={editSnippet}
                                onChange={setEditSnippet}
                                placeholder="Solution / Code Snippet"
                                minHeight="80px"
                              />
                              <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                  Custom Reminder / Next Review Date
                                </label>
                                <input
                                  type="date"
                                  value={editNextReviewDate}
                                  onChange={(e) => setEditNextReviewDate(e.target.value)}
                                  className="w-full bg-background border border-border/60 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:border-primary"
                                />
                                <span className="text-[8px] text-muted-foreground/60 leading-tight">
                                  Set a custom date for the next reminder. The rest of the revision cycle continues from original added date.
                                </span>
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
                                <ReferenceLinkBadge url={item.link} />

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

                              <div className="flex flex-wrap gap-1.5 items-center">
                                {item.subPattern && (
                                  <span className="px-2 py-0.5 bg-violet-500/10 text-violet-500 rounded-md text-[9px] font-black uppercase tracking-wider border border-violet-500/20" title={`Sub-pattern: ${item.subPattern}`}>
                                    ↳ {item.subPattern}
                                  </span>
                                )}
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
                        <td className="p-4 align-top text-sm font-bold text-muted-foreground">
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
                        <td className="p-4 align-top">
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
                                <IntuitionDisplay content={item.intuition} />
                                {item.link && (
                                  <div className="pt-2">
                                    <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60 block mb-1">
                                      Reference Material
                                    </span>
                                    <ReferenceLinkBadge url={item.link} maxW="300px" className="px-2.5 py-1.5 rounded-lg text-[10px]" />
                                  </div>
                                )}
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

    {/* Practice Arena Modal */}
    {isPracticeOpen && (
      <div className="fixed inset-0 h-screen z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="bg-card border border-border w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/60 bg-secondary/20">
            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
              <Dumbbell className="h-5 w-5" />
              Practice Arena
            </div>
            <button
              onClick={() => {
                if (practiceStage === 'solving') {
                  if (confirm("Are you sure you want to cancel the practice session? Your progress will not be logged.")) {
                    setIsPracticeOpen(false);
                  }
                } else {
                  setIsPracticeOpen(false);
                }
              }}
              className="p-2 rounded-full border border-border/80 hover:bg-secondary text-muted-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            
            {/* --- STAGE 1: PREVIEW --- */}
            {practiceStage === 'preview' && (
              <div className="space-y-6">
                <div className="text-center max-w-lg mx-auto space-y-2">
                  <h2 className="text-2xl font-black tracking-tight">Your Custom Practice Set</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    We've selected two random problems from your vault. Review them below, then start the timer to begin solving.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {practiceProblems.map((problem, index) => (
                    <div key={problem.id} className="bg-secondary/20 border border-border/60 p-5 rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none" />
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Problem {index + 1}</span>
                        <h3 className="text-lg font-black leading-snug">{problem.problemName}</h3>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            problem.difficulty === "Easy"
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                              : problem.difficulty === "Medium"
                              ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                              : "bg-rose-500/10 border border-rose-500/20 text-rose-500"
                          }`}>
                            {problem.difficulty}
                          </span>
                          {problem.topics.slice(0, 2).map((t: string) => (
                            <span key={t} className="px-2 py-0.5 bg-card text-muted-foreground/80 rounded-md text-[9px] font-black uppercase tracking-wider border border-border/30">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-auto border-t border-border/30 pt-3 flex items-center justify-between text-xs text-muted-foreground/60">
                        <div className="flex items-center gap-1.5">
                          <Timer className="h-3.5 w-3.5" />
                          <span>Allocated: {problem.difficulty === "Easy" ? "20m" : problem.difficulty === "Hard" ? "50m" : "35m"}</span>
                        </div>
                        <span>{problem.timeComplexity || "O(?)"} | {problem.spaceComplexity || "O(?)"}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-secondary/10 border border-border p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Timer className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase tracking-widest text-primary">Cumulative Session Timer</div>
                      <div className="text-lg font-black tracking-tight">{formatPracticeTime(practiceTimeLeft)}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={rerollPractice}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border hover:bg-secondary text-xs font-black uppercase tracking-widest transition-all"
                    >
                      <Shuffle className="h-4 w-4" />
                      Reroll
                    </button>
                    <button
                      onClick={handleStartSolving}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground hover:brightness-110 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                    >
                      <Play className="h-4 w-4" />
                      Start Solving
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- STAGE 2: SOLVING --- */}
            {practiceStage === 'solving' && (
              <div className="space-y-6">
                {/* Timer Banner */}
                <div className={`p-5 border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-300 ${
                  practiceTimeLeft <= 60
                    ? "bg-rose-500/10 border-rose-500/40 text-rose-500 animate-pulse"
                    : "bg-primary/5 border-primary/20 text-primary"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                      practiceTimeLeft <= 60 ? "bg-rose-500/20" : "bg-primary/10"
                    }`}>
                      <Timer className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Practice Session Timer Running</div>
                      <div className="text-2xl font-black font-mono tracking-tight">
                        {formatPracticeTime(practiceTimeLeft)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border/80 bg-card hover:bg-secondary/40 text-xs font-black uppercase tracking-widest transition-all ${
                        !isTimerRunning ? "text-amber-500 border-amber-500/20" : "text-primary"
                      }`}
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Resume
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleGoToComplete}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/10"
                    >
                      <Check className="h-4 w-4" />
                      Done Solving
                    </button>
                  </div>
                </div>

                {/* Selected Problems to practice */}
                <div className="space-y-4">
                  {practiceProblems.map((problem, index) => (
                    <div key={problem.id} className="bg-secondary/15 border border-border/60 p-5 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Problem {index + 1}</span>
                          <h3 className="text-lg font-black leading-snug flex items-center gap-2">
                            {problem.problemName}
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              problem.difficulty === "Easy"
                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                                : problem.difficulty === "Medium"
                                ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                                : "bg-rose-500/10 border border-rose-500/20 text-rose-500"
                            }`}>
                              {problem.difficulty}
                            </span>
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center self-start sm:self-auto">
                          {problem.problemUrl && (
                            <a
                              href={problem.problemUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:scale-[1.02] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Open Platform
                            </a>
                          )}
                          {problem.link && (
                            <ReferenceLinkBadge
                              url={problem.link}
                              className="px-3.5 py-2 bg-secondary/80 hover:bg-secondary text-muted-foreground border border-border/80 hover:scale-[1.02] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all h-auto leading-normal gap-1.5"
                              maxW="150px"
                            />
                          )}
                        </div>
                      </div>

                      {/* Collapsible hints: Intuition & Solution */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {/* Intuition Hints */}
                        <div className="space-y-2">
                          <button
                            onClick={() => setRevealIntuition(prev => ({ ...prev, [problem.id]: !prev[problem.id] }))}
                            className="flex items-center justify-between w-full px-4 py-3 bg-card border border-border/50 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/20 transition-all text-left"
                          >
                            <span className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              {revealIntuition[problem.id] ? "Hide Intuition Hint" : "Reveal Intuition Hint"}
                            </span>
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${revealIntuition[problem.id] ? "rotate-180" : ""}`} />
                          </button>
                          {revealIntuition[problem.id] && (
                            <div className="p-4 bg-background border border-border/40 rounded-xl animate-in fade-in duration-200">
                              <IntuitionDisplay content={problem.intuition} />
                            </div>
                          )}
                        </div>

                        {/* Code Solutions */}
                        <div className="space-y-2">
                          <button
                            onClick={() => setRevealCode(prev => ({ ...prev, [problem.id]: !prev[problem.id] }))}
                            className="flex items-center justify-between w-full px-4 py-3 bg-card border border-border/50 rounded-xl text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary hover:border-primary/20 transition-all text-left"
                          >
                            <span className="flex items-center gap-2">
                              <Code className="h-4 w-4" />
                              {revealCode[problem.id] ? "Hide Solution Code" : "Reveal Solution Code"}
                            </span>
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${revealCode[problem.id] ? "rotate-180" : ""}`} />
                          </button>
                          {revealCode[problem.id] && (
                            <div className="animate-in fade-in duration-200">
                              {problem.codeSnippet ? (
                                <CodeBlock code={problem.codeSnippet} maxHeight="200px" />
                              ) : (
                                <div className="p-4 bg-background border border-border/40 rounded-xl text-xs font-bold text-muted-foreground/60 italic">
                                  No solution snippet logged for this problem.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* --- STAGE 3: COMPLETED --- */}
            {practiceStage === 'completed' && (
              <div className="space-y-6 max-w-xl mx-auto text-center">
                <div className="space-y-2">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                    <Trophy className="h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">Practice Complete!</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Session finished! How did you do? Mark the outcomes below to update their Spaced Repetition paths.
                  </p>
                </div>

                <div className="space-y-3 pt-3">
                  {practiceProblems.map((problem) => (
                    <div key={problem.id} className="bg-secondary/15 border border-border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                      <div className="space-y-1">
                        <h4 className="font-bold text-base">{problem.problemName}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            problem.difficulty === "Easy"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : problem.difficulty === "Medium"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-rose-500/10 text-rose-500"
                          }`}>
                            {problem.difficulty}
                          </span>
                          <span className="text-[10px] font-black text-muted-foreground/50 uppercase">Current Step: D{SRS_INTERVALS[problem.reviewCount] || "Done"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPracticeResults(prev => ({ ...prev, [problem.id]: 'failed' }))}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                            practiceResults[problem.id] === 'failed'
                              ? "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20"
                              : "bg-card border-border/80 text-muted-foreground hover:bg-secondary/50"
                          }`}
                        >
                          Stuck
                        </button>
                        <button
                          onClick={() => setPracticeResults(prev => ({ ...prev, [problem.id]: 'success' }))}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                            practiceResults[problem.id] === 'success'
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                              : "bg-card border-border/80 text-muted-foreground hover:bg-secondary/50"
                          }`}
                        >
                          Got It
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setPracticeStage('solving')}
                    className="flex-1 py-3.5 border border-border hover:bg-secondary text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                  >
                    Back to Solving
                  </button>
                  <button
                    disabled={Object.values(practiceResults).some(r => r === null)}
                    onClick={handleFinishPractice}
                    className="flex-1 py-3.5 bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-50 disabled:brightness-100 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-primary/10"
                  >
                    Log Results & Finish
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    )}

    {/* LeetCode Sync Overlay */}
    {isSyncing && (
      <div className="fixed inset-0 bg-background/85 backdrop-blur-sm z-[200] flex items-center justify-center animate-in fade-in duration-300">
        <div className="bg-card border border-border/80 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 text-center max-w-sm w-full mx-4">
          <div className="p-4 bg-primary/5 rounded-full border border-primary/10 relative">
            <RefreshCw className="h-10 w-10 text-primary animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold tracking-tight">Syncing LeetCode</h3>
            <p className="text-sm text-muted-foreground transition-all duration-300 font-medium">
              {syncStatusText}
            </p>
          </div>
        </div>
      </div>
    )}

    </div>
  );
}
