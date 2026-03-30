"use client";

import {
  motion,
} from "motion/react";
import React, {
  useRef,
} from "react";

export type DockItemData = {
  icon: React.ReactNode;
  label: React.ReactNode;
  onClick: () => void;
  className?: string;
};

export type DockProps = {
  items: DockItemData[];
  className?: string;
  panelHeight?: number;
  baseItemSize?: number;
};

import { cn } from "@/lib/utils";

function DockItem({
  children,
  className = "",
  onClick,
  baseItemSize,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  baseItemSize: number;
}) {
  return (
    <motion.div
      style={{
        width: baseItemSize,
        height: baseItemSize,
      }}
      whileHover={{ scale: 1.2, y: -8 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center rounded-full border border-border shadow-sm transition-colors bg-secondary hover:bg-secondary/80",
        className
      )}
      tabIndex={0}
      role="button"
    >
      {children}
    </motion.div>
  );
}

function DockLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`${className} absolute -top-8 left-1/2 w-fit -translate-x-1/2 whitespace-pre rounded-md border border-border bg-popover px-2 py-0.5 text-[10px] text-popover-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}>
      {children}
    </div>
  );
}

function DockIcon({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      {children}
    </div>
  );
}

export default function Dock({
  items,
  className = "",
  panelHeight = 52,
  baseItemSize = 38,
}: DockProps) {
  return (
    <div
      style={{ height: panelHeight }}
      className={`${className} relative flex items-center w-fit max-w-full gap-3 rounded-full border border-border bg-background/80 backdrop-blur-md px-3 mx-auto shadow-lg mb-2`}
      role="toolbar"
      aria-label="Application dock"
    >
      {items.map((item, index) => (
        <div key={index} className="relative group flex items-center">
          <DockItem
            onClick={item.onClick}
            className={item.className}
            baseItemSize={baseItemSize}
          >
            <DockIcon>{item.icon}</DockIcon>
          </DockItem>
          <DockLabel>{item.label}</DockLabel>
        </div>
      ))}
    </div>
  );
}
