import { z } from "zod";
import "dotenv/config";
import { logger } from "../lib/logger.js";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  APP_URL: z.string().url().default("http://localhost:3000"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  MY_GMAIL: z.string().email().optional(),
  MY_GMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM_NAME: z.string().optional(),
  SUPPORT_EMAIL: z.string().email().default("support@toyshop.com"),
  CDN_HOST: z.string().default("cdn.toyshop.com"),
  APP_NAME: z.string().default("Toy Shop"),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  NEW_DB_URL: z.string().min(1, "NEW_DB_URL is required"),

  CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
  CLOUDFLARE_ACCESS_KEY_ID: z.string().optional(),
  CLOUDFLARE_SECRET_ACCESS_KEY: z.string().optional(),
  R2_API_TOKEN: z.string().optional(),

  CLOUDFLARE_BUCKET_NAME: z.string().optional(),
  CLOUDFLARE_PUBLIC_URL: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  TWILLO_VERIFY_SERVICE_SID: z.string().optional(),
  TWILLO_ACCOUNT_SID: z.string().optional(),
  TWILLO_AUTH_TOKEN: z.string().optional(),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.0-flash"),
  AI_DAILY_TOKEN_BUDGET: z.coerce.number().int().positive().default(100000),

  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:3001")
    .transform((val) => val.split(",").map((s) => s.trim())),

  REVALIDATE_SECRET: z.string().optional(),

  ENABLE_SWAGGER: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  logger.error({ errors: parsed.error.flatten().fieldErrors }, "Invalid environment variables");
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;