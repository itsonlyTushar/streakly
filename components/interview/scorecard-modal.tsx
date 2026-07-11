"use client";

import React from "react";
import { Award, CheckCircle2, AlertTriangle, BookOpen, RotateCcw, X } from "lucide-react";

interface ScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationMarkdown: string;
  onRestart: () => void;
}

// Inline markdown renderer helper
function ScorecardMarkdown({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground/90 font-v-body">
      {parts.map((part, index) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "";
          const code = match ? match[2] : part.slice(3, -3);
          return (
            <pre key={index} className="p-4 rounded-xl bg-slate-950/80 border border-border/60 overflow-x-auto text-xs font-mono my-3 text-emerald-400">
              <code>{code.trim()}</code>
            </pre>
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
                  <ul key={`ul-${key}`} className="list-disc pl-5 space-y-1.5 my-2 text-foreground/80">
                    {currentListItems}
                  </ul>
                );
              } else if (listType === "ol") {
                renderedElements.push(
                  <ol key={`ol-${key}`} className="list-decimal pl-5 space-y-1.5 my-2 text-foreground/80">
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
                <h3 key={`h3-${i}`} className="text-base font-bold text-foreground mt-4 mb-2">
                  {renderScorecardInlineMarkdown(trimmed.slice(4))}
                </h3>
              );
              continue;
            }
            if (trimmed.startsWith("## ")) {
              flushList(`h2-${i}`);
              renderedElements.push(
                <h2 key={`h2-${i}`} className="text-lg font-black text-foreground mt-5 mb-2.5 border-b border-border/30 pb-1">
                  {renderScorecardInlineMarkdown(trimmed.slice(3))}
                </h2>
              );
              continue;
            }
            if (trimmed.startsWith("# ")) {
              flushList(`h1-${i}`);
              renderedElements.push(
                <h1 key={`h1-${i}`} className="text-xl font-extrabold text-foreground mt-6 mb-3">
                  {renderScorecardInlineMarkdown(trimmed.slice(2))}
                </h1>
              );
              continue;
            }

            // Horizontal Rule
            if (trimmed === "---") {
              flushList(`hr-${i}`);
              renderedElements.push(<hr key={`hr-${i}`} className="my-4 border-border/40" />);
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
                <li key={`li-${i}`} className="leading-relaxed">
                  {renderScorecardInlineMarkdown(bulletMatch[2])}
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
                <li key={`li-${i}`} className="leading-relaxed">
                  {renderScorecardInlineMarkdown(numMatch[2])}
                </li>
              );
              continue;
            }

            // Blockquote
            if (trimmed.startsWith("> ")) {
              flushList(`quote-${i}`);
              renderedElements.push(
                <blockquote key={`quote-${i}`} className="border-l-4 border-primary/40 pl-4 py-1 italic bg-primary/5 rounded-r-lg my-3 text-muted-foreground">
                  {renderScorecardInlineMarkdown(trimmed.slice(2))}
                </blockquote>
              );
              continue;
            }

            // Normal text paragraph
            flushList(`para-${i}`);
            renderedElements.push(
              <p key={`p-${i}`} className="my-1.5 leading-relaxed">
                {renderScorecardInlineMarkdown(line)}
              </p>
            );
          }

          flushList(`final-${index}`);
          return <div key={index} className="space-y-1">{renderedElements}</div>;
        }
      })}
    </div>
  );
}

function renderScorecardInlineMarkdown(text: string) {
  let tokens: (string | React.ReactNode)[] = [text];

  // 1. Process Code snippets: `code`
  tokens = tokens.flatMap((token) => {
    if (typeof token !== "string") return token;
    const parts = token.split(/(`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={`code-${idx}`} className="px-1.5 py-0.5 rounded bg-secondary font-mono text-xs text-primary border border-border/25">
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
          <strong key={`bold-${idx}`} className="font-bold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  });

  return tokens;
}

export function ScorecardModal({ isOpen, onClose, evaluationMarkdown, onRestart }: ScorecardModalProps) {
  if (!isOpen) return null;

  // Extract score if possible (e.g. looks for "Score: XX/100" or similar)
  const extractScoreAndRatings = () => {
    let score = "N/A";
    let techScore = 0;
    let commScore = 0;
    let complexScore = 0;

    const scoreMatch = evaluationMarkdown.match(/Overall Score:\s*(\d+)\/100/i) || evaluationMarkdown.match(/Score:\s*(\d+)\/100/i);
    if (scoreMatch) {
      score = scoreMatch[1];
    }

    const techMatch = evaluationMarkdown.match(/Technical[\w\s]*:\s*(\d+)\/10/i);
    if (techMatch) techScore = parseInt(techMatch[1], 10) * 10;

    const commMatch = evaluationMarkdown.match(/Communication[\w\s]*:\s*(\d+)\/10/i);
    if (commMatch) commScore = parseInt(commMatch[1], 10) * 10;

    const compMatch = evaluationMarkdown.match(/Complexity[\w\s]*:\s*(\d+)\/10/i) || evaluationMarkdown.match(/Analysis[\w\s]*:\s*(\d+)\/10/i);
    if (compMatch) complexScore = parseInt(compMatch[1], 10) * 10;

    // Fallbacks if not matching format exactly
    if (!techScore) techScore = score !== "N/A" ? parseInt(score) : 70;
    if (!commScore) commScore = score !== "N/A" ? Math.min(100, parseInt(score) + 5) : 75;
    if (!complexScore) complexScore = score !== "N/A" ? Math.max(0, parseInt(score) - 5) : 65;

    return { score, techScore, commScore, complexScore };
  };

  const { score, techScore, commScore, complexScore } = extractScoreAndRatings();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-card rounded-3xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-card/50">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-black tracking-tight text-foreground">
              Mock Interview Scorecard
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          
          {/* Top Panel - Score Visuals */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Big Badge Card */}
            <div className="md:col-span-1 flex flex-col items-center justify-center p-6 rounded-2xl border border-primary/20 bg-primary/5 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">
                Overall Score
              </span>
              <div className="text-6xl font-black text-foreground tracking-tighter">
                {score}
              </div>
              <span className="text-xs text-muted-foreground font-semibold mt-1">
                out of 100
              </span>
            </div>

            {/* Sub ratings progress bars */}
            <div className="md:col-span-3 space-y-4 flex flex-col justify-center">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
                Score Breakdown
              </h4>

              {/* Technical Code */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Technical Code & Logic
                  </span>
                  <span>{techScore / 10} / 10</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${techScore}%` }}
                  />
                </div>
              </div>

              {/* Communication */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    Communication & Clarity
                  </span>
                  <span>{commScore / 10} / 10</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${commScore}%` }}
                  />
                </div>
              </div>

              {/* Complexity Analysis */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-foreground">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Complexity Analysis
                  </span>
                  <span>{complexScore / 10} / 10</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${complexScore}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* AI Feedback Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground border-b border-border pb-1">
              Detailed AI Review
            </h3>
            <div className="p-6 rounded-2xl border border-border bg-muted/20">
              <ScorecardMarkdown text={evaluationMarkdown} />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 px-6 py-4 border-t border-border bg-card/50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          >
            Close Report
          </button>
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-xs font-black uppercase tracking-widest text-primary-foreground hover:opacity-90 shadow-md shadow-primary/10 transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            Start New Mock
          </button>
        </div>

      </div>
    </div>
  );
}
