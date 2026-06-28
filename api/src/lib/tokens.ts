import { randomBytes, createHash } from "crypto";
import { env } from "../config/env.js";
import RefreshTokenModel from "../models/refreshToken.js";

// ── Refresh Token (opaque, stored hashed in DB) ──
const REFRESH_TOKEN_DAYS = 7;

// ── Refresh Token (opaque, stored hashed in DB) ──

export function generateRefreshTokenValue(): string {
  return randomBytes(64).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function getRefreshTokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + REFRESH_TOKEN_DAYS);
  return d;
}

export async function createRefreshToken(
  userId: string,
  type: "user" | "admin" | "delivery",
): Promise<{ tokenValue: string; expiresAt: Date }> {
  const tokenValue = generateRefreshTokenValue();
  const tokenHash = hashToken(tokenValue);
  const expiresAt = getRefreshTokenExpiry();

  await RefreshTokenModel.create({ tokenHash, userId, type, expiresAt });

  return { tokenValue, expiresAt };
}

export async function verifyRefreshToken(
  tokenValue: string,
  type: "user" | "admin" | "delivery",
): Promise<{
  userId: string;
  tokenHash: string;
} | null> {
  const tokenHash = hashToken(tokenValue);
  const doc = await RefreshTokenModel.findOne({ tokenHash, type });

  if (!doc) return null;
  if (doc.expiresAt < new Date()) {
    await RefreshTokenModel.deleteOne({ _id: doc._id });
    return null;
  }

  return { userId: String(doc.userId), tokenHash };
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await RefreshTokenModel.deleteOne({ tokenHash });
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await RefreshTokenModel.deleteMany({ userId });
}

// ── Cookie config helpers ──

export function accessTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
  };
}

export function refreshTokenCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    expires: expiresAt,
    path: "/",
  };
}

export function clearAccessTokenCookie() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
}

export function clearRefreshTokenCookie() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
    path: "/",
  };
}
