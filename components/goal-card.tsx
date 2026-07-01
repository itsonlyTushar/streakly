"use client";

import { format, differenceInDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface GoalCardProps {
  goal: {
    id: string;
    goal: string;
    dueDate: string;
    createdAt: any;
    userId: string;
    status: "active" | "completed";
    color?: string;
  };
}

const COLORS = [
  "bg-[#FFD580]", // Orange/Yellow
  "bg-[#FF9B85]", // Coral
  "bg-[#D4E09B]", // Green
  "bg-[#A9DEF9]", // Blue
  "bg-[#D0BCFF]", // Purple
];

export function GoalCard({ goal }: GoalCardProps) {
  const cardColor =
    goal.color || COLORS[Math.floor(Math.random() * COLORS.length)];
  const isCompleted = goal.status === "completed";

  const daysLeft = differenceInDays(
    startOfDay(new Date(goal.dueDate)),
    startOfDay(new Date())
  );

  return (
    <Link
      href={`/app/${goal.id}`}
      className={cn(
        "group rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[320px] shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 relative overflow-hidden",
        cardColor,
        isCompleted && "opacity-90 grayscale-[0.2]",
      )}
    >
      <div className="space-y-4 relative z-10">
        <header className="space-y-2 relative">
          <h3 className="text-3xl leading-[1.1] text-black/80 tracking-tight font-bold">
            {goal.goal}
          </h3>
          <p className="text-sm font-bold uppercase tracking-widest text-black/30">
            {isCompleted
              ? "Completed"
              : "Target: " + format(new Date(goal.dueDate), "MMM d, yyyy")}
          </p>
        </header>

        {isCompleted && (
          <div className="flex items-center gap-2 bg-black/5 w-fit px-4 py-2 rounded-full border border-black/5">
            <CheckCircle2 className="h-4 w-4 text-black/60" />
            <span className="text-xs font-bold text-black/60 uppercase tracking-tighter">
              Hall of Fame
            </span>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between relative z-10">
        {!isCompleted ? (
          <div className="flex flex-col">
            <span className={cn(
              "text-5xl font-black leading-none tracking-tighter",
              daysLeft <= 0 ? "text-red-600/60" : "text-black/60"
            )}>
              {daysLeft > 0 ? daysLeft : daysLeft === 0 ? "!" : "!!"}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-black/30 mt-1 ml-1">
              {daysLeft > 0 ? (daysLeft === 1 ? "day left" : "days left") : daysLeft === 0 ? "due today" : "overdue"}
            </span>
          </div>
        ) : (
          <div className="text-[10px] font-bold text-black/10 uppercase tracking-widest mb-1.5 flex items-center gap-2">
            Goal achieved
          </div>
        )}
        <div className="w-12 h-12 bg-white/30 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:bg-white/50 transition-colors">
          <ArrowRight className="h-6 w-6 text-black/60 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Decorative Blur */}
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/20 blur-3xl rounded-full" />
    </Link>
  );
}
