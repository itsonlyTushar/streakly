"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Code2, Eye, Plus, Sparkles, Trash2, X, Link, ExternalLink } from "lucide-react";
import { useAuthGuard } from "@/components/auth-guard";
import { CodeBlock, CodeTextarea } from "@/components/ui/code-block";
import {
  useAddMachineCodingItem,
  useDeleteMachineCodingItem,
  useMachineCodingItems,
} from "@/hooks/use-machine-coding";

interface MachineCodingEntry {
  id: string;
  questionName: string;
  approach: string;
  solutionCode: string;
  language: "JavaScript" | "React";
  link?: string | null;
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
      className={`inline-flex items-center gap-1 align-middle px-1.5 py-0.5 rounded-md bg-primary/8 hover:bg-primary/15 text-primary/70 hover:text-primary transition-all ${className}`}
      title={href}
      onClick={(e) => e.stopPropagation()}
    >
      {displayInfo.favicon && (
        <img
          src={displayInfo.favicon}
          alt=""
          className="h-3 w-3 rounded-sm"
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
  const deleteMutation = useDeleteMachineCodingItem();
  const { requireAuth } = useAuthGuard();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<MachineCodingEntry | null>(
    null,
  );

  const [form, setForm] = useState({
    questionName: "",
    approach: "",
    solutionCode: "",
    language: "JavaScript" as "JavaScript" | "React",
    link: "",
  });

  const totalEntries = useMemo(() => entries.length, [entries]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-60 rounded-2xl bg-secondary" />
        <div className="h-32 rounded-3xl bg-secondary" />
        <div className="h-48 rounded-3xl bg-secondary" />
      </div>
    );
  }

  const handleAddEntry = (e: FormEvent) => {
    e.preventDefault();

    if (
      !form.questionName.trim() ||
      !form.approach.trim() ||
      !form.solutionCode.trim()
    ) {
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
            setIsFormOpen(false);
          },
        },
      );
    });
  };

  const handleDeleteEntry = (id: string) => {
    deleteMutation.mutate(id);
    setSelectedEntry((prev) => (prev && prev.id === id ? null : prev));
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 text-primary">
            <h1 className="text-3xl md:text-4xl font-v-headings">
              Machine Coding
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Capture machine-coding questions, outline your approach, and keep
            the final solution ready to revisit.
          </p>
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
              <p className="text-xs uppercase tracking-[0.25em] text-primary">
                New entry
              </p>
              <h3 className="text-2xl font-v-headings">
                Add a machine-coding question
              </h3>
              <p className="text-sm text-muted-foreground">
                Store the question, approach, and solution in one place.
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
                  className="rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none ring-0 transition focus:border-primary"
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
                  className="rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none transition focus:border-primary"
                >
                  <option value="JavaScript">JavaScript</option>
                  <option value="React">React</option>
                </select>
              </label>
            </div>

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
                  className="w-full rounded-2xl border border-border bg-card pl-11 pr-4 py-3 text-foreground outline-none ring-0 transition focus:border-primary placeholder:text-muted-foreground/30"
                />
              </div>
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Approach used to solve
              <textarea
                rows={4}
                value={form.approach}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, approach: e.target.value }))
                }
                placeholder="Describe your step-by-step logic, data flow, or key idea."
                className="rounded-2xl border border-border bg-card px-4 py-3 text-foreground outline-none transition focus:border-primary"
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

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-primary">
              Questions
            </p>
            <h2 className="text-2xl font-v-headings">
              Click any row to inspect the full solution
            </h2>
          </div>
          <span className="rounded-full border border-border bg-background px-4 py-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {totalEntries} items
          </span>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border">
          <table className="min-w-full divide-y divide-border text-left text-sm">
            <thead className="bg-secondary/70 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Question</th>
                <th className="px-4 py-3 font-semibold">Language</th>
                <th className="px-4 py-3 font-semibold">Approach</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card text-foreground">
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="hover:bg-secondary/40 transition-colors"
                >
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSelectedEntry(entry)}
                        className="text-left font-semibold text-primary hover:underline"
                      >
                        {entry.questionName}
                      </button>
                      {entry.link && (
                        <ReferenceLink href={entry.link} className="text-[10px] ml-1" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                      {entry.language}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top text-muted-foreground max-w-md">
                    {entry.approach}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedEntry(entry)}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-background px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedEntry && (
        <div
          className="fixed inset-0 h-screen z-50 flex justify-end bg-background/70 backdrop-blur-sm"
          onClick={() => setSelectedEntry(null)}
        >
          <aside
            className="h-full w-full max-w-2xl border-l border-border bg-card p-6 shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-primary">
                  Detail view
                </p>
                <h3 className="mt-2 text-3xl font-v-headings">
                  {selectedEntry.questionName}
                </h3>
                <p className="mt-2 text-muted-foreground flex items-center gap-2 flex-wrap">
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

            <div className="mt-6 space-y-6 overflow-y-auto pb-8">
              <section className="rounded-3xl border border-border bg-background/70 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  Approach used to solve
                </p>
                <p className="mt-3 text-sm leading-7 text-foreground">
                  {selectedEntry.approach}
                </p>
              </section>

              <section className="rounded-3xl border border-border bg-background/70 p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
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

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => handleDeleteEntry(selectedEntry.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-destructive/30 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/5"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove this entry
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
