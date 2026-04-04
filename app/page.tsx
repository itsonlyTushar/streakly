"use client";

import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";
import {
  LogIn,
  Zap,
  Target,
  Scroll,
  Trophy,
  Layout,
  ChevronDown,
} from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";

export default function Home() {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();

  // Scroll tracking for step switching
  const { scrollYProgress } = useScroll();

  const [currentStep, setCurrentStep] = useState(0);

  // Map scroll progress (0-1) to steps (0-3)
  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      // Create a small buffer/threshold for each step
      const step = Math.min(3, Math.floor(latest * 4.01));
      if (step !== currentStep) {
        setCurrentStep(step);
      }
    });
  }, [scrollYProgress, currentStep]);

  useEffect(() => {
    if (!loading && user) {
      router.push("/app");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return null;
  }

  const sections = [
    {
      id: "hero",
      content: (
        <div className="flex flex-col items-center gap-10 max-w-4xl text-center">
          <div className="space-y-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <Logo className="text-6xl sm:text-8xl md:text-[11rem] tracking-tighter leading-none block" />
              <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full -z-10" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-3xl text-muted-foreground font-light max-w-2xl mx-auto"
            >
              <span className="block italic mt-3 text-foreground/70 text-lg md:text-xl">
                Minimalist goal tracking + daily notes.
              </span>
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
          >
            <button
              onClick={loginWithGoogle}
              className="flex-1 flex items-center justify-center gap-3 bg-primary text-primary-foreground h-14 rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
            >
              <LogIn className="h-5 w-5" />
              Get Started
            </button>
          </motion.div>
        </div>
      ),
    },
    {
      id: "philosophy",
      content: (
        <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl w-full px-6">
          <div className="space-y-8 text-left">
            <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
              The Vision
            </span>
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-v-headings leading-[1.1] tracking-tighter">
              Less noise, <br />
              <span className="text-muted-foreground italic">
                more substance.
              </span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
              Most tools are built for managers. Streakly is built for builders.
              No dashboards, just your goals and the notes that shape them.
            </p>
          </div>
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full" />
            <div className="relative bg-card p-10 rounded-[3rem] border border-border/10 shadow-2xl space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                    Focus Mode
                  </div>
                  <h3 className="text-3xl font-v-headings">Learn French</h3>
                </div>
                <Zap className="h-8 w-8 text-primary/40" />
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-bold">
                  <span>60 Days</span>
                  <span className="text-primary">92%</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "92%" }}
                    transition={{ duration: 1.5, delay: 0.2 }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "features",
      content: (
        <div className="max-w-6xl w-full space-y-16 px-6">
          <div className="text-center space-y-4">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-v-headings tracking-tighter">
              Pure Utility.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Deliberate features for those who value clarity.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CompactFeatureCard
              icon={<Target className="h-6 w-6" />}
              title="Focus Tracking"
              desc="Simple progress metrics."
            />
            <CompactFeatureCard
              icon={<Scroll className="h-6 w-6" />}
              title="Rich Notes"
              desc="The 'why' behind the 'what'."
            />
            <CompactFeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Zero Config"
              desc="Start your streak in seconds."
            />
          </div>
        </div>
      ),
    },
    {
      id: "finale",
      content: (
        <div className="flex flex-col items-center gap-12 text-center max-w-3xl">
          <div className="space-y-6">
            <h2 className="text-5xl sm:text-7xl md:text-[9rem] font-v-headings tracking-tighter leading-none">
              Start <span className="italic opacity-30">small.</span>
            </h2>
            <p className="text-2xl text-muted-foreground italic">
              "The finish line is just a series of starts."
            </p>
          </div>
          <div className="flex flex-col items-center gap-8 w-full mt-4">
            <button
              onClick={loginWithGoogle}
              className="group relative flex items-center gap-4 bg-primary text-primary-foreground px-12 h-16 rounded-full font-bold text-2xl hover:scale-105 transition-all"
            >
              Sign Up Free
              <LogIn className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </button>
            <div className="flex gap-8 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/50">
              <Link
                href="/privacy"
                className="hover:text-primary transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-primary transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="relative font-v-body bg-background selection:bg-primary selection:text-primary-foreground overflow-y-auto scrollbar-hide">
      {/* Header - Always Fixed */}
      <header className="fixed top-0 left-0 right-0 z-[100] flex justify-between items-center p-6 md:p-10 pointer-events-none">
        <div className="pointer-events-auto bg-background/50 backdrop-blur-xl border border-border/10 px-6 py-2 rounded-full">
          <Logo className="text-xl" />
        </div>
        <div className="pointer-events-auto bg-background/50 backdrop-blur-xl border border-border/10 p-2 rounded-full">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Immersive Stage */}
      <main className="fixed inset-0 flex items-center justify-center overflow-hidden">
        {/* Background Accents */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.03),transparent)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/2 opacity-[0.03] blur-[120px] rounded-full -z-20" />

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full flex items-center justify-center p-6 md:p-12"
          >
            {sections[currentStep].content}
          </motion.div>
        </AnimatePresence>

        {/* Floating Controls/Indicators */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6">
          {/* Progress Dots */}
          <div className="flex gap-3">
            {sections.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 transition-all duration-500 rounded-full ${i === currentStep ? "w-8 bg-primary" : "w-1.5 bg-border/40"}`}
              />
            ))}
          </div>

          {/* Scroll instruction */}
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground/30"
          >
            <div className="h-[1px] w-8 bg-border/20" />
            <span>Scroll</span>
            <div className="h-[1px] w-8 bg-border/20" />
          </motion.div>
        </div>
      </main>

      {/* Invisible Scroll Spacer - Creates the "virtual" scroll height */}
      <div className="h-[400vh] w-full pointer-events-none" />

      {/* Background Decorative Text */}
      <div className="fixed bottom-0 left-0 p-10 -z-30 opacity-[0.02] select-none">
        <Logo className="text-[20vw] leading-none tracking-tighter" />
      </div>
    </div>
  );
}

function CompactFeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-8 rounded-[2rem] bg-card/40 border border-border/10 hover:border-primary/20 transition-colors group">
      <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center text-primary mb-6 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-8 rounded-3xl bg-muted/50 border border-border/30 text-left space-y-4 hover:bg-muted transition-colors"
    >
      <div className="h-12 w-12 rounded-2xl bg-foreground/5 flex items-center justify-center text-foreground">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

function UseCaseItem({ label, example }: { label: string; example: string }) {
  return (
    <div className="border-l border-background/20 pl-8 space-y-2 group hover:border-background transition-colors cursor-default">
      <h4 className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">
        {label}
      </h4>
      <p className="text-background/50 group-hover:text-background/80 transition-colors max-w-lg">
        {example}
      </p>
    </div>
  );
}
