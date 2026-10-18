"use client";

import { useState, type FormEvent } from "react";
import {
  addDays,
  format,
  isBefore,
  startOfDay,
} from "date-fns";
import { Timestamp } from "firebase/firestore";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Link as LinkIcon,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { useAuthGuard } from "@/components/auth-guard";
import {
  useAddSRSItem,
  useDeleteSRSItem,
  useSRSItems,
  useUpdateSRSItem,
} from "@/hooks/use-srs";
import {
  calculateNextReviewDate,
  getInitialReviewDate,
  SRS_INTERVALS,
} from "@/lib/srs-utils";
import type { SRSItem } from "@/services/srs.service";

type StatusFilter = "all" | "due" | "in-progress" | "mastered" | "reminders";

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All topics" },
  { id: "due", label: "Due today" },
  { id: "in-progress", label: "Scheduled" },
  { id: "mastered", label: "Mastered" },
  { id: "reminders", label: "Reminders" },
];

function isMastered(item: SRSItem) {
  return item.reviewCount >= SRS_INTERVALS.length;
}

function isDue(item: SRSItem, today: Date) {
  return Boolean(
    item.nextReviewDate &&
      item.reviewCount < SRS_INTERVALS.length &&
      !isBefore(today, startOfDay(item.nextReviewDate.toDate())),
  );
}

function getStatus(item: SRSItem, today: Date) {
  if (isMastered(item)) {
    return { label: "Mastered", className: "bg-[#e9f4d4] text-[#486b23] dark:bg-lime-300/10 dark:text-lime-200" };
  }
  if (item.nextReviewDate && isDue(item, today)) {
    return { label: "Due today", className: "bg-[#fff0d7] text-[#8a5311] dark:bg-amber-300/10 dark:text-amber-200" };
  }
  if (item.nextReviewDate) {
    return { label: "Scheduled", className: "bg-secondary text-muted-foreground" };
  }
  return { label: "Reminder", className: "bg-[#eeebff] text-[#6452a7] dark:bg-violet-300/10 dark:text-violet-200" };
}

export default function SRSPage() {
  const { data: items = [], isLoading } = useSRSItems();
  const addMutation = useAddSRSItem();
  const updateMutation = useUpdateSRSItem();
  const deleteMutation = useDeleteSRSItem();
  const { requireAuth } = useAuthGuard();

  const [newTopic, setNewTopic] = useState("");
  const [newDetails, setNewDetails] = useState("");
  const [newLink, setNewLink] = useState("");
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date | undefined>(
    addDays(new Date(), 1),
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTopic, setEditTopic] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editLink, setEditLink] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const today = startOfDay(new Date());
  const counts = {
    all: items.length,
    due: items.filter((item) => isDue(item, today)).length,
    inProgress: items.filter(
      (item) =>
        item.nextReviewDate &&
        item.reviewCount < SRS_INTERVALS.length &&
        !isDue(item, today),
    ).length,
    mastered: items.filter(isMastered).length,
    reminders: items.filter((item) => !item.nextReviewDate && item.reminderDate)
      .length,
  };

  const search = searchQuery.trim().toLowerCase();
  const filteredItems = items
    .filter((item) => {
      const matchesSearch =
        !search ||
        item.topic.toLowerCase().includes(search) ||
        item.details?.toLowerCase().includes(search);
      if (!matchesSearch) return false;

      switch (statusFilter) {
        case "due":
          return isDue(item, today);
        case "in-progress":
          return Boolean(
            item.nextReviewDate &&
              item.reviewCount < SRS_INTERVALS.length &&
              !isDue(item, today),
          );
        case "mastered":
          return isMastered(item);
        case "reminders":
          return Boolean(!item.nextReviewDate && item.reminderDate);
        default:
          return true;
      }
    })
    .sort((a, b) => {
      const aDue = isDue(a, today);
      const bDue = isDue(b, today);
      if (aDue !== bDue) return aDue ? -1 : 1;
      if (a.nextReviewDate && b.nextReviewDate) {
        return a.nextReviewDate.toMillis() - b.nextReviewDate.toMillis();
      }
      if (a.nextReviewDate) return -1;
      if (b.nextReviewDate) return 1;
      return a.topic.localeCompare(b.topic);
    });

  const nextReview = items
    .filter(
      (item) =>
        item.nextReviewDate &&
        !isDue(item, today) &&
        !isMastered(item),
    )
    .sort(
      (a, b) =>
        a.nextReviewDate.toMillis() - b.nextReviewDate.toMillis(),
    )[0];

  const showCreateForm = isCreateOpen || items.length === 0;

  function handleAddItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTopic.trim()) return;

    requireAuth(() => {
      addMutation.mutate(
        {
          topic: newTopic.trim(),
          details: newDetails.trim(),
          link: newLink.trim() || null,
          nextReviewDate: hasReminder ? null : getInitialReviewDate(),
          reminderDate:
            hasReminder && reminderDate ? reminderDate : null,
        },
        {
          onSuccess: () => {
            setNewTopic("");
            setNewDetails("");
            setNewLink("");
            setHasReminder(false);
            setIsCreateOpen(false);
          },
        },
      );
    });
  }

  function handleReview(item: SRSItem, remembered: boolean) {
    requireAuth(() => {
      const nextReviewCount = remembered ? item.reviewCount + 1 : 0;
      const nextDate = calculateNextReviewDate(nextReviewCount);
      updateMutation.mutate({
        itemId: item.id,
        data: {
          reviewCount: nextReviewCount,
          nextReviewDate: nextDate ? Timestamp.fromDate(nextDate) : null,
        },
      });
    });
  }

  function startEditing(item: SRSItem) {
    setEditingId(item.id);
    setEditTopic(item.topic);
    setEditDetails(item.details || "");
    setEditLink(item.link || "");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTopic("");
    setEditDetails("");
    setEditLink("");
  }

  function saveEdit(event: FormEvent<HTMLFormElement>, itemId: string) {
    event.preventDefault();
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
        { onSuccess: cancelEditing },
      );
    });
  }

  function confirmDelete(itemId: string) {
    requireAuth(() => {
      deleteMutation.mutate(itemId, {
        onSuccess: () => setDeletingId(null),
      });
    });
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-8 pb-16" aria-label="Loading topics">
        <div className="h-16 w-2/3 animate-pulse rounded-xl bg-secondary" />
        <div className="h-36 animate-pulse rounded-3xl bg-secondary" />
        <div className="h-64 animate-pulse rounded-3xl bg-secondary" />
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="mx-auto max-w-6xl space-y-8 pb-16"
      >
        <header className="flex flex-col justify-between gap-5 pt-2 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-[#a6cf57]" />
              Study system <span className="text-border">/</span> Recall
            </div>
            <h1 className="text-3xl leading-tight tracking-tight sm:text-4xl">
              Spaced repetition
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Review each topic on schedule. Mark what you remember, or restart
              its path if you need another pass.
            </p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setIsCreateOpen((open) => !open)}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition-colors hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-expanded={showCreateForm}
            >
              {showCreateForm ? <X size={16} /> : <Plus size={16} />}
              {showCreateForm ? "Close form" : "Add a topic"}
            </button>
          )}
        </header>

        <section
          aria-label="Today's review summary"
          className="relative overflow-hidden rounded-[1.75rem] bg-[#19251d] px-5 py-6 text-[#f2f4ea] sm:px-8 sm:py-7"
        >
          <div className="pointer-events-none absolute -right-8 -top-16 h-56 w-56 rounded-full border border-white/[0.06]" />
          <div className="pointer-events-none absolute -right-1 -top-9 h-44 w-44 rounded-full border border-white/[0.06]" />
          <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d4e1c5]/70">
                <CalendarDays size={14} />
                Today · {format(new Date(), "EEEE, MMM d")}
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-v-headings text-5xl leading-none tracking-tight text-[#d2f078] sm:text-6xl">
                  {counts.due}
                </span>
                <span className="text-base text-[#f2f4ea]/80">
                  {counts.due === 1 ? "topic to review" : "topics to review"}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#d4e1c5]/60">
                {counts.due > 0
                  ? "Start with a quick recall, then advance each topic."
                  : "You’re all caught up. Add a topic or check what’s coming next."}
              </p>
            </div>
            <div className="flex gap-6 border-t border-white/10 pt-4 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
              <div>
                <div className="text-2xl font-semibold tabular-nums text-white">
                  {counts.inProgress}
                </div>
                <div className="mt-1 text-xs text-[#d4e1c5]/60">scheduled</div>
              </div>
              <div>
                <div className="text-2xl font-semibold tabular-nums text-white">
                  {counts.mastered}
                </div>
                <div className="mt-1 text-xs text-[#d4e1c5]/60">mastered</div>
              </div>
              <div className="min-w-24">
                <div className="text-sm font-medium text-white">
                  {nextReview
                    ? format(nextReview.nextReviewDate.toDate(), "MMM d")
                    : "—"}
                </div>
                <div className="mt-1 text-xs text-[#d4e1c5]/60">next review</div>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="capture-heading" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 id="capture-heading" className="text-lg font-semibold">
                {items.length === 0 ? "Start a learning path" : "Capture a topic"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Save a useful idea, then revisit it at increasing intervals.
              </p>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showCreateForm && (
              <motion.form
                key="capture-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                onSubmit={handleAddItem}
                className="overflow-hidden rounded-2xl border border-border/70 bg-card"
              >
                <div className="grid gap-x-5 gap-y-4 p-5 sm:p-6 lg:grid-cols-2">
                  <div className="space-y-2">
                    <label
                      htmlFor="new-topic"
                      className="text-xs font-semibold text-foreground"
                    >
                      Topic <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="new-topic"
                      required
                      value={newTopic}
                      onChange={(event) => setNewTopic(event.target.value)}
                      placeholder="e.g. React Server Components"
                      className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-[#a6cf57]/70"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="new-details"
                      className="text-xs font-semibold text-foreground"
                    >
                      Key takeaway
                    </label>
                    <input
                      id="new-details"
                      value={newDetails}
                      onChange={(event) => setNewDetails(event.target.value)}
                      placeholder="What do you want to remember?"
                      className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-[#a6cf57]/70"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="new-link"
                      className="text-xs font-semibold text-foreground"
                    >
                      Reference link
                    </label>
                    <div className="relative">
                      <LinkIcon
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        id="new-link"
                        type="url"
                        value={newLink}
                        onChange={(event) => setNewLink(event.target.value)}
                        placeholder="https://..."
                        className="h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-[#a6cf57]/70"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex min-h-11 items-center gap-3">
                      <Switch
                        checked={hasReminder}
                        onCheckedChange={setHasReminder}
                        aria-label="Use a one-time reminder instead of review intervals"
                      />
                      <span className="text-sm text-foreground">
                        One-time reminder
                      </span>
                    </div>
                    {hasReminder && (
                      <div className="min-w-48 flex-1 sm:max-w-56">
                        <DatePicker
                          selected={reminderDate}
                          onSelect={setReminderDate}
                          placeholder="Choose a date"
                          buttonClassName="h-11 rounded-lg px-3 text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t border-border/60 bg-secondary/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div
                    aria-label="Review schedule"
                    className="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span className="mr-1 hidden sm:inline">Review path</span>
                    {SRS_INTERVALS.map((day, index) => (
                      <span key={day} className="inline-flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#a6cf57]/40 bg-[#a6cf57]/10 font-semibold text-[#5a762c] dark:text-[#d2f078]">
                          {day}
                        </span>
                        <span className="sr-only">Day {day}</span>
                        {index < SRS_INTERVALS.length - 1 && (
                          <span className="h-px w-3 bg-border" />
                        )}
                      </span>
                    ))}
                    <span className="ml-1">days</span>
                  </div>
                  <button
                    type="submit"
                    disabled={
                      addMutation.isPending ||
                      !newTopic.trim() ||
                      (hasReminder && !reminderDate)
                    }
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#243222] px-5 text-sm font-semibold text-[#e8f4ce] transition-colors hover:bg-[#31452c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a6cf57] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#d2f078] dark:text-[#19251d] dark:hover:bg-[#c1e65e]"
                  >
                    <Plus size={16} />
                    {addMutation.isPending ? "Saving topic…" : "Save topic"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </section>

        <section aria-labelledby="library-heading" className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="library-heading" className="text-lg font-semibold">
                Your topics
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredItems.length} of {items.length}{" "}
                {items.length === 1 ? "topic" : "topics"}
                {searchQuery ? " · filtered" : ""}
              </p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Find a topic"
                aria-label="Search topics"
                className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-[#a6cf57]/70"
              />
            </label>
          </div>

          <div
            role="group"
            aria-label="Filter topics by status"
            className="flex gap-1 overflow-x-auto border-b border-border/70 scrollbar-hide"
          >
            {statusFilters.map(({ id, label }) => {
              const count =
                id === "all"
                  ? counts.all
                  : id === "due"
                    ? counts.due
                    : id === "in-progress"
                      ? counts.inProgress
                      : id === "mastered"
                        ? counts.mastered
                        : counts.reminders;
              const selected = statusFilter === id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setStatusFilter(id)}
                  aria-pressed={selected}
                  className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#a6cf57] ${
                    selected
                      ? "border-[#789a3f] font-semibold text-foreground dark:border-[#d2f078]"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  <span
                    className={`min-w-5 rounded px-1 text-center text-[11px] tabular-nums ${
                      selected
                        ? "bg-[#e9f4d4] text-[#486b23] dark:bg-lime-300/10 dark:text-lime-200"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {filteredItems.length > 0 ? (
            <ul className="divide-y divide-border/70 border-y border-border/70">
              <AnimatePresence initial={false} mode="popLayout">
                {filteredItems.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="group py-5 transition-colors hover:bg-secondary/25 sm:px-3"
                  >
                    {editingId === item.id ? (
                      <form
                        onSubmit={(event) => saveEdit(event, item.id)}
                        className="grid gap-3 sm:grid-cols-2"
                      >
                        <label className="space-y-1.5 text-xs font-medium">
                          Topic
                          <input
                            autoFocus
                            required
                            value={editTopic}
                            onChange={(event) => setEditTopic(event.target.value)}
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#a6cf57]/70"
                          />
                        </label>
                        <label className="space-y-1.5 text-xs font-medium">
                          Key takeaway
                          <input
                            value={editDetails}
                            onChange={(event) =>
                              setEditDetails(event.target.value)
                            }
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#a6cf57]/70"
                          />
                        </label>
                        <label className="space-y-1.5 text-xs font-medium sm:col-span-2">
                          Reference link
                          <input
                            type="url"
                            value={editLink}
                            onChange={(event) => setEditLink(event.target.value)}
                            placeholder="https://..."
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#a6cf57]/70"
                          />
                        </label>
                        <div className="flex gap-2 sm:col-span-2">
                          <button
                            type="submit"
                            disabled={updateMutation.isPending || !editTopic.trim()}
                            className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-sm font-medium text-background disabled:opacity-50"
                          >
                            <Save size={14} />
                            Save changes
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(13rem,0.78fr)_auto] lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="break-words text-base font-semibold leading-snug">
                              {item.topic}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${getStatus(item, today).className}`}
                            >
                              {item.nextReviewDate && isDue(item, today) && (
                                <Clock3 size={12} />
                              )}
                              {isMastered(item) && <Sparkles size={12} />}
                              {!item.nextReviewDate && <Bell size={12} />}
                              {getStatus(item, today).label}
                            </span>
                          </div>
                          {item.details && (
                            <p className="mt-1.5 max-w-xl whitespace-pre-wrap text-sm leading-5 text-muted-foreground">
                              {item.details}
                            </p>
                          )}
                          {item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex max-w-full items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                            >
                              <BookOpen size={13} />
                              <span className="truncate">
                                {new URL(item.link).hostname.replace(/^www\./, "")}
                              </span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>

                        <div>
                          {item.nextReviewDate || isMastered(item) ? (
                            <ol
                              aria-label={`Review milestones, ${item.reviewCount} of ${SRS_INTERVALS.length} complete`}
                              className="grid max-w-[17rem] grid-cols-4"
                            >
                              {SRS_INTERVALS.map((day, index) => {
                                const complete = item.reviewCount > index;
                                const current = item.reviewCount === index;
                                return (
                                  <li
                                    key={day}
                                    className="relative flex flex-col items-center gap-1.5"
                                  >
                                    {index > 0 && (
                                      <span
                                        aria-hidden="true"
                                        className={`absolute right-1/2 top-3.5 h-px w-full ${
                                          complete
                                            ? "bg-[#9fc455]"
                                            : "bg-border"
                                        }`}
                                      />
                                    )}
                                    <span
                                      aria-label={`Day ${day}${complete ? ", complete" : current ? ", next" : ""}`}
                                      className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold tabular-nums ${
                                        complete
                                          ? "border-[#789a3f] bg-[#789a3f] text-white"
                                          : current
                                            ? "border-[#789a3f] bg-background text-[#5a762c] ring-2 ring-[#a6cf57]/20 dark:text-[#d2f078]"
                                            : "border-border bg-background text-muted-foreground"
                                      }`}
                                    >
                                      {complete ? <Check size={13} /> : day}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      Day {day}
                                    </span>
                                  </li>
                                );
                              })}
                            </ol>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Bell size={14} />
                              {item.reminderDate
                                ? `Reminder · ${format(item.reminderDate.toDate(), "MMM d, yyyy")}`
                                : "One-time reminder"}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                          {item.nextReviewDate && !isMastered(item) && (
                            <>
                              {isDue(item, today) && (
                                <button
                                  type="button"
                                  onClick={() => handleReview(item, false)}
                                  disabled={updateMutation.isPending}
                                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                                  title="Reset this topic to the first review"
                                >
                                  <RotateCcw size={13} />
                                  Forgot
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleReview(item, true)}
                                disabled={updateMutation.isPending}
                                className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a6cf57] disabled:opacity-50 ${
                                  isDue(item, today)
                                    ? "bg-[#243222] text-[#e8f4ce] hover:bg-[#31452c] dark:bg-[#d2f078] dark:text-[#19251d]"
                                    : "border border-border bg-background text-foreground hover:bg-secondary"
                                }`}
                              >
                                <CheckCircle2 size={14} />
                                {isDue(item, today) ? "Remembered" : "Mark reviewed"}
                              </button>
                            </>
                          )}
                          <div className="ml-auto flex items-center gap-1 lg:ml-1">
                            {deletingId === item.id ? (
                              <>
                                <span className="mr-1 text-xs text-destructive">
                                  Delete?
                                </span>
                                <button
                                  type="button"
                                  onClick={() => confirmDelete(item.id)}
                                  disabled={deleteMutation.isPending}
                                  aria-label={`Confirm delete ${item.topic}`}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 disabled:opacity-50"
                                >
                                  <Check size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(null)}
                                  aria-label="Cancel delete"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
                                >
                                  <X size={15} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEditing(item)}
                                  aria-label={`Edit ${item.topic}`}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-100 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                                >
                                  <Save size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(item.id)}
                                  aria-label={`Delete ${item.topic}`}
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-100 transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {item.nextReviewDate && (
                          <p className="text-xs text-muted-foreground lg:col-start-3 lg:row-start-2 lg:text-right">
                            {isMastered(item)
                              ? "All review milestones complete"
                              : `Next · ${format(item.nextReviewDate.toDate(), "EEE, MMM d")}`}
                          </p>
                        )}
                      </div>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          ) : (
            <div className="flex flex-col items-center border-y border-border/70 px-5 py-14 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#edf4df] text-[#607e35] dark:bg-lime-300/10 dark:text-lime-200">
                {items.length === 0 ? (
                  <BookOpen size={20} />
                ) : (
                  <Search size={20} />
                )}
              </div>
              <h3 className="font-semibold">
                {items.length === 0
                  ? "Your review list is ready to begin"
                  : "No topics match this view"}
              </h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {items.length === 0
                  ? "Add a topic above and it will appear here with its first review scheduled for tomorrow."
                  : searchQuery
                    ? "Try a different search, or clear the filter to see all topics."
                    : "Choose another status filter to see more of your topics."}
              </p>
              {items.length > 0 && searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-sm font-medium text-foreground underline underline-offset-4"
                >
                  Clear search
                </button>
              )}
              {items.length > 0 && statusFilter !== "all" && !searchQuery && (
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className="mt-4 text-sm font-medium text-foreground underline underline-offset-4"
                >
                  Show all topics
                </button>
              )}
            </div>
          )}
        </section>
      </motion.div>
    </MotionConfig>
  );
}
