import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { JwtPayload, PasswordResetJwtPayload } from "../types/jwt.js";

/**
 * Generate an access token.
 * Admin tokens last 2 hours, user/delivery tokens last 1 hour.
 * The proactive refresh (every 10 min) keeps tokens fresh, so these
 * durations are generous and reduce the chance of mid-session expiry.
 * Payload contains only _id — no PII (name, email, role) to minimize leak surface.
 * Role is re-read from DB on every request via req.user (auth middleware).
 */
export const generateToken = (
  user: { _id: unknown },
  type?: "admin" | "user" | "delivery",
): string => {
  const payload: JwtPayload = {
    _id: String(user._id),
  };
  const expiry = type === "admin" ? "2h" : "1h";
  const options: SignOptions = { expiresIn: expiry };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

import { randomInt, createHash } from "crypto";

export const generateOtp = (): string => {
  return String(randomInt(100000, 999999));
};

export const hashOtp = (otp: string): string => {
  return createHash("sha256").update(otp).digest("hex");
};

export const generatePasswordResetToken = (
  email: string,
  otp: string,
): string => {
  const payload: PasswordResetJwtPayload = {
    email,
    otpHash: hashOtp(otp),
    type: "password_reset",
  };
  const options: SignOptions = { expiresIn: "10m" };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

export const verifyPasswordResetToken = (
  token: string,
): PasswordResetJwtPayload | null => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "type" in decoded &&
      (decoded as { type: unknown }).type === "password_reset"
    ) {
      return decoded as PasswordResetJwtPayload;
    }
    return null;
  } catch (error) {
    return null;
  }
};