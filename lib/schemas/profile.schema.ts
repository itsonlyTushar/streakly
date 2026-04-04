import { z } from "zod";

export const ProfileSchema = z.object({
  id: z.string(), // maps to UID
  email: z.string().email().optional().nullable(),
  bio: z.string().optional().nullable(),
  emailNotifications: z.boolean().default(true),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type ProfileData = z.infer<typeof ProfileSchema>;
