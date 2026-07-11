"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Play,
  Trash2,
  ArrowLeft,
  Terminal,
  Loader2,
  RotateCcw,
  Timer,
  Pause,
  Bot,
  Send,
  Sparkles,
  HelpCircle,
  Code2,
  FileText,
  AlertCircle,
  LogOut,
  Award,
} from "lucide-react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
import { keymap } from "@codemirror/view";
import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";
import { useAuth } from "@/components/auth-provider";
import { geminiService, ChatMessage } from "@/services/ai/gemini.service";
import { InterviewSetup } from "@/components/interview/interview-setup";
import { ScorecardModal } from "@/components/interview/scorecard-modal";

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
const PYODIDE_SCRIPT = `${PYODIDE_CDN}pyodide.js`;

/* ──────────────────────────────────────────────────────────
   Night Owl CodeMirror Theme (reused for visual consistency)
   ────────────────────────────────────────────────────────── */
const nightOwlTheme = createTheme({
  theme: "dark",
  settings: {
    background: "#011627",
    foreground: "#d6deeb",
    caret: "#80a4c2",
    selection: "#1d3b53",
    selectionMatch: "#1d3b5380",
    lineHighlight: "#01162720",
    gutterBackground: "#011627",
    gutterForeground: "rgba(255,255,255,0.15)",
    gutterBorder: "transparent",
    gutterActiveForeground: "rgba(255,255,255,0.5)",
  },
  styles: [
    { tag: t.comment, color: "#637777", fontStyle: "italic" },
    { tag: t.string, color: "#ecc48d" },
    { tag: t.regexp, color: "#5ca7e4" },
    { tag: t.number, color: "#f78c6c" },
    { tag: t.bool, color: "#ff5874" },
    { tag: [t.keyword, t.operator], color: "#c792ea" },
    { tag: [t.definitionKeyword, t.modifier], color: "#c792ea" },
    { tag: [t.function(t.variableName), t.function(t.definition(t.variableName))], color: "#82aaff" },
    { tag: [t.className, t.definition(t.typeName)], color: "#ffcb8b" },
    { tag: t.variableName, color: "#d6deeb" },
    { tag: [t.propertyName, t.definition(t.propertyName)], color: "#7fdbca" },
    { tag: t.punctuation, color: "#7fdbca" },
    { tag: t.bracket, color: "#d6deeb" },
    { tag: t.tagName, color: "#caece6" },
    { tag: t.attributeName, color: "#addb67" },
    { tag: t.self, color: "#7fdbca", fontStyle: "italic" },
    { tag: t.null, color: "#ff5874" },
    { tag: [t.controlKeyword], color: "#c792ea" },
    { tag: t.special(t.string), color: "#addb67" },
  ],
});

const QUICK_HELPERS = [
  { label: "💡 Request Hint", text: "I'm a bit stuck here. Could you give me a subtle hint on where to look or how to optimize?" },
  { label: "🚀 Pitch Approach", text: "Here is my high-level approach for this solution: " },
  { label: "⏱️ Check Complexity", text: "Let's analyze the time and space complexity of my proposed algorithm." },
  { label: "💻 Ask to Code", text: "I think I have the design clear now. I will start writing the solution in the editor." },
];

export default function MockInterviewPage() {
  const { user } = useAuth();

  // 1. Core State Machine: 'setup' | 'active' | 'evaluating'
  const [status, setStatus] = useState<"setup" | "active" | "evaluating">("setup");
  const [apiKey, setApiKey] = useState("");
  const [interviewType, setInterviewType] = useState<"dsa-python" | "dsa-js" | "system-design">("dsa-python");
  const [problemTitle, setProblemTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [interviewerStyle, setInterviewerStyle] = useState<"friendly" | "standard" | "demanding">("standard");

  // 2. Chat / Interviewer State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState("");
  const [showScorecard, setShowScorecard] = useState(false);

  // 3. IDE / Code Runner State
  const [code, setCode] = useState("");
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPyodideLoading, setIsPyodideLoading] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [stdinInputs, setStdinInputs] = useState("");
  const [showStdin, setShowStdin] = useState(false);
  const [evalStep, setEvalStep] = useState(0);

  // Trigger simulated diagnostics tick when evaluating
  useEffect(() => {
    if (status === "evaluating") {
      setEvalStep(0);
      const t1 = setTimeout(() => setEvalStep(1), 1000);
      const t2 = setTimeout(() => setEvalStep(2), 2200);
      const t3 = setTimeout(() => setEvalStep(3), 3600);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [status]);

  // 4. Timer / Stopwatch State
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchIntervalRef = useRef<any>(null);

  const pyodideRef = useRef<any>(null);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  /* ── Stopwatch Tick Effect ──────────────────────────── */
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    }
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isStopwatchRunning]);

  /* ── Auto-scroll Chat & Terminal ─────────────────────── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiLoading]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [output]);

  /* ── Pyodide Script Loader ───────────────────────────── */
  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current) return pyodideRef.current;
    setIsPyodideLoading(true);

    if (!(window as any).loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = PYODIDE_SCRIPT;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide"));
        document.head.appendChild(script);
      });
    }

    const pyodide = await (window as any).loadPyodide({ indexURL: PYODIDE_CDN });
    pyodideRef.current = pyodide;
    setPyodideReady(true);
    setIsPyodideLoading(false);
    return pyodide;
  }, []);

  /* ── Code Runner logic (Python vs JavaScript) ─────────── */
  const runCode = useCallback(async () => {
    if (isRunning || !code.trim()) return;
    setIsRunning(true);
    setOutput([]);
    setExecutionTime(null);

    if (interviewType === "dsa-python") {
      // Execute Python using Pyodide
      try {
        const pyodide = await loadPyodide();
        const outputLines: string[] = [];

        const inputLines = stdinInputs.split("\n").filter((line) => line.length > 0);
        let inputIndex = 0;

        pyodide.setStdin({
          stdin: () => {
            if (inputIndex < inputLines.length) {
              const value = inputLines[inputIndex];
              inputIndex++;
              outputLines.push(`⌨️ stdin input: ${value}`);
              setOutput([...outputLines]);
              return value;
            }
            outputLines.push("⚠️ stdin requested but no inputs available.");
            setOutput([...outputLines]);
            return "";
          },
        });

        pyodide.setStdout({
          batched: (text: string) => {
            outputLines.push(text);
            setOutput([...outputLines]);
          },
        });

        pyodide.setStderr({
          batched: (text: string) => {
            outputLines.push(`❌ ${text}`);
            setOutput([...outputLines]);
          },
        });

        const start = performance.now();
        await pyodide.runPythonAsync(code);
        const end = performance.now();
        setExecutionTime(end - start);

        if (outputLines.length === 0) {
          setOutput(["✅ Program executed successfully with no output."]);
        }
      } catch (err: any) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const cleanError = errorMsg
          .replace(/PythonError: Traceback \(most recent call last\):\n/, "")
          .replace(/\s+File "<exec>",/g, '\n📍 File "<exec>",');
        setOutput((prev) => [...prev, `\n❌ Error:\n${cleanError}`]);
      } finally {
        setIsRunning(false);
      }
    } else if (interviewType === "dsa-js") {
      // Intercept and eval JS in a safe context
      const logBuffer: string[] = [];
      const customConsole = {
        log: (...args: any[]) => {
          logBuffer.push(
            args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")
          );
          setOutput([...logBuffer]);
        },
        error: (...args: any[]) => {
          logBuffer.push(`❌ ${args.map((a) => String(a)).join(" ")}`);
          setOutput([...logBuffer]);
        },
        warn: (...args: any[]) => {
          logBuffer.push(`⚠️ ${args.map((a) => String(a)).join(" ")}`);
          setOutput([...logBuffer]);
        },
      };

      try {
        const start = performance.now();
        // Dynamic evaluation
        const fn = new Function("console", code);
        fn(customConsole);
        const end = performance.now();
        setExecutionTime(end - start);

        if (logBuffer.length === 0) {
          setOutput(["✅ Program executed successfully (no logs)."]);
        }
      } catch (err: any) {
        logBuffer.push(`❌ Execution Error: ${err.message}`);
        setOutput([...logBuffer]);
      } finally {
        setIsRunning(false);
      }
    }
  }, [code, isRunning, interviewType, loadPyodide, stdinInputs]);

  /* ── Keybindings for compiler ────────────────────────── */
  const cmExtensions = useMemo(() => {
    const list = [
      autocompletion({ activateOnTyping: true }),
      keymap.of([
        {
          key: "Ctrl-Enter",
          mac: "Cmd-Enter",
          run: () => {
            runCode();
            return true;
          },
        },
      ]),
    ];
    if (interviewType === "dsa-python") {
      list.unshift(python() as any);
    }
    return list;
  }, [interviewType, runCode]);

  /* ── Interview System Prompts ───────────────────────── */
  const getInterviewerStylePrompt = () => {
    switch (interviewerStyle) {
      case "friendly":
        return "You have a friendly, encouraging, and coaching persona. Offer gentle hints if the candidate gets stuck. Ask leading questions to help them uncover bugs. Actively encourage their thoughts.";
      case "demanding":
        return "You are an extremely demanding and strict Principal FAANG Interviewer. Keep details sparse, offer absolutely no help or code snippets. Point out flaws immediately. Demand optimal time/space complexity, and highlight any edge cases they fail to mention. Keep your responses short, concise, and professional.";
      case "standard":
      default:
        return "You are a professional, neutral software engineer interviewer. You are helpful when the candidate is clearly stuck, but you push them to discover the approach first. Validate their design choices, but guide them to fix code bugs themselves by asking guiding questions.";
    }
  };

  const getSystemInstruction = () => {
    return `You are simulating a live, technical interview round for a Software Engineering position.
Format: ${interviewType === "system-design" ? "System Design & Architecture" : `Coding Challenge (${interviewType === "dsa-python" ? "Python" : "JavaScript"})`}.
Problem Title: ${problemTitle}
Problem Difficulty: ${difficulty}
Problem Description:
${problemDescription}

Interviewer Style constraints:
${getInterviewerStylePrompt()}

Goal of the interview simulation:
1. Greet the candidate, introduce the problem, and ask if they have initial clarifying questions or want to explain their approach.
2. If the candidate wants to write code or begins typing in the editor, encourage them to code. DO NOT force them to stay in the verbal phase or block them from coding.
3. Once they write code or design notes, review their solution (which you can see via the editor context provided to you), check for logical bugs, dry run with test inputs, and ask questions about complexity.
4. Ask guiding questions to help them catch their own bugs, rather than writing the solution for them.
5. Avoid repeating questions; if they already answered a question or addressed an edge case, move forward.
6. Keep your tone realistic, helpful, and professional. Speak directly as the interviewer.
7. Stop and evaluate only when the user chooses to end the session.`;
  };

  /* ── Start Mock Interview ────────────────────────────── */
  const handleStartInterview = async (config: {
    apiKey: string;
    type: "dsa-python" | "dsa-js" | "system-design";
    problemTitle: string;
    problemDescription: string;
    difficulty: "Easy" | "Medium" | "Hard";
    interviewerStyle: "friendly" | "standard" | "demanding";
  }) => {
    setApiKey(config.apiKey);
    setInterviewType(config.type);
    setProblemTitle(config.problemTitle);
    setProblemDescription(config.problemDescription);
    setDifficulty(config.difficulty);
    setInterviewerStyle(config.interviewerStyle);

    // Initial placeholder code
    if (config.type === "dsa-python") {
      setCode(`# Write your Python solution for "${config.problemTitle}"\n\n`);
    } else if (config.type === "dsa-js") {
      setCode(`// Write your JavaScript/TypeScript solution for "${config.problemTitle}"\n\n`);
    } else {
      setCode(`# ${config.problemTitle} — System Design Blueprint\n\n## 1. Functional Requirements\n- \n\n## 2. Core API Interface\n- \n\n## 3. High-Level Architecture Diagram / Data Flow\n- \n\n## 4. Database Schema / Storage choices\n- \n\n## 5. Scalability & Edge Cases (Bottlenecks, caching, replication)\n- `);
    }

    setStatus("active");
    setStopwatchTime(0);
    setIsStopwatchRunning(true);
    setAiLoading(true);

    try {
      // Initiate Gemini first message
      const initialGreeting = await geminiService.chatCompletion(
        config.apiKey,
        [{ role: "user" as const, parts: [{ text: "Hello, I am ready to begin the interview." }] }],
        `You are a technical interviewer. Greet the candidate and present the target problem: "${config.problemTitle}". Briefly state the problem, ask if they have any clarifying questions or an initial approach, and wait for their response. Do not give any code or hints yet. Style: ${config.interviewerStyle}`
      );

      setMessages([
        {
          role: "model",
          parts: [{ text: initialGreeting }],
        },
      ]);
    } catch (err: any) {
      alert(`Failed to start interview: ${err.message}`);
      setStatus("setup");
    } finally {
      setAiLoading(false);
    }
  };

  /* ── Send message to Interviewer ─────────────────────── */
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || aiLoading) return;

    const userMsgText = userInput.trim();
    setUserInput("");

    const updatedMessages: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        parts: [{ text: userMsgText }],
      },
    ];

    setMessages(updatedMessages);
    setAiLoading(true);

    try {
      // Append current editor state so AI interviewer has visibility into the draft code
      const contextualPrompt = `${userMsgText}\n\n[CONTEXT: Candidate currently has this draft code/text in the editor: \n\`\`\`\n${code}\n\`\`\`\nProvide feedback based on this status]`;
      
      const payloadMessages: ChatMessage[] = [
        ...messages,
        {
          role: "user",
          parts: [{ text: contextualPrompt }],
        },
      ];

      const response = await geminiService.chatCompletion(
        apiKey,
        payloadMessages,
        getSystemInstruction()
      );

      setMessages([
        ...updatedMessages,
        {
          role: "model",
          parts: [{ text: response }],
        },
      ]);
    } catch (err: any) {
      alert(`API Error: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  /* ── End Interview & Evaluate ────────────────────────── */
  const handleEndAndEvaluate = async () => {
    if (messages.length === 0) return;
    if (!confirm("Are you sure you want to end the mock interview and get your report card?")) return;

    setStatus("evaluating");
    setIsStopwatchRunning(false);

    try {
      const evaluationSystemPrompt = `You are a critical, expert FAANG Technical Interview Evaluator.
Review the complete chat history of the coding interview and the candidate's final code.
Evaluate their performance across these exact three categories:
1. Technical Code & Logic (out of 10)
2. Communication & Clarity (out of 10)
3. Complexity Analysis (out of 10)

Write a detailed evaluation scorecard.
IMPORTANT: You MUST include a final overall score out of 100 in the format "Overall Score: XX/100" (e.g. "Overall Score: 78/100") on its own line in the document.
Also include:
- A brief overall summary grade (e.g., strong hire, lean hire, no hire).
- Strengths demonstrated (bullet points).
- Areas of improvement/weaknesses.
- An optimal reference solution snippet in ${interviewType === "dsa-python" ? "Python" : "JavaScript"}.
Be strict, thorough, and highly technical.`;

      const chatHistoryText = messages
        .map((m) => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.parts[0].text}`)
        .join("\n\n");

      const prompt = `Here is the interview history:\n${chatHistoryText}\n\nCandidate's Final Code/Text in the Editor:\n\`\`\`\n${code}\n\`\`\`\n\nPlease evaluate.`;

      const response = await geminiService.chatCompletion(
        apiKey,
        [{ role: "user" as const, parts: [{ text: prompt }] }],
        evaluationSystemPrompt
      );

      setEvaluationReport(response);
      setShowScorecard(true);
    } catch (err: any) {
      alert(`Evaluation failed: ${err.message}`);
      setStatus("active");
      setIsStopwatchRunning(true);
    }
  };

  const handleReset = () => {
    setStatus("setup");
    setMessages([]);
    setCode("");
    setOutput([]);
    setExecutionTime(null);
    setEvaluationReport("");
    setShowScorecard(false);
    setStopwatchTime(0);
    setIsStopwatchRunning(false);
  };

  const formatStopwatchTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, "0");
    if (hrs > 0) return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    return `${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-4 pb-20 font-v-body h-[calc(100vh-100px)] flex flex-col">
      
      {/* setup view */}
      {/* setup view */}
      {status === "setup" && <InterviewSetup onStart={handleStartInterview} />}

      {/* evaluating view with high-end simulated diagnostics checklist */}
      {status === "evaluating" && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-md mx-auto text-center px-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse" />
            <Loader2 className="h-16 w-16 text-primary animate-spin relative" />
          </div>
          <div className="space-y-4 w-full">
            <div>
              <h3 className="text-xl font-black text-foreground tracking-tight font-v-headings">Compiling Scorecard Report</h3>
              <p className="text-xs text-muted-foreground mt-1">Please stand by. Diagnostic criteria are being verified.</p>
            </div>
            
            <div className="p-5 rounded-2xl border border-border bg-card/65 text-left space-y-3 shadow-sm select-none">
              <div className="flex items-center gap-2.5 text-xs font-bold text-foreground">
                <div className={`h-2.5 w-2.5 rounded-full ${evalStep >= 0 ? "bg-emerald-500 animate-pulse" : "bg-muted"}`} />
                <span className={evalStep >= 1 ? "line-through text-muted-foreground/60" : ""}>Parsing conversation transcript</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-foreground">
                <div className={`h-2.5 w-2.5 rounded-full ${evalStep >= 1 ? "bg-emerald-500 animate-pulse" : "bg-muted"}`} />
                <span className={evalStep >= 2 ? "line-through text-muted-foreground/60" : evalStep < 1 ? "text-muted-foreground/30" : ""}>Checking syntax & logic paths</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-foreground">
                <div className={`h-2.5 w-2.5 rounded-full ${evalStep >= 2 ? "bg-emerald-500 animate-pulse" : "bg-muted"}`} />
                <span className={evalStep >= 3 ? "line-through text-muted-foreground/60" : evalStep < 2 ? "text-muted-foreground/30" : ""}>Verifying asymptotic code complexity</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-foreground">
                <div className={`h-2.5 w-2.5 rounded-full ${evalStep >= 3 ? "bg-emerald-500 animate-pulse" : "bg-muted"}`} />
                <span className={evalStep < 3 ? "text-muted-foreground/30" : ""}>Formatting feedback scorecard</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* active simulator view */}
      {status === "active" && (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
          
          {/* Header Bar */}
          <header className="flex flex-wrap items-center justify-between border border-border bg-card/45 backdrop-blur-xl rounded-2xl px-6 py-4 gap-4 shadow-sm select-none">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl border border-primary/10 bg-primary/[0.04] flex items-center justify-center text-primary">
                <Bot className="h-5.5 w-5.5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-black leading-tight text-foreground">{problemTitle}</h2>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold mt-0.5">
                  <span className="uppercase tracking-wider font-bold bg-muted/50 px-2 py-0.5 rounded border border-border/40">
                    {interviewType === "system-design" ? "System Design" : "Coding Arena"}
                  </span>
                  <span>·</span>
                  <span>Persona: {interviewerStyle}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className="flex items-center gap-2.5 text-muted-foreground font-mono text-xs border border-border bg-background/35 px-3.5 py-2 rounded-xl shadow-inner group">
                <Timer className={`h-4 w-4 transition-colors ${isStopwatchRunning ? "text-rose-500 animate-pulse" : "text-muted-foreground"}`} />
                <span className="font-bold tabular-nums tracking-wider text-foreground">
                  {formatStopwatchTime(stopwatchTime)}
                </span>
              </div>

              <button
                onClick={handleEndAndEvaluate}
                className="px-5 py-2.5 rounded-xl bg-rose-500 text-white font-black uppercase tracking-widest text-[10px] shadow-md shadow-rose-500/10 hover:shadow-rose-500/25 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer border border-rose-600/35"
              >
                Submit & Evaluate
              </button>

              <button
                onClick={handleReset}
                className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all cursor-pointer"
                title="Exit Arena"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* Core Panel Grid Split */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden min-h-0">
            
            {/* LEFT PANEL: Chat with Interviewer */}
            <div className="flex flex-col border border-border/80 bg-card/60 backdrop-blur-md rounded-2xl overflow-hidden min-h-0 shadow-md">
              
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-border/60 bg-muted/15 flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest shrink-0">
                <span className="flex items-center gap-2 text-foreground">
                  <Bot className="h-4 w-4 text-primary animate-pulse" />
                  Interviewer Discussion
                </span>
                <span className="text-[9px] lowercase text-muted-foreground/60 font-semibold bg-background border border-border/40 px-2 py-0.5 rounded-full">
                  live guidance
                </span>
              </div>

              {/* Message scroll container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.map((m, idx) => {
                  const isUser = m.role === "user";
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 max-w-[90%] ${
                        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-black border transition-all ${
                          isUser
                            ? "bg-primary/10 border-primary/20 text-primary"
                            : "bg-muted border-border/40 text-muted-foreground"
                        }`}
                      >
                        {isUser ? "You" : "AI"}
                      </div>
                      
                      {/* Bubble */}
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed break-words border relative shadow-sm ${
                          isUser
                            ? "bg-primary text-primary-foreground border-primary/30 rounded-tr-none"
                            : "bg-background/80 border-border/50 text-foreground/90 rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.parts[0].text}</p>
                      </div>
                    </div>
                  );
                })}

                {aiLoading && (
                  <div className="flex gap-3 max-w-[85%] mr-auto items-start">
                    <div className="h-7 w-7 rounded-xl bg-muted border border-border/40 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary animate-pulse" />
                    </div>
                    <div className="p-3.5 py-3 rounded-2xl rounded-tl-none border border-border/40 bg-background/80 flex items-center gap-2 shadow-sm">
                      <span className="text-xs text-muted-foreground italic mr-1">Reviewing workspace context</span>
                      <div className="flex gap-1 items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/75 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/75 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/75 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompt Helpers Ribbon */}
              <div className="px-3 py-2 border-t border-border/50 bg-muted/5 flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none shrink-0">
                {QUICK_HELPERS.map((helper) => (
                  <button
                    key={helper.label}
                    type="button"
                    onClick={() => {
                      setUserInput((prev) => {
                        const spacer = prev ? " " : "";
                        return prev + spacer + helper.text;
                      });
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-[10px] font-bold text-muted-foreground hover:text-primary hover:border-primary/30 transition-all cursor-pointer select-none active:scale-95"
                  >
                    {helper.label}
                  </button>
                ))}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-[#0d1117]/30 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask clarifying questions or describe your logic..."
                  disabled={aiLoading}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-xs focus:outline-none focus:border-primary/50 text-foreground disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!userInput.trim() || aiLoading}
                  className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>

            {/* RIGHT PANEL: Code Editor / Design Canvas */}
            <div className="flex flex-col border border-border bg-card rounded-2xl overflow-hidden min-h-0 shadow-md">
              
              {/* VS-Code Style Editor Tab Header */}
              <div
                className="flex items-center justify-between px-4 py-2 border-b border-[#111c27] select-none"
                style={{
                  background: "#011627",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex bg-[#011627] border-t-2 border-primary px-4 py-2 rounded-t-lg -mb-2 border-r border-[#111c27] flex items-center gap-2 text-xs font-bold text-[#d6deeb]">
                    {interviewType === "system-design" ? (
                      <>
                        <FileText className="h-3.5 w-3.5 text-amber-400" />
                        <span>blueprint.md</span>
                      </>
                    ) : (
                      <>
                        <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{interviewType === "dsa-python" ? "solution.py" : "solution.js"}</span>
                      </>
                    )}
                  </div>
                  
                  {/* Inactive tab simulator for visual flair */}
                  <div className="hidden sm:flex px-4 py-2 rounded-t-lg -mb-2 text-[10px] font-bold text-muted-foreground/40 items-center gap-1.5">
                    <Terminal className="h-3 w-3" />
                    <span>scratchpad.log</span>
                  </div>
                </div>

                {/* Connection engine status */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#1d3b53] bg-[#011627] text-[9px] font-bold uppercase tracking-wider text-[#d6deeb]">
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      interviewType === "system-design" 
                        ? "bg-amber-500 shadow-amber-500/50 shadow-[0_0_4px]"
                        : interviewType === "dsa-python" && pyodideReady
                          ? "bg-emerald-500 shadow-emerald-500/50 shadow-[0_0_4px]"
                          : interviewType === "dsa-js"
                            ? "bg-blue-500 shadow-blue-500/50 shadow-[0_0_4px]"
                            : "bg-amber-400 animate-pulse shadow-amber-400/50 shadow-[0_0_4px]"
                    }`} />
                    <span>
                      {interviewType === "system-design" 
                        ? "Design Engine"
                        : interviewType === "dsa-python"
                          ? pyodideReady ? "Pyodide WASM" : "Connecting WASM..."
                          : "JS Engine"}
                    </span>
                  </div>

                  {interviewType !== "system-design" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowStdin(!showStdin)}
                        className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                          showStdin
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-transparent text-muted-foreground/60 border-border/40 hover:text-foreground hover:border-border/80"
                        }`}
                      >
                        Stdin
                      </button>
                      <button
                        onClick={runCode}
                        disabled={isRunning}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
                        style={{
                          background: isRunning ? "rgba(255,59,48,0.15)" : "rgba(40,200,64,0.15)",
                          color: isRunning ? "#ff5f57" : "#28c840",
                          border: `1px solid ${
                            isRunning ? "rgba(255,59,48,0.3)" : "rgba(40,200,64,0.3)"
                          }`,
                        }}
                      >
                        {isRunning ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 fill-current" />
                            Run Code
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Editor Workspace */}
              <div className="flex-1 flex flex-col min-h-0 bg-[#011627]">
                
                {/* CodeMirror input or Design document textbox */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  {interviewType === "system-design" ? (
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full h-full p-5 bg-[#011627] text-sm text-[#d6deeb] font-mono border-none outline-none resize-none focus:ring-0 leading-relaxed"
                      placeholder="Draft your system design document here..."
                    />
                  ) : (
                    <CodeMirror
                      ref={editorRef}
                      value={code}
                      onChange={(value) => setCode(value)}
                      theme={nightOwlTheme}
                      extensions={cmExtensions}
                      basicSetup={{
                        lineNumbers: true,
                        highlightActiveLine: true,
                        bracketMatching: true,
                        closeBrackets: true,
                        tabSize: 4,
                      }}
                      style={{
                        fontSize: "13px",
                        fontFamily:
                          "'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace",
                      }}
                    />
                  )}
                </div>

                {/* Stdin Drawer */}
                {showStdin && interviewType !== "system-design" && (
                  <div className="border-t border-border bg-[#0d1117]/80 p-3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                      Stdin Input Panel (separate lines for multiple input() statements)
                    </label>
                    <textarea
                      value={stdinInputs}
                      onChange={(e) => setStdinInputs(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-border bg-slate-950 px-2.5 py-1.5 text-xs text-[#d6deeb] font-mono outline-none resize-none focus:border-primary/40"
                      placeholder="e.g. John Doe\n25"
                    />
                  </div>
                )}

                {/* Split Terminal View */}
                {interviewType !== "system-design" && (
                  <div className="h-[180px] border-t border-border/80 bg-[#0d1117] flex flex-col">
                    <div className="px-4 py-2 border-b border-border bg-[#0d1117] flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
                      <span className="flex items-center gap-1">
                        <Terminal className="h-3 w-3" />
                        Console Output Terminal
                      </span>
                      {executionTime !== null && (
                        <span className="text-emerald-500 normal-case">
                          Executed in {executionTime.toFixed(1)}ms
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1 p-3 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1">
                      {output.map((line, idx) => (
                        <div key={idx} className="whitespace-pre-wrap text-[#d6deeb]">
                          {line}
                        </div>
                      ))}
                      {output.length === 0 && (
                        <span className="text-muted-foreground/35 italic">
                          Click Run Code to verify your implementation logic.
                        </span>
                      )}
                      <div ref={terminalEndRef} />
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>
      )}

      {/* scorecard report modal */}
      <ScorecardModal
        isOpen={showScorecard}
        onClose={() => setShowScorecard(false)}
        evaluationMarkdown={evaluationReport}
        onRestart={handleReset}
      />

    </div>
  );
}
