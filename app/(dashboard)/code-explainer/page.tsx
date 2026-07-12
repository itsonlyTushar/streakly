"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { geminiService, ChatMessage } from "@/services/ai/gemini.service";
import { useDSAItems } from "@/hooks/use-dsa";
import { Highlight, themes } from "prism-react-renderer";
import {
  Sparkles,
  Lock,
  Key,
  ChevronRight,
  ChevronDown,
  Wand2,
  Code,
  Search,
  BookOpen,
  Zap,
  ArrowRight,
  Loader2,
  HelpCircle,
  FileText,
  Activity,
  Hash,
  CheckCircle,
  FolderOpen,
  Trophy,
  Flame,
  RotateCcw,
  ArrowUpRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/components/auth-guard";

// ─── Interfaces ──────────────────────────────────────────────────

interface ExplainerExplanation {
  line: number;
  explanation: string;
  scope?: string;
}

interface ExplainerJson {
  title: string;
  leetcodeNumber?: string;
  difficulty?: string;
  tags?: string[];
  problemUnderstanding?: string;
  approach?: string;
  code: string;
  explanations: ExplainerExplanation[];
  dryRun?: string;
  complexity?: {
    time?: string;
    timeReason?: string;
    space?: string;
    spaceReason?: string;
  };
  edgeCases?: {
    case: string;
    reason: string;
  }[];
}

// ─── System prompt for the Wizard ────────────────────────────────

const WIZARD_SYSTEM_PROMPT = `You are "Wizard", an expert coding tutor. For the given problem or code solution, generate a detailed code walkthrough in structured JSON format.

Your output MUST be a valid JSON object matching this schema:
{
  "title": "Title of the Breakdown (e.g. Word Search Line-by-Line Breakdown)",
  "leetcodeNumber": "optional LeetCode number (e.g. 79)",
  "difficulty": "Easy/Medium/Hard",
  "tags": ["e.g. Backtracking", "DFS", "Python"],
  "problemUnderstanding": "Plain, simple explanation of what the problem is asking for.",
  "approach": "Core idea/pattern being used and why it's the right tool.",
  "code": "The complete, fully working solution code with correct indentation preserved (use newline characters \\n). Do not add comments in this code block.",
  "explanations": [
    {
      "line": 1,
      "explanation": "Detailed explanation of line 1. Must use the exact pattern: 'We do this here so that we get/avoid ___.'",
      "scope": "Brief scope label (e.g., Method Signature, Setup Grid, Base Case, Recursive Step)"
    }
  ],
  "dryRun": "A markdown table showing step-by-step state changes for a small example.",
  "complexity": {
    "time": "Time complexity notation (e.g. O(N))",
    "timeReason": "One-line reason explaining the time complexity",
    "space": "Space complexity notation (e.g. O(H))",
    "spaceReason": "One-line reason explaining the space complexity"
  },
  "edgeCases": [
    {
      "case": "Edge case name",
      "reason": "Why the code handles it correctly"
    }
  ]
}

For the "explanations" array:
- Provide an explanation item for every single line of the code block.
- The "line" property is the 1-based line number in the "code" string.
- Each "explanation" MUST follow this exact sentence pattern: "We do this here so that we get/avoid ___." Don't just describe what the line does syntactically - explain WHY it exists and what would break or go wrong if it were missing.
- Link lines together:
  - FORWARD links: "we set this up now because a few steps down, we're going to need it for ___."
  - BACKWARD links: "this only works because earlier, in step ___, we already ___."
  Refer to line numbers directly.

Ensure the final output is ONLY valid JSON, enclosed in a \`\`\`json block. Do not write any explanations or text outside the JSON.`;

// ─── Inline Markdown renderer ────────────────────────────────────

function Markdown({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-[13px] leading-relaxed break-words font-v-body text-foreground">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "";
          const code = match ? match[2] : part.slice(3, -3);
          return (
            <div key={index} className="my-2 text-xs bg-secondary/50 p-3 rounded-xl font-mono border border-border/30 overflow-x-auto">
              <pre>{code.trim()}</pre>
            </div>
          );
        } else {
          const lines = part.split("\n");
          const renderedElements: React.ReactNode[] = [];
          let currentListItems: React.ReactNode[] = [];
          let listType: "ul" | "ol" | null = null;

          const flushList = (key: string) => {
            if (currentListItems.length > 0) {
              if (listType === "ul") {
                renderedElements.push(
                  <ul key={`ul-${key}`} className="list-disc pl-5 space-y-1 my-2">
                    {currentListItems}
                  </ul>
                );
              } else if (listType === "ol") {
                renderedElements.push(
                  <ol key={`ol-${key}`} className="list-decimal pl-5 space-y-1 my-2">
                    {currentListItems}
                  </ol>
                );
              }
              currentListItems = [];
              listType = null;
            }
          };

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            if (!trimmed) {
              flushList(`empty-${i}`);
              continue;
            }

            // Table detection
            if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
              flushList(`table-${i}`);
              const tableRows: string[] = [trimmed];
              while (i + 1 < lines.length && lines[i + 1].trim().startsWith("|") && lines[i + 1].trim().endsWith("|")) {
                i++;
                tableRows.push(lines[i].trim());
              }
              const headerRow = tableRows[0];
              const dataRows = tableRows.slice(2);
              const headers = headerRow.split("|").filter(Boolean).map((h) => h.trim());
              renderedElements.push(
                <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-xl border border-border/40 bg-secondary/10">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-secondary/60">
                        {headers.map((h, hi) => (
                          <th key={hi} className="px-3 py-2 text-left font-semibold text-foreground border-b border-border/40">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataRows.map((row, ri) => {
                        const cells = row.split("|").filter(Boolean).map((c) => c.trim());
                        return (
                          <tr key={ri} className="border-b border-border/20 last:border-b-0 hover:bg-secondary/30 transition-colors">
                            {cells.map((cell, ci) => (
                              <td key={ci} className="px-3 py-2 text-foreground/80 font-mono">
                                {renderInlineMarkdown(cell)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
              continue;
            }

            // Headers
            if (trimmed.startsWith("### ")) {
              flushList(`h3-${i}`);
              renderedElements.push(
                <h3 key={`h3-${i}`} className="text-xs font-bold text-foreground mt-3 mb-1">
                  {renderInlineMarkdown(trimmed.slice(4))}
                </h3>
              );
              continue;
            }
            if (trimmed.startsWith("## ")) {
              flushList(`h2-${i}`);
              renderedElements.push(
                <h2 key={`h2-${i}`} className="text-sm font-bold text-foreground mt-4 mb-1.5 border-b border-border/30 pb-0.5">
                  {renderInlineMarkdown(trimmed.slice(3))}
                </h2>
              );
              continue;
            }
            if (trimmed.startsWith("# ")) {
              flushList(`h1-${i}`);
              renderedElements.push(
                <h1 key={`h1-${i}`} className="text-base font-extrabold text-foreground mt-4 mb-2">
                  {renderInlineMarkdown(trimmed.slice(2))}
                </h1>
              );
              continue;
            }

            // Horizontal Rule
            if (trimmed === "---") {
              flushList(`hr-${i}`);
              renderedElements.push(<hr key={`hr-${i}`} className="my-3 border-border/40" />);
              continue;
            }

            // Unordered List Items
            const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)/);
            if (bulletMatch) {
              if (listType !== "ul") {
                flushList(`pre-ul-${i}`);
                listType = "ul";
              }
              currentListItems.push(
                <li key={`li-${i}`} className="text-[13px] leading-relaxed">
                  {renderInlineMarkdown(bulletMatch[2])}
                </li>
              );
              continue;
            }

            // Ordered List Items
            const numMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
            if (numMatch) {
              if (listType !== "ol") {
                flushList(`pre-ol-${i}`);
                listType = "ol";
              }
              currentListItems.push(
                <li key={`li-${i}`} className="text-[13px] leading-relaxed">
                  {renderInlineMarkdown(numMatch[2])}
                </li>
              );
              continue;
            }

            // Normal text paragraph
            flushList(`para-${i}`);
            renderedElements.push(
              <p key={`p-${i}`} className="my-0.5 text-[13px] leading-relaxed">
                {renderInlineMarkdown(line)}
              </p>
            );
          }

          flushList(`final-${index}`);
          return <div key={index} className="space-y-0.5">{renderedElements}</div>;
        }
      })}
    </div>
  );
}

function renderInlineMarkdown(text: string) {
  let tokens: (string | React.ReactNode)[] = [text];

  tokens = tokens.flatMap((token) => {
    if (typeof token !== "string") return token;
    const parts = token.split(/(`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={`code-${idx}`} className="px-1 py-0.5 rounded bg-secondary font-mono text-[11px] text-foreground/90 border border-border/30">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  });

  tokens = tokens.flatMap((token) => {
    if (typeof token !== "string") return token;
    const parts = token.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={`bold-${idx}`} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  });

  tokens = tokens.flatMap((token) => {
    if (typeof token !== "string") return token;
    const parts = token.split(/(\*.*?\*|_.*?_)/g);
    return parts.map((part, idx) => {
      if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
        return (
          <em key={`italic-${idx}`} className="italic text-foreground/80">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  });

  return tokens;
}

// ─── Helper function to parse JSON block safely ──────────────────

function parseExplainerJson(text: string): ExplainerJson | null {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.warn("Wizard JSON.parse direct attempt failed:", err);
    // Try regex matching ```json block
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (err2) {
        console.warn("Wizard JSON.parse of ```json block failed:", err2);
      }
    }
    
    // Try matching first '{' and last '}'
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (err3) {
        console.warn("Wizard JSON.parse of extracted curly braces block failed:", err3);
      }
    }
  }
  return null;
}

// ─── DSA Vault Picker (ChatGPT/Claude Style Inline Button) ────────

function VaultPicker({ onSelect }: { onSelect: (problemName: string, codeSnippet?: string | null) => void }) {
  const { data: items = [] } = useDSAItems();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item: any) =>
        item.problemName?.toLowerCase().includes(q) ||
        item.topics?.some((t: string) => t.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-border/40 hover:bg-secondary text-muted-foreground hover:text-foreground bg-card shadow-sm"
        )}
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span>Browse Vault</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-80 max-h-72 bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="p-2 border-b border-border/40">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-secondary/60 border border-border/30">
              <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search vault..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-52 scrollbar-thin">
            {filteredItems.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                No problems found
              </div>
            ) : (
              filteredItems.map((item: any) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.problemName, item.codeSnippet);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-secondary/60 transition-colors border-b border-border/10 last:border-b-0 cursor-pointer flex items-center justify-between group"
                >
                  <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">{item.problemName}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0 ml-2">
                    {item.difficulty}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Wizard Page ────────────────────────────────────────────

export default function WizardPage() {
  useAuthGuard();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: items = [], isLoading: itemsLoading } = useDSAItems();

  const [apiKey, setApiKey] = useState("");
  const [isKeyConfigured, setIsKeyConfigured] = useState(false);
  const [keyInput, setKeyInput] = useState("");

  const [inputMessage, setInputMessage] = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);

  // Active compiled explainer details
  const [walkthroughData, setWalkthroughData] = useState<ExplainerJson | null>(null);
  const [activeLineIdx, setActiveLineIdx] = useState(0);

  const codeLines = useMemo(() => {
    if (!walkthroughData || !walkthroughData.code) return [];
    return walkthroughData.code.split(/\r?\n/);
  }, [walkthroughData]);

  const explanationsMap = useMemo(() => {
    const map = new Map<number, ExplainerExplanation>();
    if (walkthroughData && walkthroughData.explanations) {
      walkthroughData.explanations.forEach((item) => {
        map.set(item.line - 1, item);
      });
    }
    return map;
  }, [walkthroughData]);

  const parsedComplexity = useMemo(() => {
    if (!walkthroughData || !walkthroughData.complexity) return null;
    const c = walkthroughData.complexity as any;
    return {
      time: c.time || c.timeComplexity || c.time_complexity || "",
      timeReason: c.timeReason || c.timeComplexityReason || c.time_reason || c.timeReasoning || "",
      space: c.space || c.spaceComplexity || c.space_complexity || "",
      spaceReason: c.spaceReason || c.spaceComplexityReason || c.space_reason || c.spaceReasoning || ""
    };
  }, [walkthroughData]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);

  // Mention State for @ or / triggers
  const [mentionState, setMentionState] = useState<{
    isOpen: boolean;
    searchQuery: string;
    trigger: "@" | "/";
    startIdx: number;
    selectIndex: number;
  }>({
    isOpen: false,
    searchQuery: "",
    trigger: "@",
    startIdx: -1,
    selectIndex: 0,
  });

  // Check for saved API key and load persisted walkthrough data
  useEffect(() => {
    const savedKey = localStorage.getItem("streakly:dsa:gemini_api_key") || "";
    if (savedKey.trim()) {
      setApiKey(savedKey.trim());
      setIsKeyConfigured(true);
    }

    try {
      const savedData = localStorage.getItem("streakly:wizard:walkthrough_data");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed && parsed.code && parsed.explanations) {
          setWalkthroughData(parsed);
          
          const savedLine = localStorage.getItem("streakly:wizard:active_line_idx");
          if (savedLine) {
            setActiveLineIdx(parseInt(savedLine, 10) || 0);
          }
        }
      }
    } catch (e) {
      console.warn("Failed to load persisted Wizard walkthrough:", e);
    }
  }, []);

  // Save walkthrough whenever it changes
  useEffect(() => {
    try {
      if (walkthroughData) {
        localStorage.setItem("streakly:wizard:walkthrough_data", JSON.stringify(walkthroughData));
      } else {
        localStorage.removeItem("streakly:wizard:walkthrough_data");
        localStorage.removeItem("streakly:wizard:active_line_idx");
      }
    } catch (e) {
      console.warn("Failed to persist Wizard walkthrough:", e);
    }
  }, [walkthroughData]);

  // Save active line index whenever it changes
  useEffect(() => {
    try {
      if (walkthroughData) {
        localStorage.setItem("streakly:wizard:active_line_idx", activeLineIdx.toString());
      }
    } catch (e) {
      console.warn("Failed to persist active line index:", e);
    }
  }, [activeLineIdx, walkthroughData]);

  // Keyboard navigation for active line explanation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!walkthroughData || codeLines.length === 0) return;
      
      // Don't intercept if user is typing in inputs or textareas
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      if (e.key === "ArrowDown" || e.key === "Down") {
        e.preventDefault();
        setActiveLineIdx((prev) => Math.min(prev + 1, codeLines.length - 1));
      } else if (e.key === "ArrowUp" || e.key === "Up") {
        e.preventDefault();
        setActiveLineIdx((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [walkthroughData, codeLines]);

  // Center active line in view
  useEffect(() => {
    if (!walkthroughData || codeLines.length === 0) return;
    const activeEl = codeContainerRef.current?.querySelector(`[data-line-idx="${activeLineIdx}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeLineIdx, walkthroughData, codeLines]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 260) + "px";
    }
  }, [inputMessage]);

  // Filter vault items for mention list
  const filteredItems = useMemo(() => {
    if (!mentionState.isOpen) return [];
    const q = mentionState.searchQuery.toLowerCase();
    return items.filter(
      (item: any) =>
        item.problemName?.toLowerCase().includes(q) ||
        item.topics?.some((t: string) => t.toLowerCase().includes(q))
    );
  }, [items, mentionState.isOpen, mentionState.searchQuery]);

  // Input changes handler
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputMessage(text);

    const cursor = e.target.selectionStart;
    const textUpToCursor = text.slice(0, cursor);

    // Look for "@" or "/" followed by word characters up to the cursor
    const match = textUpToCursor.match(/(?:^|\s|[\n])([@/])([a-zA-Z0-9_\-\s]*)$/);

    if (match) {
      const trigger = match[1] as "@" | "/";
      const query = match[2];
      
      if (query.includes("\n")) {
        setMentionState((prev) => ({ ...prev, isOpen: false }));
        return;
      }

      setMentionState({
        isOpen: true,
        searchQuery: query,
        trigger,
        startIdx: cursor - match[2].length - 1,
        selectIndex: 0,
      });
    } else {
      setMentionState((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // Insert selected mention into textarea
  const insertMention = (item: any) => {
    const text = inputMessage;
    const before = text.slice(0, mentionState.startIdx);
    const cursor = textareaRef.current?.selectionStart || text.length;
    const after = text.slice(cursor);
    
    let insertText = "";
    if (item.codeSnippet) {
      insertText = `${item.problemName}\n\n\`\`\`python\n${item.codeSnippet.trim()}\n\`\`\`\n`;
    } else {
      insertText = `${item.problemName}\n`;
    }

    const newText = before + insertText + after;
    setInputMessage(newText);
    setMentionState((prev) => ({ ...prev, isOpen: false }));

    setTimeout(() => {
      const ta = textareaRef.current;
      if (ta) {
        ta.focus();
        const newCursorPos = mentionState.startIdx + insertText.length;
        ta.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 50);
  };

  // Intercept KeyDown events in input field
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionState.isOpen && filteredItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionState((prev) => ({
          ...prev,
          selectIndex: (prev.selectIndex + 1) % filteredItems.length,
        }));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionState((prev) => ({
          ...prev,
          selectIndex: (prev.selectIndex - 1 + filteredItems.length) % filteredItems.length,
        }));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredItems[mentionState.selectIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionState((prev) => ({ ...prev, isOpen: false }));
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputMessage);
    }
  };

  // Pick from DSA Vault utility handler
  const handleVaultSelect = (problemName: string, codeSnippet?: string | null) => {
    let text = problemName;
    if (codeSnippet?.trim()) {
      text += "\n\n" + codeSnippet.trim();
    }
    setInputMessage(text);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  // Save API Key
  const handleSaveApiKey = () => {
    if (!keyInput.trim()) {
      toast({ title: "Please enter a generated key", variant: "error" });
      return;
    }
    localStorage.setItem("streakly:dsa:gemini_api_key", keyInput.trim());
    setApiKey(keyInput.trim());
    setIsKeyConfigured(true);
    toast({ title: "Gemini API key configured!", variant: "success" });
  };

  // Trigger Gemini explaining API
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loadingResponse || !user) return;

    setLoadingResponse(true);
    setWalkthroughData(null);

    const apiPayload: ChatMessage[] = [
      {
        role: "user",
        parts: [{ text: textToSend }],
      },
    ];

    console.log("Wizard: Sending request to Gemini with payload:", apiPayload);

    try {
      const result = await geminiService.explainerCompletion(
        apiKey,
        apiPayload,
        WIZARD_SYSTEM_PROMPT
      );

      console.log("Wizard: Received raw result from Gemini:", result);

      const parsed = parseExplainerJson(result);
      if (parsed) {
        console.log("Wizard: Successfully parsed structured JSON walkthrough:", parsed);
        setWalkthroughData(parsed);
        setActiveLineIdx(0);
      } else {
        console.error("Wizard: Parser failed to resolve the JSON response. Raw result was:", result);
        toast({
          title: "Format Error",
          description: "Wizard failed to compile a structured interactive representation. See console for details.",
          variant: "error",
        });
      }
    } catch (err: any) {
      console.error("Wizard: Gemini API completion threw an error:", err);
      toast({
        title: "API Error",
        description: err?.message || "Failed to get response from Gemini API.",
        variant: "error",
      });
    } finally {
      setLoadingResponse(false);
    }
  };


  // Reset walkthrough
  const handleReset = () => {
    setWalkthroughData(null);
    setInputMessage("");
    setMentionState((prev) => ({ ...prev, isOpen: false }));
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  // DSA Vault Metrics
  const metrics = useMemo(() => {
    const total = items.length;
    const easy = items.filter((i) => i.difficulty === "Easy").length;
    const medium = items.filter((i) => i.difficulty === "Medium").length;
    const hard = items.filter((i) => i.difficulty === "Hard").length;
    const topics = new Set(items.flatMap((i) => i.topics || [])).size;
    return { total, easy, medium, hard, topics };
  }, [items]);

  // Auth check
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="p-4 rounded-3xl bg-secondary/50 border border-border/40 mb-5 animate-pulse">
          <Wand2 className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h2 className="font-bold text-xl mb-2">Sign In Required</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Please sign in to your Streakly account to use the Wizard.
        </p>
      </div>
    );
  }

  // Key config check
  if (!isKeyConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 shadow-inner">
              <Wand2 className="h-8 w-8 animate-pulse" />
            </div>
            <h2 className="font-bold text-2xl tracking-tight">Activate the Wizard</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Wizard leverages your Gemini API key to deliver heavily detailed production walkthroughs locally.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-card/60 border border-border/40 shadow-2xl backdrop-blur-md space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Gemini API Key
              </label>
              <input
                type="password"
                placeholder="Paste your AIzaSy... API Key"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveApiKey()}
                className="w-full text-sm p-3 rounded-xl bg-secondary/60 border border-border/60 focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground/40 font-mono"
              />
            </div>

            <button
              onClick={handleSaveApiKey}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-transform active:scale-[0.98] cursor-pointer hover:opacity-90 shadow-md"
            >
              Activate Wizard <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="text-center">
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
            >
              Get a free API Key from Google AI Studio &rarr;
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Set selected lines helper variables
  const activeLine = explanationsMap.get(activeLineIdx);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)] max-w-7xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between py-4 border-b border-border/20 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 shadow-md">
            <Wand2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl leading-none tracking-tight">
                Wizard
              </h1>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-500 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/10 flex items-center gap-1">
                Interactive Breakdown
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Select code lines to reveal educational explanations and logical links.
            </p>
          </div>
        </div>

        {walkthroughData && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/40 text-xs font-semibold text-foreground/80 hover:text-foreground transition-all cursor-pointer shadow-sm active:scale-95 animate-in fade-in zoom-in-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Walkthrough</span>
          </button>
        )}
      </div>

      {/* Workspace Area */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {!walkthroughData && !loadingResponse ? (
          /* ========================================================
             1. EMPTY STATE - Minimal Conversational Center
             ======================================================== */
          <div className="max-w-2xl mx-auto w-full flex flex-col justify-center items-center h-full py-12 px-4 space-y-6 animate-in fade-in duration-300">
            {/* Hero Header */}
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Explain code with Wizard
              </h2>
            </div>

            {/* Input card */}
            <div className="w-full relative">
              {/* Mention List Dropdown */}
              {mentionState.isOpen && filteredItems.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-full max-h-64 bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="bg-secondary/40 px-3 py-1.5 border-b border-border/30 text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Search className="h-3 w-3" />
                    <span>DSA Vault Lookup ({mentionState.searchQuery || "@"})</span>
                  </div>
                  
                  <div className="overflow-y-auto max-h-48 scrollbar-thin">
                    {filteredItems.map((item: any, idx: number) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => insertMention(item)}
                        className={cn(
                          "w-full text-left px-3.5 py-2.5 transition-colors border-b border-border/10 last:border-b-0 cursor-pointer flex items-center justify-between",
                          idx === mentionState.selectIndex ? "bg-primary/5 text-foreground font-semibold" : "hover:bg-secondary/50 text-foreground/80"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Code className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs truncate">{item.problemName}</span>
                        </div>
                        <span
                          className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-2",
                            item.difficulty === "Easy" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                            item.difficulty === "Medium" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                            item.difficulty === "Hard" && "bg-red-500/10 text-red-600 dark:text-red-400"
                          )}
                        >
                          {item.difficulty}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border border-border/40 rounded-3xl overflow-hidden focus-within:border-indigo-500/30 bg-card shadow-lg transition-all focus-within:ring-2 focus-within:ring-indigo-500/5">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={handleTextareaChange}
                  onKeyDown={handleTextareaKeyDown}
                  placeholder="Paste details here or type @ to pull a DSA problem..."
                  className="w-full resize-none bg-transparent text-sm p-4 outline-none placeholder:text-muted-foreground/30 min-h-[140px] font-mono scrollbar-thin"
                />

                <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/20 border-t border-border/10">
                  <div className="flex items-center gap-2">
                    <VaultPicker onSelect={handleVaultSelect} />
                  </div>

                  <button
                    onClick={() => handleSendMessage(inputMessage)}
                    disabled={!inputMessage.trim()}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all bg-primary text-primary-foreground hover:opacity-95 active:scale-95 disabled:opacity-30 disabled:scale-100 cursor-pointer shadow-sm"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    <span>Explain</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Suggestions Horizontal Row */}
            <div className="flex flex-wrap gap-2 justify-center w-full max-w-lg mx-auto">
              {[
                { label: "Word Search DFS", snippet: "class Solution:\n    def exist(self, board, word):\n        pass" },
                { label: "Valid Parentheses", snippet: "def isValid(s):\n    pass" },
                { label: "Sliding Window Anagrams", snippet: "def findAnagrams(s, p):\n    pass" },
                { label: "Cycle Detection", snippet: "def hasCycle(head):\n    pass" }
              ].map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => handleVaultSelect(suggestion.label, suggestion.snippet)}
                  className="px-3 py-1.5 rounded-full border border-border/40 hover:border-indigo-500/30 hover:bg-secondary/40 text-xs text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        ) : loadingResponse ? (
          /* ========================================================
             2. LOADING STATE
             ======================================================== */
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-foreground">Wizard is compiling walkthrough</h3>
              <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                Analyzing code, establishing line links, running dry run, and preparing interactive layout...
              </p>
            </div>
          </div>
        ) : (
          /* ========================================================
             3. RESULTS STATE - High-end Interactive Walkthrough
             ======================================================== */
          <div className="flex-1 overflow-y-auto space-y-6 pr-1 scrollbar-thin animate-in fade-in duration-300">
            
            {/* Header info / badges */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {walkthroughData?.leetcodeNumber && (
                  <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                    LeetCode {walkthroughData.leetcodeNumber}
                  </span>
                )}
                {walkthroughData?.difficulty && (
                  <span className={cn(
                    "border px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                    walkthroughData.difficulty === "Easy" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                    walkthroughData.difficulty === "Medium" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                    walkthroughData.difficulty === "Hard" && "bg-red-500/10 text-red-500 border-red-500/20"
                  )}>
                    {walkthroughData.difficulty}
                  </span>
                )}
                {walkthroughData?.tags?.map((tag) => (
                  <span key={tag} className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="text-[11px] text-muted-foreground italic">
                Tip: Press <kbd className="px-1 py-0.5 rounded bg-secondary font-mono border border-border/30">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-secondary font-mono border border-border/30">↓</kbd> on your keyboard to navigate lines.
              </div>
            </div>

            {/* Main Interactive Grid (Split visual) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[500px] items-stretch">
              
              {/* Left Column: Solution Code view */}
              <div className="lg:col-span-7 flex flex-col min-h-0 border border-border/40 rounded-3xl bg-[#0b0f19]/70 backdrop-blur-md shadow-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/20 bg-secondary/15 flex items-center justify-between shrink-0">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    {walkthroughData?.tags?.includes("Python") ? "Python Solution" : "Solution Code"}
                  </span>
                </div>

                <div 
                  ref={codeContainerRef}
                  className="flex-1 overflow-y-auto font-mono text-[13px] leading-relaxed p-4 select-text scrollbar-thin bg-[#050810]/60 text-slate-100"
                >
                  <Highlight
                    theme={themes.nightOwl}
                    code={walkthroughData?.code || ""}
                    language={walkthroughData?.tags?.some(t => t.toLowerCase().includes("python")) ? "python" : "javascript"}
                  >
                    {({ tokens, getLineProps, getTokenProps }) => (
                      <table className="w-full border-collapse">
                        <tbody>
                          {tokens.map((line, idx) => {
                            const isActive = idx === activeLineIdx;
                            const lineProps = getLineProps({ line });
                            return (
                              <tr
                                key={idx}
                                {...lineProps}
                                data-line-idx={idx}
                                onClick={() => setActiveLineIdx(idx)}
                                className={cn(
                                  "group cursor-pointer border-l-4 border-transparent transition-all hover:bg-white/5",
                                  isActive && "bg-indigo-500/10 border-indigo-505 border-indigo-500 font-medium"
                                )}
                                style={{}}
                              >
                                {/* Line Number */}
                                <td className={cn(
                                  "w-12 text-right pr-4 select-none border-r border-border/10 text-slate-500 font-medium text-[11px]",
                                  isActive && "text-indigo-400 font-bold border-indigo-500/20"
                                )}>
                                  {idx + 1}
                                </td>
                                {/* Code Snippet */}
                                <td className="pl-4 pr-2 whitespace-pre py-0.5 text-left font-mono text-slate-200">
                                  {line.map((token, key) => (
                                    <span key={key} {...getTokenProps({ token })} />
                                  ))}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </Highlight>
                </div>
              </div>

              {/* Right Column: Line Explanation */}
              <div className="lg:col-span-5 flex flex-col min-h-0 border border-border/40 rounded-3xl bg-card/30 backdrop-blur-md shadow-2xl overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/20 bg-secondary/15 flex items-center shrink-0">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Line Explanation
                  </span>
                </div>

                {/* Explanation Card */}
                <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-between scrollbar-thin">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border/10 pb-2">
                      <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Line {activeLineIdx + 1}
                      </span>
                      {activeLine?.scope && (
                        <span className="text-xs font-medium text-muted-foreground font-mono">
                          {activeLine.scope}
                        </span>
                      )}
                    </div>

                    <div className="text-[13px] leading-relaxed text-foreground/95 select-text font-v-body py-2">
                      {activeLine?.explanation || "No specific walkthrough explanation generated for this line."}
                    </div>
                  </div>

                  {/* Navigation controls */}
                  <div className="border-t border-border/20 pt-4 mt-6 flex items-center justify-between shrink-0">
                    <button
                      disabled={activeLineIdx === 0}
                      onClick={() => setActiveLineIdx((prev) => Math.max(prev - 1, 0))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border/40 hover:bg-secondary text-xs font-semibold disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Prev</span>
                    </button>

                    <div className="text-xs font-mono text-muted-foreground">
                      <span className="font-bold text-foreground">{activeLineIdx + 1}</span> / {codeLines.length}
                    </div>

                    <button
                      disabled={codeLines.length === 0 || activeLineIdx === codeLines.length - 1}
                      onClick={() => setActiveLineIdx((prev) => Math.min(prev + 1, codeLines.length - 1))}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border/40 hover:bg-secondary text-xs font-semibold disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Other details in secondary card tabs */}
            <div className="border border-border/40 rounded-3xl bg-card/20 p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Problem Understanding & Approach */}
                <div className="space-y-3">
                  {walkthroughData?.problemUnderstanding && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <HelpCircle className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Problem Understanding</span>
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {walkthroughData.problemUnderstanding}
                      </p>
                    </div>
                  )}

                  {walkthroughData?.approach && (
                    <div className="space-y-1 pt-2 border-t border-border/10">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Approach & Pattern</span>
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {walkthroughData.approach}
                      </p>
                    </div>
                  )}
                </div>

                {/* Dry Run, Complexity & Edge Cases */}
                <div className="space-y-3">
                  {parsedComplexity && (
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Complexity Analysis</span>
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                        <div className="p-2 rounded-xl bg-secondary/30">
                          <span className="font-bold text-foreground">Time: </span>
                          <span className="font-mono text-indigo-400">{parsedComplexity.time}</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{parsedComplexity.timeReason}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-secondary/30">
                          <span className="font-bold text-foreground">Space: </span>
                          <span className="font-mono text-indigo-400">{parsedComplexity.space}</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{parsedComplexity.spaceReason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {walkthroughData?.edgeCases && walkthroughData.edgeCases.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-border/10">
                      <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Key Edge Cases</span>
                      </h4>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {walkthroughData.edgeCases.map((ec, idx) => (
                          <li key={idx} className="text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground">{ec.case}</span>: {ec.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>


              {/* Dry Run Full width representation */}
              {walkthroughData?.dryRun && (
                <div className="pt-3 border-t border-border/10 space-y-1.5">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Dry Run Walkthrough</span>
                  </h4>
                  <div className="overflow-x-auto">
                    <Markdown text={walkthroughData.dryRun} />
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
