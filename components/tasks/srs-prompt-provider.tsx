"use client";

import React, { createContext, useContext, useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Brain, ArrowRight } from "lucide-react";

interface SrsPromptContextType {
  promptSrs: (
    task: { title: string; description?: string | null },
    onConfirmSrs: () => void,
    onConfirmOnlyComplete: () => void
  ) => void;
}

const SrsPromptContext = createContext<SrsPromptContextType | undefined>(undefined);

export function SrsPromptProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  
  const callbacksRef = useRef<{
    onConfirmSrs: () => void;
    onConfirmOnlyComplete: () => void;
  } | null>(null);

  const promptSrs = (
    task: { title: string; description?: string | null },
    onConfirmSrs: () => void,
    onConfirmOnlyComplete: () => void
  ) => {
    setTaskTitle(task.title);
    callbacksRef.current = { onConfirmSrs, onConfirmOnlyComplete };
    setIsOpen(true);
  };

  const handleConfirmSrs = () => {
    if (callbacksRef.current) {
      callbacksRef.current.onConfirmSrs();
    }
    setIsOpen(false);
  };

  const handleConfirmOnlyComplete = () => {
    if (callbacksRef.current) {
      callbacksRef.current.onConfirmOnlyComplete();
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <SrsPromptContext.Provider value={{ promptSrs }}>
      {children}
      
      <Modal isOpen={isOpen} onClose={handleCancel} className="max-w-[420px]">
        <div className="flex flex-col items-center text-center">
          {/* Glowing Gradient Icon Container */}
          <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-tr from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 flex items-center justify-center mb-5 relative group">
            <div className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-tr from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-10 transition-opacity blur-lg" />
            <Brain className="h-7 w-7 text-violet-500 animate-pulse" />
          </div>

          <span className="text-[10px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-widest mb-1 block">
            Spaced Repetition System
          </span>
          <h3 className="text-2xl font-black text-foreground mb-2 leading-tight">
            Add to SRS?
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6 px-2">
            Do you want to start a Spaced Repetition (SRS) review cycle for <strong className="text-foreground">{taskTitle}</strong>?
          </p>

          {/* Interactive Milestone Pathway Preview */}
          <div className="w-full bg-secondary/30 border border-border/40 rounded-2xl p-4 my-2 mb-6 space-y-3">
            <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 text-center">
              Active Study Cycle Schedule
            </div>
            <div className="flex items-center justify-between px-2">
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-violet-500">Day 1</span>
                <div className="h-7 w-7 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-[10px] font-black text-violet-500 mt-1 shadow-sm">
                  1d
                </div>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/30 mt-4" />
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-muted-foreground/60">Day 3</span>
                <div className="h-7 w-7 rounded-full bg-secondary/60 border border-border/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground mt-1">
                  3d
                </div>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/30 mt-4" />
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-muted-foreground/60">Day 7</span>
                <div className="h-7 w-7 rounded-full bg-secondary/60 border border-border/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground mt-1">
                  7d
                </div>
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/30 mt-4" />
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-bold text-muted-foreground/60">Day 30</span>
                <div className="h-7 w-7 rounded-full bg-secondary/60 border border-border/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground mt-1">
                  30d
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5 w-full mt-2">
            <button
              onClick={handleConfirmSrs}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold py-3.5 px-6 rounded-2xl text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
            >
              <Brain className="h-4 w-4" /> Yes, start SRS
            </button>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 px-4 bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOnlyComplete}
                className="flex-1 py-3 px-4 bg-background text-foreground border border-border hover:bg-secondary/40 rounded-xl text-xs font-bold transition-all active:scale-[0.98]"
              >
                No, just complete
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </SrsPromptContext.Provider>
  );
}

export function useSrsPrompt() {
  const context = useContext(SrsPromptContext);
  if (context === undefined) {
    throw new Error("useSrsPrompt must be used within a SrsPromptProvider");
  }
  return context;
}
