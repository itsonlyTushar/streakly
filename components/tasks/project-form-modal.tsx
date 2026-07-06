"use client";

import React, { useEffect, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { useToast } from "@/components/ui/toast";
import { useAuthGuard } from "@/components/auth-guard";
import { TaskProject } from "@/services/tasks.service";
import { TaskProjectColor } from "@/lib/schemas/task.schema";
import {
  useAddTaskProject,
  useUpdateTaskProject,
  useDeleteTaskProject,
} from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";
import { PROJECT_COLORS, PROJECT_COLOR_KEYS } from "./task-ui";

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: TaskProject | null;
}

export function ProjectFormModal({ isOpen, onClose, project }: ProjectFormModalProps) {
  const isEdit = !!project;
  const { toast } = useToast();
  const { requireAuth } = useAuthGuard();
  const addMutation = useAddTaskProject();
  const updateMutation = useUpdateTaskProject();
  const deleteMutation = useDeleteTaskProject();

  const [name, setName] = useState("");
  const [color, setColor] = useState<TaskProjectColor>("violet");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(project?.name ?? "");
    setColor(project?.color ?? "violet");
  }, [isOpen, project]);

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Name required", description: "Give your list a name.", variant: "error" });
      return;
    }
    requireAuth(() => {
      if (isEdit && project) {
        updateMutation.mutate(
          { itemId: project.id, data: { name: name.trim(), color } },
          { onSuccess: onClose }
        );
      } else {
        addMutation.mutate({ name: name.trim(), color }, { onSuccess: onClose });
      }
    });
  };

  const handleDelete = () => {
    if (!project) return;
    deleteMutation.mutate(project.id, { onSuccess: onClose });
  };

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-sm p-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tighter">
              {isEdit ? "Edit list" : "New list"}
            </h3>
            <p className="text-xs text-muted-foreground font-medium">
              Group related tasks together.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
              Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="e.g. Job Search, Study, Side Project"
              className="w-full bg-secondary/50 border border-transparent focus:border-primary/30 rounded-xl px-3 py-2.5 outline-none transition-all text-sm font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLOR_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setColor(key)}
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                    PROJECT_COLORS[key].swatch,
                    color === key
                      ? "ring-2 ring-offset-2 ring-offset-card scale-110 " + PROJECT_COLORS[key].ring
                      : "opacity-70 hover:opacity-100"
                  )}
                >
                  {color === key && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {isEdit && (
              <button
                type="button"
                onClick={() => setIsDeleteOpen(true)}
                className="p-2.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all"
                title="Delete list"
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
              className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isEdit ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete this list?"
        description="Tasks in this list won't be deleted — they'll move back to your Inbox view under All Tasks."
        confirmText="Delete list"
        variant="destructive"
        icon="danger"
      />
    </>
  );
}
