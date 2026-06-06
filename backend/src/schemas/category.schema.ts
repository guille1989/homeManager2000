import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  type: z.enum(["income", "expense", "both"]).default("expense"),
  color: z.string().regex(/^#([a-f\d]{3}|[a-f\d]{6})$/i).default("#448481"),
  icon: z.string().max(40).optional()
});

export const updateCategorySchema = createCategorySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "At least one field is required"
);

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
