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
  SUPPORT_EMAIL: z.string().email().default("support@kidorakart.com"),
  CDN_HOST: z.string().default("cdn.kidorakart.com"),
  APP_NAME: z.string().default("Kidora Kart"),

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

  AI_PROVIDER: z.enum(["gemini", "openrouter", "llm7", "huggingface"]).default("openrouter"),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),

  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("openrouter/free"),

  LLM7_API_KEY: z.string().optional(),
  LLM7_BASE_URL: z.string().optional(),
  LLM7_MODEL: z.string().default("gpt-4o-mini-2024-07-18"),

  HUGGINGFACE_API_KEY: z.string().optional(),
  HUGGINGFACE_BASE_URL: z.string().optional(),
  HUGGINGFACE_MODEL: z.string().default("meta-llama/Llama-3.3-70B-Instruct"),

  AI_DAILY_TOKEN_BUDGET: z.coerce.number().int().positive().default(100000),

  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:3001")
    .transform((val) => val.split(",").map((s) => s.trim())),

  SHIPROCKET_EMAIL: z.string().email().optional(),
  SHIPROCKET_PASSWORD: z.string().optional(),
  SHIPROCKET_TOKEN: z.string().optional(), // Cached JWT — service regenerates on 401

  TURNSTILE_SECRET_KEY: z.string().optional(),

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