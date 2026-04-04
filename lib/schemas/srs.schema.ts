import { z } from "zod";

export const SRSItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string().optional().nullable(),
  topic: z.string().min(1, "Topic is required"),
  details: z.string().optional().nullable(),
  dateLearned: z.any(), // Firebase Timestamp
  nextReviewDate: z.any(), // Firebase Timestamp
  reviewCount: z.number().nonnegative(),
  createdAt: z.any(),
});

export type SRSItem = z.infer<typeof SRSItemSchema>;
