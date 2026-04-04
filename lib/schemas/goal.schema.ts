import { z } from "zod";

export const GoalStatusSchema = z.enum(["active", "completed"]);

export const GoalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  goal: z.string().min(1, "Goal description is required"),
  dueDate: z.string(),
  status: GoalStatusSchema,
  color: z.string().optional().nullable(),
  createdAt: z.any(), // Firebase Timestamp
  completedAt: z.any().optional().nullable(),
});

export type GoalData = z.infer<typeof GoalSchema>;
export type GoalStatus = z.infer<typeof GoalStatusSchema>;
