import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
  householdName: z.string().min(2).max(100).optional(),
  partnerName: z.string().min(2).max(80).optional(),
  inviteCode: z.string().min(8).max(64).optional(),
  currency: z.string().min(3).max(3).default("EUR")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
