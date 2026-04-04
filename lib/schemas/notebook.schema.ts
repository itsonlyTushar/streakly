import { z } from "zod";

export const NotebookSchema = z.object({
  userId: z.string(),
  drawing: z.string(),
  updatedAt: z.any().optional(),
});

export type NotebookData = z.infer<typeof NotebookSchema>;
