"use client";

import { useAuth } from "@/components/auth-provider";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GoalCard } from "@/components/goal-card";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";

export default function HallOfFamePage() {
  const { user, loading: authLoading } = useAuth();
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "goals"),
      where("userId", "==", user.uid),
      where("status", "==", "completed"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGoals(goalsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (authLoading || !user) {
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

      {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-secondary rounded-3xl animate-pulse" />
            ))}
        </div>
      ) : goals.length === 0 ? (
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
