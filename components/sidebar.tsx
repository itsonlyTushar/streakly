"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, LayoutDashboard, Trophy, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./auth-provider";
import { ThemeToggle } from "./theme-toggle";

interface SidebarProps {
  onAddGoal: () => void;
}

export function Sidebar({ onAddGoal }: SidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const navItems = [
    { href: "/app", icon: LayoutDashboard, label: "Active Goals" },
    { href: "/hall-of-fame", icon: Trophy, label: "Hall of Fame" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <aside className="w-16 md:w-20 border-r border-border h-screen flex flex-col items-center py-8 bg-background sticky top-0">

      <button
        onClick={onAddGoal}
        className="w-10 h-10 md:w-12 md:h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg mb-8"
        aria-label="Add New Goal"
      >
        <Plus className="h-6 w-6" />
      </button>

      <nav className="flex-1 flex flex-col gap-6">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "p-2 rounded-xl transition-colors",
              pathname === item.href
                ? "bg-secondary text-primary"
                : "text-muted-foreground hover:text-primary hover:bg-secondary/50"
            )}
            title={item.label}
          >
            <item.icon className="h-6 w-6" />
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-6">
        <ThemeToggle />
        {user && (
          <button
            onClick={logout}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
            title="Logout"
          >
            <LogOut className="h-6 w-6" />
          </button>
        )}
      </div>
    </aside>
  );
}
