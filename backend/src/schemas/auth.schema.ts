import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().min(2).max(80).optional(),
    email: z.string().email(),
    password: z.string().min(8),
    householdName: z.string().min(2).max(100).optional(),
    partnerName: z.string().min(2).max(80).optional(),
    inviteCode: z.string().min(8).max(64).optional(),
    currency: z.string().min(3).max(3).default("EUR")
  })
  .superRefine((value, ctx) => {
    if (!value.inviteCode && !value.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["name"],
        message: "Name is required when creating a household"
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
