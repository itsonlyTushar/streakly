"use client";

import * as React from "react";
import { Modal } from "./modal";
import { cn } from "@/lib/utils";
import { AlertTriangle, LogOut, Trash2, HelpCircle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "primary" | "warning";
  icon?: "logout" | "danger" | "warning" | "question";
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  icon = "question",
  isLoading = false,
}: ConfirmationModalProps) {
  
  const getIcon = () => {
    switch (icon) {
      case "logout":
        return <LogOut className="h-6 w-6 text-destructive" />;
      case "danger":
        return <Trash2 className="h-6 w-6 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-6 w-6 text-amber-500" />;
      case "question":
      default:
        return <HelpCircle className="h-6 w-6 text-primary" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-destructive/20";
      case "warning":
        return "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20";
      case "primary":
      default:
        return "bg-primary text-primary-foreground hover:opacity-90 shadow-primary/20";
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[400px]">
      <div className="flex flex-col items-center text-center">
        {/* Icon Header */}
        <div className={cn(
          "w-16 h-16 rounded-3xl flex items-center justify-center mb-6 animate-in zoom-in-50 duration-500",
          variant === "destructive" ? "bg-destructive/10" : 
          variant === "warning" ? "bg-amber-500/10" : "bg-primary/10"
        )}>
          {getIcon()}
        </div>

        {/* Text Content */}
        <h3 className="text-2xl font-bold text-foreground mb-2 leading-tight">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8 px-4">
          {description}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all hover:bg-secondary border border-transparent active:scale-[0.98] disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            disabled={isLoading}
            className={cn(
              "flex-1 px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center",
              getVariantStyles()
            )}
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>

      {/* Decorative background element */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
    </Modal>
  );
}
