"use client";

import { useAuth } from "@/components/auth-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AddGoalModal } from "@/components/goals/add-goal-modal";
import { Logo } from "@/components/ui/logo";
import { ChatFAB } from "@/components/ai-assistant/chat-fab";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Listen to open-add-goal-modal custom event to trigger opening of the modal
  useEffect(() => {
    const handleOpen = () => setIsAddModalOpen(true);
    window.addEventListener("open-add-goal-modal", handleOpen);
    return () => {
      window.removeEventListener("open-add-goal-modal", handleOpen);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse font-bold text-2xl flex items-center gap-1">
          <Logo />...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-v-body print:h-auto print:overflow-visible print:block">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 lg:p-8 relative print:overflow-visible print:h-auto print:p-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <ChatFAB />
      <AddGoalModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
}
