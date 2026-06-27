export interface JwtPayload {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface PasswordResetJwtPayload {
  email: string;
  otpHash: string;
  type: "password_reset";
}