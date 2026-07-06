"use client";

import React, { useMemo, useState } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  Inbox,
  ListTodo,
  Pencil,
  CheckCircle2,
  CalendarClock,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { isPast, isToday, startOfDay } from "date-fns";
import { useAuthGuard } from "@/components/auth-guard";
import { cn } from "@/lib/utils";
import { useTasks, useTaskProjects, useAddTask } from "@/hooks/use-tasks";
import { Task } from "@/services/tasks.service";
import { TaskProject } from "@/services/tasks.service";
import { TaskPriority } from "@/lib/schemas/task.schema";
import { PRIORITY_ORDER, PROJECT_COLORS } from "@/components/tasks/task-ui";
import { TaskList } from "@/components/tasks/task-list";
import { TaskFormSheet } from "@/components/tasks/task-form-sheet";
import { ProjectFormModal } from "@/components/tasks/project-form-modal";

type ProjectFilter = "all" | "inbox" | string;

export default function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: projects = [] } = useTaskProjects();
  const { requireAuth } = useAuthGuard();
  const addTask = useAddTask();

  const [selectedProject, setSelectedProject] = useState<ProjectFilter>("all");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [quickAdd, setQuickAdd] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<TaskProject | null>(null);

  const activeProject =
    selectedProject !== "all" && selectedProject !== "inbox"
      ? projects.find((p) => p.id === selectedProject)
      : undefined;

  // Tasks scoped to the current list selection (used for stats).
  const scoped = useMemo(() => {
    if (selectedProject === "all") return tasks;
    if (selectedProject === "inbox") return tasks.filter((t) => !t.projectId);
    return tasks.filter((t) => t.projectId === selectedProject);
  }, [tasks, selectedProject]);

  // Scoped + search + priority filter (used for display).
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((t) => {
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (q) {
        const hit =
          t.title.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q));
        if (!hit) return false;
      }
      return true;
    });
  }, [scoped, search, priorityFilter]);

  const stats = useMemo(() => {
    const total = scoped.length;
    const done = scoped.filter((t) => t.status === "Done").length;
    let dueToday = 0;
    let overdue = 0;
    let completedToday = 0;
    scoped.forEach((t) => {
      const due = t.dueDate?.toDate?.() as Date | undefined;
      if (t.status !== "Done" && due) {
        if (isToday(due)) dueToday++;
        else if (isPast(startOfDay(due))) overdue++;
      }
      if (t.status === "Done") {
        const c = t.completedAt?.toDate?.() as Date | undefined;
        if (c && isToday(c)) completedToday++;
      }
    });
    return {
      total,
      done,
      dueToday,
      overdue,
      completedToday,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  }, [scoped]);

  const openCreate = () => {
    setEditingTask(null);
    setFormOpen(true);
  };

  const openTask = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleQuickAdd = () => {
    const value = quickAdd.trim();
    if (!value) return;
    requireAuth(() => {
      addTask.mutate({
        title: value,
        status: "Todo",
        projectId: activeProject ? activeProject.id : null,
      });
      setQuickAdd("");
    });
  };

  const statPills = [
    { label: "Total", value: stats.total, icon: ListTodo, tone: "text-foreground" },
    { label: "Due today", value: stats.dueToday, icon: CalendarClock, tone: "text-amber-500" },
    { label: "Overdue", value: stats.overdue, icon: AlertTriangle, tone: "text-rose-500" },
    { label: "Done today", value: stats.completedToday, icon: CheckCircle2, tone: "text-emerald-500" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter flex items-center gap-2.5">
            <ListTodo className="h-8 w-8 text-primary" />
            Tasks
          </h1>
          <p className="text-muted-foreground font-medium max-w-md text-sm">
            Capture, organize and knock out everything you need to get done.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          New task
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {statPills.map((s) => (
          <div
            key={s.label}
            className="bg-card border border-border/50 rounded-2xl p-3.5 flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-xl bg-secondary/60 flex items-center justify-center flex-shrink-0">
              <s.icon className={cn("h-4 w-4", s.tone)} />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-black leading-none">{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                {s.label}
              </div>
            </div>
          </div>
        ))}
        {/* Progress */}
        <div className="bg-card border border-border/50 rounded-2xl p-3.5 flex items-center gap-3 col-span-2 lg:col-span-1">
          <div className="h-9 w-9 rounded-xl bg-secondary/60 flex items-center justify-center flex-shrink-0">
            <Flame className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-black leading-none">{stats.percent}%</div>
            <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Project selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <ProjectChip
          active={selectedProject === "all"}
          onClick={() => setSelectedProject("all")}
          icon={<LayoutGrid className="h-3.5 w-3.5" />}
          label="All"
        />
        <ProjectChip
          active={selectedProject === "inbox"}
          onClick={() => setSelectedProject("inbox")}
          icon={<Inbox className="h-3.5 w-3.5" />}
          label="Inbox"
        />
        {projects.map((p) => (
          <ProjectChip
            key={p.id}
            active={selectedProject === p.id}
            onClick={() => setSelectedProject(p.id)}
            icon={<span className={cn("w-2.5 h-2.5 rounded-full", PROJECT_COLORS[p.color].dot)} />}
            label={p.name}
          />
        ))}

        {activeProject && (
          <button
            onClick={() => {
              setEditingProject(activeProject);
              setProjectModalOpen(true);
            }}
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors"
            title="Edit list"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          onClick={() => {
            setEditingProject(null);
            setProjectModalOpen(true);
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-muted-foreground border border-dashed border-border/60 hover:border-primary/50 hover:text-primary transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          New list
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, tags…"
            className="w-full bg-secondary/50 border border-transparent focus:border-primary/30 rounded-xl pl-9 pr-3 py-2.5 outline-none transition-all text-sm font-medium"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | "all")}
          className="bg-secondary/50 border border-transparent focus:border-primary/30 rounded-xl px-3 py-2.5 outline-none transition-all text-sm font-bold cursor-pointer"
        >
          <option value="all">All priorities</option>
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

      </div>

      {/* Quick add */}
      <div className="relative">
        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <input
          value={quickAdd}
          onChange={(e) => setQuickAdd(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleQuickAdd();
          }}
          placeholder={
            activeProject
              ? `Add a task to ${activeProject.name} and press Enter…`
              : "Add a task and press Enter…"
          }
          className="w-full bg-card border border-border/50 focus:border-primary/40 rounded-xl pl-9 pr-3 py-3 outline-none transition-all text-sm font-medium"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="h-[50vh] rounded-3xl bg-secondary/40 animate-pulse" />
      ) : visible.length === 0 ? (
        <div className="text-center py-16 space-y-3 border border-dashed border-border/50 rounded-3xl bg-secondary/[0.04]">
          <ListTodo className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <p className="text-muted-foreground font-semibold">
            {scoped.length === 0 ? "No tasks yet" : "No tasks match your filters"}
          </p>
          <p className="text-xs text-muted-foreground/60">
            {scoped.length === 0
              ? "Use the quick-add above or hit “New task” to get started."
              : "Try clearing the search or priority filter."}
          </p>
        </div>
      ) : (
        <TaskList tasks={visible} projects={projects} onOpenTask={openTask} />
      )}

      {/* Overlays */}
      <TaskFormSheet
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        task={editingTask}
        projects={projects}
        defaultProjectId={activeProject ? activeProject.id : null}
      />
      <ProjectFormModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        project={editingProject}
      />
    </div>
  );
}

function ProjectChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all max-w-[180px]",
        active
          ? "bg-secondary border-primary/40 text-foreground"
          : "border-border/50 text-muted-foreground hover:bg-secondary/50"
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
