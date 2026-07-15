import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { geminiService, ChatMessage } from "@/services/ai/gemini.service";
import { ragService, UserProgressContext } from "@/services/ai/rag.service";
import {
  extractActions,
  parseActionDate,
  normalizeDifficulty,
  normalizeTaskPriority,
  actionAreaLabel,
  CoachAction,
} from "@/services/ai/actions";
import { useAddDSAItem } from "@/hooks/use-dsa";
import { useAddSRSItem } from "@/hooks/use-srs";
import { useAddTask } from "@/hooks/use-tasks";
import { format } from "date-fns";
import { ContextStatus } from "./context-status";
import { Suggestions } from "./suggestions";
import { CodeBlock } from "@/components/ui/code-block";
import {
  Send,
  Sparkles,
  RefreshCw,
  Key,
  Trash2,
  Lock,
  ChevronRight,
  Bot,
  User as UserIcon,
} from "lucide-react";

// Inline markdown renderer helper
function Markdown({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed break-words font-v-body text-foreground">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "";
          const code = match ? match[2] : part.slice(3, -3);
          return (
            <div key={index} className="my-2.5 shadow-sm rounded-xl overflow-hidden border border-border/40 text-left">
              <CodeBlock code={code.trim()} language={lang || undefined} maxHeight="300px" />
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
                  <ul key={`ul-${key}`} className="list-disc pl-5 space-y-1 my-1.5">
                    {currentListItems}
                  </ul>
                );
              } else if (listType === "ol") {
                renderedElements.push(
                  <ol key={`ol-${key}`} className="list-decimal pl-5 space-y-1 my-1.5">
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

            // Headers
            if (trimmed.startsWith("### ")) {
              flushList(`h3-${i}`);
              renderedElements.push(
                <h3 key={`h3-${i}`} className="text-[13px] font-bold text-foreground mt-3 mb-1">
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
              renderedElements.push(<hr key={`hr-${i}`} className="my-2.5 border-border/40" />);
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

  // 1. Process Code snippets: `code`
  tokens = tokens.flatMap((token) => {
    if (typeof token !== "string") return token;
    const parts = token.split(/(`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={`code-${idx}`} className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-foreground/90 border border-border/20">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  });

  // 2. Process Bold text: **bold**
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

  // 3. Process Italic text: *italic* or _italic_
  tokens = tokens.flatMap((token) => {
    if (typeof token !== "string") return token;
    const parts = token.split(/(\*.*?\*|__.*?__|_.*?_)/g);
    return parts.map((part, idx) => {
      if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
        const content = part.startsWith("__") || part.startsWith("**") ? part.slice(2, -2) : part.slice(1, -1);
        return (
          <em key={`italic-${idx}`} className="italic text-foreground/80">
            {content}
          </em>
        );
      }
      return part;
    });
  });

  return tokens;
}

// ----------------------------------------------------------------------
// Main ChatWindow Component
// ----------------------------------------------------------------------

export function ChatWindow() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [apiKey, setApiKey] = useState("");
  const [isKeyConfigured, setIsKeyConfigured] = useState(false);
  const [keyInput, setKeyInput] = useState("");

  const [context, setContext] = useState<UserProgressContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Workspace mutation hooks — let the coach add items on request.
  const addDSA = useAddDSAItem();
  const addSRS = useAddSRSItem();
  const addTask = useAddTask();

  // Execute a single parsed action through the real workspace hooks.
  const runAction = async (
    action: CoachAction
  ): Promise<{ ok: boolean; label: string; area: string }> => {
    const area = actionAreaLabel(action.type);
    try {
      if (action.type === "add_dsa") {
        await addDSA.mutateAsync({
          problemName: action.problemName,
          difficulty: normalizeDifficulty(action.difficulty),
          topics: action.topics ?? [],
          intuition: action.intuition ?? null,
          timeComplexity: action.timeComplexity ?? null,
          spaceComplexity: action.spaceComplexity ?? null,
          problemUrl: action.problemUrl ?? null,
          nextReviewDate: parseActionDate(action.nextReviewDate),
        });
        return { ok: true, label: action.problemName, area };
      }
      if (action.type === "add_srs") {
        await addSRS.mutateAsync({
          topic: action.topic,
          details: action.details ?? "",
          nextReviewDate: parseActionDate(action.nextReviewDate),
        });
        return { ok: true, label: action.topic, area };
      }
      // add_task
      await addTask.mutateAsync({
        title: action.title,
        dueDate: parseActionDate(action.dueDate),
        priority: normalizeTaskPriority(action.priority),
        description: action.description ?? null,
        subtasks: action.subtasks ?? [],
      });
      return { ok: true, label: action.title, area };
    } catch {
      const label =
        action.type === "add_dsa"
          ? action.problemName
          : action.type === "add_srs"
            ? action.topic
            : action.title;
      return { ok: false, label, area };
    }
  };

  // 1. Initial configuration check
  useEffect(() => {
    const savedKey = localStorage.getItem("streakly:dsa:gemini_api_key") || "";
    if (savedKey.trim()) {
      setApiKey(savedKey.trim());
      setIsKeyConfigured(true);
    }
  }, []);

  // 2. Fetch User Context for RAG once key is loaded and user is authenticated
  const loadUserContext = async () => {
    if (!user) return;
    setContextLoading(true);
    try {
      const data = await ragService.getUserContext(user.uid);
      setContext(data);
    } catch (err) {
      console.error(err);
    } finally {
      setContextLoading(false);
    }
  };

  useEffect(() => {
    if (isKeyConfigured && user) {
      loadUserContext();

      // Load conversation history from localStorage if it exists
      const savedHistory = localStorage.getItem(`streakly:ai_assistant:history:${user.uid}`);
      if (savedHistory) {
        try {
          setMessages(JSON.parse(savedHistory));
        } catch (_) {
          setMessages([]);
        }
      }
    }
  }, [isKeyConfigured, user]);

  // 3. Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingResponse]);

  // 4. Save API Key local method
  const handleSaveApiKey = () => {
    if (!keyInput.trim()) {
      toast({ title: "Please enter a valid key", variant: "error" });
      return;
    }
    localStorage.setItem("streakly:dsa:gemini_api_key", keyInput.trim());
    setApiKey(keyInput.trim());
    setIsKeyConfigured(true);
    toast({ title: "Gemini API key configured successfully!", variant: "success" });
  };

  // 5. Reset API Key
  const handleResetApiKey = () => {
    if (window.confirm("Are you sure you want to clear your Gemini API Key? This will disable the AI Coach.")) {
      localStorage.removeItem("streakly:dsa:gemini_api_key");
      setApiKey("");
      setKeyInput("");
      setIsKeyConfigured(false);
      setMessages([]);
      setContext(null);
      toast({ title: "Gemini API Key removed.", variant: "warning" });
    }
  };

  // 6. Clear chat history
  const handleClearHistory = () => {
    if (!user) return;
    setMessages([]);
    localStorage.removeItem(`streakly:ai_assistant:history:${user.uid}`);
    toast({ title: "Chat history cleared", variant: "success" });
  };

  // 7. Send user prompt
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loadingResponse || !user) return;

    const userMessage: ChatMessage = {
      role: "user",
      parts: [{ text: textToSend }],
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage("");
    setLoadingResponse(true);

    try {
      // Setup system instructions based on fresh local RAG data
      // (Optional: reload context to make it fully real-time)
      const freshContext = context || await ragService.getUserContext(user.uid);
      if (!context) setContext(freshContext);

      const contextString = ragService.buildContextString(freshContext);
      const today = format(new Date(), "yyyy-MM-dd");
      const systemInstruction = ragService.getSystemInstruction(contextString, today);

      // Invoke Gemini API Client
      const result = await geminiService.chatCompletion(
        apiKey,
        newMessages,
        systemInstruction
      );

      // Pull out any workspace actions the coach wants to perform,
      // execute them, and append a confirmation summary to the reply.
      const { text: cleanedText, actions } = extractActions(result);
      let finalText = cleanedText;

      if (actions.length > 0) {
        const results = [];
        for (const action of actions) {
          results.push(await runAction(action));
        }
        const summary = results
          .map((r) =>
            r.ok
              ? `- ✅ Added **${r.label}** to ${r.area}`
              : `- ⚠️ Couldn't add **${r.label}** to ${r.area}`
          )
          .join("\n");
        finalText = [cleanedText, summary].filter(Boolean).join("\n\n");
        // Refresh RAG context so the coach "sees" the new items.
        loadUserContext();
      }

      const modelMessage: ChatMessage = {
        role: "model",
        parts: [{ text: finalText || "Done!" }],
      };

      const updatedHistory = [...newMessages, modelMessage];
      setMessages(updatedHistory);
      // Persist locally
      localStorage.setItem(
        `streakly:ai_assistant:history:${user.uid}`,
        JSON.stringify(updatedHistory)
      );
    } catch (err: any) {
      toast({
        title: "API Error",
        description: err?.message || "Failed to get response from Gemini API.",
        variant: "error",
      });
    } finally {
      setLoadingResponse(false);
    }
  };

  // Check user registration
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-80">
        <Bot className="h-12 w-12 text-muted-foreground/60 mb-4 animate-bounce" />
        <h3 className="font-bold text-lg mb-2">Sign In Required</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Please sign in to your Streakly account to enable the personalized AI Coach.
        </p>
      </div>
    );
  }

  // Check key configuration
  if (!isKeyConfigured) {
    return (
      <div className="flex flex-col justify-center p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Key className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-base">Gemini API Configuration</h3>
            <p className="text-xs text-muted-foreground">Personalized AI Coach</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Streakly uses your own Gemini API key to run a zero-cost local AI assistant. Your keys and workspace data are stored locally in your browser.
        </p>

        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" /> Gemini API Key
            </label>
            <input
              type="password"
              placeholder="Paste your AIzaSy... API Key"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl bg-secondary border border-border/60 focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <button
            onClick={handleSaveApiKey}
            className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs transition-transform active:scale-[0.98] cursor-pointer hover:opacity-90"
          >
            Activate AI Coach <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="pt-2 border-t border-border/40">
          <a
            href="https://aistudio.google.com/"
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            Get a free API Key from Google AI Studio &rarr;
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card font-v-body">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40 bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex flex-col gap-1">
          <h3 className="font-bold text-sm flex items-center gap-1.5 leading-none">
            <Bot className="h-4 w-4 text-primary animate-pulse" />
            <span>Streakly AI Coach</span>
          </h3>
          <ContextStatus context={context} loading={contextLoading} />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={loadUserContext}
            disabled={contextLoading}
            title="Sync latest workspace data"
            className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${contextLoading ? "animate-spin" : ""}`} />
          </button>
          {messages.length > 0 && (
            <button
              onClick={handleClearHistory}
              title="Clear chat history"
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-secondary rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={handleResetApiKey}
            title="Configure API key"
            className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-lg transition-colors cursor-pointer"
          >
            <Key className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-background/50">
        {messages.length === 0 ? (
          <div className="space-y-4 py-4">
            <div className="flex gap-2.5 items-start max-w-[85%]">
              <div className="h-7 w-7 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-none bg-card border border-border/40 shadow-sm text-xs leading-relaxed text-foreground">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  Welcome to Streakly AI Coach! <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                </p>
                I am connected to your active goals, study notes, DSA problems, and machine coding tasks. Ask me about your studies, request a weekly schedule, or have me <strong>add</strong> things for you — e.g. &ldquo;add Two Sum to my DSA arena&rdquo;, &ldquo;add Sliding Window to SRS&rdquo;, or &ldquo;add a task to revise graphs due tomorrow&rdquo;.
              </div>
            </div>

            <div className="pt-2">
              <Suggestions onSelect={(prompt) => handleSendMessage(prompt)} />
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === "user";
            const textContent = msg.parts?.[0]?.text || "";
            return (
              <div
                key={index}
                className={`flex gap-2.5 items-start max-w-[85%] ${
                  isUser ? "ml-auto flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 border ${
                    isUser
                      ? "bg-secondary border-border/60 text-foreground"
                      : "bg-primary border-primary text-primary-foreground"
                  }`}
                >
                  {isUser ? <UserIcon className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                <div
                  className={`p-3.5 rounded-2xl shadow-sm text-xs overflow-hidden ${
                    isUser
                      ? "rounded-tr-none bg-secondary/80 text-foreground border border-border/40"
                      : "rounded-tl-none bg-card text-foreground border border-border/40"
                  }`}
                >
                  <Markdown text={textContent} />
                </div>
              </div>
            );
          })
        )}

        {/* Loading reply state */}
        {loadingResponse && (
          <div className="flex gap-2.5 items-start max-w-[85%] animate-pulse">
            <div className="h-7 w-7 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-none bg-card border border-border/40 shadow-sm flex items-center gap-2">
              <span className="flex h-1.5 w-1.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
              </span>
              <span className="text-[11px] text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputMessage);
        }}
        className="p-3 border-t border-border/40 bg-card flex gap-2 items-center"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          disabled={loadingResponse}
          placeholder="Ask AI Coach (e.g. review my notes)..."
          className="flex-1 text-xs p-2.5 rounded-xl bg-secondary border border-border/60 focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || loadingResponse}
          className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.96] transition-all disabled:opacity-40 disabled:scale-100 cursor-pointer"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
