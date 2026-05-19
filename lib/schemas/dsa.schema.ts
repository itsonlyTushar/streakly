import { z } from "zod";

export const DSADifficultySchema = z.enum(["Easy", "Medium", "Hard"]);
export type DSADifficulty = z.infer<typeof DSADifficultySchema>;

export const DSAItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userEmail: z.string().optional().nullable(),
  problemName: z.string().min(1, "Problem name is required"),
  problemUrl: z.string().optional().nullable(),
  difficulty: DSADifficultySchema,
  topics: z.array(z.string()).default([]),
  timeComplexity: z.string().optional().nullable(),
  spaceComplexity: z.string().optional().nullable(),
  intuition: z.string().optional().nullable(),
  codeSnippet: z.string().optional().nullable(),
  dateLearned: z.any(), // Firebase Timestamp
  nextReviewDate: z.any().optional().nullable(), // Firebase Timestamp
  reviewCount: z.number().nonnegative(),
  createdAt: z.any(),
  updatedAt: z.any().optional().nullable(),
});

export type DSAItem = z.infer<typeof DSAItemSchema>;
