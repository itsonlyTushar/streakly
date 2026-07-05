import React from "react";
import { Database, HelpCircle } from "lucide-react";
import { UserProgressContext } from "@/services/ai/rag.service";

interface ContextStatusProps {
  context: UserProgressContext | null;
  loading: boolean;
}

export function ContextStatus({ context, loading }: ContextStatusProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse py-1 px-2.5 rounded-full bg-secondary/50 border border-border/20 w-fit">
        <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-ping" />
        <span>Indexing your workspace...</span>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="flex items-center gap-2 text-xs text-destructive py-1 px-2.5 rounded-full bg-destructive/10 border border-destructive/20 w-fit">
        <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
        <span>Offline context</span>
      </div>
    );
  }

  const goalsCount = context.activeGoals.length + context.completedGoals.length;
  const dsaCount = context.dsaProblems.length;
  const notesCount = context.notes.length;
  const mcCount = context.machineCoding.length;
  const totalItems = goalsCount + dsaCount + notesCount + mcCount;

  return (
    <div className="group relative flex items-center gap-2 text-[11px] text-muted-foreground bg-secondary/80 hover:bg-secondary border border-border/40 py-1 px-2.5 rounded-full transition-all duration-200 cursor-help w-fit select-none">
      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 relative">
        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
      </div>
      <div className="flex items-center gap-1">
        <Database className="h-3 w-3 text-muted-foreground/75" />
        <span>
          Workspace Synced: {totalItems} items
        </span>
      </div>

      {/* Tooltip on Hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-popover text-popover-foreground border border-border/60 rounded-xl shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 pointer-events-none z-50 text-xs leading-relaxed font-normal">
        <p className="font-semibold mb-1 text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Database className="h-3 w-3 text-primary" /> Connected Datasets
        </p>
        <ul className="space-y-1 text-muted-foreground">
          <li className="flex justify-between">
            <span>Active/Done Goals:</span>
            <span className="font-semibold text-foreground">{goalsCount}</span>
          </li>
          <li className="flex justify-between">
            <span>DSA Problems:</span>
            <span className="font-semibold text-foreground">{dsaCount}</span>
          </li>
          <li className="flex justify-between">
            <span>Study Notes:</span>
            <span className="font-semibold text-foreground">{notesCount}</span>
          </li>
          <li className="flex justify-between">
            <span>Machine Coding:</span>
            <span className="font-semibold text-foreground">{mcCount}</span>
          </li>
        </ul>
        <p className="mt-1.5 pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground/80">
          Your local data is injected as AI context securely in your browser.
        </p>
      </div>
    </div>
  );
}
