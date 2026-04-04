import { z } from "zod";

export const NoteSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  userId: z.string(),
  content: z.string().min(1, "Note content cannot be empty"),
  date: z.any(), // Firebase Timestamp
  dateString: z.string(), // yyyy-MM-dd
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type Note = z.infer<typeof NoteSchema>;
