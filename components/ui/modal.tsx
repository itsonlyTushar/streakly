"use client";

import * as React from "react";
import { X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className={cn(
          "bg-card border border-border w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200",
          className
        )}
      >
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>
        {children}
      </div>
    </div>
  );
}
