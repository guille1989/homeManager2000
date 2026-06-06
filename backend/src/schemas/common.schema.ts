import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

export const idParamSchema = z.object({
  id: objectIdSchema
});

export const periodQuerySchema = z.object({
  period: z.enum(["week", "month", "year"]).optional(),
  date: z.string().optional(),
  visibility: z.enum(["private", "shared"]).default("shared")
});

export const visibilityQuerySchema = z.object({
  visibility: z.enum(["private", "shared"]).default("shared")
});

export const visibilitySchema = z.enum(["private", "shared"]).default("shared");
