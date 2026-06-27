import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import User from "../models/user.js";
import { env } from "../config/env.js";
import type { JwtPayload } from "../types/jwt.js";

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
    console.error(error);
    res.status(401).json({
      _status: false,
      _message: "Not authorized, token Expired",
      _error: error instanceof Error ? error.message : error,
    });
  }
};

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

  // Fallback: check httpOnly cookie
  token = req.cookies?.adminToken || req.cookies?.deliveryToken;
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
