"use client";

import { useAuth } from "@/components/auth-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AddGoalModal } from "@/components/goals/add-goal-modal";
import { Logo } from "@/components/ui/logo";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse font-bold text-2xl flex items-center gap-1">
          <Logo />...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-v-body">
      <Sidebar onAddGoal={() => setIsAddModalOpen(true)} />
      <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-12 relative">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <AddGoalModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
}
