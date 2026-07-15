"use client";

import { useAuth } from "@/components/auth-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AddGoalModal } from "@/components/goals/add-goal-modal";
import { Logo } from "@/components/ui/logo";
import { ChatFAB } from "@/components/ai-assistant/chat-fab";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden font-v-body print:h-auto print:overflow-visible print:block">
      <Sidebar isMobileOpen={isMobileSidebarOpen} setIsMobileOpen={setIsMobileSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Top Header */}
        <header className="flex md:hidden items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 -ml-2 text-muted-foreground hover:text-primary rounded-lg focus:outline-none"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <Logo />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 pb-6 md:p-6 lg:p-8 relative print:overflow-visible print:h-auto print:p-0">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <ChatFAB />
      <AddGoalModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
}
