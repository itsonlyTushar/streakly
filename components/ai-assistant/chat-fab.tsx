import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, MessageSquare, Bot } from "lucide-react";
import { ChatWindow } from "./chat-window";

export function ChatFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest(".ai-chat-fab-button")
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ai-chat-fab-button fixed bottom-24 md:bottom-6 right-6 md:right-8 z-50 h-12 w-12 rounded-full flex items-center justify-center bg-card text-card-foreground border border-border/80 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer print:hidden hover:bg-secondary/50"
        title="Toggle AI Coach Chat"
      >
        <div className="absolute inset-0 rounded-full bg-primary opacity-5 group-hover:opacity-10 transition-opacity" />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <img src="/apple-touch-icon.png" alt="Streakly Logo" className="h-5 w-5 object-contain" />
              {/* Pulsing indicator */}
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Floating Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-[110px] md:bottom-[76px] right-6 md:right-8 z-50 w-[350px] sm:w-[380px] md:w-[410px] h-[550px] max-h-[calc(100vh-140px)] rounded-3xl border border-border/40 shadow-2xl bg-card/95 backdrop-blur-md overflow-hidden flex flex-col print:hidden"
          >
            {/* Soft decorative light leak in the background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex-1 flex flex-col min-h-0">
              <ChatWindow />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
export default ChatFAB;
