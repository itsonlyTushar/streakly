"use client";

import * as React from "react";
import { X, CheckCircle2, AlertCircle, Info, LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ----------------------------------------------------------------------
// Types & Context
// ----------------------------------------------------------------------

type ToastVariant = "default" | "success" | "error" | "warning";

interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toast: (props: Omit<ToastProps, "id">) => void;
  remove: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ----------------------------------------------------------------------
// Toast Component
// ----------------------------------------------------------------------

const variantIcons: Record<ToastVariant, LucideIcon> = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertCircle,
};

const Toast = ({ id, title, description, variant = "default", duration = 3000, onRemove }: ToastProps & { onRemove: (id: string) => void }) => {
  const Icon = variantIcons[variant];

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const variantStyles = {
    default: "bg-background/80",
    success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    error: "bg-destructive/10 border-destructive/20 text-destructive",
    warning: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
  };

  return (
    <div
      className={cn(
        "group relative flex w-full max-w-sm items-start gap-4 rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-300 pointer-events-auto",
        "animate-in slide-in-from-right-full fade-in",
        variantStyles[variant]
      )}
    >
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 overflow-hidden">
        {title && <h3 className="text-sm font-bold leading-none tracking-tight">{title}</h3>}
        {description && <p className="mt-1 text-sm opacity-90">{description}</p>}
      </div>
      <button
        onClick={() => onRemove(id)}
        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-foreground/50 transition-colors hover:text-foreground focus:outline-none"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// ----------------------------------------------------------------------
// Provider Component
// ----------------------------------------------------------------------

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const toast = React.useCallback(({ title, description, variant, duration }: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant, duration }]);
  }, []);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, remove }}>
      {children}
      {/* Toast Container - Centered fixed at bottom center */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none items-center">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
