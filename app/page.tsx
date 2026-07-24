"use client";

import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { LogIn, Target, Brain, Code, Cpu, Trophy, ArrowRight, Zap, ChevronRight, Calendar, Wand2, Bot, ListTodo, Layers, Play } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as any },
  }),
};

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
    <div className="min-h-screen bg-background font-v-body overflow-x-hidden">
      {/* Subtle dot-grid background */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo className="text-xl" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={loginWithGoogle}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 hover:scale-[1.02] active:scale-95"
            >
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">

        {/* ── Hero ── */}
        <section className="relative pt-24 pb-20 text-center">
          {/* Radial glow behind heading */}
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,var(--color-primary)_0%,transparent_80%)] opacity-[0.06]" />

          <motion.div custom={0} initial="hidden" animate="visible" variants={fadeUp}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-medium text-muted-foreground">
              <Zap className="h-3 w-3 text-primary" fill="currentColor" />
              Free · No dashboards · Just clarity
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-8 text-6xl md:text-8xl lg:text-[7rem] font-v-headings leading-[0.9] tracking-tight text-foreground"
          >
            Build habits.
            <br />
            <span className="relative inline-block">
              <span className="relative z-10">Ship skills.</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="absolute bottom-2 left-0 right-0 h-3 md:h-4 bg-primary/10 origin-left -z-10 rounded"
              />
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mx-auto mt-7 max-w-md text-base md:text-lg text-muted-foreground leading-relaxed"
          >
            Track goals, study smarter, and prep for interviews — one clean
            workspace, built for developers.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <button
              onClick={loginWithGoogle}
              className="group flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.02] active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              Get started — it&apos;s free
              <ArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <Link
              href="/srs"
              className="flex items-center gap-1.5 rounded-full border border-border bg-transparent px-7 py-3.5 text-sm font-semibold text-foreground transition hover:bg-card"
            >
              Explore without signing in
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            </Link>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center justify-center gap-2"
          >
            {[
              "Goal streaks",
              "Spaced repetition",
              "Interactive Flashcards",
              "DSA tracker",
              "Machine coding",
              "Revision calendar",
              "AI code wizard",
              "AI mock interviews",
              "Smart checklists",
            ].map((f) => (
              <span
                key={f}
                className="rounded-full border border-border bg-card/60 px-3.5 py-1 text-xs font-medium text-muted-foreground"
              >
                {f}
              </span>
            ))}
          </motion.div>
        </section>

        {/* ── Features Bento ── */}
        <section className="py-16 space-y-8">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            className="space-y-2"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">
              What&apos;s inside
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Everything you need to level up.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Featured wide card */}
            <motion.div
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
              className="lg:col-span-2 relative rounded-3xl bg-primary text-primary-foreground p-8 flex flex-col gap-6 overflow-hidden hover:scale-[1.01] transition-transform"
            >
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-foreground/10 blur-3xl" />
              <div className="h-11 w-11 rounded-2xl bg-primary-foreground/15 flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary-foreground/50">
                  Core Feature
                </p>
                <h3 className="text-2xl font-bold text-primary-foreground">
                  Spaced Repetition System
                </h3>
                <p className="text-sm text-primary-foreground/70 leading-relaxed max-w-sm">
                  Capture what you learn. The app surfaces it again right before
                  you forget — so you actually retain it long-term.
                </p>
              </div>
            </motion.div>

            {/* Regular cards */}
            {[
              {
                icon: <Layers className="h-5 w-5" />,
                label: "Flashcards",
                title: "Interactive Decks",
                desc: "Study concepts with 3D flip flashcards, smart SRS intervals (Again, Hard, Good, Easy), and deck organization.",
              },
              {
                icon: <Calendar className="h-5 w-5" />,
                label: "Calendar",
                title: "Revision Calendar",
                desc: "Visualize your upcoming SRS reviews, DSA problems, and daily tasks in a unified monthly view.",
              },
              {
                icon: <Target className="h-5 w-5" />,
                label: "Goals",
                title: "Goal Tracking & Archive",
                desc: "Set timed goals with a daily log, and archive them in the Hall of Fame upon completion.",
              },
              {
                icon: <Wand2 className="h-5 w-5" />,
                label: "Wizard",
                title: "AI Code Explainer",
                desc: "Let AI explain complex code blocks, suggest optimizations, and document your learnings.",
              },
              {
                icon: <Bot className="h-5 w-5" />,
                label: "Interviews",
                title: "Mock Interview (Beta)",
                desc: "Pre-empt actual technical rounds by chatting with a dedicated AI mock interviewer.",
              },
              {
                icon: <ListTodo className="h-5 w-5" />,
                label: "Tasks",
                title: "Smart Task Lists",
                desc: "Create daily check-lists and convert your completed tasks into active Spaced Repetition cards.",
              },
              {
                icon: <Code className="h-5 w-5" />,
                label: "DSA",
                title: "DSA Practice",
                desc: "Log problems, tag topics, and track your active review schedule using Spaced Repetition.",
              },
              {
                icon: <Cpu className="h-5 w-5" />,
                label: "Coding",
                title: "Machine Coding",
                desc: "Save architecture patterns, boilerplate codes, and frontend setups for rapid recall.",
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                custom={i + 2}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                className="rounded-3xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  {card.icon}
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-primary">
                    {card.label}
                  </p>
                  <h3 className="font-bold text-foreground">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Spaced Repetition Video Section ── */}
        <section className="py-16 border-t border-border/40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <motion.div
              custom={0}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              className="lg:col-span-5 space-y-4"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
                <Play className="h-3 w-3 fill-primary" />
                The Science of Learning
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                How Spaced Repetition Hack Your Memory
              </h2>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Without revision, humans forget up to 80% of new material within just 24 hours (the Ebbinghaus Forgetting Curve).
              </p>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                By reviewing concepts at mathematically timed intervals right when forgetting begins, Streakly locks knowledge directly into your long-term memory.
              </p>
              <div className="pt-2 flex flex-col gap-2.5">
                {[
                  "Optimized review intervals (1d, 3d, 7d, 14d, 30d)",
                  "Interactive 3D flashcards with customizable decks",
                  "Automated daily revision reminders",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs md:text-sm font-medium text-foreground">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              custom={1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              className="lg:col-span-7"
            >
              <div className="relative rounded-3xl border border-border/80 bg-card/60 p-2 sm:p-4 shadow-2xl backdrop-blur-sm overflow-hidden group">
                <div className="pointer-events-none absolute -inset-px rounded-3xl border border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
                  <iframe
                    className="h-full w-full border-0"
                    src="https://www.youtube.com/embed/YL2NDkqRJpc"
                    title="How Spaced Repetition Works"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── CTA Strip ── */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={fadeUp}
          custom={0}
          className="py-16"
        >
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 md:px-14 py-14 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent" />
            <div className="relative space-y-3 text-center md:text-left">
              <p className="text-xs uppercase tracking-[0.25em] font-bold text-primary">
                Ready?
              </p>
              <h3 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                Start your streak today.
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                No setup, no dashboards, just your goals and the notes that
                shape them.
              </p>
            </div>
            <button
              onClick={loginWithGoogle}
              className="group relative shrink-0 flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.02] active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              Sign in with Google
              <ArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </motion.section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 mt-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Logo className="text-sm" />
            <span className="text-border mx-1">·</span>
            <span className="hidden sm:inline">Built for developers.</span>
          </div>
          <div className="flex gap-5">
            <Link
              href="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
