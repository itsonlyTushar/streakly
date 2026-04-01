"use client";

import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useState, useEffect } from "react";
import {
  Brain,
  Plus,
  History,
  CheckCircle2,
  Clock,
  ChevronRight,
  Flame,
  Search,
  BookOpen,
  LayoutGrid,
  List,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addDays, isPast, isToday, set } from "date-fns";

interface SRSItem {
  id: string;
  userId: string;
  topic: string;
  details?: string;
  dateLearned: Timestamp;
  nextReviewDate: Timestamp;
  reviewCount: number;
  status: "learning" | "memorized";
  createdAt: Timestamp;
}

const INTERVALS = [1, 3, 7, 30]; // Days for each subsequent review

export default function SRSPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<SRSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopic, setNewTopic] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "srs"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const SRSItems = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as SRSItem[];

        // Sort in-memory to avoid needing a composite index for now
        SRSItems.sort((a, b) => {
          if (!a.nextReviewDate || !b.nextReviewDate) return 0;
          return a.nextReviewDate.toMillis() - b.nextReviewDate.toMillis();
        });

        setItems(SRSItems);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setLoading(false); // don't stay in spinning state
      },
    );

    return () => unsubscribe();
  }, [user]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTopic.trim()) return;

    setIsAdding(true);
    try {
      const today = new Date();
      // 1st review is 10 AM the next day
      const firstReviewDate = set(addDays(today, 1), {
        hours: 10,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });

      await addDoc(collection(db, "srs"), {
        userId: user.uid,
        userEmail: user.email, // store email for reminders
        topic: newTopic.trim(),
        details: newDetails.trim(),
        dateLearned: serverTimestamp(),
        nextReviewDate: Timestamp.fromDate(firstReviewDate),
        reviewCount: 0,
        status: "learning",
        createdAt: serverTimestamp(),
      });

      setNewTopic("");
      setNewDetails("");
    } catch (error) {
      console.error("Error adding SRS item:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleReview = async (item: SRSItem) => {
    if (!user) return;

    try {
      const nextReviewCount = item.reviewCount + 1;
      const isFinished = nextReviewCount >= INTERVALS.length;

      const updates: any = {
        reviewCount: nextReviewCount,
        lastReviewedAt: serverTimestamp(),
      };

      if (isFinished) {
        updates.status = "memorized";
      } else {
        const nextInterval = INTERVALS[nextReviewCount];
        const nextDate = set(addDays(new Date(), nextInterval), {
          hours: 10,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        });
        updates.nextReviewDate = Timestamp.fromDate(nextDate);
      }

      await updateDoc(doc(db, "srs", item.id), updates);
    } catch (error) {
      console.error("Error updating SRS item:", error);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const dueItems = filteredItems.filter(
    (item) =>
      item.status === "learning" &&
      item.nextReviewDate &&
      isPast(item.nextReviewDate.toDate()),
  );

  const upcomingItems = filteredItems.filter(
    (item) =>
      item.status === "learning" &&
      item.nextReviewDate &&
      !isPast(item.nextReviewDate.toDate()),
  );

  const memorizedItems = filteredItems.filter(
    (item) => item.status === "memorized",
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin text-primary">
          <Brain className="h-10 w-10" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      {/* Header Section */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <Brain className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Spaced Repetition
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl font-medium">
          Retain what you learn forever. The system will remind you exactly when
          your brain is about to forget.
        </p>
      </header>

      {/* Add New Learning Form */}
      <section className="bg-card border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 text-primary/5 -rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-0 duration-500">
          <BookOpen className="h-40 w-40" />
        </div>

        <form onSubmit={handleAddItem} className="relative z-10 space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Plus className="h-6 w-6 text-primary" />
            What did you learn today?
          </h2>
          <div className="space-y-4">
            <input
              required
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="Topic Title (e.g., React Server Components, Pythagorean Theorem)"
              className="w-full bg-secondary/50 border border-border/50 rounded-2xl p-5 text-lg font-bold focus:ring-2 ring-primary outline-none transition-all placeholder:text-muted-foreground/30"
            />
            <textarea
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              placeholder="Short description or key takeaways (optional)"
              className="w-full bg-secondary/50 border border-border/50 rounded-2xl p-5 h-24 resize-none focus:ring-2 ring-primary outline-none transition-all placeholder:text-muted-foreground/30 font-medium"
            />
            <button
              type="submit"
              disabled={isAdding || !newTopic.trim()}
              className="px-8 h-14 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg items-center gap-2 flex disabled:opacity-50"
            >
              {isAdding ? "Adding..." : "Start Learning"}
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </form>
      </section>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Due Now"
          value={dueItems.length}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <StatCard
          icon={<Flame className="h-5 w-5" />}
          label="Active Learning"
          value={items.filter((i) => i.status === "learning").length}
          color="text-primary"
          bg="bg-primary/10"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Memorized"
          value={memorizedItems.length}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
      </div>

      {/* Search and Filters */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your knowledge base..."
          className="w-full h-14 pl-14 pr-6 bg-secondary/30 rounded-2xl border border-border/50 focus:ring-2 ring-primary outline-none transition-all"
        />
      </div>

      {/* Items Lists */}
      <div className="space-y-16">
        {dueItems.length > 0 && (
          <section className="space-y-6">
            <h3 className="text-2xl font-bold flex items-center gap-2 text-amber-500">
              <Clock className="h-6 w-6" />
              Due for Review
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dueItems.map((item) => (
                <SRSItemCard
                  key={item.id}
                  item={item}
                  isDue
                  onReview={() => handleReview(item)}
                />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <History className="h-6 w-6 text-primary" />
              Revision Schedule
            </h3>

            {upcomingItems.length > 0 && (
              <div className="flex items-center gap-1 bg-secondary/50 p-1.5 rounded-2xl w-fit">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    viewMode === "grid"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    viewMode === "table"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  <List className="h-4 w-4" />
                  Table
                </button>
              </div>
            )}
          </div>

          {upcomingItems.length === 0 ? (
            <div className="p-12 text-center bg-secondary/20 rounded-[2rem] border border-dashed border-border">
              <p className="text-muted-foreground font-medium">
                No items in revision. Start learning something new!
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingItems.map((item) => (
                <SRSItemCard
                  key={item.id}
                  item={item}
                  onReview={() => handleReview(item)}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[2rem] border border-border/50 bg-card/50 shadow-sm backdrop-blur-sm">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-border/50 bg-secondary/30">
                    <th className="p-6 font-bold text-xs uppercase tracking-widest text-muted-foreground">
                      Topic & Context
                    </th>
                    <th className="p-6 font-bold text-xs uppercase tracking-widest text-muted-foreground">
                      Learn Date
                    </th>
                    <th className="p-6 font-bold text-xs uppercase tracking-widest text-muted-foreground">
                      Next Session
                    </th>
                    <th className="p-6 font-bold text-xs uppercase tracking-widest text-muted-foreground">
                      Progression
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {upcomingItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-secondary/20 transition-all group"
                    >
                      <td className="p-6 max-w-[300px]">
                        <div className="font-bold text-lg group-hover:text-primary transition-colors">
                          {item.topic}
                        </div>
                        {item.details && (
                          <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {item.details}
                          </div>
                        )}
                      </td>
                      <td className="p-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-xl text-sm font-medium">
                          <History className="h-3.5 w-3.5 text-muted-foreground" />
                          {item.dateLearned
                            ? format(item.dateLearned.toDate(), "MMM d")
                            : "Just now"}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm font-bold text-primary">
                            <Clock className="h-4 w-4" />
                            {item.nextReviewDate
                              ? format(item.nextReviewDate.toDate(), "MMM d")
                              : "Pending"}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                            {item.nextReviewDate
                              ? `at ${format(item.nextReviewDate.toDate(), "h:mm a")}`
                              : "---"}
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                              Stage {item.reviewCount + 1}/4
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-primary">
                                {Math.round((item.reviewCount / 4) * 100)}%
                              </span>
                              <button
                                onClick={() => handleReview(item)}
                                className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all opacity-0 group-hover:opacity-100"
                                title="Mark as reviewed"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${(item.reviewCount / 4) * 100}%`,
                              }}
                              className="h-full bg-primary"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {memorizedItems.length > 0 && (
          <section className="space-y-6">
            <h3 className="text-2xl font-bold flex items-center gap-2 text-emerald-500">
              <CheckCircle2 className="h-6 w-6" />
              Memorized
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {memorizedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center justify-between"
                >
                  <span className="font-bold truncate pr-2">{item.topic}</span>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="p-6 bg-card border border-border/50 rounded-3xl flex items-center gap-5">
      <div className={`p-4 ${bg} ${color} rounded-2xl`}>{icon}</div>
      <div>
        <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        <div className="text-3xl font-black">{value}</div>
      </div>
    </div>
  );
}

function SRSItemCard({
  item,
  isDue = false,
  onReview,
}: {
  item: SRSItem;
  isDue?: boolean;
  onReview?: () => void;
}) {
  const nextDate = item.nextReviewDate?.toDate();
  const reviewProgress = (item.reviewCount / 4) * 100;

  return (
    <motion.div
      layout
      className={`p-6 rounded-3xl border transition-all ${
        isDue
          ? "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 shadow-sm"
          : "bg-card border-border/50 hover:bg-secondary/20"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <h4 className="text-lg font-bold group-hover:text-primary transition-colors">
            {item.topic}
          </h4>
          {item.details && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {item.details}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isDue && (
            <button
              onClick={onReview}
              className="px-3 py-1 bg-amber-500 text-white rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
            >
              Complete
            </button>
          )}
          <div
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isDue
                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            Review {item.reviewCount + 1}/4
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000"
            style={{ width: `${reviewProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {isDue
              ? "Due now"
              : nextDate
                ? `Next: ${format(nextDate, "MMM d, h:mm a")}`
                : "Scheduling..."}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
