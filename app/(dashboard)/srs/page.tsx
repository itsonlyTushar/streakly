"use client";

import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
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
  Search,
  BookOpen,
  Calendar,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { format, addDays, isPast, set } from "date-fns";

interface SRSItem {
  id: string;
  userId: string;
  topic: string;
  details?: string;
  dateLearned: Timestamp;
  nextReviewDate: Timestamp;
  reviewCount: number;
  createdAt: Timestamp;
}

const INTERVALS = [1, 3, 7, 30]; // Exact stages as per request

export default function SRSPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<SRSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopic, setNewTopic] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

        SRSItems.sort((a, b) => {
          // Stable sort by creation date (newest first)
          const dateA = a.createdAt?.toMillis() || 0;
          const dateB = b.createdAt?.toMillis() || 0;
          if (dateA !== dateB) return dateB - dateA;
          // Fallback to topic name for absolute stability
          return a.topic.localeCompare(b.topic);
        });

        setItems(SRSItems);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
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
      const firstReviewDate = set(addDays(today, 1), {
        hours: 10,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });

      await addDoc(collection(db, "srs"), {
        userId: user.uid,
        userEmail: user.email,
        topic: newTopic.trim(),
        details: newDetails.trim(),
        dateLearned: serverTimestamp(),
        nextReviewDate: Timestamp.fromDate(firstReviewDate),
        reviewCount: 0,
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
      
      // If we finished the 30th day (last stage), we can either hide it or keep it at max
      if (nextReviewCount >= INTERVALS.length) {
        await updateDoc(doc(db, "srs", item.id), {
          reviewCount: nextReviewCount,
          lastReviewedAt: serverTimestamp(),
          // We could set nextReviewDate to null or very far in future if "completed"
          nextReviewDate: null, 
        });
        return;
      }

      const nextInterval = INTERVALS[nextReviewCount];
      const nextDate = set(addDays(new Date(), nextInterval), {
        hours: 10,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });

      await updateDoc(doc(db, "srs", item.id), {
        reviewCount: nextReviewCount,
        lastReviewedAt: serverTimestamp(),
        nextReviewDate: Timestamp.fromDate(nextDate),
      });
    } catch (error) {
      console.error("Error updating SRS item:", error);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details?.toLowerCase().includes(searchQuery.toLowerCase()),
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
    <div className="max-w-6xl mx-auto space-y-10 pb-20 px-4">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary text-sm font-black uppercase tracking-widest">
            <Sparkles className="h-4 w-4" />
            Active Learning
          </div>
          <h1 className="text-5xl font-black tracking-tighter">
            Spaced Repetition
          </h1>
          <p className="text-muted-foreground font-medium max-w-sm">
            Retain mastery through scheduled revision milestones.
          </p>
        </div>
      </header>

      {/* Add New Learning Form - Refined & Premium */}
      <section className="bg-gradient-to-br from-card to-secondary/20 border border-border/60 rounded-3xl p-6 md:p-8 shadow-2xl shadow-primary/5 relative overflow-hidden group">
        <div className="absolute -top-10 -right-10 p-8 text-primary/5 -rotate-12 transition-transform group-hover:scale-110 duration-700">
          <Brain className="h-64 w-64" />
        </div>

        <form onSubmit={handleAddItem} className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-12">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
              <Plus className="h-5 w-5 text-primary" />
              Capture new knowledge
            </h2>
          </div>
          
          <div className="md:col-span-5">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
              Topic Title
            </label>
            <input
              required
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g., React Server Components"
              className="w-full bg-background border border-border/60 rounded-xl px-4 py-4 text-base font-bold focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30"
            />
          </div>

          <div className="md:col-span-5">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
              Context or Details
            </label>
            <input
              type="text"
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              placeholder="Key takeaway or reference"
              className="w-full bg-background border border-border/60 rounded-xl px-4 py-4 text-base font-medium focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30"
            />
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isAdding || !newTopic.trim()}
              className="w-full h-[60px] bg-primary text-primary-foreground rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {isAdding ? "Saving..." : "Start"}
            </button>
          </div>
        </form>
      </section>

      {/* Main Content - Search and Table */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter topics..."
              className="w-full h-12 pl-12 pr-4 bg-secondary/30 rounded-xl border border-border/50 focus:ring-2 ring-primary/20 outline-none transition-all"
            />
          </div>
          <div className="text-xs font-bold text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg border border-border/50">
            {filteredItems.length} TOPICS TRACKED
          </div>
        </div>

        {/* The "Propro" Table */}
        <div className="overflow-hidden rounded-2xl border border-border shadow-md bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-secondary/40 border-b border-border">
                  <th className="p-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-r border-border/50">
                    Topic & Background
                  </th>
                  <th className="p-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground min-w-[240px] border-r border-border/50">
                    Learning Path (Milestones)
                  </th>
                  <th className="p-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground border-r border-border/50">
                    Next Session
                  </th>
                  <th className="p-5 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-right px-8">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-20 text-center text-muted-foreground font-medium italic">
                      No items found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isDue = item.nextReviewDate && isPast(item.nextReviewDate.toDate());
                    const isCompleted = item.reviewCount >= INTERVALS.length;
                    
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-secondary/10 transition-colors group"
                      >
                        <td className="p-5 align-top border-r border-border/50">
                          <div className="flex flex-col gap-1">
                            <div className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                              {item.topic}
                            </div>
                            {item.details && (
                              <div className="text-xs text-muted-foreground font-medium max-w-[300px]">
                                {item.details}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-5 align-top border-r border-border/50">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Started {item.dateLearned ? format(item.dateLearned.toDate(), "MMM d") : "---"}
                            </div>
                            
                            {/* The Circle Progression UI */}
                            <div className="flex items-center gap-4">
                              {INTERVALS.map((day, idx) => {
                                const isDone = item.reviewCount > idx;
                                const isCurrent = item.reviewCount === idx;
                                
                                return (
                                  <div key={day} className="flex flex-col items-center gap-2">
                                    <span className={`text-[10px] font-black ${isCurrent && isDue ? 'text-amber-500' : isDone ? 'text-primary' : 'text-muted-foreground/40'}`}>
                                      {day}{day === 1 ? 'st' : day === 3 ? 'rd' : day === 7 ? 'th' : 'th'}
                                    </span>
                                    <div 
                                      className={`h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all ${
                                        isDone 
                                          ? 'bg-primary border-primary shadow-lg shadow-primary/20' 
                                          : isCurrent && isDue
                                            ? 'border-amber-500 animate-pulse bg-amber-500/5'
                                            : 'border-border/60 bg-secondary/20'
                                      }`}
                                    >
                                      {isDone && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                                      {isCurrent && !isDone && <div className={`h-2 w-2 rounded-full ${isDue ? 'bg-amber-500' : 'bg-primary/40'}`} />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="p-5 align-top border-r border-border/50">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between min-w-[120px]">
                              {isCompleted ? (
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                  <Sparkles className="h-3 w-3" />
                                  Mastered
                                </div>
                              ) : (
                                <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${isDue ? "text-amber-600" : "text-primary/60"}`}>
                                  {isDue ? (
                                    <>
                                      <Clock className="h-3 w-3" />
                                      Due Now
                                    </>
                                  ) : (
                                    <>
                                      <History className="h-3 w-3" />
                                      Scheduled
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-xs font-black text-muted-foreground">
                              {isCompleted ? "Goal achieved" : item.nextReviewDate ? format(item.nextReviewDate.toDate(), "MMM d, h:mm a") : "---"}
                            </div>
                          </div>
                        </td>
                        <td className="p-5 align-top text-right px-8">
                          {!isCompleted && (
                            <button
                              onClick={() => handleReview(item)}
                              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                isDue
                                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95"
                                  : "bg-secondary text-muted-foreground opacity-40 hover:opacity-100 hover:bg-primary hover:text-primary-foreground"
                              }`}
                            >
                              {isDue ? "Review Now" : "Mark Step"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
