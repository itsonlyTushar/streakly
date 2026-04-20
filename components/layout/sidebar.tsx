"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus,
  LayoutDashboard,
  Trophy,
  LogOut,
  User,
  Brain,
  Book,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Tooltip } from "@/components/ui/tooltip";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useState, useEffect } from "react";
import Dock from "@/components/ui/doc";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

interface SidebarProps {
  onAddGoal: () => void;
}

export function Sidebar({ onAddGoal }: SidebarProps) {
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
    { href: "/app", icon: LayoutDashboard, label: "Active Goals" },
    { href: "/srs", icon: Brain, label: "Spaced Repetition" },
    { href: "/notebook", icon: Book, label: "Notebook" },
    { href: "/hall-of-fame", icon: Trophy, label: "Hall of Fame" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  const dockItems = [
    {
      icon: <Plus className="h-5 w-5" />,
      label: "Add Goal",
      onClick: () => {
        if (!user) {
          setIsAuthModalOpen(true);
        } else {
          onAddGoal();
        }
      },
      className:
        "bg-primary text-primary-foreground border-primary shadow-lg scale-110",
    },
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Goals",
      onClick: () => router.push("/app"),
      className:
        pathname === "/app" ? "border-primary bg-secondary shadow-inner" : "",
    },
    {
      icon: <Brain className="h-5 w-5" />,
      label: "SRS",
      onClick: () => router.push("/srs"),
      className:
        pathname === "/srs" ? "border-primary bg-secondary shadow-inner" : "",
    },
    {
      icon: <Book className="h-5 w-5" />,
      label: "Notebook",
      onClick: () => router.push("/notebook"),
      className:
        pathname === "/notebook"
          ? "border-primary bg-secondary shadow-inner"
          : "",
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      label: "Rankings",
      onClick: () => router.push("/hall-of-fame"),
      className:
        pathname === "/hall-of-fame"
          ? "border-primary bg-secondary shadow-inner"
          : "",
    },
    {
      icon: <User className="h-5 w-5" />,
      label: "Profile",
      onClick: () => router.push("/profile"),
      className:
        pathname === "/profile"
          ? "border-primary bg-secondary shadow-inner"
          : "",
    },
    {
      icon: <LogOut className="h-5 w-5 text-destructive" />,
      label: "Logout",
      onClick: () => setIsLogoutModalOpen(true),
    },
    {
      icon: mounted ? (
        theme === "dark" ? (
          <Sun className="h-5 w-5 text-yellow-500" />
        ) : (
          <Moon className="h-5 w-5 text-slate-700" />
        )
      ) : (
        <Sun className="h-5 w-5" />
      ),
      label: "Theme",
      onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
  ];

  return (
    <>
      <aside className="hidden md:flex w-20 border-r border-border h-screen flex-col items-center py-8 bg-background sticky top-0 z-50">
        <div className="mb-8">
          <Tooltip content="Add New Goal" side="right">
            <button
              onClick={() => {
                if (!user) {
                  setIsAuthModalOpen(true);
                } else {
                  onAddGoal();
                }
              }}
              className="w-10 h-10 md:w-12 md:h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
              aria-label="Add New Goal"
            >
              <Plus className="h-6 w-6" />
            </button>
          </Tooltip>
        </div>

        <nav className="flex-1 flex flex-col gap-6">
          {navItems.map((item) => (
            <Tooltip key={item.href} content={item.label} side="right">
              <Link
                href={item.href}
                className={cn(
                  "p-2 rounded-xl transition-colors",
                  pathname === item.href
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground hover:text-primary hover:bg-secondary/50",
                )}
              >
                <item.icon className="h-6 w-6" />
              </Link>
            </Tooltip>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-6">
          <Tooltip content="Toggle Theme" side="right">
            <ThemeToggle />
          </Tooltip>
          {user && (
            <Tooltip content="Logout" side="right">
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </Tooltip>
          )}
        </div>
      </aside>

      {/* Mobile Dock */}
      <div className="md:hidden fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto relative">
          <Dock items={dockItems} baseItemSize={38} panelHeight={52} />
        </div>
      </div>

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
