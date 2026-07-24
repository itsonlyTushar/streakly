import { z } from "zod";

export const FlashcardSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string().optional().nullable(),
  deck: z.string().min(1, "Deck name is required"),
  front: z.string().min(1, "Front text / question is required"),
  back: z.string().min(1, "Back text / answer is required"),
  tags: z.array(z.string()).default([]),
  reviewCount: z.number().default(0),
  easeFactor: z.number().default(2.5),
  intervalDays: z.number().default(1),
  nextReviewDate: z.any().optional().nullable(), // Firebase Timestamp
  lastReviewedAt: z.any().optional().nullable(), // Firebase Timestamp
  mastered: z.boolean().default(false),
  createdAt: z.any(), // Firebase Timestamp
  updatedAt: z.any().optional().nullable(), // Firebase Timestamp
});

export type Flashcard = z.infer<typeof FlashcardSchema>;

export type ReviewRating = "again" | "hard" | "good" | "easy" | "mastered";
