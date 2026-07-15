"use client";

import React, { useState } from "react";
import { CalendarClock, ListChecks, Check, ChevronDown } from "lucide-react";
import { format, isPast, isToday, startOfDay } from "date-fns";
import { Task, TaskProject } from "@/services/tasks.service";
import { useUpdateTask } from "@/hooks/use-tasks";
import { useAddSRSItem } from "@/hooks/use-srs";
import { useSrsPrompt } from "./srs-prompt-provider";
import { getInitialReviewDate } from "@/lib/srs-utils";
import { useAuthGuard } from "@/components/auth-guard";
import { cn } from "@/lib/utils";
import { PRIORITY_META, PROJECT_COLORS } from "./task-ui";

interface TaskListProps {
  tasks: Task[];
  projects: TaskProject[];
  onOpenTask: (task: Task) => void;
}

export function TaskList({ tasks, projects, onOpenTask }: TaskListProps) {
  const updateMutation = useUpdateTask();
  const addSrsItem = useAddSRSItem();
  const { promptSrs } = useSrsPrompt();
  const { requireAuth } = useAuthGuard();
  const [showCompleted, setShowCompleted] = useState(false);

  const active = tasks
    .filter((t) => t.status !== "Done")
    .sort(
      (a, b) =>
        PRIORITY_META[a.priority].rank - PRIORITY_META[b.priority].rank ||
        a.order - b.order
    );

  const completed = tasks
    .filter((t) => t.status === "Done")
    .sort((a, b) => {
      const ca = a.completedAt?.toMillis?.() ?? 0;
      const cb = b.completedAt?.toMillis?.() ?? 0;
      return cb - ca;
    });

  const toggleDone = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => {
      if (task.status !== "Done") {
        promptSrs(
          task,
          () => {
            // Yes, start SRS: complete task & add to SRS
            updateMutation.mutate({
              itemId: task.id,
              data: { status: "Done" },
            });
            addSrsItem.mutate({
              topic: task.title,
              details: task.description || "",
              nextReviewDate: getInitialReviewDate(),
            });
          },
          () => {
            // No, just complete: complete task only
            updateMutation.mutate({
              itemId: task.id,
              data: { status: "Done" },
            });
          }
        );
      } else {
        updateMutation.mutate({
          itemId: task.id,
          data: { status: "Todo" },
        });
      }
    });
  };

  const Row = ({ task }: { task: Task }) => {
    const priority = PRIORITY_META[task.priority] ?? PRIORITY_META.None;
    const project = projects.find((p) => p.id === task.projectId);
    const projectColor = project ? PROJECT_COLORS[project.color] : null;
    const due = task.dueDate?.toDate?.() as Date | undefined;
    const isDone = task.status === "Done";
    const overdue = due && !isDone && isPast(startOfDay(due)) && !isToday(due);
    const dueToday = due && !isDone && isToday(due);
    const doneSubs = task.subtasks.filter((s) => s.done).length;

    return (
      <div
        onClick={() => onOpenTask(task)}
        className="flex items-center gap-3 px-3 py-2.5 bg-card hover:bg-secondary/30 transition-colors cursor-pointer"
      >
        <button
          onClick={(e) => toggleDone(task, e)}
          className={cn(
            "flex-shrink-0 h-5 w-5 rounded-full border flex items-center justify-center transition-all",
            isDone
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-border hover:border-primary"
          )}
          title={isDone ? "Mark as not done" : "Mark as done"}
        >
          {isDone && <Check className="h-3 w-3" />}
        </button>

        {!isDone && (
          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", priority.dot)} />
        )}

        <span
          className={cn(
            "font-semibold text-sm text-foreground truncate flex-1",
            isDone && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </span>

        <div className="flex items-center gap-2 flex-shrink-0">
          {task.subtasks.length > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
              <ListChecks className="h-3 w-3" />
              {doneSubs}/{task.subtasks.length}
            </span>
          )}
          {project && projectColor && (
            <span
              className={cn(
                "hidden md:inline text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border",
                projectColor.chip
              )}
            >
              {project.name}
            </span>
          )}
          {due && (
            <span
              className={cn(
                "flex items-center gap-1 text-[10px] font-bold",
                overdue
                  ? "text-rose-500"
                  : dueToday
                  ? "text-amber-500"
                  : "text-muted-foreground"
              )}
            >
              <CalendarClock className="h-3 w-3" />
              {isToday(due) ? "Today" : format(due, "MMM d")}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {active.length > 0 && (
        <div className="rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/40">
          {active.map((task) => (
            <Row key={task.id} task={task} />
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowCompleted((v) => !v)}
            className="flex items-center gap-2 px-1 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", !showCompleted && "-rotate-90")}
            />
            Completed
            <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border/40">
              {completed.length}
            </span>
          </button>

          {showCompleted && (
            <div className="rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/40">
              {completed.map((task) => (
                <Row key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
