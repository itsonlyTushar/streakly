"use client";

import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { LogIn, Target, Brain, Code, Cpu, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { user, loading, loginWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/srs");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background font-v-body">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Logo className="text-xl" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:scale-[1.02]"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16 space-y-20">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6 py-8"
        >
          <Logo className="text-5xl md:text-6xl block" />
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Track goals, study smarter, and prep for interviews all in one
            clean workspace built for developers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.02] active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              Get Started it&apos;s free
            </button>
            <Link
              href="/srs"
              className="flex items-center gap-2 rounded-full border border-border bg-secondary px-6 py-3 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/80"
            >
              Explore without signing in
            </Link>
          </div>
        </motion.section>

        {/* Features */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="space-y-6"
        >
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-primary font-bold">
              What&apos;s inside
            </p>
            <h2 className="text-3xl md:text-4xl font-v-headings">
              Everything you need to level up.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon={<Target className="h-5 w-5" />}
              title="Goal Tracking"
              desc="Set timed goals with a daily log. Stay consistent, not just motivated."
            />
            <FeatureCard
              icon={<Brain className="h-5 w-5" />}
              title="Spaced Repetition"
              desc="Capture what you learn. The app surfaces it again right before you forget."
            />
            <FeatureCard
              icon={<Code className="h-5 w-5" />}
              title="DSA Practice"
              desc="Log problems, tag topics, and track your review schedule."
            />
            <FeatureCard
              icon={<Cpu className="h-5 w-5" />}
              title="Machine Coding"
              desc="Save questions with your approach and solution for fast recall."
            />
            <FeatureCard
              icon={<Trophy className="h-5 w-5" />}
              title="Hall of Fame"
              desc="Goals you've completed live here as a record of what you've built."
            />
            <div className="rounded-3xl border border-dashed border-border bg-card/40 p-6 flex items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">
                More features shipping soon.
              </p>
            </div>
          </div>
        </motion.section>

        {/* CTA strip */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="rounded-3xl border border-border bg-card p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-v-headings">
              Start your streak today.
            </h3>
            <p className="text-muted-foreground text-sm">
              No setup, no dashboards, just your goals and the notes that shape
              them.
            </p>
          </div>
          <button
            onClick={loginWithGoogle}
            className="shrink-0 flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.02] active:scale-95"
          >
            <LogIn className="h-4 w-4" />
            Sign in with Google
          </button>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5 text-xs text-muted-foreground">
          <Logo className="text-sm" />
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 space-y-3 hover:border-primary/30 transition-colors">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
