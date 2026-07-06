"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Brain,
  Code,
  ListTodo,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
} from "lucide-react";
import { isToday, isPast, startOfDay, format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

import { useAuthGuard } from "@/components/auth-guard";
import { useToast } from "@/components/ui/toast";

import { useTasks, useUpdateTask } from "@/hooks/use-tasks";
import { useSRSItems, useUpdateSRSItem } from "@/hooks/use-srs";
import { useDSAItems, useUpdateDSAItem } from "@/hooks/use-dsa";
import { useMachineCodingItems } from "@/hooks/use-machine-coding";

import { PRIORITY_META } from "@/components/tasks/task-ui";
import { calculateNextReviewDate } from "@/lib/srs-utils";

// ---------------------------------------------------------------------------
// Unified item type used by the consolidated list
// ---------------------------------------------------------------------------
type ConsolidatedSource = "task" | "srs" | "dsa" | "machine-coding";

interface ConsolidatedItem {
  id: string;
  source: ConsolidatedSource;
  title: string;
  subtitle?: string;
  urgency: number; // lower = more urgent
  isOverdue: boolean;
  isDueToday: boolean;
  raw: any;
}

// ---------------------------------------------------------------------------
// Source metadata for badges & colors
// ---------------------------------------------------------------------------
const SOURCE_META: Record<
  ConsolidatedSource,
  {
    label: string;
    icon: React.ElementType;
    badge: string;
    check: string;
    glow: string;
    ring: string;
  }
> = {
  task: {
    label: "Task",
    icon: ListTodo,
    badge:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    check: "text-violet-500",
    glow: "shadow-violet-500/20",
    ring: "ring-violet-500/30",
  },
  srs: {
    label: "SRS",
    icon: Brain,
    badge:
      "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
    check: "text-sky-500",
    glow: "shadow-sky-500/20",
    ring: "ring-sky-500/30",
  },
  dsa: {
    label: "DSA",
    icon: Code,
    badge:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    check: "text-amber-500",
    glow: "shadow-amber-500/20",
    ring: "ring-amber-500/30",
  },
  "machine-coding": {
    label: "Machine Coding",
    icon: Sparkles,
    badge:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    check: "text-emerald-500",
    glow: "shadow-emerald-500/20",
    ring: "ring-emerald-500/30",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConsolidatedList() {
  const { data: tasks = [], isLoading: isTasksLoading } = useTasks();
  const { data: srsItems = [], isLoading: isSrsLoading } = useSRSItems();
  const { data: dsaItems = [], isLoading: isDsaLoading } = useDSAItems();
  const { data: mcItems = [], isLoading: isMcLoading } =
    useMachineCodingItems();

  const updateTask = useUpdateTask();
  const updateSrs = useUpdateSRSItem();
  const updateDsa = useUpdateDSAItem();
  const { requireAuth } = useAuthGuard();
  const { toast } = useToast();

  // Track locally-completed IDs for instant visual feedback (optimistic)
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(true);

  // Build the unified top-5 list
  const items = useMemo<ConsolidatedItem[]>(() => {
    const all: ConsolidatedItem[] = [];
    const today = startOfDay(new Date());

    // ----- Tasks (not done) -----
    tasks
      .filter((t) => t.status !== "Done")
      .forEach((t) => {
        const due = t.dueDate?.toDate?.() as Date | undefined;
        const overdue = due ? isPast(startOfDay(due)) && !isToday(due) : false;
        const dueToday = due ? isToday(due) : false;

        // Urgency: overdue > due today > priority rank > no due date
        const priorityRank = PRIORITY_META[t.priority]?.rank ?? 4;
        let urgency = 100 + priorityRank;
        if (overdue) urgency = 0;
        else if (dueToday) urgency = 10 + priorityRank;

        all.push({
          id: t.id,
          source: "task",
          title: t.title,
          subtitle: due
            ? overdue
              ? `Overdue · ${format(due, "MMM d")}`
              : dueToday
              ? "Due today"
              : `Due ${format(due, "MMM d")}`
            : t.priority !== "None"
            ? t.priority
            : undefined,
          urgency,
          isOverdue: overdue,
          isDueToday: dueToday,
          raw: t,
        });
      });

    // ----- SRS (due today or overdue) -----
    srsItems.forEach((item) => {
      if (!item.nextReviewDate) return;
      const reviewDate = item.nextReviewDate.toDate();
      const overdue =
        isPast(startOfDay(reviewDate)) && !isToday(reviewDate);
      const dueToday = isToday(reviewDate);
      if (!overdue && !dueToday) return;

      all.push({
        id: item.id,
        source: "srs",
        title: item.topic,
        subtitle: overdue
          ? `Overdue · ${format(reviewDate, "MMM d")}`
          : "Review today",
        urgency: overdue ? 1 : 11,
        isOverdue: overdue,
        isDueToday: dueToday,
        raw: item,
      });
    });

    // ----- DSA (due today or overdue) -----
    dsaItems.forEach((item) => {
      if (!item.nextReviewDate) return;
      const reviewDate = item.nextReviewDate.toDate();
      const overdue =
        isPast(startOfDay(reviewDate)) && !isToday(reviewDate);
      const dueToday = isToday(reviewDate);
      if (!overdue && !dueToday) return;

      all.push({
        id: item.id,
        source: "dsa",
        title: item.problemName,
        subtitle: overdue
          ? `Overdue · ${format(reviewDate, "MMM d")}`
          : "Review today",
        urgency: overdue ? 2 : 12,
        isOverdue: overdue,
        isDueToday: dueToday,
        raw: item,
      });
    });

    // ----- Machine Coding (most recent entries not yet "practiced") -----
    // Machine coding items don't have a built-in review system,
    // so we surface the newest entries as quick-revisit prompts.
    mcItems.slice(0, 2).forEach((item, idx) => {
      all.push({
        id: item.id,
        source: "machine-coding",
        title: item.questionName,
        subtitle: item.language,
        urgency: 200 + idx, // lowest priority — they're for practice
        isOverdue: false,
        isDueToday: false,
        raw: item,
      });
    });

    // Sort by urgency, take top 5
    all.sort((a, b) => a.urgency - b.urgency);
    return all.slice(0, 5);
  }, [tasks, srsItems, dsaItems, mcItems]);

  // ----- Handlers -----
  const handleComplete = (item: ConsolidatedItem) => {
    if (completedIds.has(item.id)) return;

    requireAuth(() => {
      setCompletedIds((prev) => new Set(prev).add(item.id));

      switch (item.source) {
        case "task":
          updateTask.mutate({
            itemId: item.id,
            data: { status: "Done" },
          });
          toast({
            title: "Task completed!",
            description: "Nice work — one less thing to do.",
            variant: "success",
          });
          break;

        case "srs": {
          const srs = item.raw;
          const nextReviewCount = srs.reviewCount + 1;
          const nextDate = calculateNextReviewDate(nextReviewCount);
          updateSrs.mutate({
            itemId: item.id,
            data: {
              reviewCount: nextReviewCount,
              nextReviewDate: nextDate
                ? Timestamp.fromDate(nextDate)
                : (null as any),
            },
          });
          toast({
            title: "SRS review completed!",
            description: nextDate
              ? `Next review on ${format(nextDate, "MMM d")}.`
              : "All milestones done!",
            variant: "success",
          });
          break;
        }

        case "dsa": {
          const dsa = item.raw;
          const nextReviewCount = dsa.reviewCount + 1;
          const baseDate = dsa.dateLearned
            ? dsa.dateLearned.toDate()
            : dsa.createdAt
            ? dsa.createdAt.toDate()
            : new Date();
          const nextDate = calculateNextReviewDate(
            nextReviewCount,
            baseDate
          );
          updateDsa.mutate({
            itemId: item.id,
            data: {
              reviewCount: nextReviewCount,
              nextReviewDate: nextDate
                ? Timestamp.fromDate(nextDate)
                : null,
            },
          });
          toast({
            title: "DSA review completed!",
            description: nextDate
              ? `Next review on ${format(nextDate, "MMM d")}.`
              : "All milestones done!",
            variant: "success",
          });
          break;
        }

        case "machine-coding":
          // No built-in completion — just acknowledge
          toast({
            title: "Marked as practiced!",
            description: "Keep building your muscle memory.",
            variant: "success",
          });
          break;
      }
    });
  };

  // ----- Loading -----
  const isLoading = isTasksLoading || isSrsLoading || isDsaLoading || isMcLoading;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-card border border-border/50 rounded-3xl p-6 shadow-sm animate-pulse">
        <div className="h-8 w-48 rounded-2xl bg-secondary mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-2xl bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  // Filter out already-completed items from the display
  const visibleItems = items.filter((i) => !completedIds.has(i.id));
  const completedCount = items.length - visibleItems.length;

  return (
    <div className="bg-white dark:bg-card border border-border/50 rounded-3xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-6 pb-0 cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-black tracking-tight">
              Today&apos;s Focus
            </h3>
            <p className="text-xs text-muted-foreground">
              {visibleItems.length === 0
                ? "All caught up! 🎉"
                : `${visibleItems.length} item${visibleItems.length > 1 ? "s" : ""} to tackle`}
              {completedCount > 0 && (
                <span className="text-emerald-500 font-semibold ml-1">
                  · {completedCount} done
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="text-muted-foreground/50 group-hover:text-foreground transition-colors">
          {expanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </button>

      {/* List */}
      {expanded && (
        <div className="p-6 pt-5">
          {visibleItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <div className="text-4xl">✨</div>
              <p className="text-sm text-muted-foreground font-medium">
                You&apos;re all caught up — nothing pending!
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {visibleItems.map((item, idx) => {
                const meta = SOURCE_META[item.source];
                const Icon = meta.icon;

                return (
                  <li
                    key={item.id}
                    className={cn(
                      "group relative flex items-center gap-3 p-3.5 rounded-2xl border border-border/40",
                      "bg-secondary/30 hover:bg-secondary/60",
                      "transition-all duration-200",
                      "hover:shadow-md",
                      item.isOverdue && "border-rose-500/30 bg-rose-500/5"
                    )}
                    style={{
                      animationDelay: `${idx * 60}ms`,
                      animationFillMode: "backwards",
                    }}
                  >
                    {/* Check button */}
                    <button
                      onClick={() => handleComplete(item)}
                      className={cn(
                        "flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center",
                        "border-2 border-border/60 hover:border-current",
                        "transition-all duration-200",
                        `hover:${meta.check}`,
                        "hover:scale-110 active:scale-95"
                      )}
                      title="Mark complete"
                    >
                      <Circle className="h-4 w-4 opacity-30 group-hover:opacity-0 transition-opacity" />
                      <CheckCircle2
                        className={cn(
                          "h-5 w-5 absolute opacity-0 group-hover:opacity-100 transition-opacity",
                          meta.check
                        )}
                      />
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate leading-tight">
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p
                          className={cn(
                            "text-[11px] font-medium mt-0.5",
                            item.isOverdue
                              ? "text-rose-500"
                              : "text-muted-foreground"
                          )}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>

                    {/* Source badge */}
                    <span
                      className={cn(
                        "flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border",
                        meta.badge
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Progress bar at the bottom */}
          {items.length > 0 && (
            <div className="mt-5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <span>Progress</span>
                <span className="tabular-nums">
                  {completedCount}/{items.length}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700 ease-out"
                  style={{
                    width: `${
                      items.length > 0
                        ? Math.round((completedCount / items.length) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
