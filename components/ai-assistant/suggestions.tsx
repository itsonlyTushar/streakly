import React from "react";
import { Sparkles, Calendar, BookOpen, Brain, Code, Plus } from "lucide-react";

interface SuggestionsProps {
  onSelect: (prompt: string) => void;
}

export function Suggestions({ onSelect }: SuggestionsProps) {
  const list = [
    {
      text: "Draft a study schedule for my active goals",
      icon: Calendar,
      color: "text-blue-500 bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20",
    },
    {
      text: "Analyze my DSA prep & suggest next steps",
      icon: Code,
      color: "text-amber-500 bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20",
    },
    {
      text: "Add a task to revise Sliding Window due tomorrow",
      icon: Plus,
      color: "text-rose-500 bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20",
    },
    {
      text: "Summarize and review my recent notes",
      icon: BookOpen,
      color: "text-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20",
    },
    {
      text: "Quiz me on coding concepts in my workspace",
      icon: Brain,
      color: "text-purple-500 bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <div className="flex flex-col gap-2 p-1.5 animate-fadeIn">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1 px-1">
        <Sparkles className="h-3 w-3 text-yellow-500" /> Suggested prompts
      </p>
      <div className="grid grid-cols-1 gap-2">
        {list.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <button
              key={index}
              onClick={() => onSelect(item.text)}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer group bg-card ${item.color}`}
            >
              <IconComponent className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110 mt-0.5" />
              <span className="font-medium text-foreground/95 leading-snug">
                {item.text}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
