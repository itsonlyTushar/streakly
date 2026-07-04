"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

export function Sheet({ isOpen, onClose, children, className, title, description }: SheetProps) {
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={cn(
          "bg-card border-l border-border w-full max-w-md h-full shadow-2xl p-6 md:p-8 flex flex-col gap-6 overflow-hidden relative animate-in slide-in-from-right duration-300",
          className
        )}
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary transition-colors z-10"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        {(title || description) && (
          <div className="space-y-1.5 pr-8 border-b border-border/50 pb-4">
            {title && (
              <div className="text-2xl font-black tracking-tighter text-foreground">
                {title}
              </div>
            )}
            {description && (
              <div className="text-xs text-muted-foreground font-medium">
                {description}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}
