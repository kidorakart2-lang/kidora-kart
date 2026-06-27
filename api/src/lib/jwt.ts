import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import type { JwtPayload, PasswordResetJwtPayload } from "../types/jwt.js";

export const generateToken = (
  user: { _id: unknown; name?: string; email?: string; role?: string },
): string => {
  const payload: JwtPayload = {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const options: SignOptions = { expiresIn: "10d" };
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