"use client";

import { RevisionCalendar } from "@/components/srs/revision-calendar";
import { RevisionHeatmap } from "@/components/srs/revision-heatmap";
import { ConsolidatedList } from "@/components/consolidated-list";
import { CalendarDays, Sparkles } from "lucide-react";

export default function CalendarPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-24 px-4 sm:px-6 relative">
      {/* Decorative Ambient Glass Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-40 right-0 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Header Hero Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4 border-b border-border/20 pb-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 dark:bg-violet-500/15 border border-violet-500/20 text-violet-600 dark:text-violet-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Spaced Repetition & Revision Hub</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tighter bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            Revision Calendar
          </h1>
          <p className="text-muted-foreground font-medium text-sm md:text-base max-w-md leading-relaxed">
            Visualize active retention paths, scheduled SRS reviews, DSA problems, and daily tasks in one unified glass view.
          </p>
        </div>
      </header>

      {/* Revision Calendar Dashboard */}
      <RevisionCalendar />

      {/* Learning & Revision Heatmap */}
      <RevisionHeatmap />

      {/* Consolidated Top 5 — Tasks + SRS + DSA + Machine Coding */}
      <ConsolidatedList />
    </div>
  );
}
