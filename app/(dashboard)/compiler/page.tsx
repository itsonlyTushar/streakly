"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
} from "lucide-react";

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
  const [showShortcuts, setShowShortcuts] = useState(false);

  const pyodideRef = useRef<PyodideInterface | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

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
        .replace(/\s+File "<exec>",/g, "\n📍 File "<exec>",");
      setOutput((prev) => [...prev, `\n❌ Error:\n${cleanError}`]);
    } finally {
      setIsRunning(false);
    }
  }, [code, isRunning, loadPyodide, stdinInputs]);

  /* ── Keyboard shortcut ───────────────────────────────── */
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

  /* ── Tab key support in textarea ─────────────────────── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + "    " + code.substring(end);
      setCode(newCode);
      // Set cursor position after the inserted tab
      requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      });
    }
  };

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
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
            Python Compiler
          </h1>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
          >
            <Keyboard className="h-3.5 w-3.5" />
            Shortcuts
          </button>
          <button
            onClick={downloadCode}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Download .py
          </button>
          <button
            onClick={() => {
              setCode(DEFAULT_CODE);
              setOutput([]);
              setExecutionTime(null);
            }}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </header>

      {/* ─── Shortcuts popover ──────────────────────────── */}
      {showShortcuts && (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-3">
            Keyboard Shortcuts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {[
              ["Ctrl + Enter", "Run code"],
              ["Tab", "Insert 4 spaces"],
              ["Ctrl + S", "Download .py file"],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center gap-3">
                <kbd className="px-2 py-1 rounded-lg bg-secondary text-[11px] font-mono font-bold border border-border/60">
                  {key}
                </kbd>
                <span className="text-muted-foreground text-xs">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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

          {/* Textarea editor */}
          <div className="flex-1 relative" style={{ background: "#011627" }}>
            {/* Line numbers gutter */}
            <div
              className="absolute left-0 top-0 bottom-0 overflow-hidden select-none pointer-events-none"
              style={{
                width: "50px",
                paddingTop: "16px",
                fontFamily:
                  "'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
                fontSize: "13px",
                lineHeight: "1.7",
                color: "rgba(255,255,255,0.15)",
                textAlign: "right",
                paddingRight: "12px",
              }}
            >
              {code.split("\n").map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              className="w-full h-full resize-none outline-none placeholder:text-white/20"
              style={{
                background: "transparent",
                color: "#d6deeb",
                caretColor: "#80a4c2",
                fontFamily:
                  "'Fira Code', 'JetBrains Mono', 'Cascadia Code', 'Consolas', monospace",
                fontSize: "13px",
                lineHeight: "1.7",
                padding: "16px 20px 16px 58px",
                minHeight: "400px",
                border: "none",
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
                className="w-full rounded-lg outline-none resize-none placeholder:text-white/15"
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
            className="flex-1 overflow-auto"
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
