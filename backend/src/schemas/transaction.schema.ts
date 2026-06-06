import { z } from "zod";
import { objectIdSchema, visibilitySchema } from "./common.schema";

const splitConfigSchema = z
  .object({
    shares: z.record(z.coerce.number().nonnegative()).optional()
  })
  .default({});

export const transactionQuerySchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  categoryId: objectIdSchema.optional(),
  paidBy: z.string().optional(),
  visibility: z.enum(["private", "shared"]).default("shared"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});

const transactionBaseSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive(),
  categoryId: objectIdSchema,
  description: z.string().max(200).default(""),
  date: z.coerce.date(),
  paidBy: z.string().min(2).max(80),
  splitMode: z.enum(["individual", "shared"]).default("shared"),
  visibility: visibilitySchema,
  splitType: z.enum(["equal", "percentage", "custom"]).default("equal"),
  splitConfig: splitConfigSchema,
  isRecurring: z.boolean().default(false)
});

const validateSplit = (value: Partial<z.infer<typeof transactionBaseSchema>>, ctx: z.RefinementCtx) => {
  if (value.visibility === "shared" && value.type === "income") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["type"],
      message: "Shared household transactions must be expenses"
    });
  }

  if (value.visibility === "shared" && value.splitType && value.splitType !== "equal") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["splitType"],
      message: "Shared household expenses are always split equally in member balance"
    });
  }

  if (value.visibility === "private" && value.splitMode === "shared") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["splitMode"],
      message: "Private transactions must use individual split mode"
    });
  }

  if ((value.splitType === "percentage" || value.splitType === "custom") && !value.splitConfig?.shares) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["splitConfig"],
      message: "splitConfig.shares is required for percentage and custom split types"
    });
  }
};

export const createTransactionSchema = transactionBaseSchema.superRefine(validateSplit);

export const updateTransactionSchema = transactionBaseSchema.partial().superRefine(validateSplit).refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required"
);

export type TransactionQuery = z.infer<typeof transactionQuerySchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
