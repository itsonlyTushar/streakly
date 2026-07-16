"use client";

import { useMemo, useState, useEffect, type FormEvent } from "react";
import {
  Code2,
  Eye,
  Plus,
  Sparkles,
  Trash2,
  X,
  Link,
  ExternalLink,
  Grid,
  List,
  Calendar as CalendarIcon,
  Check,
} from "lucide-react";
import { useAuthGuard } from "@/components/auth-guard";
import { useToast } from "@/components/ui/toast";
import { CodeBlock, CodeTextarea } from "@/components/ui/code-block";
import { Switch } from "@/components/ui/switch";
import { DatePicker } from "@/components/ui/date-picker";
import { format, isPast, addDays, isToday, startOfDay } from "date-fns";
import { Timestamp } from "firebase/firestore";
import {
  useAddMachineCodingItem,
  useDeleteMachineCodingItem,
  useMachineCodingItems,
  useUpdateMachineCodingItem,
} from "@/hooks/use-machine-coding";

interface MachineCodingEntry {
  id: string;
  questionName: string;
  approach: string;
  solutionCode: string;
  language: "JavaScript" | "React";
  link?: string | null;
  practiceDate?: any | null; // Firebase Timestamp
}

function ReferenceLink({ href, className = "text-[10px]" }: { href: string; className?: string }) {
  const displayInfo = useMemo(() => {
    try {
      const url = new URL(href);
      return {
        hostname: url.hostname.replace("www.", ""),
        favicon: `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=16`,
      };
    } catch {
      return {
        hostname: "Link",
        favicon: null,
      };
    }
  }, [href]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 align-middle px-2 py-0.5 rounded-md bg-primary/8 hover:bg-primary/15 text-primary/70 hover:text-primary transition-all ${className}`}
      title={href}
      onClick={(e) => e.stopPropagation()}
    >
      {displayInfo.favicon && (
        <img
          src={displayInfo.favicon}
          alt=""
          className="h-3.5 w-3.5 rounded-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      <span className="font-bold">
        {displayInfo.hostname}
      </span>
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export default function MachineCodingPage() {
  const { data: entries = [], isLoading } = useMachineCodingItems();
  const addMutation = useAddMachineCodingItem();
  const updateMutation = useUpdateMachineCodingItem();
  const deleteMutation = useDeleteMachineCodingItem();
  const { requireAuth } = useAuthGuard();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<MachineCodingEntry | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  const [form, setForm] = useState({
    questionName: "",
    approach: "",
    solutionCode: "",
    language: "JavaScript" as "JavaScript" | "React",
    link: "",
  });

  const [hasPracticeDate, setHasPracticeDate] = useState(false);
  const [practiceSelectedDate, setPracticeSelectedDate] = useState<Date | undefined>(
    addDays(new Date(), 1)
  );

  const { toast } = useToast();
  const [editLink, setEditLink] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedEntry) {
      setEditLink(selectedEntry.link || "");
    } else {
      setEditLink("");
    }
  }, [selectedEntry]);

  const totalEntries = useMemo(() => entries.length, [entries]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-60 rounded-2xl bg-secondary animate-pulse" />
        <div className="h-32 rounded-3xl bg-secondary animate-pulse" />
        <div className="h-48 rounded-3xl bg-secondary animate-pulse" />
      </div>
    );
  }

  const handleAddEntry = (e: FormEvent) => {
    e.preventDefault();

    if (!form.questionName.trim()) {
      toast({
        title: "Validation error",
        description: "Please specify a question name.",
        variant: "error",
      });
      return;
    }

    requireAuth(() => {
      addMutation.mutate(
        {
          questionName: form.questionName.trim(),
          approach: form.approach.trim(),
          solutionCode: form.solutionCode.trim(),
          language: form.language,
          link: form.link.trim() || null,
          practiceDate: hasPracticeDate && practiceSelectedDate ? practiceSelectedDate : null,
        },
        {
          onSuccess: () => {
            setForm({
              questionName: "",
              approach: "",
              solutionCode: "",
              language: "JavaScript",
              link: "",
            });
            setHasPracticeDate(false);
            setPracticeSelectedDate(addDays(new Date(), 1));
            setIsFormOpen(false);
          },
        },
      );
    });
  };

  const handleDeleteConfirm = (id: string) => {
    requireAuth(() => {
      deleteMutation.mutate(id, {
        onSuccess: () => {
          setDeletingId(null);
          setSelectedEntry((prev) => (prev && prev.id === id ? null : prev));
          toast({
            title: "Question removed",
            description: "Solution entry deleted successfully.",
            variant: "success",
          });
        },
      });
    });
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="space-y-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 text-primary">
            <h1 className="text-3xl md:text-4xl font-v-headings">
              Machine Coding
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsFormOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          {isFormOpen ? "Close form" : "Add question"}
        </button>
      </header>

      {isFormOpen && (
        <div
          className="fixed inset-0 h-screen z-50 flex justify-end bg-background/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsFormOpen(false)}
        >
          <aside
            className="relative h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-card p-6 shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="absolute right-6 top-6 rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary"
              aria-label="Close form"
            >
              <X className="h-5 w-5" />
            </button>
            <form onSubmit={handleAddEntry} className="grid gap-5">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.25em] text-primary font-bold">
                  New entry
                </p>
                <h3 className="text-2xl font-v-headings">
                  Add a machine-coding question
                </h3>
                <p className="text-sm text-muted-foreground">
                  Store the question, reference links, practice schedule, and solution code.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Name of the question
                  <input
                    type="text"
                    value={form.questionName}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        questionName: e.target.value,
                      }))
                    }
                    placeholder="Example: Build a todo app list"
                    className="rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none ring-0 transition focus:border-primary text-sm"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium">
                  Solution language
                  <select
                    value={form.language}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        language: e.target.value as "JavaScript" | "React",
                      }))
                    }
                    className="rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none transition focus:border-primary text-sm"
                  >
                    <option value="JavaScript">JavaScript</option>
                    <option value="React">React</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium">
                  Reference Link
                  <div className="relative">
                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                    <input
                      type="url"
                      value={form.link}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          link: e.target.value,
                        }))
                      }
                      placeholder="https://example.com/question"
                      className="w-full rounded-2xl border border-border bg-card pl-11 pr-4 py-3 text-foreground outline-none ring-0 transition focus:border-primary placeholder:text-muted-foreground/30 text-sm"
                    />
                  </div>
                </label>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Schedule Practice</span>
                  <div className="flex items-center gap-3 bg-secondary/40 border border-border/40 px-4 py-2 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className={`h-4 w-4 ${hasPracticeDate ? "text-primary" : "text-muted-foreground/40"}`} />
                      <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        Practice Date
                      </span>
                    </div>
                    <Switch checked={hasPracticeDate} onCheckedChange={setHasPracticeDate} />
                  </div>
                </div>
              </div>

              {hasPracticeDate && (
                <div className="flex flex-col min-w-[200px] animate-in fade-in slide-in-from-left-2 duration-300">
                  <label className="text-xs font-semibold text-muted-foreground ml-1 mb-1 block">
                    Select Practice Date
                  </label>
                  <DatePicker
                    selected={practiceSelectedDate}
                    onSelect={setPracticeSelectedDate}
                    placeholder="Pick a date"
                    buttonClassName="p-3 text-sm h-12 rounded-2xl border border-border"
                  />
                </div>
              )}

              <label className="grid gap-2 text-sm font-medium">
                Approach used to solve
                <textarea
                  rows={4}
                  value={form.approach}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, approach: e.target.value }))
                  }
                  placeholder="Describe your step-by-step logic, data flow, or key idea."
                  className="rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none transition focus:border-primary text-sm"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium">
                Solution code
                <CodeTextarea
                  value={form.solutionCode}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, solutionCode: value }))
                  }
                  placeholder="Paste or write the solution code here."
                  minHeight="220px"
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02]"
                >
                  Save question
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      <section className="w-full space-y-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="rounded-full border border-border bg-background px-4 py-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {totalEntries} items
            </span>

            <div className="flex items-center gap-1 bg-secondary/60 p-0.5 rounded-xl border border-border/15">

              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "table"
                    ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                Table
              </button>
                            <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-zinc-800 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
                Grid
              </button>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.length === 0 ? (
              <div className="col-span-full py-16 text-center text-muted-foreground font-medium italic border border-dashed border-border/60 rounded-3xl">
                No items found. Create a question to start.
              </div>
            ) : (
              entries.map((entry) => {
                const hasDate = !!entry.practiceDate;
                const dateVal = hasDate ? entry.practiceDate.toDate() : null;
                const overdue = dateVal ? isPast(startOfDay(dateVal)) && !isToday(dateVal) : false;

                return (
                  <div
                    key={entry.id}
                    className="bg-secondary/10 hover:bg-secondary/20 border border-border/50 hover:border-primary/20 rounded-3xl p-5 shadow-sm transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                          {entry.language}
                        </span>

                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setSelectedEntry(entry)}
                            className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-primary transition-colors"
                            title="Inspect solution"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {deletingId === entry.id ? (
                            <div className="flex items-center gap-1 bg-destructive/10 border border-destructive/20 rounded-lg px-2 py-0.5 animate-in zoom-in duration-200">
                              <span className="text-[9px] font-black text-destructive uppercase">Delete?</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteConfirm(entry.id)}
                                disabled={deleteMutation.isPending}
                                className="p-0.5 hover:bg-destructive hover:text-white rounded text-destructive"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingId(null)}
                                className="p-0.5 hover:bg-secondary rounded text-muted-foreground"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingId(entry.id)}
                              className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove entry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="font-bold text-lg text-card-foreground group-hover:text-primary transition-colors leading-snug cursor-pointer" onClick={() => setSelectedEntry(entry)}>
                          {entry.questionName}
                        </h3>
                        {entry.link && (
                          <div className="pt-0.5">
                            <ReferenceLink href={entry.link} className="text-[10px]" />
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground font-medium line-clamp-3 leading-relaxed">
                        {entry.approach || "No approach details provided."}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {hasDate ? (
                          <div className="flex items-center gap-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold border ${
                              overdue
                                ? "bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400"
                                : "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400"
                            }`}>
                              <CalendarIcon className="h-3 w-3" />
                              {format(dateVal!, "MMM d")}
                              {overdue && " (Due)"}
                            </span>
                            <button
                              onClick={() => {
                                requireAuth(() => {
                                  updateMutation.mutate({
                                    itemId: entry.id,
                                    data: { practiceDate: null },
                                  });
                                });
                              }}
                              className="p-1 hover:bg-secondary rounded-md text-muted-foreground/50 hover:text-destructive transition-colors"
                              title="Clear practice date"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <DatePicker
                            selected={entry.practiceDate ? entry.practiceDate.toDate() : undefined}
                            placeholder="Schedule practice"
                            onSelect={(date) => {
                              if (date) {
                                requireAuth(() => {
                                  updateMutation.mutate({
                                    itemId: entry.id,
                                    data: { practiceDate: Timestamp.fromDate(date) },
                                  });
                                });
                              }
                            }}
                            buttonClassName="!h-8 !p-1.5 !px-2.5 !text-[10px] !font-bold !rounded-lg !border-border/60 hover:!border-primary/40 !text-muted-foreground hover:!text-primary !transition-all !flex !items-center !justify-between !bg-background !w-full"
                          />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedEntry(entry)}
                        className="inline-flex items-center justify-center gap-1 bg-background hover:bg-primary border border-border/60 hover:border-primary hover:text-primary-foreground p-1 px-3.5 rounded-xl text-xs font-bold transition-all shadow-sm flex-shrink-0"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-secondary/20 text-muted-foreground border-b border-border/30">
                <tr>
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em]">Question</th>
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em]">Language</th>
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em]">Approach</th>
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em]">Practice Date</th>
                  <th className="px-6 py-5 font-black text-[10px] uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 bg-card text-foreground">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground font-medium italic">
                      No items found. Create a question to start.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const hasDate = !!entry.practiceDate;
                    const dateVal = hasDate ? entry.practiceDate.toDate() : null;
                    const overdue = dateVal ? isPast(startOfDay(dateVal)) && !isToday(dateVal) : false;

                    return (
                      <tr
                        key={entry.id}
                        className="hover:bg-secondary/15 border-b border-border/10 last:border-b-0 transition-all duration-200 group"
                      >
                        <td className="px-6 py-5 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/5 text-primary border border-primary/10 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                              <Code2 className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedEntry(entry)}
                                  className="text-left font-black text-base text-foreground hover:text-primary transition-colors leading-tight"
                                >
                                  {entry.questionName}
                                </button>
                                {entry.link && (
                                  <ReferenceLink href={entry.link} className="text-[10px] ml-1" />
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 align-middle">
                          <span className={`inline-block rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] border ${
                            entry.language === "React"
                              ? "bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                          }`}>
                            {entry.language}
                          </span>
                        </td>
                        <td className="px-6 py-5 align-middle text-muted-foreground max-w-sm">
                          <div className="line-clamp-2 text-xs font-medium leading-relaxed">{entry.approach || "—"}</div>
                        </td>
                        <td className="px-6 py-5 align-middle">
                          {hasDate ? (
                            <div className="flex items-center gap-1.5 w-fit">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-2xl text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                                overdue
                                  ? "bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400"
                                  : "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400"
                              }`}>
                                <CalendarIcon className="h-3.5 w-3.5" />
                                {format(dateVal!, "MMM d, yyyy")}
                                {overdue && " (Due)"}
                              </span>
                              <button
                                onClick={() => {
                                  requireAuth(() => {
                                    updateMutation.mutate({
                                      itemId: entry.id,
                                      data: { practiceDate: null },
                                    });
                                  });
                                }}
                                className="p-1 hover:bg-secondary rounded-lg text-muted-foreground/40 hover:text-destructive transition-all"
                                title="Clear practice date"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <DatePicker
                              selected={entry.practiceDate ? entry.practiceDate.toDate() : undefined}
                              placeholder="Schedule practice"
                              onSelect={(date) => {
                                if (date) {
                                  requireAuth(() => {
                                    updateMutation.mutate({
                                      itemId: entry.id,
                                      data: { practiceDate: Timestamp.fromDate(date) },
                                    });
                                  });
                                }
                              }}
                              buttonClassName="!h-9 !p-2.5 !px-3.5 !text-[10px] !font-black !uppercase !tracking-widest !rounded-xl !border-border/60 hover:!border-primary/40 !text-muted-foreground hover:!text-primary !transition-all !flex !items-center !justify-between !bg-background !shadow-sm !w-48"
                            />
                          )}
                        </td>
                        <td className="px-6 py-5 align-middle text-right">
                          <div className="flex gap-2 justify-end items-center">
                            <button
                              type="button"
                              onClick={() => setSelectedEntry(entry)}
                              className="inline-flex items-center justify-center h-9 p-1 px-4 bg-primary/5 hover:bg-primary border border-primary/10 hover:border-primary text-primary hover:text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                            >
                              Inspect
                            </button>
                            {deletingId === entry.id ? (
                              <div className="flex items-center gap-1.5 bg-destructive/10 border border-destructive/25 rounded-2xl px-3 py-1.5 animate-in zoom-in duration-200">
                                <span className="text-[9px] font-black text-destructive uppercase tracking-wider">Delete?</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteConfirm(entry.id)}
                                  disabled={deleteMutation.isPending}
                                  className="p-1 hover:bg-destructive hover:text-white rounded-lg text-destructive transition-all"
                                  title="Confirm delete"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(null)}
                                  className="p-1 hover:bg-secondary rounded-lg text-muted-foreground transition-all"
                                  title="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeletingId(entry.id)}
                                className="inline-flex items-center justify-center h-9 w-9 border border-destructive/20 bg-background text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-2xl transition-all shadow-sm hover:border-destructive"
                                title="Delete Question"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedEntry && (
        <div
          className="fixed inset-0 h-screen z-50 flex justify-end bg-background/70 backdrop-blur-sm"
          onClick={() => setSelectedEntry(null)}
        >
          <aside
            className="h-full w-full max-w-2xl border-l border-border bg-card p-6 shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-primary font-bold">
                  Detail view
                </p>
                <h3 className="mt-2 text-3xl font-v-headings">
                  {selectedEntry.questionName}
                </h3>
                <p className="mt-2 text-muted-foreground flex items-center gap-2 flex-wrap text-sm">
                  <span>{selectedEntry.language} · machine-coding solution</span>
                  {selectedEntry.link && (
                    <>
                      <span>·</span>
                      <ReferenceLink href={selectedEntry.link} className="text-xs" />
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="rounded-full border border-border p-2 text-muted-foreground hover:bg-secondary"
                aria-label="Close detail view"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-6 overflow-y-auto pb-8 flex-1">
              <section className="rounded-3xl border border-border bg-background/70 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-bold mb-3">
                  Approach used to solve
                </p>
                <p className="text-sm leading-7 text-foreground whitespace-pre-line">
                  {selectedEntry.approach || "No approach details provided."}
                </p>
              </section>

              <section className="rounded-3xl border border-border bg-background/70 p-5 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-bold mb-2">
                    Reference Link
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                      <input
                        type="url"
                        value={editLink}
                        onChange={(e) => setEditLink(e.target.value)}
                        placeholder="https://example.com/question"
                        className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-xs text-foreground outline-none ring-0 transition focus:border-primary placeholder:text-muted-foreground/30 h-9"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        requireAuth(() => {
                          const updatedLink = editLink.trim() || null;
                          updateMutation.mutate(
                            {
                              itemId: selectedEntry.id,
                              data: { link: updatedLink },
                            },
                            {
                              onSuccess: () => {
                                setSelectedEntry((prev) =>
                                  prev ? { ...prev, link: updatedLink } : null
                                );
                                toast({
                                  title: "Link updated!",
                                  description: "Reference URL saved successfully.",
                                  variant: "success",
                                });
                              },
                            }
                          );
                        });
                      }}
                      disabled={updateMutation.isPending}
                      className="px-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black uppercase tracking-wider rounded-xl transition-all h-9 flex items-center justify-center shadow-sm flex-shrink-0"
                    >
                      Update URL
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-background/70 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-bold mb-3">
                  Practice Schedule
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <DatePicker
                    selected={selectedEntry.practiceDate ? selectedEntry.practiceDate.toDate() : undefined}
                    placeholder="Schedule practice session"
                    onSelect={(date) => {
                      requireAuth(() => {
                        const newDate = date ? Timestamp.fromDate(date) : null;
                        updateMutation.mutate(
                          {
                            itemId: selectedEntry.id,
                            data: { practiceDate: newDate },
                          },
                          {
                            onSuccess: () => {
                              setSelectedEntry((prev) =>
                                prev ? { ...prev, practiceDate: newDate } : null
                              );
                              toast({
                                title: "Schedule updated!",
                                description: "Revisit date saved to calendar.",
                                variant: "success",
                              });
                            },
                          }
                        );
                      });
                    }}
                    buttonClassName="!h-9 !p-2.5 !px-3.5 !text-xs !font-black !uppercase !tracking-widest !rounded-xl !border-border/60 hover:!border-primary/40 !text-muted-foreground hover:!text-primary !transition-all !flex !items-center !justify-between !bg-background !shadow-sm !w-56"
                  />
                  {selectedEntry.practiceDate && (
                    <button
                      type="button"
                      onClick={() => {
                        requireAuth(() => {
                          updateMutation.mutate(
                            {
                              itemId: selectedEntry.id,
                              data: { practiceDate: null },
                            },
                            {
                              onSuccess: () => {
                                setSelectedEntry((prev) =>
                                  prev ? { ...prev, practiceDate: null } : null
                                );
                                toast({
                                  title: "Schedule cleared!",
                                  description: "Practice date removed.",
                                  variant: "success",
                                });
                              },
                            }
                          );
                        });
                      }}
                      className="p-2 bg-secondary hover:bg-destructive hover:text-destructive-foreground rounded-xl text-muted-foreground transition-all flex items-center justify-center h-9"
                      title="Clear Scheduled Date"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </section>

              {selectedEntry.solutionCode ? (
                <section className="rounded-3xl border border-border bg-background/70 p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-bold">
                      Solution code
                    </p>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                      {selectedEntry.language}
                    </span>
                  </div>
                  <CodeBlock
                    code={selectedEntry.solutionCode}
                    language={
                      selectedEntry.language === "React" ? "tsx" : "javascript"
                    }
                    showCopyButton
                    maxHeight="420px"
                  />
                </section>
              ) : (
                <section className="rounded-3xl border border-border bg-background/70 p-5 py-8 text-center text-muted-foreground text-xs italic">
                  No solution code has been uploaded yet.
                </section>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
                {deletingId === selectedEntry.id ? (
                  <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-full px-4 py-2 animate-in zoom-in duration-200">
                    <span className="text-xs font-black text-destructive uppercase tracking-wider">Are you sure?</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteConfirm(selectedEntry.id)}
                      disabled={deleteMutation.isPending}
                      className="p-1 hover:bg-destructive hover:text-white rounded-lg text-destructive transition-all"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(null)}
                      className="p-1 hover:bg-secondary rounded-lg text-muted-foreground transition-all"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeletingId(selectedEntry.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/5"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove this entry
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
