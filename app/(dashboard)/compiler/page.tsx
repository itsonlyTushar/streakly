"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Play,
  Trash2,
  ArrowLeft,
  Terminal,
  Loader2,
  RotateCcw,
  Keyboard,
  Download,
  ChevronDown,
  Timer,
  Pause,
} from "lucide-react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { autocompletion } from "@codemirror/autocomplete";
import { keymap } from "@codemirror/view";
import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";

/* ──────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────── */
interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdin: (options: { stdin: () => string }) => void;
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
}

declare global {
  interface Window {
    loadPyodide: (options?: { indexURL?: string }) => Promise<PyodideInterface>;
  }
}

/* ──────────────────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────────────────── */
const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
const PYODIDE_SCRIPT = `${PYODIDE_CDN}pyodide.js`;

const LS_CODE_KEY = "streakly-compiler-code";
const LS_STDIN_KEY = "streakly-compiler-stdin";

const DEFAULT_CODE = `# 🐍 Python Playground — Streakly
# Write your code below and hit Run (Ctrl + Enter)

def two_sum(nums, target):
    """Classic Two Sum — O(N) with hashmap"""
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test it out
result = two_sum([2, 7, 11, 15], 9)
print(f"Indices: {result}")

# Try input()
name = input("What's your name? ")
print(f"Hello, {name}! Happy coding 🚀")
`;

/* ──────────────────────────────────────────────────────────
   Night Owl CodeMirror Theme
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

/* ──────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────── */
export default function CompilerPage() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [stdinInputs, setStdinInputs] = useState("");
  const [showStdinPanel, setShowStdinPanel] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const pyodideRef = useRef<PyodideInterface | null>(null);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  /* ── Stopwatch State & Logic ────────────────────────── */
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    }
    return () => {
      if (stopwatchIntervalRef.current) {
        clearInterval(stopwatchIntervalRef.current);
      }
    };
  }, [isStopwatchRunning]);

  /* ── Hydrate state from localStorage on mount ────────── */
  useEffect(() => {
    try {
      const savedCode = localStorage.getItem(LS_CODE_KEY);
      const savedStdin = localStorage.getItem(LS_STDIN_KEY);
      if (savedCode !== null) setCode(savedCode);
      if (savedStdin !== null) setStdinInputs(savedStdin);
    } catch {
      // localStorage may be unavailable (e.g. private browsing)
    }
    setHydrated(true);
  }, []);

  /* ── Persist code to localStorage on change ─────────── */
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LS_CODE_KEY, code);
    } catch { /* quota exceeded or unavailable */ }
  }, [code, hydrated]);

  /* ── Persist stdin inputs to localStorage on change ─── */
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LS_STDIN_KEY, stdinInputs);
    } catch { /* quota exceeded or unavailable */ }
  }, [stdinInputs, hydrated]);

  const formatStopwatchTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, "0");

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const handleStopwatchStartPause = () => {
    setIsStopwatchRunning(!isStopwatchRunning);
  };

  const handleStopwatchReset = () => {
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
  };

  /* ── Load Pyodide WASM ───────────────────────────────── */
  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current) return pyodideRef.current;
    setIsLoading(true);

    // Inject Pyodide script if not already loaded
    if (!window.loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = PYODIDE_SCRIPT;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide"));
        document.head.appendChild(script);
      });
    }

    const pyodide = await window.loadPyodide({ indexURL: PYODIDE_CDN });
    pyodideRef.current = pyodide;
    setPyodideReady(true);
    setIsLoading(false);
    return pyodide;
  }, []);

  /* ── Run Python code ─────────────────────────────────── */
  const runCode = useCallback(async () => {
    if (isRunning || !code.trim()) return;
    setIsRunning(true);
    setIsStopwatchRunning(false);
    setOutput([]);
    setExecutionTime(null);

    try {
      const pyodide = await loadPyodide();
      const outputLines: string[] = [];

      // Prepare stdin queue from user-provided inputs
      const inputLines = stdinInputs
        .split("\n")
        .filter((line) => line.length > 0);
      let inputIndex = 0;

      pyodide.setStdin({
        stdin: () => {
          if (inputIndex < inputLines.length) {
            const value = inputLines[inputIndex];
            inputIndex++;
            outputLines.push(`⌨️  ${value}`);
            setOutput([...outputLines]);
            return value;
          }
          outputLines.push("⚠️  No more stdin input available (add inputs in the Input panel)");
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

      const startTime = performance.now();
      await pyodide.runPythonAsync(code);
      const endTime = performance.now();

      setExecutionTime(endTime - startTime);

      if (outputLines.length === 0) {
        outputLines.push("✅ Program executed successfully (no output).");
        setOutput([...outputLines]);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      // Clean up Python traceback for nicer display
      const cleanError = errorMsg
        .replace(/PythonError: Traceback \(most recent call last\):\n/, "")
        .replace(/\s+File "<exec>",/g, '\n📍 File "<exec>",');
      setOutput((prev) => [...prev, `\n❌ Error:\n${cleanError}`]);
    } finally {
      setIsRunning(false);
    }
  }, [code, isRunning, loadPyodide, stdinInputs, setIsStopwatchRunning]);

  /* ── Keyboard shortcut (global, for when editor isn't focused) ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [runCode]);

  /* ── Auto-scroll output ──────────────────────────────── */
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  /* ── CodeMirror extensions (memoised to avoid re-creating) ── */
  const runCodeRef = useRef(runCode);
  runCodeRef.current = runCode;

  const cmExtensions = useMemo(
    () => [
      python(),
      autocompletion({
        activateOnTyping: true,
      }),
      keymap.of([
        {
          key: "Ctrl-Enter",
          mac: "Cmd-Enter",
          run: () => {
            runCodeRef.current();
            return true;
          },
        },
      ]),
    ],
    []
  );

  /* ── Download code ───────────────────────────────────── */
  const downloadCode = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "solution.py";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 pb-24 px-2 md:px-4 font-v-body">
      {/* ─── Header ─────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="space-y-2">
          <Link
            href="/dsa"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-primary text-xs font-black uppercase tracking-widest transition-colors group w-fit"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to DSA
          </Link>
          <div className="flex items-center gap-2 text-primary text-sm font-black uppercase tracking-widest">
            <Terminal className="h-4 w-4" />
            Online IDE
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mini Stopwatch */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border bg-card/25 backdrop-blur-sm text-muted-foreground font-mono text-xs transition-all select-none group">
            <div className="flex items-center gap-1.5">
              <Timer className={`h-3.5 w-3.5 transition-all duration-300 ${isStopwatchRunning ? "text-emerald-400 animate-pulse" : "text-muted-foreground group-hover:text-primary"}`} />
              <span className={`font-bold tabular-nums tracking-wider ${isStopwatchRunning ? "text-primary" : "text-muted-foreground"}`}>
                {formatStopwatchTime(stopwatchTime)}
              </span>
            </div>
            <div className="h-4 w-px bg-border/60" />
            <div className="flex items-center gap-1">
              <button
                onClick={handleStopwatchStartPause}
                title={isStopwatchRunning ? "Pause" : "Start"}
                className={`p-0.5 rounded transition-all hover:bg-primary/10 ${isStopwatchRunning ? "text-amber-400 hover:text-amber-300" : "text-emerald-400 hover:text-emerald-300"}`}
              >
                {isStopwatchRunning ? (
                  <Pause className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" />
                )}
              </button>
              <button
                onClick={handleStopwatchReset}
                title="Reset"
                className="p-0.5 rounded text-muted-foreground hover:text-rose-400 hover:bg-primary/10 transition-all"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setCode(DEFAULT_CODE);
              setOutput([]);
              setExecutionTime(null);
              setStdinInputs("");
              try {
                localStorage.removeItem(LS_CODE_KEY);
                localStorage.removeItem(LS_STDIN_KEY);
              } catch { /* ignore */ }
            }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </header>


      {/* ─── Status bar ─────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              pyodideReady
                ? "bg-emerald-500 shadow-emerald-500/50 shadow-[0_0_6px]"
                : isLoading
                  ? "bg-amber-500 animate-pulse"
                  : "bg-muted-foreground/30"
            }`}
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            {pyodideReady
              ? "Python Ready"
              : isLoading
                ? "Loading Pyodide…"
                : "Not Loaded"}
          </span>
        </div>
        {executionTime !== null && (
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
            Executed in {executionTime.toFixed(1)}ms
          </span>
        )}
        <span className="text-[10px] font-mono text-muted-foreground/40 ml-auto">
          {code.split("\n").length} lines
        </span>
      </div>

      {/* ─── Main IDE Layout ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[500px]">
        {/* ── Code Editor Panel ────────────────────────── */}
        <div className="flex flex-col rounded-2xl overflow-hidden border border-border/60 shadow-lg">
          {/* Editor header */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{
              background: "#011627",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span
                className="text-[9px] font-bold uppercase tracking-widest ml-2"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                solution.py
              </span>
            </div>
            {/* Run button in header */}
            <button
              onClick={runCode}
              disabled={isRunning || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-40"
              style={{
                background: isRunning
                  ? "rgba(255,59,48,0.15)"
                  : "rgba(40,200,64,0.15)",
                color: isRunning ? "#ff5f57" : "#28c840",
                border: `1px solid ${isRunning ? "rgba(255,59,48,0.3)" : "rgba(40,200,64,0.3)"}`,
              }}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Running…
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading…
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Run
                </>
              )}
            </button>
          </div>

          {/* CodeMirror Editor */}
          <div className="flex-1 relative cm-editor-wrapper" style={{ background: "#011627" }}>
            <CodeMirror
              ref={editorRef}
              value={code}
              onChange={(value) => setCode(value)}
              theme={nightOwlTheme}
              extensions={cmExtensions}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightActiveLine: true,
                foldGutter: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                highlightSelectionMatches: true,
                searchKeymap: true,
                tabSize: 4,
              }}
              style={{
                fontSize: "13px",
                minHeight: "400px",
                fontFamily:
                  "'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
              }}
            />
          </div>
        </div>

        {/* ── Output / Terminal Panel ──────────────────── */}
        <div className="flex flex-col rounded-2xl overflow-hidden border border-border/60 shadow-lg">
          {/* Terminal header */}
          <div
            className="flex items-center justify-between px-4 py-2.5"
            style={{
              background: "#0d1117",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-center gap-2">
              <Terminal
                className="h-3.5 w-3.5"
                style={{ color: "rgba(255,255,255,0.4)" }}
              />
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Output
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStdinPanel(!showStdinPanel)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                style={{
                  background: showStdinPanel
                    ? "rgba(99,102,241,0.2)"
                    : "rgba(255,255,255,0.06)",
                  color: showStdinPanel
                    ? "#818cf8"
                    : "rgba(255,255,255,0.4)",
                  border: `1px solid ${showStdinPanel ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.08)"}`,
                }}
              >
                <Keyboard className="h-3 w-3" />
                Input
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${showStdinPanel ? "rotate-180" : ""}`}
                />
              </button>
              <button
                onClick={() => {
                  setOutput([]);
                  setExecutionTime(null);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Trash2 className="h-3 w-3" />
                Clear
              </button>
            </div>
          </div>

          {/* Stdin input panel */}
          {showStdinPanel && (
            <div
              className="px-4 py-3"
              style={{
                background: "#0d1117",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <label
                className="text-[9px] font-bold uppercase tracking-widest mb-2 block"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Standard Input (one value per line)
              </label>
              <textarea
                value={stdinInputs}
                onChange={(e) => setStdinInputs(e.target.value)}
                placeholder={"Enter inputs here, one per line...\ne.g.:\nAlice\n42"}
                spellCheck={false}
                rows={3}
                className="w-full rounded-lg outline-none resize-none placeholder:text-white/15 scrollbar-thin"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  color: "#d6deeb",
                  caretColor: "#818cf8",
                  fontFamily:
                    "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
                  fontSize: "12px",
                  lineHeight: "1.6",
                  padding: "10px 12px",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />
            </div>
          )}

          {/* Terminal output */}
          <div
            ref={outputRef}
            className="flex-1 overflow-auto scrollbar-thin"
            style={{
              background: "#0d1117",
              minHeight: showStdinPanel ? "260px" : "400px",
              maxHeight: "600px",
            }}
          >
            {output.length === 0 && !isRunning ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                >
                  <Terminal
                    className="h-6 w-6"
                    style={{ color: "rgba(255,255,255,0.15)" }}
                  />
                </div>
                <p
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  Output will appear here
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "rgba(255,255,255,0.1)" }}
                >
                  Press Ctrl + Enter to run
                </p>
              </div>
            ) : (
              <pre
                className="p-4"
                style={{
                  fontFamily:
                    "'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
                  fontSize: "13px",
                  lineHeight: "1.7",
                  color: "#d6deeb",
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {output.map((line, i) => {
                  const isError = line.startsWith("❌");
                  const isInput = line.startsWith("⌨️");
                  const isWarning = line.startsWith("⚠️");
                  const isSuccess =
                    line.startsWith("✅");
                  return (
                    <div
                      key={i}
                      style={{
                        color: isError
                          ? "#ff6b6b"
                          : isInput
                            ? "#818cf8"
                            : isWarning
                              ? "#febc2e"
                              : isSuccess
                                ? "#28c840"
                                : "#d6deeb",
                      }}
                    >
                      {line}
                    </div>
                  );
                })}
                {isRunning && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2
                      className="h-3 w-3 animate-spin"
                      style={{ color: "#28c840" }}
                    />
                    <span style={{ color: "rgba(255,255,255,0.3)" }}>
                      Running…
                    </span>
                  </div>
                )}
              </pre>
            )}
          </div>

          {/* Bottom gradient */}
          <div
            className="h-1"
            style={{
              background:
                "linear-gradient(to right, #ff5f57, #febc2e, #28c840)",
              opacity: 0.6,
            }}
          />
        </div>
      </div>

      {/* ─── Bottom Run Bar (Mobile-friendly) ───────────── */}
      <div className="lg:hidden fixed bottom-20 left-4 right-4 z-40">
        <button
          onClick={runCode}
          disabled={isRunning || isLoading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-2xl disabled:opacity-50"
          style={{
            background: isRunning
              ? "rgba(255,59,48,0.9)"
              : "rgba(40,200,64,0.9)",
            color: "#fff",
            backdropFilter: "blur(12px)",
            border: `1px solid ${isRunning ? "rgba(255,59,48,0.5)" : "rgba(40,200,64,0.5)"}`,
          }}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Running…
            </>
          ) : isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Python…
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Run Code
            </>
          )}
        </button>
      </div>
    </div>
  );
}
