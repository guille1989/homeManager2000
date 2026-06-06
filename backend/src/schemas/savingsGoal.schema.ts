import { z } from "zod";
import { visibilityQuerySchema, visibilitySchema } from "./common.schema";

const savingsGoalBaseSchema = z.object({
  name: z.string().min(2).max(100),
  targetAmount: z.coerce.number().positive(),
  currentAmount: z.coerce.number().nonnegative().default(0),
  targetDate: z.coerce.date(),
  color: z.string().regex(/^#([a-f\d]{3}|[a-f\d]{6})$/i).default("#59b2b0"),
  visibility: visibilitySchema,
  type: z.enum(["personal", "shared"]).default("shared")
});

const validateGoalVisibility = (value: Partial<z.infer<typeof savingsGoalBaseSchema>>, ctx: z.RefinementCtx) => {
  if (value.visibility === "private" && value.type !== "personal") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["type"],
      message: "Private goals must be personal"
    });
  }

  if (value.visibility === "shared" && value.type !== "shared") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["type"],
      message: "Shared goals must use shared type"
    });
  }
};

export const createSavingsGoalSchema = savingsGoalBaseSchema.superRefine(validateGoalVisibility);

export const updateSavingsGoalSchema = savingsGoalBaseSchema.partial().superRefine(validateGoalVisibility).refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required"
);

export const createContributionSchema = z.object({
  amount: z.coerce.number().positive(),
  date: z.coerce.date(),
  contributedBy: z.string().min(2).max(80),
  note: z.string().max(160).optional()
});

export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>;
export type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>;
export type CreateContributionInput = z.infer<typeof createContributionSchema>;
export type SavingsGoalQuery = z.infer<typeof visibilityQuerySchema>;
