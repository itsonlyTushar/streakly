import { z } from "zod";

export const TaskStatusSchema = z.enum(["Todo", "Done"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskPrioritySchema = z.enum(["Urgent", "High", "Medium", "Low", "None"]);
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;

export const SubtaskSchema = z.object({
  id: z.string(),
  text: z.string(),
  done: z.boolean().default(false),
});
export type Subtask = z.infer<typeof SubtaskSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string().optional().nullable(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(), // null = Inbox
  status: TaskStatusSchema.default("Todo"),
  priority: TaskPrioritySchema.default("None"),
  tags: z.array(z.string()).default([]),
  dueDate: z.any().optional().nullable(), // Firebase Timestamp
  subtasks: z.array(SubtaskSchema).default([]),
  order: z.number().default(0),
  completedAt: z.any().optional().nullable(), // Firebase Timestamp
  createdAt: z.any(),
  updatedAt: z.any().optional().nullable(),
});
export type Task = z.infer<typeof TaskSchema>;

// Preset color palette for projects/lists. Keys map to Tailwind-friendly tints
// resolved in the UI (see TASK_PROJECT_COLORS in the components).
export const TaskProjectColorSchema = z.enum([
  "violet",
  "blue",
  "emerald",
  "amber",
  "rose",
  "cyan",
  "slate",
]);
export type TaskProjectColor = z.infer<typeof TaskProjectColorSchema>;

export const TaskProjectSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string().optional().nullable(),
  name: z.string().min(1, "List name is required"),
  color: TaskProjectColorSchema.default("violet"),
  order: z.number().default(0),
  createdAt: z.any(),
  updatedAt: z.any().optional().nullable(),
});
export type TaskProject = z.infer<typeof TaskProjectSchema>;
