import type { Address } from "./address.js";

export type UserRole = "user" | "admin" | "delivery";

/** Core user model (mirrors Mongoose schema) */
export interface User {
  _id: string;
  name: string;
  gender?: "male" | "female" | "other";
  address?: Address;
  role: UserRole;
  avatar?: string | null;
  avatarFileName?: string | null;
  avatarFileId?: string | null;
  email: string;
  isEmailVerified?: boolean;
  googleId?: string | null;
  mobile?: number | null;
  isMobileVerified?: boolean;
  status?: boolean;
  order?: number;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Login request payload */
export interface LoginPayload {
  email: string;
  password: string;
}

/** Registration request payload */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  mobile?: number;
  gender?: string;
}

/** JWT token response */
export interface TokenResponse {
  token: string;
  user: User;
}
