"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({
  children,
  content,
  side = "right",
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const variants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      x: side === "right" ? -10 : side === "left" ? 10 : 0,
      y: side === "bottom" ? -10 : side === "top" ? 10 : 0,
    },
    animate: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      x: side === "right" ? -10 : side === "left" ? 10 : 0,
      y: side === "bottom" ? -10 : side === "top" ? 10 : 0,
    },
  };

  const sideClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={cn(
              "absolute z-[100] px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-primary-foreground bg-primary rounded-lg shadow-2xl border border-primary/10 whitespace-nowrap pointer-events-none",
              sideClasses[side],
              className
            )}
          >
            {content}
            <div
              className={cn(
                "absolute w-2 h-2 bg-primary transform rotate-45",
                side === "top" && "bottom-[-4px] left-1/2 -translate-x-1/2",
                side === "bottom" && "top-[-4px] left-1/2 -translate-x-1/2",
                side === "left" && "right-[-4px] top-1/2 -translate-y-1/2",
                side === "right" && "left-[-4px] top-1/2 -translate-y-1/2"
              )}
            />
          </motion.div>

        )}
      </AnimatePresence>
    </div>
  );
}
