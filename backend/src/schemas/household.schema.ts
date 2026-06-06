import { z } from "zod";

export const createHouseholdSchema = z.object({
  name: z.string().min(2).max(100),
  currency: z.string().min(3).max(3).default("EUR"),
  partnerNames: z.array(z.string().min(2).max(80)).length(2)
});

export const updateHouseholdSchema = createHouseholdSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required"
);

export const joinHouseholdSchema = z.object({
  inviteCode: z.string().min(8).max(64)
});

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>;
export type JoinHouseholdInput = z.infer<typeof joinHouseholdSchema>;
