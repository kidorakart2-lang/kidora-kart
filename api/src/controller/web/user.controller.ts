import type { Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { randomBytes } from "crypto";
import User from "../../models/user.js";
import { generateToken, generateOtp, generatePasswordResetToken, verifyPasswordResetToken, hashOtp } from "../../lib/jwt.js";
import { hashPassword, comparePassword } from "../../lib/bcrypt.js";
import { sendEmail } from "../../lib/nodemailer.js";
import { uploadToR2 } from "../../lib/cloudflare.js";
import { env } from "../../config/env.js";
import { success, fail } from "../../utils/responses.js";
import {
  createRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
} from "../../lib/tokens.js";

const oauthStates = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  for (const [key, ts] of oauthStates) {
    if (now - ts > 600000) oauthStates.delete(key);
  }
}, 120000);

/** Helper: set access + refresh token cookies for a user session.
 * Returns the generated access token so callers can reuse it without calling generateToken again. */
async function setSessionCookies(
  res: Response,
  user: { _id: unknown },
  type: "user",
): Promise<string> {
  const accessToken = generateToken(user, "user");
  const refresh = await createRefreshToken(String(user._id), type);

  res.cookie(type === "user" ? "userToken" : "adminToken", accessToken, accessTokenCookieOptions("user"));
  res.cookie(
    type === "user" ? "userRefreshToken" : "adminRefreshToken",
    refresh.tokenValue,
    refreshTokenCookieOptions(refresh.expiresAt),
  );

  return accessToken;
}

/** Helper: clear all session cookies */
function clearSessionCookies(res: Response): void {
  res.cookie("userToken", "", clearAccessTokenCookie());
  res.cookie("userRefreshToken", "", clearRefreshTokenCookie());
  res.cookie("adminToken", "", clearAccessTokenCookie());
  res.cookie("adminRefreshToken", "", clearRefreshTokenCookie());
  res.cookie("deliveryToken", "", clearAccessTokenCookie());
  res.cookie("deliveryRefreshToken", "", clearRefreshTokenCookie());
}

export const registerUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  if (!req.body) {
    return fail(res, "All fields are required", 400);
  }
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      return fail(res, "All fields are required", 400);
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return fail(res, "User already exists", 409);
    }

    const hashed = await hashPassword(password);
    const newUser = await User.create({
      name,
      email,
      password: hashed,
    });

    const userObj = newUser.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...userData } = userObj;

    const accessToken = await setSessionCookies(res, newUser, "user");

    return res.status(201).json({
      _status: true,
      _message: "User registered successfully",
      _data: userData,
      _token: accessToken,
    });
  } catch (error) {
    console.error(error);
    return fail(res, "Internal Server Error", 500);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  if (!req.body) {
    return fail(res, "Email and password are required", 400);
  }
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      return fail(res, "All fields are required", 400);
    }

    const user = await User.findOne({ email });
    if (!user || !(await comparePassword(password, user.password))) {
      return fail(res, "Invalid email or password", 401);
    }

    const userObj = user.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...userData } = userObj;

    const accessToken = await setSessionCookies(res, user, "user");

    return res.status(200).json({
      _status: true,
      _message: "User logged in successfully",
      _data: userData,
      _token: accessToken,
    });
  } catch (error) {
    console.error(error);
    return fail(res, "Internal Server Error", 500);
  }
};

export const refreshUserToken = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const refreshValue = req.cookies?.userRefreshToken;
  if (!refreshValue) {
    return fail(res, "No refresh token", 401);
  }

  try {
    const result = await verifyRefreshToken(refreshValue, "user");
    if (!result) {
      clearSessionCookies(res);
      return fail(res, "Session expired, please log in again", 401);
    }

    // Rotate refresh token
    await revokeRefreshToken(result.tokenHash);

    const user = await User.findById(result.userId).select("-password");
    if (!user || user.deletedAt) {
      clearSessionCookies(res);
      return fail(res, "User not found or deactivated", 401);
    }

    await setSessionCookies(res, user, "user");

    return res.status(200).json({
      _status: true,
      _message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    clearSessionCookies(res);
    return fail(res, "Session expired, please log in again", 401);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  if (!req.user) return fail(res, "Unauthorized", 401);
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return fail(res, "User not found", 404);
    return success(res, user, "User profile Found");
  } catch (error) {
    return fail(res, "Internal Server Error", 500);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  if (!req.user) return fail(res, "Unauthorized", 401);
  try {
    const user = await User.findById(req.user._id);
    if (!user) return fail(res, "User not found", 404);

    const { oldPassword, newPassword } = req.body as {
      oldPassword?: string;
      newPassword?: string;
    };
    if (!oldPassword || !newPassword) {
      return fail(res, "Old and new password are required", 400);
    }

    // Enforce minimum password strength
    if (newPassword.length < 6) {
      return fail(res, "New password must be at least 6 characters long", 400);
    }

    const isMatch = await comparePassword(oldPassword, user.password);
    if (!isMatch) return fail(res, "Incorrect password", 401);

    user.password = await hashPassword(newPassword);
    await user.save();

    // Revoke all existing refresh tokens so other sessions are forced to re-login
    await revokeAllUserRefreshTokens(String(user._id));

    return success(res, null, "Password changed successfully");
  } catch (error) {
    console.error(error);
    return fail(res, "Internal Server Error", 500);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  if (!req.user) return fail(res, "Unauthorized", 401);
  try {
    const user = await User.findById(req.user._id);
    if (!user) return fail(res, "User not found", 404);

    let avatarUrl: string | null = user.avatar ?? null;
    if (req.file) {
      try {
        const result = await uploadToR2(req.file, "avatars");
        avatarUrl = result.url;
      } catch (uploadError) {
        console.error("Avatar upload error:", uploadError);
        return fail(res, "Failed to upload avatar", 500);
      }
    }

    const body = req.body as Record<string, string | undefined>;

    if (body.name) user.name = body.name;
    if (body.address) {
      try {
        user.address = JSON.parse(body.address);
      } catch {
        // ignore parse errors silently — falls through to individual fields
      }
    }
    if (body.mobile) user.mobile = Number(body.mobile as string);
    if (body.gender) user.gender = body.gender as "male" | "female" | "other";

    if (body.pincode || body.street || body.city || body.state || body.area || body.instructions) {
      if (!user.address) user.address = { state: "", city: "", street: "", area: "", instructions: "" };
      if (body.pincode) user.address.pincode = Number(body.pincode as string);
      if (body.street) (user.address as Record<string, unknown>).street = body.street;
      if (body.city) (user.address as Record<string, unknown>).city = body.city;
      if (body.state) (user.address as Record<string, unknown>).state = body.state;
      if (body.area) (user.address as Record<string, unknown>).area = body.area;
      if (body.instructions) (user.address as Record<string, unknown>).instructions = body.instructions;
    }

    user.avatar = avatarUrl;
    await user.save();

    return success(res, user, "User profile updated successfully");
  } catch (error) {
    console.error(error);
    return fail(res, "Internal Server Error", 500);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  if (!req.body || !req.body.email) {
    return fail(res, "Email is required", 400);
  }

  try {
    const { email } = req.body as { email?: string };
    const user = await User.findOne({ email });
    if (!user) {
      return success(
        res,
        null,
        "We have sent you an OTP to your email. Please check your email to reset your password.",
      );
    }

    const otp = generateOtp();
    const token = generatePasswordResetToken(email!, otp);

    try {
      await sendEmail(email!, "passwordReset", {
        otp,
        subject: "Your Password Reset OTP",
        name: user.name || "User",
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      return fail(res, "Failed to send OTP. Please try again later.", 500);
    }

    return res.status(200).json({
      _status: true,
      _message: "OTP sent to your email",
      _token: token,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return fail(res, "Internal Server Error", 500);
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  if (!req.body || !req.body.otp || !req.body.token) {
    return fail(res, "OTP and token are required", 400);
  }

  try {
    const { otp, token } = req.body as { otp?: string; token?: string };
    const decoded = verifyPasswordResetToken(token!);
    if (!decoded || decoded.type !== "password_reset") {
      return fail(res, "Invalid or expired attempt", 400);
    }
    if (decoded.otpHash !== hashOtp(otp!)) {
      return fail(res, "Invalid OTP", 400);
    }

    const newToken = generatePasswordResetToken(decoded.email, otp!);
    return res.status(200).json({
      _status: true,
      _message: "OTP verified successfully",
      _token: newToken,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return fail(res, "Internal Server Error", 500);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  if (!req.user) return fail(res, "Not authorized", 401);
  const userEmail = req.user.email;
  try {
    const { newPassword } = req.body as { newPassword?: string };
    if (!newPassword) return fail(res, "newPassword is required", 400);
    if (newPassword.length < 6) return fail(res, "Password must be at least 6 characters", 400);

    const userData = await User.findOne({ email: userEmail });
    if (!userData) return fail(res, "Account Not Found", 404);

    userData.password = await hashPassword(newPassword);
    await userData.save();

    // Revoke all sessions on password reset
    await revokeAllUserRefreshTokens(String(userData._id));
    clearSessionCookies(res);

    return success(res, null, "Password reset successfully");
  } catch (error) {
    console.error("Reset password error:", error);
    return fail(res, "Internal Server Error", 500);
  }
};

export const verifyUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  if (!req.user) return fail(res, "Unauthorized", 401);

  try {
    const user = req.user;
    if (user.isEmailVerified) {
      return fail(res, "Your account is already verified", 200);
    }

    const email = user.email;
    const otp = generateOtp();

    const verificationToken = jwt.sign(
      {
        email,
        otp,
        type: "email_verification",
        userId: user._id,
      },
      env.JWT_SECRET,
      { expiresIn: "10m" } as SignOptions,
    );

    try {
      await sendEmail(email, "verifyEmail", {
        otp,
        subject: "Verify Your Email",
        name: user.name || "User",
        verificationLink: `${env.FRONTEND_URL}/verify-email?token=${verificationToken}&otp=${otp}`,
      });
      return res.status(200).json({
        _status: true,
        _message: "Verification email sent successfully",
        _token: verificationToken,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return fail(res, "Failed to send verification email. Please try again later.", 500);
    }
  } catch (error) {
    console.error("Verify user error:", error);
    return fail(res, "Internal Server Error", 500);
  }
};

export const completeVerify = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const { token, otp } = req.body as { token?: string; otp?: string };
  if (!token || !otp) {
    return fail(res, "Token and OTP are required", 400);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      type?: string;
      otp?: string;
      userId?: string;
    };

    if (decoded.type !== "email_verification") {
      return fail(res, "Invalid verification token", 400);
    }
    if (decoded.otp !== otp) {
      return fail(res, "Invalid OTP", 400);
    }

    const user = await User.findById(decoded.userId);
    if (!user) return fail(res, "User not found", 404);

    user.isEmailVerified = true;
    await user.save();
    return success(res, null, "Email verified successfully");
  } catch (error) {
    console.error("Complete verify error:", error);
    if (error instanceof Error && error.name === "TokenExpiredError") {
      return fail(res, "Verification link has expired. Please request a new one.", 400);
    }
    return fail(res, "Internal Server Error", 500);
  }
};

export const googleAuthInit = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  const state = randomBytes(32).toString("hex");
  oauthStates.set(state, Date.now());

  if (!env.GOOGLE_CLIENT_ID) {
    return fail(res, "Google authentication is not configured", 500);
  }

  const redirectUri = `${env.FRONTEND_URL}/auth/google/callback`;
  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(env.GOOGLE_CLIENT_ID)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent("email profile")}&` +
    `access_type=offline&` +
    `state=${encodeURIComponent(state)}&` +
    `prompt=select_account`;

  return res.status(200).json({ _status: true, _state: state, _url: googleAuthUrl });
};

const buildGooglePayload = (
  payload: { email?: string; name?: string; picture?: string; sub?: string },
) => {
  const { email, name, picture: avatar, sub: googleId } = payload;
  if (!email || !googleId) return null;
  return { email, name, avatar, googleId };
};

export const googleLogin = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { credential } = req.body as { credential?: string };
    if (!credential) {
      return fail(res, "Google credential is required", 400);
    }

    const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload() ?? {};
    const parsed = buildGooglePayload(payload);
    if (!parsed) return fail(res, "Email not found in Google account", 400);

    let user = await User.findOne({
      $or: [{ email: parsed.email }, { googleId: parsed.googleId }],
    });

    if (!user) {
      user = await User.create({
        name: parsed.name,
        email: parsed.email,
        password: await hashPassword(Math.random().toString(36).slice(-8)),
        avatar: parsed.avatar,
        googleId: parsed.googleId,
        isEmailVerified: true,
        status: true,
      });
    } else if (!user.status) {
      return fail(res, "Your account has been deactivated. Please contact support.", 403);
    } else if (!user.googleId) {
      user.googleId = parsed.googleId;
      user.isEmailVerified = true;
      if (!user.avatar) user.avatar = parsed.avatar;
      await user.save();
    }

    const userObj = user.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = userObj;

    const accessToken = await setSessionCookies(res, user, "user");

    return res.status(200).json({
      _status: true,
      _message: "Login successful",
      _data: { user: userData },
      _token: accessToken,
    });
  } catch (error) {
    console.error("Google login error:", error);
    return fail(res, "Error during Google authentication", 500);
  }
};

export const googleAuthCallback = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { code, state } = req.body as { code?: string; mobile?: string; state?: string };
    if (!code) {
      return fail(res, "Authorization code is required", 400);
    }
    if (!state || !oauthStates.has(state)) {
      return fail(res, "Invalid OAuth state. Possible CSRF attack.", 400);
    }
    oauthStates.delete(state);

    const client = new OAuth2Client(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      `${env.FRONTEND_URL}/auth/google/callback`,
    );

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token ?? "",
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload() ?? {};
    const parsed = buildGooglePayload(payload);
    if (!parsed) return fail(res, "Email not found in Google account", 400);

    let user = await User.findOne({
      $or: [{ email: parsed.email }, { googleId: parsed.googleId }],
    });

    if (!user) {
      user = await User.create({
        name: parsed.name,
        email: parsed.email,
        password: await hashPassword(Math.random().toString(36).slice(-8)),
        avatar: parsed.avatar,
        googleId: parsed.googleId,
        isEmailVerified: true,
        status: true,
      });
    } else if (!user.status) {
      return fail(res, "Your account has been deactivated. Please contact support.", 403);
    } else if (!user.googleId) {
      user.googleId = parsed.googleId;
      user.isEmailVerified = true;
      if (!user.avatar) user.avatar = parsed.avatar;
      await user.save();
    }

    const userObj = user.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = userObj;

    const accessToken = await setSessionCookies(res, user, "user");

    return res.status(200).json({
      _status: true,
      _message: "Login successful",
      _data: { user: userData },
      _token: accessToken,
    });
  } catch (error) {
    console.error("Google auth callback error:", error);
    return fail(res, "Error during Google authentication", 500);
  }
};

export const reLogin = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (!req.user) return fail(res, "Unauthorized", 401);

    await setSessionCookies(res, req.user, "user");

    return res.status(200).json({
      _status: true,
      _message: "Login successful",
    });
  } catch (error) {
    console.error("Re-login error:", error);
    return fail(res, "Error during re-login", 500);
  }
};

export const logoutUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  // Revoke refresh token if present
  const refreshValue = req.cookies?.userRefreshToken;
  if (refreshValue) {
    try {
      const { hashToken } = await import("../../lib/tokens.js");
      const tokenHash = hashToken(refreshValue);
      await revokeRefreshToken(tokenHash);
    } catch {
      // Ignore revocation errors — clear cookies anyway
    }
  }

  clearSessionCookies(res);

  return res.status(200).json({
    _status: true,
    _message: "Logged out successfully",
  });
};
