"use client";

import React, { useEffect, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { Plus, X, Trash2, Check, Inbox } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { DatePicker } from "@/components/ui/date-picker";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useToast } from "@/components/ui/toast";
import { useAuthGuard } from "@/components/auth-guard";
import { Task, TaskProject } from "@/services/tasks.service";
import { Subtask, TaskPriority } from "@/lib/schemas/task.schema";
import { useAddTask, useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";
import { PRIORITY_META, PRIORITY_ORDER, PROJECT_COLORS } from "./task-ui";

interface TaskFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  projects: TaskProject[];
  defaultProjectId?: string | null;
}

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

const labelCls =
  "text-[10px] font-black uppercase tracking-widest text-muted-foreground/70";
const inputCls =
  "w-full bg-secondary/50 border border-transparent focus:border-primary/30 rounded-xl px-3 py-2.5 outline-none transition-all text-sm font-medium placeholder:text-muted-foreground/40";

export function TaskFormSheet({
  isOpen,
  onClose,
  task,
  projects,
  defaultProjectId = null,
}: TaskFormSheetProps) {
  const isEdit = !!task;
  const { toast } = useToast();
  const { requireAuth } = useAuthGuard();
  const addMutation = useAddTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [priority, setPriority] = useState<TaskPriority>("None");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Sync form state whenever the sheet opens or the target task changes.
  useEffect(() => {
    if (!isOpen) return;
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setProjectId(task.projectId ?? null);
      setPriority(task.priority);
      setDueDate(task.dueDate?.toDate?.() ?? undefined);
      setTags(task.tags ?? []);
      setSubtasks(task.subtasks ?? []);
    } else {
      setTitle("");
      setDescription("");
      setProjectId(defaultProjectId ?? null);
      setPriority("None");
      setDueDate(undefined);
      setTags([]);
      setSubtasks([]);
    }
    setTagInput("");
    setSubtaskInput("");
  }, [isOpen, task, defaultProjectId]);

  const addTag = () => {
    const value = tagInput.trim();
    if (value && !tags.includes(value)) setTags([...tags, value]);
    setTagInput("");
  };

  const addSubtask = () => {
    const value = subtaskInput.trim();
    if (value) setSubtasks([...subtasks, { id: genId(), text: value, done: false }]);
    setSubtaskInput("");
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Title required", description: "Give your task a name.", variant: "error" });
      return;
    }

    requireAuth(() => {
      if (isEdit && task) {
        updateMutation.mutate(
          {
            itemId: task.id,
            data: {
              title: title.trim(),
              description: description.trim() || null,
              projectId,
              priority,
              tags,
              dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
              subtasks,
            },
          },
          { onSuccess: onClose }
        );
      } else {
        addMutation.mutate(
          {
            title: title.trim(),
            description: description.trim() || null,
            projectId,
            priority,
            tags,
            dueDate: dueDate ?? null,
            subtasks,
          },
          { onSuccess: onClose }
        );
      }
    });
  };

  const handleDelete = () => {
    if (!task) return;
    deleteMutation.mutate(task.id, { onSuccess: onClose });
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Sheet
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? "Edit task" : "New task"}
        description={isEdit ? "Update the details of this task." : "Capture something you need to get done."}
      >
        <div className="flex flex-col gap-5 pb-24">
          {/* Title */}
          <div className="space-y-1.5">
            <label className={labelCls}>Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className={cn(inputCls, "text-base")}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className={labelCls}>Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, context, links…"
              rows={3}
              className={cn(inputCls, "resize-none")}
            />
          </div>

          {/* Project / list */}
          <div className="space-y-1.5">
            <label className={labelCls}>List</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setProjectId(null)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all",
                  projectId === null
                    ? "bg-secondary border-primary/40 text-foreground"
                    : "border-border/50 text-muted-foreground hover:bg-secondary/50"
                )}
              >
                <Inbox className="h-3.5 w-3.5" />
                Inbox
              </button>
              {projects.map((p) => {
                const color = PROJECT_COLORS[p.color];
                const active = projectId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProjectId(p.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all",
                      active
                        ? "bg-secondary border-primary/40 text-foreground"
                        : "border-border/50 text-muted-foreground hover:bg-secondary/50"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full", color.dot)} />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <label className={labelCls}>Priority</label>
            <div className="grid grid-cols-5 gap-1.5">
              {PRIORITY_ORDER.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "px-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide border transition-all flex flex-col items-center gap-1",
                    priority === p
                      ? "bg-secondary border-primary/40 text-foreground"
                      : "border-border/50 text-muted-foreground hover:bg-secondary/50"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full", PRIORITY_META[p].dot)} />
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <label className={labelCls}>Due date</label>
            <div className="flex items-center gap-2">
              <DatePicker
                selected={dueDate}
                onSelect={setDueDate}
                placeholder="No due date"
                buttonClassName="!py-2.5 !px-3 !text-sm !rounded-xl"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate(undefined)}
                  className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary text-muted-foreground transition-colors"
                  title="Clear due date"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className={labelCls}>Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="flex items-center gap-1 px-2 py-1 bg-secondary/80 text-muted-foreground rounded-md text-[10px] font-black uppercase border border-border/40"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
              placeholder="Type a tag and press Enter"
              className={inputCls}
            />
          </div>

          {/* Subtasks */}
          <div className="space-y-1.5">
            <label className={labelCls}>
              Subtasks{" "}
              {subtasks.length > 0 && (
                <span className="text-muted-foreground/50">
                  · {subtasks.filter((s) => s.done).length}/{subtasks.length}
                </span>
              )}
            </label>
            <div className="space-y-1.5">
              {subtasks.map((s) => (
                <div key={s.id} className="flex items-center gap-2 group">
                  <button
                    type="button"
                    onClick={() =>
                      setSubtasks(
                        subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x))
                      )
                    }
                    className={cn(
                      "flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-all",
                      s.done
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-border hover:border-primary"
                    )}
                  >
                    {s.done && <Check className="h-2.5 w-2.5" />}
                  </button>
                  <span
                    className={cn(
                      "flex-1 text-sm",
                      s.done && "line-through text-muted-foreground"
                    )}
                  >
                    {s.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSubtasks(subtasks.filter((x) => x.id !== s.id))}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                placeholder="Add a subtask"
                className={inputCls}
              />
              <button
                type="button"
                onClick={addSubtask}
                className="p-2.5 rounded-xl bg-secondary/50 hover:bg-secondary text-foreground transition-colors flex-shrink-0"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sticky footer actions */}
        <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border/50 p-4 flex items-center gap-2">
          {isEdit && (
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="p-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all"
              title="Delete task"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {isPending ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create task"
            )}
          </button>
        </div>
      </Sheet>

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this task?"
        description="This can't be undone. The task and its subtasks will be permanently removed."
        confirmText="Delete"
        variant="destructive"
        icon="danger"
      />
    </>
  );
}
