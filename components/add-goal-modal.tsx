"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../components/auth-provider";
import { X, Calendar as CalendarIcon, Type } from "lucide-react";
import { useToast } from "@/components/ui/toast";

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
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !goal || !dueDate) return;

    const today = new Date().toISOString().split("T")[0];
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
        dueDate,
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
      setDueDate("");
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

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-300">
      <div className="bg-card border border-border w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl space-y-8 relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-secondary transition-colors"
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
          <div className="space-y-2">
            <div className="flex items-center gap-2 ml-1">
              <Type className="h-4 w-4 text-muted-foreground" />
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Goal Details
              </label>
            </div>
            <textarea
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full bg-secondary rounded-2xl p-5 focus:ring-2 ring-primary outline-none transition-all h-32 resize-none placeholder:text-muted-foreground/30 text-lg font-medium"
              placeholder="e.g. Read 20 pages of a book"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 ml-1">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Target Date
              </label>
            </div>
            <input
              required
              type="date"
              min={todayStr}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-secondary rounded-2xl p-5 focus:ring-2 ring-primary outline-none transition-all font-medium text-lg"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-16 rounded-2xl text-xl bg-primary text-primary-foreground hover:scale-[1.03] transition-transform disabled:opacity-50 shadow-xl font-bold"
            >
              {isSubmitting ? "Creating..." : "Save Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
