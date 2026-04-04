"use client";

import { useAuth } from "@/components/auth-provider";
import { useState, use } from "react";
import {
  format,
  differenceInDays,
  startOfDay,
  addDays,
  isSameDay,
} from "date-fns";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Trophy,
  History,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  Edit3,
} from "lucide-react";
import { CheckCircle2, Save } from "lucide-react";
import Link from "next/link";

import { RichEditor } from "@/components/ui/rich-editor";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { Logo } from "@/components/ui/logo";
import { useGoal, useCompleteGoal } from "@/hooks/use-goals";
import {
  useGoalNotes,
  useAddNote,
  useUpdateNote,
  useDeleteNote,
} from "@/hooks/use-notes";

export default function GoalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: goal, isLoading: goalLoading } = useGoal(id);
  const { data: notes = [], isLoading: notesLoading } = useGoalNotes(id);

  const addNoteMutation = useAddNote();
  const updateNoteMutation = useUpdateNote();
  const deleteNoteMutation = useDeleteNote();
  const completeGoalMutation = useCompleteGoal();

  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [viewMode, setViewMode] = useState<"timeline" | "grid">("timeline");

  // States for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const saveNote = async () => {
    if (!newNote || newNote === "<p></p>" || !user || !goal) return;
    addNoteMutation.mutate(
      { goalId: id, content: newNote },
      {
        onSuccess: () => setNewNote(""),
      },
    );
  };

  const openDeleteConfirm = (noteId: string) => {
    setNoteToDelete(noteId);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteConfirm = () => {
    setIsDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  const handleDeleteNote = async () => {
    if (!noteToDelete) return;
    deleteNoteMutation.mutate(
      { noteId: noteToDelete, goalId: id },
      {
        onSuccess: () => {
          closeDeleteConfirm();
        },
      },
    );
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingContent || editingContent === "<p></p>") return;
    updateNoteMutation.mutate(
      { noteId, content: editingContent, goalId: id },
      {
        onSuccess: () => {
          setEditingNoteId(null);
          setEditingContent("");
        },
      },
    );
  };

  const startEditing = (note: any) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingContent("");
  };

  const handleCompleteGoal = async () => {
    if (!goal) return;
    completeGoalMutation.mutate(goal.id);
  };

  if (authLoading || goalLoading || notesLoading || !goal) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse font-bold text-2xl flex items-center gap-1">
          <Logo />
          ...
        </div>
      </div>
    );
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const startDate = goal.createdAt?.toDate() || new Date();
  const daysSinceStart =
    Math.max(
      0,
      differenceInDays(startOfDay(new Date()), startOfDay(startDate)),
    ) + 1;
  const targetDate = new Date(goal.dueDate);
  const totalDays =
    Math.max(
      0,
      differenceInDays(startOfDay(targetDate), startOfDay(startDate)),
    ) + 1;

  const timelineData = Array.from({ length: daysSinceStart }).map((_, i) => {
    const date = addDays(startOfDay(startDate), i);
    const dateStr = format(date, "yyyy-MM-dd");
    const dayNotes = notes.filter((n) => n.dateString === dateStr);
    return {
      date,
      dateStr,
      dayNotes,
      isToday: isSameDay(date, new Date()),
      isMissed: dayNotes.length === 0 && !isSameDay(date, new Date()),
    };
  });

  const isCompleted = goal.status === "completed";
  const allNotesLogged = notes.length >= totalDays;
  const isPastDueDate =
    isSameDay(new Date(), targetDate) || new Date() > targetDate;
  const canComplete = !isCompleted && allNotesLogged && isPastDueDate;

  return (
    <div className="max-w-6xl mx-auto space-y-10 md:space-y-16 pb-20 px-4 md:px-0">
      {/* Header */}
      <header className="space-y-8">
        <Link
          href="/app"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-all font-medium group"
        >
          <div className="p-2 rounded-full bg-secondary/50 group-hover:bg-secondary transition-colors">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          </div>
          Back to Goals
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div
              className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit border border-black/5 shadow-sm",
                goal.color || "bg-secondary",
              )}
            >
              {isCompleted ? "Hall of Fame" : "Active Goal"}
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-v-headings tracking-tighter leading-[0.85] py-2">
              {goal.goal}
            </h1>
            <div className="flex items-center gap-6 text-muted-foreground/60 pt-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="text-sm font-bold uppercase tracking-tighter">
                  Due {format(new Date(goal.dueDate), "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2 border-l border-border pl-6">
                <History className="h-4 w-4" />
                <span className="text-sm font-bold uppercase tracking-tighter">
                  {notes.length} logs recorded
                </span>
              </div>
            </div>
          </div>

          {canComplete && (
            <button
              onClick={handleCompleteGoal}
              className="h-20 px-10 bg-black text-white rounded-[2rem] font-bold text-2xl hover:scale-[1.03] active:scale-95 transition-all shadow-2xl flex items-center gap-3"
            >
              <Trophy className="h-7 w-7 text-yellow-500" />
              Enshrine Goal
            </button>
          )}
        </div>
      </header>

      {/* Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-start">
        {/* Main Feed */}
        <section className="space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl tracking-tight flex items-center gap-4 font-bold">
              Progress
              <span className="px-3 py-1 bg-secondary rounded-xl text-xs text-muted-foreground font-v-body font-bold uppercase tracking-widest">
                {timelineData.length} Days
              </span>
            </h2>

            {/* View Switcher */}
            <div className="bg-secondary/50 p-1.5 rounded-2xl flex items-center gap-1 border border-border/10">
              <button
                onClick={() => setViewMode("timeline")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                  viewMode === "timeline"
                    ? "bg-white dark:bg-card shadow-sm text-primary"
                    : "text-muted-foreground hover:text-primary",
                )}
              >
                <ListIcon className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                  viewMode === "grid"
                    ? "bg-white dark:bg-card shadow-sm text-primary"
                    : "text-muted-foreground hover:text-primary",
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {viewMode === "timeline" ? (
            <div className="space-y-10 md:space-y-16 border-l-2 border-secondary/50 pl-6 md:pl-10 relative ml-2 md:ml-4">
              {[...timelineData].reverse().map((day) => (
                <div key={day.dateStr} className="relative group">
                  <div
                    className={cn(
                      "absolute -left-[35px] md:-left-[51px] top-1 w-6 h-6 rounded-full border-4 border-background transition-all ring-8 ring-transparent group-hover:ring-secondary/30",
                      day.dayNotes.length > 0
                        ? "bg-black scale-110 shadow-lg"
                        : day.isMissed
                          ? "bg-destructive/40"
                          : "bg-secondary",
                    )}
                  />

                  <div className="space-y-6">
                    <header className="flex items-center justify-between">
                      <p
                        className={cn(
                          "text-xs font-bold uppercase tracking-[0.2em] transition-colors",
                          day.isToday
                            ? "text-primary"
                            : "text-muted-foreground/40",
                        )}
                      >
                        {format(day.date, "EEEE, MMM d")}
                        {day.isToday && (
                          <span className="ml-3 animate-pulse">● Today</span>
                        )}
                      </p>
                    </header>

                    {day.dayNotes.length > 0 ? (
                      <div className="grid gap-4">
                        {day.dayNotes.map((note: any) => (
                          <div
                            key={note.id}
                            className="bg-white dark:bg-card rounded-3xl p-8 border border-border/50 shadow-sm hover:shadow-md transition-shadow prose dark:prose-invert max-w-none"
                          >
                            {editingNoteId === note.id ? (
                              <div className="space-y-4">
                                <RichEditor
                                  content={editingContent}
                                  onChange={setEditingContent}
                                  className="min-h-[100px]"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={cancelEditing}
                                    className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleUpdateNote(note.id)}
                                    disabled={updateNoteMutation.isPending}
                                    className="px-6 py-2 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
                                  >
                                    {updateNoteMutation.isPending
                                      ? "Saving..."
                                      : "Save Changes"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html: note.content,
                                  }}
                                />
                                <div className="mt-4 pt-4 border-t border-border/20 flex items-center justify-between">
                                  <div className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest">
                                    Logged at{" "}
                                    {format(
                                      note.date?.toDate() || new Date(),
                                      "h:mm a",
                                    )}
                                  </div>
                                  {note.dateString === todayStr &&
                                    !isCompleted && (
                                      <div className="flex items-center gap-4">
                                        <button
                                          onClick={() => startEditing(note)}
                                          className="p-2 hover:bg-secondary rounded-full transition-colors group/edit"
                                          title="Edit Log"
                                        >
                                          <Edit3 className="h-3.5 w-3.5 text-muted-foreground/30 group-hover/edit:text-primary transition-colors" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            openDeleteConfirm(note.id)
                                          }
                                          className="p-2 hover:bg-destructive/10 rounded-full transition-colors group/delete"
                                          title="Delete Log"
                                        >
                                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground/30 group-hover/delete:text-destructive transition-colors" />
                                        </button>
                                      </div>
                                    )}
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : day.isMissed ? (
                      <div className="bg-destructive/5 rounded-3xl p-10 border border-destructive/10 flex items-center gap-6 group/missed transition-colors hover:bg-destructive/[0.08]">
                        <div className="text-5xl grayscale opacity-20 font-bold group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500">
                          :(
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-destructive font-bold uppercase tracking-widest opacity-60">
                            Activity Missed
                          </p>
                          <p className="text-sm text-destructive/60 font-medium italic">
                            Keep the streak going tomorrow. Consistency is king.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-secondary/10 rounded-3xl p-10 border border-dashed border-border/50 flex items-center gap-4 transition-colors hover:bg-secondary/20">
                        <p className="text-sm text-muted-foreground/30 font-bold uppercase tracking-[0.15em]">
                          Pending Entry...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...timelineData].reverse().map((day) => (
                <div
                  key={day.dateStr}
                  className={cn(
                    "rounded-3xl p-8 transition-all border group relative",
                    day.dayNotes.length > 0
                      ? "bg-white dark:bg-card border-border/50 shadow-sm"
                      : day.isMissed
                        ? "bg-destructive/[0.03] border-destructive/10"
                        : "bg-secondary/10 border-dashed border-border/50",
                  )}
                >
                  <header className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                        {format(day.date, "EEEE")}
                      </p>
                      <p className="font-bold text-xl">
                        {format(day.date, "MMM d")}
                      </p>
                    </div>
                    {day.dayNotes.length > 0 ? (
                      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    ) : day.isToday ? (
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    ) : day.isMissed ? (
                      <span className="text-2xl opacity-20 font-bold">:(</span>
                    ) : null}
                  </header>

                  {day.dayNotes.length > 0 ? (
                    <div className="space-y-4">
                      {day.dayNotes.map((note: any) => (
                        <div
                          key={note.id}
                          className="prose prose-sm dark:prose-invert line-clamp-3"
                        >
                          {editingNoteId === note.id ? (
                            <div className="space-y-4">
                              <RichEditor
                                content={editingContent}
                                onChange={setEditingContent}
                                className="min-h-[80px] p-2 text-sm"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={cancelEditing}
                                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdateNote(note.id)}
                                  className="text-[10px] font-bold uppercase tracking-widest text-primary"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: note.content,
                                }}
                              />
                              {note.dateString === todayStr && !isCompleted && (
                                <div className="flex items-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditing(note);
                                    }}
                                    className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                                  >
                                    <Edit3 className="h-3 w-3 text-muted-foreground" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDeleteConfirm(note.id);
                                    }}
                                    className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : day.isMissed ? (
                    <p className="text-xs text-destructive/40 font-bold uppercase tracking-widest italic mt-4">
                      Missed Day
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/20 font-bold uppercase tracking-widest italic mt-4">
                      Empty Slot
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Logger */}
        <section className="lg:sticky lg:top-12">
          <div className="bg-card rounded-[3rem] p-10 border border-border shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] space-y-10 relative overflow-hidden group/card">
            <div className="space-y-3 relative z-10">
              <h2 className="text-4xl tracking-tighter font-bold">
                Activity Log
              </h2>
              <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                {isCompleted
                  ? "This goal is archived."
                  : "Detail your accomplishments. Be specific, be consistent."}
              </p>
            </div>

            {isCompleted ? (
              <div className="bg-black/5 rounded-[2.5rem] p-10 text-center space-y-6 border border-black/5 relative z-10">
                <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="h-10 w-10 text-yellow-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl tracking-tight font-bold">
                    Goal Achieved
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This goal is now read-only in your Hall of Fame. Well
                    deserved.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-10 relative z-10">

                <div className="space-y-6">
                  <RichEditor
                    content={newNote}
                    onChange={setNewNote}
                    placeholder="Describe your progress..."
                  />
                  <button
                    onClick={saveNote}
                    disabled={
                      addNoteMutation.isPending ||
                      !newNote ||
                      newNote === "<p></p>"
                    }
                    className="w-full h-20 bg-black text-white rounded-[2rem] font-bold text-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 shadow-2xl flex items-center justify-center gap-4 group"
                  >
                    {addNoteMutation.isPending
                      ? "Syncing..."
                      : "Record Activity"}
                    <Save className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* Background decoration */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/[0.02] rounded-full blur-3xl pointer-events-none group-hover/card:bg-primary/[0.04] transition-colors" />
          </div>
        </section>
      </div>
      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteDialogOpen} onClose={closeDeleteConfirm}>
        <div className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-4xl tracking-tight font-bold">Delete Log?</h2>
            <p className="text-muted-foreground text-sm font-medium">
              This action cannot be undone.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={closeDeleteConfirm}
              className="flex-1 h-16 rounded-2xl text-lg font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteNote}
              disabled={deleteNoteMutation.isPending}
              className="flex-[2] h-16 rounded-2xl text-lg font-bold bg-destructive text-destructive-foreground hover:opacity-90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              {deleteNoteMutation.isPending
                ? "Deleting..."
                : "Delete Permanently"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
