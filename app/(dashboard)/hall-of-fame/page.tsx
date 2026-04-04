"use client";

import { useCompletedGoals } from "@/hooks/use-goals";
import { GoalCard } from "@/components/goal-card";
import { Logo } from "@/components/logo";

export default function HallOfFamePage() {
  const { data: goals = [], isLoading } = useCompletedGoals();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse font-heading text-2xl flex items-center gap-1">
          <Logo />...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <h1 className="text-6xl font-v-headings tracking-tighter">Hall of Fame</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          A permanent record of your consistency. These goals are now part of who you are.
        </p>
      </header>

      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-secondary/30 rounded-[3rem] border border-dashed border-border gap-4">
          <p className="text-muted-foreground font-medium text-lg">No completed goals yet.</p>
          <p className="text-sm text-muted-foreground/60 max-w-xs text-center">
            Reach your due date and log every day to see your goals enshrined here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {goals.map((goal) => (
            <div key={goal.id} className="opacity-80 transition-opacity hover:opacity-100">
                <GoalCard goal={goal} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
