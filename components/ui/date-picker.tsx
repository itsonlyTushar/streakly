"use client";

import * as React from "react";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
}

export function DatePicker({ 
  selected, 
  onSelect, 
  placeholder = "Pick a date", 
  className,
  buttonClassName
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full bg-secondary/50 border border-transparent focus:border-primary/20 rounded-2xl p-4 md:p-5 outline-none transition-all font-medium text-base md:text-lg flex items-center justify-between hover:bg-secondary active:scale-[0.99] group",
          buttonClassName
        )}
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground/30"}>
          {selected ? format(selected, "MMMM d, yyyy") : placeholder}
        </span>
        <ChevronRight
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-300",
            isOpen && "rotate-90"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 mt-3 z-[70] bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden p-2 min-w-[300px]"
          >
            <Calendar
              selected={selected}
              onSelect={(date) => {
                onSelect(date);
                setIsOpen(false);
              }}
              className="rounded-3xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
