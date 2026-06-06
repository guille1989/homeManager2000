import { z } from "zod";
import { objectIdSchema, visibilitySchema } from "./common.schema";

export const budgetQuerySchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).optional(),
  visibility: z.enum(["private", "shared"]).default("shared")
});

export const createBudgetSchema = z.object({
  categoryId: objectIdSchema,
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
  limit: z.coerce.number().nonnegative(),
  visibility: visibilitySchema
});

export const updateBudgetSchema = createBudgetSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required"
);

export type BudgetQuery = z.infer<typeof budgetQuerySchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
