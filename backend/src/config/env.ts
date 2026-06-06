import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MONGO_URI: z.string().min(1).default("mongodb://localhost:27017/couple_budget"),
  JWT_SECRET: z.string().min(8, "JWT_SECRET must contain at least 8 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z.string().url().default("http://localhost:5173")
});

export const env = envSchema.parse(process.env);

