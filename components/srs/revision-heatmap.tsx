"use client";

import React, { useState, useMemo } from "react";
import {
  format,
  subDays,
  startOfWeek,
  eachDayOfInterval,
  isSameDay,
  startOfDay,
  parseISO,
  getDay,
  isPast,
  isToday,
} from "date-fns";
import {
  Brain,
  Code,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSRSItems } from "@/hooks/use-srs";
import { useDSAItems } from "@/hooks/use-dsa";
import { Tooltip } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

export function RevisionHeatmap() {
  const { data: srsItems = [], isLoading: isSrsLoading } = useSRSItems();
  const { data: dsaItems = [], isLoading: isDsaLoading } = useDSAItems();

  const [filterType, setFilterType] = useState<"all" | "srs" | "dsa">("all");
  const [metricType, setMetricType] = useState<"combined" | "scheduled" | "learned">("combined");
  
  // Selected date for displaying details below heatmap
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Generate grid days for the last 365 days, starting on the Sunday of 52 weeks ago
  const gridDays = useMemo(() => {
    const today = new Date();
    const startDate = startOfWeek(subDays(today, 364)); // ~52 weeks ago
    return eachDayOfInterval({ start: startDate, end: today });
  }, []);

  // Helper to convert Firestore Timestamps safely to local dates
  const parseDate = (timestamp: any) => {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    // Handle serialized objects
    if (timestamp.seconds !== undefined) {
      return new Date(timestamp.seconds * 1000);
    }
    return new Date(timestamp);
  };

  // Build key-value map of date strings ("yyyy-MM-dd") to activity details
  const activityMap = useMemo(() => {
    const map: Record<
      string,
      {
        learnedSRS: any[];
        learnedDSA: any[];
        scheduledSRS: any[];
        scheduledDSA: any[];
      }
    > = {};

    const getOrCreate = (date: Date) => {
      const key = format(startOfDay(date), "yyyy-MM-dd");
      if (!map[key]) {
        map[key] = {
          learnedSRS: [],
          learnedDSA: [],
          scheduledSRS: [],
          scheduledDSA: [],
        };
      }
      return map[key];
    };

    // Populate SRS Items
    srsItems.forEach((item) => {
      // Learned/Created dates
      const createdDate = parseDate(item.createdAt) || parseDate(item.dateLearned);
      if (createdDate) {
        getOrCreate(createdDate).learnedSRS.push(item);
      }
      // Scheduled revisions
      const reviewDate = parseDate(item.nextReviewDate);
      if (reviewDate) {
        getOrCreate(reviewDate).scheduledSRS.push(item);
      }
    });

    // Populate DSA Items
    dsaItems.forEach((item) => {
      // Learned/Created dates
      const createdDate = parseDate(item.createdAt) || parseDate(item.dateLearned);
      if (createdDate) {
        getOrCreate(createdDate).learnedDSA.push(item);
      }
      // Scheduled revisions
      const reviewDate = parseDate(item.nextReviewDate);
      if (reviewDate) {
        getOrCreate(reviewDate).scheduledDSA.push(item);
      }
    });

    return map;
  }, [srsItems, dsaItems]);

  // Aggregate stats per day based on filters
  const getDayStats = (date: Date) => {
    const key = format(startOfDay(date), "yyyy-MM-dd");
    const data = activityMap[key] || {
      learnedSRS: [],
      learnedDSA: [],
      scheduledSRS: [],
      scheduledDSA: [],
    };

    const srsLearned = filterType === "all" || filterType === "srs" ? data.learnedSRS : [];
    const dsaLearned = filterType === "all" || filterType === "dsa" ? data.learnedDSA : [];
    const srsScheduled = filterType === "all" || filterType === "srs" ? data.scheduledSRS : [];
    const dsaScheduled = filterType === "all" || filterType === "dsa" ? data.scheduledDSA : [];

    const learnedCount = srsLearned.length + dsaLearned.length;
    const scheduledCount = srsScheduled.length + dsaScheduled.length;

    let score = 0;
    if (metricType === "combined") {
      score = learnedCount + scheduledCount;
    } else if (metricType === "learned") {
      score = learnedCount;
    } else {
      score = scheduledCount;
    }

    return {
      learnedSRS: srsLearned,
      learnedDSA: dsaLearned,
      scheduledSRS: srsScheduled,
      scheduledDSA: dsaScheduled,
      learnedCount,
      scheduledCount,
      score,
    };
  };

  // Group columns by month for month labels at the top of the grid
  const monthLabels = useMemo(() => {
    const labels: { text: string; colSpan: number }[] = [];
    let currentMonthStr = "";
    let count = 0;

    // Standardize mapping 7-day columns
    gridDays.forEach((day, index) => {
      // We only read month change at the start of a week column (index % 7 === 0)
      if (index % 7 === 0) {
        const mStr = format(day, "MMM");
        if (mStr !== currentMonthStr) {
          if (count > 0) {
            labels.push({ text: currentMonthStr, colSpan: count });
          }
          currentMonthStr = mStr;
          count = 1;
        } else {
          count++;
        }
      }
    });

    if (count > 0) {
      labels.push({ text: currentMonthStr, colSpan: count });
    }

    return labels;
  }, [gridDays]);

  // Selected Day Details
  const selectedDayDetails = useMemo(() => {
    if (!selectedDate) return null;
    const stats = getDayStats(selectedDate);
    return {
      date: selectedDate,
      ...stats,
    };
  }, [selectedDate, activityMap, filterType, metricType]);

  // Overall Statistics for metrics cards
  const summaryStats = useMemo(() => {
    let totalLearned = 0;
    let totalScheduled = 0;
    let activeStreak = 0;
    let highestDailyCount = 0;

    gridDays.forEach((day) => {
      const stats = getDayStats(day);
      totalLearned += stats.learnedCount;
      totalScheduled += stats.scheduledCount;
      if (stats.score > highestDailyCount) {
        highestDailyCount = stats.score;
      }
    });

    // Simple Streak calculation backwards from today
    let tempDate = new Date();
    while (true) {
      const stats = getDayStats(tempDate);
      if (stats.score > 0) {
        activeStreak++;
        tempDate = subDays(tempDate, 1);
      } else {
        break;
      }
    }

    return {
      totalLearned,
      totalScheduled,
      activeStreak,
      highestDailyCount,
    };
  }, [gridDays, activityMap, filterType, metricType]);

  const isLoading = isSrsLoading || isDsaLoading;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-secondary/50 rounded-md" />
        <div className="h-[120px] bg-secondary/35 rounded-2xl" />
        <div className="h-20 bg-secondary/30 rounded-2xl" />
      </div>
    );
  }

  // Get color scale classes based on metric score and selection type
  const getCellColor = (score: number) => {
    if (score === 0) return "bg-secondary/30 dark:bg-secondary/15 hover:bg-secondary/60 dark:hover:bg-secondary/30";

    // Green hues for DSA only, Blue hues for SRS only, Purple/Violet for Combined
    if (filterType === "dsa") {
      if (score === 1) return "bg-emerald-500/20 border border-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400";
      if (score === 2) return "bg-emerald-500/40 border border-emerald-500/20 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300";
      if (score <= 4) return "bg-emerald-500 text-white dark:bg-emerald-600";
      return "bg-emerald-700 text-white dark:bg-emerald-500";
    }

    if (filterType === "srs") {
      if (score === 1) return "bg-blue-500/20 border border-blue-500/10 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400";
      if (score === 2) return "bg-blue-500/40 border border-blue-500/20 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300";
      if (score <= 4) return "bg-blue-500 text-white dark:bg-blue-600";
      return "bg-blue-700 text-white dark:bg-blue-500";
    }

    // Default: Combined (Violet/Indigo Theme)
    if (score === 1) return "bg-violet-500/20 border border-violet-500/10 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400";
    if (score === 2) return "bg-violet-500/40 border border-violet-500/20 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300";
    if (score <= 4) return "bg-violet-500 text-white dark:bg-violet-600";
    return "bg-violet-700 text-white dark:bg-violet-500";
  };

  return (
    <div className="bg-white dark:bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Header and Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Milestone Metrics
          </div>
          <h3 className="text-xl font-bold tracking-tight">Learning & Revision Intensity</h3>
          <p className="text-xs text-muted-foreground">
            A combined retrospective of your daily DSA practice and SRS milestones.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Module filter */}
          <div className="bg-secondary/60 p-1 rounded-xl flex items-center gap-1 border border-border/10">
            <button
              onClick={() => setFilterType("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                filterType === "all"
                  ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              All Items
            </button>
            <button
              onClick={() => setFilterType("dsa")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                filterType === "dsa"
                  ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              DSA Practiced
            </button>
            <button
              onClick={() => setFilterType("srs")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                filterType === "srs"
                  ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              SRS Reviewed
            </button>
          </div>

          {/* Metric mode filter */}
          <div className="bg-secondary/60 p-1 rounded-xl flex items-center gap-1 border border-border/10">
            <button
              onClick={() => setMetricType("combined")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                metricType === "combined"
                  ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              Combined
            </button>
            <button
              onClick={() => setMetricType("learned")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                metricType === "learned"
                  ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              Learned
            </button>
            <button
              onClick={() => setMetricType("scheduled")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                metricType === "scheduled"
                  ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              Scheduled
            </button>
          </div>
        </div>
      </div>

      {/* Mini Stats Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-secondary/[0.04] border border-border/30 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
            Practice Streak
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold">{summaryStats.activeStreak}</span>
            <span className="text-xs text-muted-foreground">days</span>
          </div>
        </div>
        <div className="bg-secondary/[0.04] border border-border/30 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
            Items Learned
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold">{summaryStats.totalLearned}</span>
            <span className="text-xs text-muted-foreground">total</span>
          </div>
        </div>
        <div className="bg-secondary/[0.04] border border-border/30 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
            Revisions Plotted
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold">{summaryStats.totalScheduled}</span>
            <span className="text-xs text-muted-foreground">due dates</span>
          </div>
        </div>
        <div className="bg-secondary/[0.04] border border-border/30 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
            Max Daily Action
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold">{summaryStats.highestDailyCount}</span>
            <span className="text-xs text-muted-foreground">in a day</span>
          </div>
        </div>
      </div>

      {/* Grid Container */}
      <div className="space-y-2">
        <div className="overflow-x-auto scrollbar-thin pb-2 select-none">
          <div className="min-w-[760px] flex flex-col">
            {/* Month Headings Row */}
            <div className="flex pl-8 mb-1">
              {monthLabels.map((month, idx) => (
                <div
                  key={idx}
                  className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 text-left"
                  style={{
                    width: `${(month.colSpan / 53) * 100}%`,
                    minWidth: `${month.colSpan * 14}px`,
                  }}
                >
                  {month.text}
                </div>
              ))}
            </div>

            {/* Grid Area with Day Labels */}
            <div className="flex items-start">
              {/* Day Labels Column */}
              <div className="w-8 flex flex-col justify-between h-[105px] pr-2 text-right">
                <span className="text-[8px] font-black uppercase text-muted-foreground/40 leading-none">Mon</span>
                <span className="text-[8px] font-black uppercase text-muted-foreground/40 leading-none">Wed</span>
                <span className="text-[8px] font-black uppercase text-muted-foreground/40 leading-none">Fri</span>
              </div>

              {/* Heatmap Grid Cells */}
              <div className="grid grid-rows-7 grid-flow-col gap-[3px] flex-1">
                {gridDays.map((day) => {
                  const stats = getDayStats(day);
                  const isDaySelected = selectedDate && isSameDay(day, selectedDate);
                  
                  // Label for Tooltip
                  const tooltipContent = `${format(day, "MMM d, yyyy")}: ${stats.score} ${
                    metricType === "combined"
                      ? "activities"
                      : metricType === "learned"
                      ? "items learned"
                      : "revisions scheduled"
                  } (${stats.learnedCount} learned, ${stats.scheduledCount} scheduled)`;

                  return (
                    <Tooltip key={day.toString()} content={tooltipContent} side="top">
                      <button
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "w-[12px] h-[12px] rounded-sm transition-all relative focus:outline-none",
                          getCellColor(stats.score),
                          isDaySelected && "ring-2 ring-primary ring-offset-2 dark:ring-offset-card scale-110 z-10",
                          isToday(day) && "ring-1 ring-primary/40"
                        )}
                        style={{ contentVisibility: "auto" }}
                      />
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center justify-end gap-1.5 text-[9px] font-bold text-muted-foreground/80 pr-1">
          <span>Less</span>
          <div className="w-[10px] h-[10px] rounded-sm bg-secondary/30 dark:bg-secondary/15" />
          <div className={cn("w-[10px] h-[10px] rounded-sm", getCellColor(1))} />
          <div className={cn("w-[10px] h-[10px] rounded-sm", getCellColor(2))} />
          <div className={cn("w-[10px] h-[10px] rounded-sm", getCellColor(3))} />
          <div className={cn("w-[10px] h-[10px] rounded-sm", getCellColor(5))} />
          <span>More</span>
        </div>
      </div>

      {/* Selected Day Details Panel */}
      <AnimatePresence mode="wait">
        {selectedDayDetails && (
          <motion.div
            key={selectedDayDetails.date.toString()}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="border border-border/40 bg-secondary/[0.04] dark:bg-zinc-900/[0.08] rounded-2xl p-4 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border/30 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary/70" />
                <h4 className="font-bold text-sm">
                  {format(selectedDayDetails.date, "EEEE, MMMM d, yyyy")}
                </h4>
                {isToday(selectedDayDetails.date) && (
                  <span className="text-[8px] font-black uppercase bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                    Today
                  </span>
                )}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase">
                {selectedDayDetails.score} Actions logged
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Learned Column */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-emerald-500" />
                  Knowledge Acquired ({selectedDayDetails.learnedCount})
                </div>

                {selectedDayDetails.learnedCount === 0 ? (
                  <p className="text-xs text-muted-foreground/60 italic pl-1">
                    No items learned on this day.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDayDetails.learnedDSA.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-white dark:bg-zinc-900/60 p-2 rounded-xl border border-border/20 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Code className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                          <span className="font-bold truncate">{item.problemName}</span>
                        </div>
                        <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                          DSA
                        </span>
                      </div>
                    ))}
                    {selectedDayDetails.learnedSRS.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-white dark:bg-zinc-900/60 p-2 rounded-xl border border-border/20 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Brain className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                          <span className="font-bold truncate">{item.topic}</span>
                        </div>
                        <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded flex-shrink-0">
                          SRS
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scheduled Revisions Column */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <Layers className="h-3 w-3 text-violet-500" />
                  Scheduled Revisions ({selectedDayDetails.scheduledCount})
                </div>

                {selectedDayDetails.scheduledCount === 0 ? (
                  <p className="text-xs text-muted-foreground/60 italic pl-1">
                    No milestone revisions scheduled on this day.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedDayDetails.scheduledDSA.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-white dark:bg-zinc-900/60 p-2 rounded-xl border border-border/20 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Code className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                          <span className="font-bold truncate">{item.problemName}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[8px] font-black text-muted-foreground uppercase">
                            Step {item.reviewCount + 1}
                          </span>
                          <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            DSA
                          </span>
                        </div>
                      </div>
                    ))}
                    {selectedDayDetails.scheduledSRS.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between bg-white dark:bg-zinc-900/60 p-2 rounded-xl border border-border/20 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Brain className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                          <span className="font-bold truncate">{item.topic}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[8px] font-black text-muted-foreground uppercase">
                            Step {item.reviewCount + 1}
                          </span>
                          <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded">
                            SRS
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
