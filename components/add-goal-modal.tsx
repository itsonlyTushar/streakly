"use client";

import { useState, useRef, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../components/auth-provider";
import { X, Calendar as CalendarIcon, Type, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { format, startOfToday } from "date-fns";
import { Calendar } from "./ui/calendar";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  "bg-[#FFD580]", // Orange/Yellow
  "bg-[#FF9B85]", // Coral
  "bg-[#D4E09B]", // Green
  "bg-[#A9DEF9]", // Blue
  "bg-[#D0BCFF]", // Purple
];

export function AddGoalModal({ isOpen, onClose }: AddGoalModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goal, setGoal] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !goal || !dueDate) return;

    const today = startOfToday();
    if (dueDate < today) {
      toast({
        title: "Invalid Date",
        description: "Please select today or a future date.",
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      await addDoc(collection(db, "goals"), {
        userId: user.uid,
        goal,
        dueDate: format(dueDate, "yyyy-MM-dd"),
        color,
        status: "active",
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Goal Created!",
        description: `Successfully set your goal: "${goal}"`,
        variant: "success",
      });

      setGoal("");
      setDueDate(undefined);
      onClose();
    } catch (error) {
      console.error("Error adding project", error);
      toast({
        title: "Error!",
        description: "Failed to create goal. Please try again.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/40 backdrop-blur-md z-[60] flex items-center justify-center p-4 transition-all overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card border border-border w-full max-w-md rounded-[2.5rem] p-6 md:p-10 shadow-2xl space-y-6 md:space-y-8 relative overflow-visible my-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-8 right-8 p-2 rounded-xl hover:bg-secondary transition-all active:scale-95"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className="space-y-2">
          <h2 className="text-4xl tracking-tight font-bold">New Goal</h2>
          <p className="text-muted-foreground text-sm font-medium">
            What's your next commitment?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 ml-1">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Type className="h-4 w-4 text-primary" />
              </div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Goal Details
              </label>
            </div>
            <textarea
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-secondary/50 border border-transparent focus:border-primary/20 rounded-2xl p-5 outline-none transition-all h-32 resize-none placeholder:text-muted-foreground/30 text-lg font-medium"
              placeholder="e.g. Read 20 pages of a book"
            />
          </div>

          <div className="space-y-3 relative">
            <div className="flex items-center gap-2 ml-1">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <CalendarIcon className="h-4 w-4 text-primary" />
              </div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Target Date
              </label>
            </div>
            
            <button
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="w-full bg-secondary/50 border border-transparent focus:border-primary/20 rounded-2xl p-5 outline-none transition-all font-medium text-lg flex items-center justify-between hover:bg-secondary active:scale-[0.99] group"
            >
              <span className={dueDate ? "text-foreground" : "text-muted-foreground/30"}>
                {dueDate ? format(dueDate, "MMMM d, yyyy") : "Pick a date"}
              </span>
              <ChevronRight className={cn(
                "h-5 w-5 text-muted-foreground transition-transform duration-300",
                isCalendarOpen && "rotate-90"
              )} />
            </button>

            <AnimatePresence>
              {isCalendarOpen && (
                <motion.div
                  ref={calendarRef}
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-full left-0 right-0 mt-3 z-[70] bg-card border border-border rounded-[2rem] shadow-2xl overflow-hidden p-2"
                >
                  <Calendar 
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date);
                      setIsCalendarOpen(false);
                    }}
                    className="rounded-3xl"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-4 pt-4 pb-2">
            <button
              type="submit"
              disabled={isSubmitting || !dueDate || !goal}
              className="flex-1 h-16 rounded-2xl text-xl bg-primary text-primary-foreground hover:shadow-xl hover:shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale font-bold"
            >
              {isSubmitting ? "Creating..." : "Save Goal"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>

  );
}
