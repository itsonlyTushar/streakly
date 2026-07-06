"use client";

import React, { useState, useMemo } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isPast,
  startOfDay,
  startOfToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Brain,
  Code,
  CheckCircle2,
  Check,
  RefreshCw,
  CalendarDays,
  ListTodo,
} from "lucide-react";
import { Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useAuthGuard } from "@/components/auth-guard";
import { useToast } from "@/components/ui/toast";
import { useSRSItems, useUpdateSRSItem } from "@/hooks/use-srs";
import { useDSAItems, useUpdateDSAItem } from "@/hooks/use-dsa";
import { useTasks, useUpdateTask } from "@/hooks/use-tasks";
import { PRIORITY_META } from "@/components/tasks/task-ui";
import { useAllUserNotes } from "@/hooks/use-notes";
import { SRS_INTERVALS, calculateNextReviewDate } from "@/lib/srs-utils";
import { Sheet } from "@/components/ui/sheet";

export function RevisionCalendar() {
  const { data: srsItems = [], isLoading: isSrsLoading } = useSRSItems();
  const { data: dsaItems = [], isLoading: isDsaLoading } = useDSAItems();
  const { data: taskItems = [], isLoading: isTasksLoading } = useTasks();
  const { data: allNotes = [], isLoading: isNotesLoading } = useAllUserNotes();

  const updateSrsMutation = useUpdateSRSItem();
  const updateDsaMutation = useUpdateDSAItem();
  const updateTaskMutation = useUpdateTask();
  const { requireAuth } = useAuthGuard();
  const { toast } = useToast();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [filterType, setFilterType] = useState<"all" | "srs" | "dsa" | "task">("all");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const today = startOfToday();

  // Navigation handlers
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Aggregate items mapped by date for calendar display
  const itemsByDate = useMemo(() => {
    const map: Record<string, { srs: any[]; dsa: any[]; task: any[] }> = {};

    const add = (date: Date, type: "srs" | "dsa" | "task", item: any) => {
      const key = format(startOfDay(date), "yyyy-MM-dd");
      if (!map[key]) {
        map[key] = { srs: [], dsa: [], task: [] };
      }
      map[key][type].push(item);
    };

    srsItems.forEach((item) => {
      if (item.nextReviewDate) {
        add(item.nextReviewDate.toDate(), "srs", item);
      }
    });

    dsaItems.forEach((item) => {
      if (item.nextReviewDate) {
        add(item.nextReviewDate.toDate(), "dsa", item);
      }
    });

    taskItems.forEach((item) => {
      if (item.dueDate && item.status !== "Done") {
        add(item.dueDate.toDate(), "task", item);
      }
    });

    return map;
  }, [srsItems, dsaItems, taskItems]);

  // Get items for selected day
  const selectedDayItems = useMemo(() => {
    const key = format(startOfDay(selectedDate), "yyyy-MM-dd");
    const dayData = itemsByDate[key] || { srs: [], dsa: [], task: [] };

    let srsList = dayData.srs;
    let dsaList = dayData.dsa;
    let taskList = dayData.task;

    if (filterType === "srs") {
      dsaList = [];
      taskList = [];
    }
    if (filterType === "dsa") {
      srsList = [];
      taskList = [];
    }
    if (filterType === "task") {
      srsList = [];
      dsaList = [];
    }

    return {
      srs: srsList,
      dsa: dsaList,
      task: taskList,
      total: srsList.length + dsaList.length + taskList.length,
    };
  }, [selectedDate, itemsByDate, filterType]);

  // Action Handlers
  const handleSrsReviewSuccess = async (item: any) => {
    requireAuth(() => {
      const nextReviewCount = item.reviewCount + 1;
      const nextDateValue = calculateNextReviewDate(nextReviewCount);

      updateSrsMutation.mutate({
        itemId: item.id,
        data: {
          reviewCount: nextReviewCount,
          nextReviewDate: nextDateValue
            ? Timestamp.fromDate(nextDateValue)
            : (null as any),
        },
      });
      toast({ title: "Milestone marked!", description: "Keep it up!", variant: "success" });
    });
  };

  const handleSrsReviewForgot = async (item: any) => {
    requireAuth(() => {
      const nextDateValue = calculateNextReviewDate(0);

      updateSrsMutation.mutate({
        itemId: item.id,
        data: {
          reviewCount: 0,
          nextReviewDate: nextDateValue
            ? Timestamp.fromDate(nextDateValue)
            : (null as any),
        },
      });
      toast({ title: "SRS cycle reset.", description: "Review path scheduled from Day 1.", variant: "success" });
    });
  };

  const handleDsaReviewSuccess = async (item: any) => {
    requireAuth(() => {
      const nextReviewCount = item.reviewCount + 1;
      const baseDate = item.dateLearned ? item.dateLearned.toDate() : (item.createdAt ? item.createdAt.toDate() : new Date());
      const nextDateValue = calculateNextReviewDate(nextReviewCount, baseDate);

      updateDsaMutation.mutate({
        itemId: item.id,
        data: {
          reviewCount: nextReviewCount,
          nextReviewDate: nextDateValue ? Timestamp.fromDate(nextDateValue) : null,
        },
      });
      toast({ title: "DSA review completed!", description: "Milestone advanced.", variant: "success" });
    });
  };

  const handleDsaReviewForgot = async (item: any) => {
    requireAuth(() => {
      const nextDateValue = calculateNextReviewDate(0);

      updateDsaMutation.mutate({
        itemId: item.id,
        data: {
          reviewCount: 0,
          nextReviewDate: nextDateValue ? Timestamp.fromDate(nextDateValue) : null,
        },
      });
      toast({ title: "DSA cycle reset.", description: "Problem will be reviewed tomorrow.", variant: "success" });
    });
  };

  const handleTaskComplete = (item: any) => {
    requireAuth(() => {
      updateTaskMutation.mutate({
        itemId: item.id,
        data: { status: "Done" },
      });
      toast({ title: "Task completed!", description: "Nice work — one less thing to do.", variant: "success" });
    });
  };

  // Generate calendar days
  const calendarCells = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const cells = [];
    let day = startDate;

    while (day <= endDate) {
      cells.push(day);
      day = addDays(day, 1);
    }
    return cells;
  }, [currentMonth]);

  const isLoading = isSrsLoading || isDsaLoading || isTasksLoading || isNotesLoading;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-[600px] rounded-3xl bg-secondary/50" />
        <div className="h-[250px] rounded-3xl bg-secondary/50" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Monthly Calendar Grid Card */}
      <div className="bg-white dark:bg-card border border-border/50 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header / Month Navigator */}
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div className="space-y-1">
              <h3 className="text-2xl font-black tracking-tighter">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
              <p className="text-xs text-muted-foreground">
                Visualize your active retention paths.
              </p>
            </div>

            <div className="flex items-center gap-1">
              {/* Type Filters */}
              <div className="bg-secondary/60 p-1 rounded-xl flex items-center gap-1 border border-border/10 mr-2">
                <button
                  onClick={() => setFilterType("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    filterType === "all"
                      ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  All
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
                  SRS
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
                  DSA
                </button>
                <button
                  onClick={() => setFilterType("task")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    filterType === "task"
                      ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  Tasks
                </button>
              </div>

              <button
                onClick={prevMonth}
                className="p-2 rounded-xl hover:bg-secondary border border-border/30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl hover:bg-secondary border border-border/30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Weekdays Labels */}
          <div className="grid grid-cols-7 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd");
              const dayData = itemsByDate[dayKey] || { srs: [], dsa: [], task: [] };

              const srsFiltered = filterType === "all" || filterType === "srs" ? dayData.srs : [];
              const dsaFiltered = filterType === "all" || filterType === "dsa" ? dayData.dsa : [];
              const taskFiltered = filterType === "all" || filterType === "task" ? dayData.task : [];

              const totalItemsCount = srsFiltered.length + dsaFiltered.length + taskFiltered.length;

              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isDayToday = isSameDay(day, today);
              const isDaySelected = isSameDay(day, selectedDate);

              // Highlight status: color cell outline if tasks due
              const hasDueTasks = totalItemsCount > 0 && (isPast(day) || isSameDay(day, today));

              return (
                <button
                  key={day.toString()}
                  onClick={() => {
                    setSelectedDate(day);
                    setIsSheetOpen(true);
                  }}
                  className={cn(
                    "min-h-[110px] p-1.5 rounded-2xl flex flex-col items-stretch justify-between border transition-all text-left group overflow-hidden relative",
                    isCurrentMonth ? "bg-background/20" : "bg-secondary/[0.05] border-transparent opacity-30",
                    isDaySelected
                      ? "border-primary ring-2 ring-primary/10 shadow-sm"
                      : "border-border/35 hover:border-border-foreground/50 hover:bg-secondary/20",
                    isDayToday && "bg-secondary/40 font-bold",
                    hasDueTasks && !isDaySelected && "border-amber-500/30 bg-amber-500/[0.02]"
                  )}
                >
                  <header className="flex justify-between items-center w-full px-0.5">
                    <span
                      className={cn(
                        "text-xs font-bold leading-none",
                        isDayToday ? "text-primary bg-secondary p-1 rounded-md" : "text-muted-foreground/80"
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Display Total Count Badge if item count is large */}
                    {totalItemsCount > 0 && (
                      <span className="text-[9px] font-black leading-none bg-secondary/80 px-1 py-0.5 rounded-full text-muted-foreground scale-90">
                        {totalItemsCount}
                      </span>
                    )}
                  </header>

                  {/* Small pills/indicators representation */}
                  <div className="mt-2 space-y-1 overflow-hidden pointer-events-none flex-1 flex flex-col justify-end">
                    {srsFiltered.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="text-[9px] truncate bg-blue-500/10 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-1 py-0.5 rounded-md leading-none font-bold uppercase tracking-wider flex items-center gap-1"
                      >
                        <Brain className="h-2.5 w-2.5 flex-shrink-0" />
                        <span>{item.topic}</span>
                      </div>
                    ))}

                    {dsaFiltered.slice(0, 2).map((item) => {
                      const isHard = item.difficulty === "Hard";
                      const isEasy = item.difficulty === "Easy";
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "text-[9px] truncate px-1 py-0.5 rounded-md leading-none font-bold uppercase tracking-wider flex items-center gap-1 border",
                            isHard
                              ? "bg-red-500/10 text-red-600 border-red-500/10 dark:bg-red-900/20 dark:text-red-400"
                              : isEasy
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/10 dark:bg-emerald-900/20 dark:text-emerald-400"
                              : "bg-yellow-500/10 text-yellow-600 border-yellow-500/10 dark:bg-yellow-900/20 dark:text-yellow-400"
                          )}
                        >
                          <Code className="h-2.5 w-2.5 flex-shrink-0" />
                          <span>{item.problemName}</span>
                        </div>
                      );
                    })}

                    {taskFiltered.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="text-[9px] truncate bg-violet-500/10 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400 px-1 py-0.5 rounded-md leading-none font-bold uppercase tracking-wider flex items-center gap-1 border border-violet-500/10"
                      >
                        <ListTodo className="h-2.5 w-2.5 flex-shrink-0" />
                        <span>{item.title}</span>
                      </div>
                    ))}

                    {totalItemsCount > 4 && (
                      <div className="text-[8px] font-black text-muted-foreground/50 text-right leading-none pr-1">
                        +{totalItemsCount - 4} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Details Sheet */}
      <Sheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-black tracking-tighter">
              {format(selectedDate, "EEEE, MMMM d")}
            </h3>
            {isSameDay(selectedDate, today) && (
              <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-primary text-primary-foreground px-2.5 py-1 rounded-full">
                Today
              </span>
            )}
          </div>
        }
        description={
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            <CalendarDays className="h-3.5 w-3.5" />
            Day View
          </div>
        }
      >
        {/* List of items scheduled for the day */}
        <div>
          {selectedDayItems.total === 0 ? (
            <div className="text-center py-10 space-y-2 border border-dashed border-border/50 rounded-2xl bg-secondary/[0.04]">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mx-auto" />
              <p className="text-muted-foreground text-sm font-medium">
                Zero tasks scheduled
              </p>
              <p className="text-xs text-muted-foreground/60 italic">
                Enjoy your day or add new goals!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {/* General SRS list */}
              {selectedDayItems.srs.map((item) => {
                const isDue = item.nextReviewDate && isPast(item.nextReviewDate.toDate());
                return (
                  <div
                    key={item.id}
                    className="border border-border/40 bg-secondary/[0.08] hover:bg-secondary/[0.12] transition-colors rounded-2xl p-4 space-y-4 relative overflow-hidden"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md">
                          <Brain className="h-3 w-3" />
                          General SRS
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                          Milestone {item.reviewCount + 1}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground">
                        {item.topic}
                      </h4>
                      {item.details && (
                        <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed">
                          {item.details}
                        </p>
                      )}
                    </div>

                    {/* Milestones Progress Dots */}
                    <div className="flex gap-1.5 pt-1 border-t border-border/20">
                      {SRS_INTERVALS.map((day, idx) => {
                        const isDone = item.reviewCount > idx;
                        const isCurrent = item.reviewCount === idx;
                        return (
                          <div
                            key={day}
                            className={cn(
                              "h-2 flex-1 rounded-full",
                              isDone
                                ? "bg-blue-500 shadow-sm"
                                : isCurrent && isDue
                                ? "bg-amber-500"
                                : "bg-secondary"
                            )}
                            title={`Milestone ${idx + 1} (${day}d)`}
                          />
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => handleSrsReviewForgot(item)}
                        disabled={updateSrsMutation.isPending}
                        className="p-1 px-2.5 bg-destructive/10 text-destructive border border-destructive/10 hover:bg-destructive hover:text-white rounded-lg transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                        title="Forgot this topic? Reset study cycle to Day 1."
                      >
                        <RefreshCw className="h-3 w-3" />
                        Forgot
                      </button>
                      <button
                        onClick={() => handleSrsReviewSuccess(item)}
                        disabled={updateSrsMutation.isPending}
                        className="p-1 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                        title="Remembered this topic! Move to next milestone."
                      >
                        <Check className="h-3 w-3" />
                        Got it
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* DSA Problems list */}
              {selectedDayItems.dsa.map((item) => {
                const isDue = item.nextReviewDate && isPast(item.nextReviewDate.toDate());
                const isHard = item.difficulty === "Hard";
                const isEasy = item.difficulty === "Easy";

                return (
                  <div
                    key={item.id}
                    className="border border-border/40 bg-secondary/[0.08] hover:bg-secondary/[0.12] transition-colors rounded-2xl p-4 space-y-4 relative overflow-hidden"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider bg-secondary border px-2 py-0.5 rounded-md",
                            isHard
                              ? "text-red-600 border-red-500/10 bg-red-500/5"
                              : isEasy
                              ? "text-emerald-600 border-emerald-500/10 bg-emerald-500/5"
                              : "text-yellow-600 border-yellow-500/10 bg-yellow-500/5"
                          )}
                        >
                          <Code className="h-3 w-3" />
                          DSA • {item.difficulty}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                          Milestone {item.reviewCount + 1}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground">
                        {item.problemName}
                      </h4>
                      {item.topics && item.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.topics.slice(0, 3).map((topic: string) => (
                            <span
                              key={topic}
                              className="text-[8px] font-black uppercase bg-secondary/80 text-muted-foreground px-1.5 py-0.5 rounded-md"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Milestones Progress Dots */}
                    <div className="flex gap-1.5 pt-1 border-t border-border/20">
                      {SRS_INTERVALS.map((day, idx) => {
                        const isDone = item.reviewCount > idx;
                        const isCurrent = item.reviewCount === idx;
                        return (
                          <div
                            key={day}
                            className={cn(
                              "h-2 flex-1 rounded-full",
                              isDone
                                ? "bg-primary shadow-sm"
                                : isCurrent && isDue
                                ? "bg-amber-500"
                                : "bg-secondary"
                            )}
                            title={`Milestone ${idx + 1} (${day}d)`}
                          />
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        onClick={() => handleDsaReviewForgot(item)}
                        disabled={updateDsaMutation.isPending}
                        className="p-1 px-2.5 bg-destructive/10 text-destructive border border-destructive/10 hover:bg-destructive hover:text-white rounded-lg transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                        title="Reset review cycle."
                      >
                        <RefreshCw className="h-3 w-3" />
                        Forgot
                      </button>
                      <button
                        onClick={() => handleDsaReviewSuccess(item)}
                        disabled={updateDsaMutation.isPending}
                        className="p-1 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                        title="Mark problem as solved and advance milestone."
                      >
                        <Check className="h-3 w-3" />
                        Solved
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Tasks due this day */}
              {selectedDayItems.task.map((item) => {
                const priority =
                  PRIORITY_META[item.priority as keyof typeof PRIORITY_META] ??
                  PRIORITY_META.None;
                return (
                  <div
                    key={item.id}
                    className="border border-border/40 bg-secondary/[0.08] hover:bg-secondary/[0.12] transition-colors rounded-2xl p-4 space-y-4 relative overflow-hidden"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-violet-600 bg-violet-500/10 px-2 py-0.5 rounded-md">
                          <ListTodo className="h-3 w-3" />
                          Task
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                            priority.chip
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", priority.dot)} />
                          {priority.label}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 italic leading-relaxed">
                          {item.description}
                        </p>
                      )}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="text-[8px] font-black uppercase bg-secondary/80 text-muted-foreground px-1.5 py-0.5 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 justify-end pt-1 border-t border-border/20">
                      <button
                        onClick={() => handleTaskComplete(item)}
                        disabled={updateTaskMutation.isPending}
                        className="p-1 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                        title="Mark this task as done."
                      >
                        <Check className="h-3 w-3" />
                        Complete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Sheet>
    </div>
  );
}
