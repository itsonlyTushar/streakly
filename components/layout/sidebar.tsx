"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Target,
  Trophy,
  LogOut,
  User,
  Brain,
  Code,
  Cpu,
  Calendar,
  ListTodo,
  Bot,
  Wand2,
  X,
  Menu,
  Layers,
  Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Tooltip } from "@/components/ui/tooltip";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({ isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { loginWithGoogle, logout, user } = useAuth();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { href: "/srs", icon: Brain, label: "Spaced Repetition" },
    { href: "/flashcards", icon: Layers, label: "Flashcards" },
    { href: "/dsa", icon: Code, label: "DSA Arena" },
    { href: "/code-explainer", icon: Wand2, label: "Wizard" },
    { href: "/machine-coding", icon: Cpu, label: "Machine Coding" },
    { href: "/interview", icon: Bot, label: "Mock Interview (Beta)" },
    { href: "/tasks", icon: ListTodo, label: "Tasks" },
    { href: "/record", icon: Video, label: "Record" },
    { href: "/hall-of-fame", icon: Trophy, label: "Hall of Fame" },
    { href: "/app", icon: Target, label: "Active Goals" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-16 border-r border-border h-screen flex-col items-center py-6 bg-background sticky top-0 z-50 print:hidden">
        <div className="mb-6 flex-shrink-0">
          <Tooltip content="Revision Calendar" side="right">
            <Link
              href="/calendar"
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 border border-border shadow-md",
                pathname === "/calendar"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-primary hover:bg-secondary"
              )}
            >
              <Calendar className="h-5 w-5" />
            </Link>
          </Tooltip>
        </div>

        {/* Scrollable Nav Icons */}
        <nav 
          className="flex-1 w-full flex flex-col items-center gap-5 overflow-y-auto py-2 px-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {navItems.map((item) => (
            <Tooltip key={item.href} content={item.label} side="right">
              <Link
                href={item.href}
                className={cn(
                  "p-2 rounded-xl transition-colors flex-shrink-0",
                  pathname === item.href
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:text-primary hover:bg-secondary/50",
                )}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            </Tooltip>
          ))}
        </nav>

        <div className="mt-auto pt-6 flex-shrink-0 flex flex-col items-center gap-5">
          <Tooltip content="Toggle Theme" side="right">
            <ThemeToggle />
          </Tooltip>
          {user && (
            <Tooltip content="Logout" side="right">
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </Tooltip>
          )}
        </div>
      </aside>

      {/* Mobile Collapsible Sidebar (Drawer) */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs print:hidden"
            />

            {/* Sidebar drawer panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 bottom-0 left-0 w-[280px] max-w-[85vw] z-50 bg-background border-r border-border flex flex-col p-6 shadow-2xl overflow-y-auto print:hidden"
            >
              {/* Header with Logo and Close button */}
              <div className="flex items-center justify-between mb-8 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-lg">
                    S
                  </div>
                  <span className="font-headings font-black tracking-tight text-xl">Streakly</span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navigation list */}
              <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto scrollbar-none py-1">
                {/* Revision Calendar at the top of mobile navigation */}
                <Link
                  href="/calendar"
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                    pathname === "/calendar"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-primary hover:bg-secondary"
                  )}
                >
                  <Calendar className="h-5 w-5" />
                  <span>Revision Calendar</span>
                </Link>

                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                      pathname === item.href
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:text-primary hover:bg-secondary"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              {/* Bottom user profile and logout */}
              <div className="mt-auto pt-6 border-t border-border flex-shrink-0 flex flex-col gap-4">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center font-bold text-sm text-primary border border-border/30">
                      {user?.displayName?.[0] || user?.email?.[0] || "?"}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold truncate max-w-[140px]">
                        {user?.displayName || "Developer"}
                      </span>
                      <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                        {user?.email || "No email"}
                      </span>
                    </div>
                  </div>
                </div>

                {user && (
                  <button
                    onClick={() => {
                      setIsMobileOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-destructive/20 text-destructive bg-destructive/5 hover:bg-destructive/10 transition-colors font-semibold text-xs uppercase tracking-wider"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
        title="Ready to sign out?"
        description="We'll keep your progress safe until you come back. See you soon!"
        confirmText="Sign Out"
        variant="destructive"
        icon="logout"
      />

      <ConfirmationModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onConfirm={async () => {
          setIsAuthModalOpen(false);
          await loginWithGoogle();
        }}
        title="Join Streakly"
        description="You need an account to save your goals and track progress. Sign in now to get started!"
        confirmText="Sign in with Google"
        variant="primary"
        icon="question"
      />
    </>
  );
}
