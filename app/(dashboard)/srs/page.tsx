"use client";

import {
  useSRSItems,
  useAddSRSItem,
  useUpdateSRSItem,
  useDeleteSRSItem,
} from "@/hooks/use-srs";
import {
  Brain,
  Plus,
  History,
  CheckCircle2,
  Clock,
  Search,
  Calendar,
  Sparkles,
  Bell,
  Edit2,
  Save,
  X,
  Trash2,
  Check,
  RefreshCw,
  Link,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { format, addDays, isPast, set } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuthGuard } from "@/components/auth-guard";

import {
  SRS_INTERVALS,
  calculateNextReviewDate,
  getInitialReviewDate,
} from "@/lib/srs-utils";

export default function SRSPage() {
  const { data: items = [], isLoading } = useSRSItems();
  const addMutation = useAddSRSItem();
  const updateMutation = useUpdateSRSItem();
  const deleteMutation = useDeleteSRSItem();
  const { requireAuth } = useAuthGuard();

  const [newTopic, setNewTopic] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [newLink, setNewLink] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderSelectedDate, setReminderSelectedDate] = useState<
    Date | undefined
  >(addDays(new Date(), 1));

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTopic, setEditTopic] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editLink, setEditLink] = useState("");

  // Delete states
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<
    "all" | "due" | "in-progress" | "mastered" | "reminders"
  >("all");

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    requireAuth(() => {
      addMutation.mutate(
        {
          topic: newTopic.trim(),
          details: newDetails.trim(),
          link: newLink.trim() || null,
          nextReviewDate: hasReminder ? null : getInitialReviewDate(),
          reminderDate:
            hasReminder && reminderSelectedDate ? reminderSelectedDate : null,
        },
        {
          onSuccess: () => {
            setNewTopic("");
            setNewDetails("");
            setNewLink("");
            setHasReminder(false);
          },
        },
      );
    });
  };

  const handleReviewSuccess = async (item: any) => {
    requireAuth(() => {
      const nextReviewCount = item.reviewCount + 1;
      const nextDateValue = calculateNextReviewDate(nextReviewCount);

      updateMutation.mutate({
        itemId: item.id,
        data: {
          reviewCount: nextReviewCount,
          nextReviewDate: nextDateValue
            ? Timestamp.fromDate(nextDateValue)
            : (null as any),
        },
      });
    });
  };

  const handleReviewForgot = async (item: any) => {
    requireAuth(() => {
      const nextDateValue = calculateNextReviewDate(0);

      updateMutation.mutate({
        itemId: item.id,
        data: {
          reviewCount: 0,
          nextReviewDate: nextDateValue
            ? Timestamp.fromDate(nextDateValue)
            : (null as any),
        },
      });
    });
  };

  const handleDeleteConfirm = async (itemId: string) => {
    requireAuth(() => {
      deleteMutation.mutate(itemId, {
        onSuccess: () => {
          setDeletingId(null);
        },
      });
    });
  };

  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setEditTopic(item.topic);
    setEditDetails(item.details || "");
    setEditLink(item.link || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTopic("");
    setEditDetails("");
    setEditLink("");
  };

  const handleSaveEdit = async (itemId: string) => {
    if (!editTopic.trim()) return;

    requireAuth(() => {
      updateMutation.mutate(
        {
          itemId,
          data: {
            topic: editTopic.trim(),
            details: editDetails.trim(),
            link: editLink.trim() || null,
          },
        },
        {
          onSuccess: () => {
            handleCancelEdit();
          },
        },
      );
    });
  };

  // Status counts
  const counts = {
    all: items.length,
    due: items.filter(
      (item) =>
        item.nextReviewDate &&
        isPast(item.nextReviewDate.toDate()) &&
        item.reviewCount < SRS_INTERVALS.length,
    ).length,
    inProgress: items.filter(
      (item) =>
        item.nextReviewDate &&
        !isPast(item.nextReviewDate.toDate()) &&
        item.reviewCount < SRS_INTERVALS.length,
    ).length,
    mastered: items.filter(
      (item) => item.nextReviewDate && item.reviewCount >= SRS_INTERVALS.length,
    ).length,
    reminders: items.filter((item) => !item.nextReviewDate && item.reminderDate)
      .length,
  };

  const searchedItems = items.filter(
    (item) =>
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.details?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredItems = searchedItems.filter((item) => {
    if (statusFilter === "all") return true;

    const isDue = item.nextReviewDate && isPast(item.nextReviewDate.toDate());
    const isCompleted =
      item.nextReviewDate && item.reviewCount >= SRS_INTERVALS.length;

    if (statusFilter === "due") {
      return item.nextReviewDate && isDue && !isCompleted;
    }
    if (statusFilter === "in-progress") {
      return item.nextReviewDate && !isDue && !isCompleted;
    }
    if (statusFilter === "mastered") {
      return isCompleted;
    }
    if (statusFilter === "reminders") {
      return !item.nextReviewDate && item.reminderDate;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin text-primary">
          <Brain className="h-10 w-10" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary text-sm font-black uppercase tracking-widest">
            <Sparkles className="h-4 w-4" />
            Active Learning
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
            Spaced Repetition
          </h1>
          <p className="text-muted-foreground font-medium max-w-sm">
            Retain mastery through scheduled revision milestones.
          </p>
        </div>
      </header>

      {/* Add New Learning Form - Refined & Premium */}
      <section className="bg-gradient-to-br from-card to-secondary/20 border border-border/60 rounded-3xl p-5 md:p-6 shadow-2xl shadow-primary/5 relative group">
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="absolute -top-10 -right-10 p-8 text-primary/5 -rotate-12 transition-transform group-hover:scale-110 duration-700">
            <Brain className="h-64 w-64" />
          </div>
        </div>

        <form
          onSubmit={handleAddItem}
          className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6"
        >
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

          <div className="md:col-span-5">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
              Reference Link
            </label>
            <div className="relative">
              <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full bg-background border border-border/60 rounded-xl pl-11 pr-4 py-4 text-base font-medium focus:border-primary focus:ring-4 ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/30"
              />
            </div>
          </div>

          <div className="md:col-span-12 flex flex-wrap items-center gap-6 mt-2">
            <div className="flex items-center gap-3 bg-background/50 border border-border/40 px-4 py-2 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2">
                <Bell
                  className={`h-4 w-4 ${hasReminder ? "text-primary" : "text-muted-foreground/30"}`}
                />
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Set Reminder
                </span>
              </div>
              <Switch checked={hasReminder} onCheckedChange={setHasReminder} />
            </div>

            {hasReminder && (
              <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex flex-col min-w-[200px]">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">
                    Reminder Date
                  </label>
                  <DatePicker
                    selected={reminderSelectedDate}
                    onSelect={setReminderSelectedDate}
                    placeholder="Pick a date"
                    buttonClassName="p-2 md:p-2 text-sm h-10 rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-12 flex justify-end">
            <button
              type="submit"
              disabled={addMutation.isPending || !newTopic.trim()}
              className="w-full md:w-auto px-12 h-[60px] bg-primary text-primary-foreground rounded-xl font-black text-sm uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {addMutation.isPending ? "Saving..." : "Start Learning Path"}
            </button>
          </div>
        </form>
      </section>

      {/* Main Content - Search and Table */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter topics by title or details..."
              className="w-full h-12 pl-12 pr-4 bg-secondary/30 rounded-xl border border-border/50 focus:ring-2 ring-primary/20 outline-none transition-all"
            />
          </div>
          <div className="text-xs font-bold text-muted-foreground bg-secondary/50 px-4 py-2 rounded-lg border border-border/50 self-end md:self-auto uppercase tracking-wider">
            {filteredItems.length} of {items.length} Showing
          </div>
        </div>

        {/* Filter Tabs / Pills */}
        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border/40">
          <button
            onClick={() => setStatusFilter("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10"
                : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary hover:text-foreground"
            }`}
          >
            All
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                statusFilter === "all"
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-secondary-foreground/10 text-muted-foreground"
              }`}
            >
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("due")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === "due"
                ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/10"
                : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary hover:text-foreground"
            }`}
          >
            <div
              className={`h-2.5 w-2.5 rounded-full bg-amber-500 ${counts.due > 0 ? "" : ""}`}
            />
            Due Now
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                statusFilter === "due"
                  ? "bg-white/20 text-white"
                  : "bg-secondary-foreground/10 text-muted-foreground"
              }`}
            >
              {counts.due}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("in-progress")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === "in-progress"
                ? "bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/10"
                : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary hover:text-foreground"
            }`}
          >
            <div className="h-2.5 w-2.5 rounded-full bg-sky-400" />
            In Progress
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                statusFilter === "in-progress"
                  ? "bg-white/20 text-white"
                  : "bg-secondary-foreground/10 text-muted-foreground"
              }`}
            >
              {counts.inProgress}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("mastered")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === "mastered"
                ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/10"
                : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary hover:text-foreground"
            }`}
          >
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Mastered
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                statusFilter === "mastered"
                  ? "bg-white/20 text-white"
                  : "bg-secondary-foreground/10 text-muted-foreground"
              }`}
            >
              {counts.mastered}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("reminders")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              statusFilter === "reminders"
                ? "bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/10"
                : "bg-secondary/40 text-muted-foreground border-border/40 hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Bell className="h-3 w-3" />
            Fixed Reminders
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                statusFilter === "reminders"
                  ? "bg-white/20 text-white"
                  : "bg-secondary-foreground/10 text-muted-foreground"
              }`}
            >
              {counts.reminders}
            </span>
          </button>
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
                    <td
                      colSpan={4}
                      className="p-20 text-center text-muted-foreground font-medium italic"
                    >
                      No items found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isDue =
                      item.nextReviewDate &&
                      isPast(item.nextReviewDate.toDate());
                    const isCompleted =
                      item.reviewCount >= SRS_INTERVALS.length;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-secondary/10 transition-colors group"
                      >
                        <td className="p-5 align-top border-r border-border/50">
                          {editingId === item.id ? (
                            <div className="flex flex-col gap-3">
                              <input
                                autoFocus
                                type="text"
                                value={editTopic}
                                onChange={(e) => setEditTopic(e.target.value)}
                                className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-sm font-bold focus:border-primary focus:ring-2 ring-primary/10 outline-none transition-all"
                                placeholder="Topic Title"
                              />
                              <textarea
                                value={editDetails}
                                onChange={(e) => setEditDetails(e.target.value)}
                                className="w-full bg-background border border-border/60 rounded-lg px-3 py-2 text-xs font-medium focus:border-primary focus:ring-2 ring-primary/10 outline-none transition-all min-h-[60px]"
                                placeholder="Details..."
                              />
                              <div className="relative">
                                <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
                                <input
                                  type="url"
                                  value={editLink}
                                  onChange={(e) => setEditLink(e.target.value)}
                                  className="w-full bg-background border border-border/60 rounded-lg pl-8 pr-3 py-2 text-xs font-medium focus:border-primary focus:ring-2 ring-primary/10 outline-none transition-all"
                                  placeholder="https://reference-link.com"
                                />
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <button
                                  onClick={() => handleSaveEdit(item.id)}
                                  disabled={
                                    updateMutation.isPending ||
                                    !editTopic.trim()
                                  }
                                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-black uppercase tracking-wider hover:brightness-110 disabled:opacity-50"
                                >
                                  <Save className="h-3 w-3" /> Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-muted-foreground rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                >
                                  <X className="h-3 w-3" /> Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 relative group/title">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-bold text-lg leading-tight group-hover/title:text-primary transition-colors">
                                  {item.topic}
                                  {item.link && (
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 ml-2 align-middle px-1.5 py-0.5 rounded-md bg-primary/8 hover:bg-primary/15 text-primary/70 hover:text-primary transition-all"
                                      title={item.link}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <img
                                        src={`https://www.google.com/s2/favicons?domain=${new URL(item.link).hostname}&sz=16`}
                                        alt=""
                                        className="h-3 w-3 rounded-sm"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                      />
                                      <span className="text-[10px] font-bold">
                                        {new URL(item.link).hostname.replace('www.', '')}
                                      </span>
                                      <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                  )}
                                </div>
                                {deletingId === item.id ? (
                                  <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-200 bg-destructive/10 border border-destructive/20 rounded-lg px-2 py-0.5 ml-2">
                                    <span className="text-[9px] font-black text-destructive uppercase tracking-wider">
                                      Confirm Delete?
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleDeleteConfirm(item.id)
                                      }
                                      disabled={deleteMutation.isPending}
                                      className="p-0.5 hover:bg-destructive hover:text-white rounded text-destructive transition-colors"
                                      title="Yes, delete"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingId(null)}
                                      className="p-0.5 hover:bg-secondary rounded text-muted-foreground transition-colors"
                                      title="Cancel"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleStartEdit(item)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded-md text-muted-foreground/50 hover:text-primary transition-colors"
                                      title="Edit topic"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingId(item.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded-md text-muted-foreground/50 hover:text-destructive transition-colors"
                                      title="Delete topic"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              {item.details && (
                                <div className="text-xs text-muted-foreground font-medium max-w-[300px]">
                                  {item.details}
                                </div>
                              )}
                              {item.reminderDate && (
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary mt-1 bg-primary/5 w-fit px-2 py-0.5 rounded-full border border-primary/10">
                                  <Bell className="h-2.5 w-2.5" />
                                  Reminder:{" "}
                                  {format(
                                    item.reminderDate.toDate(),
                                    "MMM d, yyyy",
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-5 align-top border-r border-border/50">
                          {item.nextReviewDate ? (
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Started{" "}
                                {item.dateLearned
                                  ? format(item.dateLearned.toDate(), "MMM d")
                                  : "---"}
                              </div>

                              {/* The Circle Progression UI */}
                              <div className="flex items-center gap-4">
                                {SRS_INTERVALS.map(
                                  (day: number, idx: number) => {
                                    const isDone = item.reviewCount > idx;
                                    const isCurrent = item.reviewCount === idx;

                                    return (
                                      <div
                                        key={day}
                                        className="flex flex-col items-center gap-2"
                                      >
                                        <span
                                          className={`text-[10px] font-black ${isCurrent && isDue ? "text-amber-500" : isDone ? "text-primary" : "text-muted-foreground/40"}`}
                                        >
                                          {day}
                                          {day === 1
                                            ? "st"
                                            : day === 3
                                              ? "rd"
                                              : day === 7
                                                ? "th"
                                                : "th"}
                                        </span>
                                        <div
                                          className={`h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all ${
                                            isDone
                                              ? "bg-primary border-primary shadow-lg shadow-primary/20"
                                              : isCurrent && isDue
                                                ? "border-amber-500 bg-amber-500/5"
                                                : "border-border/60 bg-secondary/20"
                                          }`}
                                        >
                                          {isDone && (
                                            <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                                          )}
                                          {isCurrent && !isDone && (
                                            <div
                                              className={`h-2 w-2 rounded-full ${isDue ? "bg-amber-500" : "bg-primary/40"}`}
                                            />
                                          )}
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full py-2 bg-secondary/20 rounded-xl border border-dashed border-border/50">
                              <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                                No intervals
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-5 align-top border-r border-border/50">
                          {item.nextReviewDate ? (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between min-w-[120px]">
                                {isCompleted ? (
                                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                    <Sparkles className="h-3 w-3" />
                                    Mastered
                                  </div>
                                ) : (
                                  <div
                                    className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${isDue ? "text-amber-600" : "text-primary/60"}`}
                                  >
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
                                {isCompleted
                                  ? "Goal achieved"
                                  : item.nextReviewDate
                                    ? format(
                                        item.nextReviewDate.toDate(),
                                        "MMM d, h:mm a",
                                      )
                                    : "---"}
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary/60">
                                <Bell className="h-3 w-3" />
                                One-off Alert
                              </div>
                              <div className="text-xs font-black text-muted-foreground italic">
                                SRS cycle disabled
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-5 align-top text-right px-8">
                          {item.nextReviewDate && !isCompleted && (
                            <>
                              {isDue ? (
                                <div className="flex items-center justify-end gap-2 flex-wrap">
                                  <button
                                    onClick={() => handleReviewForgot(item)}
                                    disabled={updateMutation.isPending}
                                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl hover:bg-destructive hover:text-white transition-all text-xs font-black uppercase tracking-widest active:scale-95 disabled:opacity-50"
                                    title="Forgot this topic? Reset the SRS path to Day 1."
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Forgot
                                  </button>
                                  <button
                                    onClick={() => handleReviewSuccess(item)}
                                    disabled={updateMutation.isPending}
                                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 rounded-xl hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-widest disabled:opacity-50"
                                    title="Remembered this topic! Advance to next milestone."
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    Got it!
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleReviewSuccess(item)}
                                  disabled={updateMutation.isPending}
                                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-secondary text-muted-foreground opacity-40 hover:opacity-100 hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
                                  title="Manually advance to the next interval"
                                >
                                  Mark Step
                                </button>
                              )}
                            </>
                          )}
                          {!item.nextReviewDate && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-xl text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">
                              Fixed reminder
                            </div>
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
