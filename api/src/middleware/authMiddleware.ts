import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import User from "../models/user.js";
import { env } from "../config/env.js";
import type { JwtPayload } from "../types/jwt.js";
import { generateToken } from "../lib/jwt.js";
import {
  createRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  clearRefreshTokenCookie,
} from "../lib/tokens.js";

const extractAndVerifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
  token: string,
): Promise<void> => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as unknown as JwtPayload;
    const user = await User.findById(decoded._id).select("-password");
    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    // JWT expired — try to refresh using the refresh token cookie
    if (
      error instanceof Error &&
      (error.name === "TokenExpiredError" || (error as jwt.JsonWebTokenError).name === "TokenExpiredError")
    ) {
      try {
        await attemptAutoRefresh(req, res, next);
        return;
      } catch {
        // fall through to 401
      }
    }

    res.status(401).json({
      _status: false,
      _message: "Not authorized, token expired",
    });
  }
};

/**
 * Attempt to auto-refresh the access token using the refresh token cookie.
 * If successful, sets new httpOnly cookies and proceeds with the request.
 */
async function attemptAutoRefresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Determine which cookie types to check based on which tokens are present
  const userRefresh = req.cookies?.userRefreshToken;
  const adminRefresh = req.cookies?.adminRefreshToken;
  const deliveryRefresh = req.cookies?.deliveryRefreshToken;

  let refreshValue: string | undefined;
  let tokenType: "user" | "admin" | "delivery" | undefined;

  if (userRefresh) {
    refreshValue = userRefresh;
    tokenType = "user";
  } else if (adminRefresh) {
    refreshValue = adminRefresh;
    tokenType = "admin";
  } else if (deliveryRefresh) {
    refreshValue = deliveryRefresh;
    tokenType = "delivery";
  }

  if (!refreshValue || !tokenType) {
    res.status(401).json({
      _status: false,
      _message: "Not authorized, no valid session",
    });
    return;
  }

  const result = await verifyRefreshToken(refreshValue, tokenType);
  if (!result) {
    // Refresh token invalid or expired — clear cookies
    res.cookie(
      tokenType === "user" ? "userRefreshToken" : tokenType === "admin" ? "adminRefreshToken" : "deliveryRefreshToken",
      "",
      clearRefreshTokenCookie(),
    );
    res.status(401).json({
      _status: false,
      _message: "Session expired, please log in again",
    });
    return;
  }

  // Revoke old refresh token (rotation)
  await revokeRefreshToken(result.tokenHash);

  // Fetch user from DB (don't trust the JWT payload for anything except _id)
  const user = await User.findById(result.userId).select("-password");
  if (!user || user.deletedAt) {
    res.status(401).json({
      _status: false,
      _message: "User not found or deactivated",
    });
    return;
  }

  // Issue new access + refresh tokens
  const newAccessToken = generateToken(user.toObject());
  const newRefresh = await createRefreshToken(
    String(user._id),
    tokenType,
  );

  const accessCookieName =
    tokenType === "user" ? "userToken"
    : tokenType === "admin" ? "adminToken"
    : "deliveryToken";

  const refreshCookieName =
    tokenType === "user" ? "userRefreshToken"
    : tokenType === "admin" ? "adminRefreshToken"
    : "deliveryRefreshToken";

  res.cookie(accessCookieName, newAccessToken, accessTokenCookieOptions());
  res.cookie(refreshCookieName, newRefresh.tokenValue, refreshTokenCookieOptions(newRefresh.expiresAt));

  req.user = user;
  next();
}

const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({
        _status: false,
        _message: "Not authorized, no token",
      });
      return;
    }
    await extractAndVerifyToken(req, res, next, token);
    return;
  }

  // Fallback: check httpOnly cookies
  token = req.cookies?.adminToken || req.cookies?.deliveryToken || req.cookies?.userToken;
  if (token) {
    await extractAndVerifyToken(req, res, next, token);
    return;
  }

  res.status(401).json({
    _status: false,
    _message: "Not authorized, no token",
  });
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        _status: false,
        _message: "Not authorized, no user",
      });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({
        _status: false,
        _message: "Forbidden: insufficient permissions",
      });
      return;
    }
    next();
  };
};

export const adminOnly = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;
  if (!user) {
    res.status(401).json({
      _status: false,
      _message: "Not authorized, no user",
    });
    return;
  }
  if (user.role !== "admin") {
    res.status(403).json({
      _status: false,
      _message: "Forbidden: admin access required",
    });
    return;
  }
  next();
};

export default protect;
