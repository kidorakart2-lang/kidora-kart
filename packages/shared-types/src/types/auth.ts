/** Auth state for frontend Redux / context */
export interface AuthState {
  user: import("./user.js").User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** Login request */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Register request */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  mobile?: number;
  gender?: string;
}

/** Password reset request */
export interface PasswordResetRequest {
  email: string;
  otp: string;
  password: string;
}

/** Forgot password request */
export interface ForgotPasswordRequest {
  email: string;
}
