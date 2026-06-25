"use client";

import { differenceInDays, startOfDay } from "date-fns";
import { useActiveGoals } from "@/hooks/use-goals";
import { GoalCard } from "@/components/goals/goal-card";

export default function AppPage() {
  const { data: goals = [], isLoading } = useActiveGoals();

  // Hide goals whose due date has already passed (overdue) from the active list.
  const visibleGoals = goals.filter(
    (goal) =>
      differenceInDays(startOfDay(new Date(goal.dueDate)), startOfDay(new Date())) >= 0,
  );

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-12 w-48 bg-secondary rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-secondary rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-v-headings">Goals</h1>
        <p className="text-base text-muted-foreground ml-1">
          Stay consistent, one step at a time.
        </p>
      </header>

      {visibleGoals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-secondary/50 rounded-3xl border border-dashed border-border gap-4">
          <p className="text-muted-foreground font-medium">No active goals yet.</p>
          <p className="text-sm text-muted-foreground/80">Click the + button to start one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
