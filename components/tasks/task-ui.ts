import { TaskPriority, TaskProjectColor, TaskStatus } from "@/lib/schemas/task.schema";

// Full literal Tailwind class strings (so the JIT compiler can see them).

export const PROJECT_COLORS: Record<
  TaskProjectColor,
  { dot: string; text: string; chip: string; ring: string; swatch: string }
> = {
  violet: {
    dot: "bg-violet-500",
    text: "text-violet-500",
    chip: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    ring: "ring-violet-500/40",
    swatch: "bg-violet-500",
  },
  blue: {
    dot: "bg-blue-500",
    text: "text-blue-500",
    chip: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    ring: "ring-blue-500/40",
    swatch: "bg-blue-500",
  },
  emerald: {
    dot: "bg-emerald-500",
    text: "text-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    ring: "ring-emerald-500/40",
    swatch: "bg-emerald-500",
  },
  amber: {
    dot: "bg-amber-500",
    text: "text-amber-500",
    chip: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    ring: "ring-amber-500/40",
    swatch: "bg-amber-500",
  },
  rose: {
    dot: "bg-rose-500",
    text: "text-rose-500",
    chip: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    ring: "ring-rose-500/40",
    swatch: "bg-rose-500",
  },
  cyan: {
    dot: "bg-cyan-500",
    text: "text-cyan-500",
    chip: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    ring: "ring-cyan-500/40",
    swatch: "bg-cyan-500",
  },
  slate: {
    dot: "bg-slate-500",
    text: "text-slate-500",
    chip: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    ring: "ring-slate-500/40",
    swatch: "bg-slate-500",
  },
};

export const PROJECT_COLOR_KEYS: TaskProjectColor[] = [
  "violet",
  "blue",
  "emerald",
  "amber",
  "rose",
  "cyan",
  "slate",
];

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; rank: number; dot: string; chip: string }
> = {
  Urgent: {
    label: "Urgent",
    rank: 0,
    dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
    chip: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
  High: {
    label: "High",
    rank: 1,
    dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    chip: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  Medium: {
    label: "Medium",
    rank: 2,
    dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]",
    chip: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  Low: {
    label: "Low",
    rank: 3,
    dot: "bg-emerald-500",
    chip: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  None: {
    label: "None",
    rank: 4,
    dot: "bg-muted-foreground/40",
    chip: "bg-secondary text-muted-foreground border-border/40",
  },
};

export const PRIORITY_ORDER: TaskPriority[] = ["Urgent", "High", "Medium", "Low", "None"];

export const STATUS_ORDER: TaskStatus[] = ["Todo", "Done"];

export const STATUS_META: Record<
  TaskStatus,
  { label: string; dot: string; accent: string }
> = {
  Todo: {
    label: "To Do",
    dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]",
    accent: "text-blue-500",
  },
  Done: {
    label: "Done",
    dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    accent: "text-emerald-500",
  },
};
