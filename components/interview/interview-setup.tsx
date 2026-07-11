"use client";

import { useState, useEffect, useMemo } from "react";
import { Key, Bot, Sparkles, Code, Cpu, Layers, Play, AlertCircle, Search, Sliders, Check, HelpCircle, Star, Terminal } from "lucide-react";
import { useDSAItems } from "@/hooks/use-dsa";
import { useMachineCodingItems } from "@/hooks/use-machine-coding";
import { motion, AnimatePresence } from "framer-motion";

// Preset interview problems
export const INTERVIEW_PRESETS = [
  {
    id: "preset-twosum",
    type: "dsa-python",
    title: "Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
  },
  {
    id: "preset-lru",
    type: "dsa-python",
    title: "LRU Cache",
    difficulty: "Medium",
    description: "Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the `LRUCache` class:\n- `LRUCache(int capacity)` Initialize the LRU cache with positive size `capacity`.\n- `int get(int key)` Return the value of the `key` if the `key` exists, otherwise return `-1`.\n- `void put(int key, int value)` Update the value of the `key` if the `key` exists. Otherwise, add the `key-value` pair to the cache. If the number of keys exceeds the `capacity` from this operation, evict the least recently used key.",
  },
  {
    id: "preset-promise-all",
    type: "dsa-js",
    title: "Implement Promise.all",
    difficulty: "Medium",
    description: "Implement a custom utility function `promiseAll(iterable)` that behaves identically to standard `Promise.all()`.\n\nIt should take an array (or any iterable) of promises (or plain values) and return a promise that:\n- Resolves with an array of values when all inputted promises resolve.\n- Rejects immediately if any input promise rejects, with that rejection reason.",
  },
  {
    id: "preset-debounce",
    type: "dsa-js",
    title: "Implement Debounce with Cancel",
    difficulty: "Easy",
    description: "Implement a `debounce` function that delays invoking `func` until after `wait` milliseconds have elapsed since the last time the debounced function was invoked.\n\nThe debounced function should also provide a `.cancel()` method to cancel pending function invocations.",
  },
  {
    id: "preset-ratelimiter",
    type: "system-design",
    title: "Design a Rate Limiter",
    difficulty: "Medium",
    description: "Design a scalable API Rate Limiter for a high-traffic web service. Your design should outline:\n1. Functional requirements (e.g. rate limit rule configuration, response headers).\n2. Choice of algorithm (Token Bucket, Leaking Bucket, Fixed Window, Sliding Window Log, Sliding Window Counter).\n3. High-level architecture (middleware, cache nodes, database setup).\n4. Scalability issues in a distributed setup (race conditions, consistency).",
  },
  {
    id: "preset-urlshortener",
    type: "system-design",
    title: "Design a URL Shortener",
    difficulty: "Medium",
    description: "Design a URL shortening service like TinyURL. Your system design should cover:\n1. Functional requirements (high availability, custom alias support).\n2. Scale estimates (QPS, database size requirements over 5 years).\n3. Hash generation algorithm & unique ID generation service.\n4. Database modeling, indexing, and geo-distributed caching strategy.",
  },
];

interface InterviewSetupProps {
  onStart: (config: {
    apiKey: string;
    type: "dsa-python" | "dsa-js" | "system-design";
    problemTitle: string;
    problemDescription: string;
    difficulty: "Easy" | "Medium" | "Hard";
    interviewerStyle: "friendly" | "standard" | "demanding";
  }) => void;
}

export function InterviewSetup({ onStart }: InterviewSetupProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [type, setType] = useState<"dsa-python" | "dsa-js" | "system-design">("dsa-python");
  const [problemSource, setProblemSource] = useState<"preset" | "dsa" | "machine-coding">("preset");
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [interviewerStyle, setInterviewerStyle] = useState<"friendly" | "standard" | "demanding">("standard");

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | "Easy" | "Medium" | "Hard">("all");

  const { data: dsaItems = [], isLoading: loadingDsa } = useDSAItems();
  const { data: mcItems = [], isLoading: loadingMc } = useMachineCodingItems();

  useEffect(() => {
    const savedKey = localStorage.getItem("streakly:dsa:gemini_api_key") || "";
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setShowKeyInput(true);
    }
  }, []);

  const availableProblemsList = useMemo(() => {
    if (type === "system-design") {
      return INTERVIEW_PRESETS.filter((p) => p.type === "system-design").map((p) => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty as "Easy" | "Medium" | "Hard",
        source: "Architecture Preset",
        description: p.description,
      }));
    }

    if (problemSource === "preset") {
      return INTERVIEW_PRESETS.filter((p) => p.type === type).map((p) => ({
        id: p.id,
        title: p.title,
        difficulty: p.difficulty as "Easy" | "Medium" | "Hard",
        source: "Coding Preset",
        description: p.description,
      }));
    }

    if (problemSource === "dsa") {
      return dsaItems.map((p) => ({
        id: p.id,
        title: p.problemName,
        difficulty: (p.difficulty || "Medium") as "Easy" | "Medium" | "Hard",
        source: "DSA Vault",
        description: `Intuition:\n${p.intuition || "N/A"}\n\nTopics:\n${(p.topics || []).join(", ")}`,
      }));
    }

    if (problemSource === "machine-coding") {
      return mcItems.map((p) => ({
        id: p.id,
        title: p.questionName,
        difficulty: "Medium" as "Easy" | "Medium" | "Hard",
        source: `Machine Coding [${p.language}]`,
        description: `Approach:\n${p.approach || "N/A"}`,
      }));
    }

    return [];
  }, [type, problemSource, dsaItems, mcItems]);

  const filteredProblems = useMemo(() => {
    return availableProblemsList.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === "all" || p.difficulty === difficultyFilter;
      return matchesSearch && matchesDifficulty;
    });
  }, [availableProblemsList, searchQuery, difficultyFilter]);

  useEffect(() => {
    if (filteredProblems.length > 0) {
      const stillExists = filteredProblems.some((p) => p.id === selectedProblemId);
      if (!stillExists) {
        setSelectedProblemId(filteredProblems[0].id);
      }
    } else {
      setSelectedProblemId("");
    }
  }, [filteredProblems, selectedProblemId]);

  const handleSaveKey = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    localStorage.setItem("streakly:dsa:gemini_api_key", trimmed);
    setShowKeyInput(false);
  };

  const handleStart = () => {
    if (!apiKey.trim()) {
      alert("Please configure a valid Gemini API Key first.");
      return;
    }

    const selectedObj = availableProblemsList.find((p) => p.id === selectedProblemId);
    if (!selectedObj) {
      alert("Please select a problem to start.");
      return;
    }

    onStart({
      apiKey,
      type,
      problemTitle: selectedObj.title,
      problemDescription: selectedObj.description,
      difficulty: selectedObj.difficulty,
      interviewerStyle,
    });
  };

  const getDifficultyColor = (diff: "Easy" | "Medium" | "Hard") => {
    switch (diff) {
      case "Easy":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Hard":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "Medium":
      default:
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 py-6 px-4">
      {/* Radial Grid Background Glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,var(--color-primary)_0%,transparent_80%)] opacity-[0.06] dark:opacity-[0.09]" />

      {/* ── Header Area ── */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/10 bg-primary/[0.03] text-[10px] font-black uppercase tracking-widest text-primary/80 dark:border-primary/20 dark:bg-primary/[0.05]"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Technical Mock Simulator
        </motion.div>
        
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-foreground font-v-headings leading-none">
          Live Mock Interview Arena
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Select your target workspace, configure your interviewer persona, and begin simulated FAANG technical interview loops with real-time diagnostic grading.
        </p>
      </div>

      {/* ── Setup Bento Board ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Format & Persona (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div className="flex-1 rounded-3xl border border-border bg-card/45 backdrop-blur-xl p-6 md:p-8 space-y-6 shadow-sm flex flex-col justify-between">
            
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary border-b border-border/40 pb-2.5 flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                Interviewer Profiles
              </h3>

              {/* API Configuration */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-primary" />
                    Gemini API Configuration
                  </label>
                  {apiKey && (
                    <button
                      type="button"
                      onClick={() => setShowKeyInput(!showKeyInput)}
                      className="text-[10px] text-primary hover:underline font-bold"
                    >
                      {showKeyInput ? "Cancel" : "Change"}
                    </button>
                  )}
                </div>

                {showKeyInput ? (
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Enter API Key"
                      className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs focus:outline-none focus:border-primary/50 text-foreground shadow-inner"
                      defaultValue={apiKey}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveKey(e.currentTarget.value);
                      }}
                      id="gemini-key-input"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById("gemini-key-input") as HTMLInputElement;
                        handleSaveKey(input?.value || "");
                      }}
                      className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition-all"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl border border-border bg-background/35 text-[11px] text-muted-foreground font-mono">
                    <span>••••••••••••••••••••••••••••••••</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold ml-auto uppercase tracking-widest">
                      Synced
                    </span>
                  </div>
                )}
              </div>

              {/* Format Selectors */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-primary" />
                  Interview Challenge Format
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { id: "dsa-python", label: "DSA Playground (Python)", icon: Code, desc: "Run and test algorithm inputs in Pyodide WASM" },
                    { id: "dsa-js", label: "Frontend Playground (JS/TS)", icon: Cpu, desc: "Execute JavaScript code blocks natively in-browser" },
                    { id: "system-design", label: "System Architecture Board", icon: Layers, desc: "Map architectural systems in a design notepad" },
                  ].map((opt) => {
                    const isSelected = type === opt.id;
                    return (
                      <motion.button
                        whileHover={{ y: -1 }}
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setType(opt.id as any);
                          if (opt.id === "system-design") {
                            setProblemSource("preset");
                          }
                        }}
                        className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                          isSelected
                            ? "border-primary bg-primary/[0.02] shadow-inner"
                            : "border-border/60 bg-background/10 text-muted-foreground hover:text-foreground hover:bg-background/40"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          </div>
                        )}
                        <div className={`p-2.5 rounded-xl border ${isSelected ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border/40 text-muted-foreground"}`}>
                          <opt.icon className="h-4.5 w-4.5" />
                        </div>
                        <div className="pr-6">
                          <div className="text-xs font-black text-foreground">{opt.label}</div>
                          <div className="text-[10px] leading-tight text-muted-foreground/80 mt-0.5">{opt.desc}</div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Interviewer Personas */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                  Interviewer Persona Strictness
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: "friendly",
                      label: "Coach",
                      accent: "border-emerald-500 bg-emerald-500/5 text-emerald-600 hover:border-emerald-500/40 hover:bg-emerald-500/5",
                      normal: "border-border bg-background/10 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] text-muted-foreground hover:text-emerald-500",
                    },
                    {
                      id: "standard",
                      label: "Standard",
                      accent: "border-blue-500 bg-blue-500/5 text-blue-600 hover:border-blue-500/40 hover:bg-blue-500/5",
                      normal: "border-border bg-background/10 hover:border-blue-500/30 hover:bg-blue-500/[0.02] text-muted-foreground hover:text-blue-500",
                    },
                    {
                      id: "demanding",
                      label: "Principal",
                      accent: "border-rose-500 bg-rose-500/5 text-rose-600 hover:border-rose-500/40 hover:bg-rose-500/5",
                      normal: "border-border bg-background/10 hover:border-rose-500/30 hover:bg-rose-500/[0.02] text-muted-foreground hover:text-rose-500",
                    },
                  ].map((style) => {
                    const isSelected = interviewerStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setInterviewerStyle(style.id as any)}
                        className={`py-3 px-1 rounded-xl border text-center transition-all cursor-pointer text-xs font-black uppercase tracking-wider ${
                          isSelected ? style.accent : style.normal
                        }`}
                      >
                        {style.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Right Column: Problem Select Grid (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          <div className="flex-1 rounded-3xl border border-border bg-card/45 backdrop-blur-xl p-6 md:p-8 space-y-6 shadow-sm flex flex-col justify-between h-full">
            
            <div className="space-y-6 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b border-border/40 pb-2.5 shrink-0">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Select Challenge
                </h3>
                
                {type !== "system-design" && (
                  <div className="flex bg-muted/65 p-0.5 rounded-lg border border-border/50">
                    {[
                      { id: "preset", label: "Presets" },
                      { id: "dsa", label: "DSA Arena" },
                      { id: "machine-coding", label: "My Vault" },
                    ].map((src) => (
                      <button
                        key={src.id}
                        type="button"
                        onClick={() => setProblemSource(src.id as any)}
                        className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                          problemSource === src.id
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {src.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Filters Ribbon */}
              <div className="flex gap-2.5 shrink-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="text"
                    placeholder="Search problem title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                {type !== "system-design" && (
                  <div className="flex items-center gap-1.5 bg-background border border-border rounded-xl px-3">
                    <Sliders className="h-3.5 w-3.5 text-muted-foreground/60" />
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value as any)}
                      className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none text-muted-foreground cursor-pointer focus:ring-0 focus:text-foreground"
                    >
                      <option value="all">All Difficulties</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Scrollable Selector Grid */}
              <div className="flex-1 overflow-y-auto max-h-[320px] pr-1.5 space-y-2 mt-2">
                <AnimatePresence mode="popLayout">
                  {filteredProblems.map((prob) => {
                    const isSelected = selectedProblemId === prob.id;
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        key={prob.id}
                        onClick={() => setSelectedProblemId(prob.id)}
                        className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex items-center justify-between group relative overflow-hidden ${
                          isSelected
                            ? "border-primary bg-primary/[0.02] shadow-inner"
                            : "border-border bg-background/10 hover:bg-background/80 hover:border-primary/30"
                        }`}
                      >
                        <div className="space-y-1.5 pr-6 z-10">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] font-black uppercase tracking-widest border px-2.5 py-0.5 rounded-full ${getDifficultyColor(prob.difficulty)}`}>
                              {prob.difficulty}
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider bg-muted/40 px-2 py-0.5 rounded-md">
                              {prob.source}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                            {prob.title}
                          </h4>
                        </div>
                        
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 border z-10 transition-all ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground scale-105"
                            : "border-border/65 text-transparent group-hover:border-primary/40"
                        }`}>
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredProblems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3 border border-dashed border-border/80 rounded-2xl bg-background/[0.03]">
                    <HelpCircle className="h-7 w-7 text-muted-foreground/45" />
                    <div className="text-xs text-muted-foreground font-bold">No challenge entries match this query.</div>
                  </div>
                )}
              </div>

            </div>

            {/* Selection details preview card */}
            {selectedProblemId && (
              <div className="mt-4 p-4 rounded-2xl border border-border/50 bg-background/30 shrink-0 select-none relative overflow-hidden">
                <div className="absolute top-0 right-0 h-16 w-16 bg-primary/[0.01] blur-md rounded-full pointer-events-none" />
                <span className="text-[9px] font-black uppercase tracking-widest text-primary/70 block mb-1.5">
                  Question Outline
                </span>
                <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
                  {availableProblemsList.find((p) => p.id === selectedProblemId)?.description}
                </p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Start Arena button */}
      <div className="flex justify-center pt-4">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleStart}
          disabled={!apiKey || !selectedProblemId}
          className="w-full max-w-xl rounded-2xl bg-primary py-4.5 font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none relative overflow-hidden"
        >
          <Play className="h-4.5 w-4.5 fill-current" />
          Enter Practice Arena
        </motion.button>
      </div>

    </div>
  );
}
