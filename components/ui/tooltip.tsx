"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let top = 0;
      let left = 0;

      if (side === "right") {
        top = rect.top + rect.height / 2;
        left = rect.right + 8;
      } else if (side === "left") {
        top = rect.top + rect.height / 2;
        left = rect.left - 8;
      } else if (side === "top") {
        top = rect.top - 8;
        left = rect.left + rect.width / 2;
      } else if (side === "bottom") {
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2;
      }

      setCoords({ top, left });
    }
  };

  const handleMouseEnter = () => {
    updateCoords();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

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
    top: "-translate-x-1/2 -translate-y-full mb-2",
    bottom: "-translate-x-1/2 mt-2",
    left: "-translate-x-full -translate-y-1/2 mr-2",
    right: "-translate-y-1/2 ml-2",
  };

  const arrowClasses = {
    top: "bottom-[-4px] left-1/2 -translate-x-1/2 rotate-45",
    bottom: "top-[-4px] left-1/2 -translate-x-1/2 rotate-45",
    left: "right-[-4px] top-1/2 -translate-y-1/2 rotate-45",
    right: "left-[-4px] top-1/2 -translate-y-1/2 rotate-45",
  };

  return (
    <div
      ref={triggerRef}
      className="relative flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isVisible && (
              <motion.div
                initial="initial"
                animate="animate"
                exit="exit"
                variants={variants}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{
                  position: "fixed",
                  top: coords.top,
                  left: coords.left,
                  zIndex: 9999,
                }}
                className={cn(
                  "px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold text-primary-foreground bg-primary rounded-lg shadow-2xl border border-primary/10 whitespace-nowrap pointer-events-none",
                  sideClasses[side],
                  className
                )}
              >
                {content}
                <div className={cn("absolute w-2 h-2 bg-primary", arrowClasses[side])} />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
