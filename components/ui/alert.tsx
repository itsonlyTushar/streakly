"use client";

import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success" | "warning";
}

import { Terminal, AlertCircle, CheckCircle2, Info, LucideIcon } from "lucide-react";

const variantIcons: Record<string, LucideIcon> = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle2,
  warning: AlertCircle,
};

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const Icon = variantIcons[variant];
    const variantStyles = {
      default: "bg-background/80",
      destructive: "border-destructive text-destructive bg-destructive/10",
      success: "border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
      warning: "border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10",
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-2xl border p-4 shadow-sm backdrop-blur-sm transition-all",
          "flex items-start gap-3",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <div className="flex h-5 w-5 shrink-0 items-center justify-center opacity-90">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          {children}
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-bold leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed opacity-90", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
