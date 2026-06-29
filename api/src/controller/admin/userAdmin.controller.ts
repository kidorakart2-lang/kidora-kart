import type { Request, Response } from "express";
import { generateToken } from "../../lib/jwt.js";
import userModel from "../../models/user.js";
import { logger } from "../../lib/logger.js";
import Cart from "../../models/cart.js";
import Order from "../../models/order.js";
import Wishlist from "../../models/wishlist.js";
import Reviews from "../../models/review.js";
import auditLogModel from "../../models/auditLog.js";
import { comparePassword, hashPassword } from "../../lib/bcrypt.js";
import {
  createRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
} from "../../lib/tokens.js";

/** Helper: set admin/delivery session cookies */
async function setSessionCookies(
  res: Response,
  user: { _id: unknown },
  type: "admin" | "delivery",
): Promise<void> {
  const accessToken = generateToken(user);
  const refresh = await createRefreshToken(String(user._id), type);

  const accessName = type === "admin" ? "adminToken" : "deliveryToken";
  const refreshName = type === "admin" ? "adminRefreshToken" : "deliveryRefreshToken";

  res.cookie(accessName, accessToken, accessTokenCookieOptions());
  res.cookie(refreshName, refresh.tokenValue, refreshTokenCookieOptions(refresh.expiresAt));
}

function clearSessionCookiesAdmin(res: Response): void {
  res.cookie("adminToken", "", clearAccessTokenCookie());
  res.cookie("adminRefreshToken", "", clearRefreshTokenCookie());
  res.cookie("deliveryToken", "", clearAccessTokenCookie());
  res.cookie("deliveryRefreshToken", "", clearRefreshTokenCookie());
}

export const login = async (req: Request, res: Response): Promise<void> => {
  if (!req.body) {
    res.status(400).json({ _status: false, _message: "No data provided" });
    return;
  }
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ _status: false, _message: "All fields are required" });
      return;
    }
    const user = await userModel.findOne({ email, role: "admin" });
    if (!user) {
      res.status(401).json({ _status: false, _message: "Invalid credentials" });
      return;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      res.status(401).json({ _status: false, _message: "Invalid credentials" });
      return;
    }

    await setSessionCookies(res, user, "admin");

    res.status(200).json({
      _status: true,
      _message: "Admin logged in successfully",
    });
  } catch (error) {
    logger.error({ err: error }, "Admin login error");
    res.status(500).json({ _status: false, _message: "Internal Server Error" });
  }
};

export const refreshAdminToken = async (req: Request, res: Response): Promise<void> => {
  const refreshValue = req.cookies?.adminRefreshToken;
  if (!refreshValue) {
    res.status(401).json({ _status: false, _message: "No refresh token" });
    return;
  }

  try {
    const result = await verifyRefreshToken(refreshValue, "admin");
    if (!result) {
      clearSessionCookiesAdmin(res);
      res.status(401).json({ _status: false, _message: "Session expired, please log in again" });
      return;
    }

    await revokeRefreshToken(result.tokenHash);

    const user = await userModel.findById(result.userId).select("-password");
    if (!user || user.deletedAt) {
      clearSessionCookiesAdmin(res);
      res.status(401).json({ _status: false, _message: "User not found or deactivated" });
      return;
    }

    await setSessionCookies(res, user, "admin");

    res.status(200).json({ _status: true, _message: "Token refreshed successfully" });
  } catch (error) {
    logger.error({ err: error }, "Admin refresh error");
    clearSessionCookiesAdmin(res);
    res.status(401).json({ _status: false, _message: "Session expired" });
  }
};

export const refreshDeliveryToken = async (req: Request, res: Response): Promise<void> => {
  const refreshValue = req.cookies?.deliveryRefreshToken;
  if (!refreshValue) {
    res.status(401).json({ _status: false, _message: "No refresh token" });
    return;
  }

  try {
    const result = await verifyRefreshToken(refreshValue, "delivery");
    if (!result) {
      clearSessionCookiesAdmin(res);
      res.status(401).json({ _status: false, _message: "Session expired, please log in again" });
      return;
    }

    await revokeRefreshToken(result.tokenHash);

    const user = await userModel.findById(result.userId).select("-password");
    if (!user || user.deletedAt) {
      clearSessionCookiesAdmin(res);
      res.status(401).json({ _status: false, _message: "User not found or deactivated" });
      return;
    }

    await setSessionCookies(res, user, "delivery");

    res.status(200).json({ _status: true, _message: "Token refreshed successfully" });
  } catch (error) {
    logger.error({ err: error }, "Delivery refresh error");
    clearSessionCookiesAdmin(res);
    res.status(401).json({ _status: false, _message: "Session expired" });
  }
};

export const findAllUser = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const users = await userModel.find({ deletedAt: null }).lean();
    res.status(200).json({
      _status: true,
      _message: "Users found successfully",
      _data: users,
    });
  } catch (error) {
    logger.error({ err: error }, "findAllUser error");
    res.status(500).json({ _status: false, _message: "Internal Server Error" });
  }
};

export const getFullDetails = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = await userModel.findById(req.params.id);
    const cart = await Cart.find({ user: req.params.id })
      .populate("items.product", "name images image discount_price price slug")
      .populate("items.color");
    const orders = await Order.find({ userId: req.params.id })
      .populate("items.productId", "name images slug")
      .select("-payment.razorpay.signature");
    const wishlist = await Wishlist.find({ user: req.params.id }).populate(
      "products",
      "name price discount_price images slug stock",
    );
    const reviews = await Reviews.find({ userId: req.params.id }).populate(
      "productId",
      "name images slug",
    );
    res.status(200).json({
      _status: true,
      _message: "User details found",
      _user: user,
      _cart: cart,
      _orders: orders,
      _wishlist: wishlist,
      _reviews: reviews,
    });
  } catch (error) {
    logger.error({ err: error }, "getFullDetails error");
    res.status(500).json({ _status: false, _message: "Internal Server Error" });
  }
};

export const logout = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  clearSessionCookiesAdmin(res);
  res.status(200).json({
    _status: true,
    _message: "Admin logged out successfully",
  });
};

export const delieveryLogin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ _status: false, _message: "All fields are required" });
      return;
    }
    const user = await userModel.findOne({ email, role: "delivery" });
    if (!user) {
      res.status(401).json({ _status: false, _message: "Invalid credentials" });
      return;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      res.status(401).json({ _status: false, _message: "Invalid credentials" });
      return;
    }

    await setSessionCookies(res, user, "delivery");

    res.status(200).json({
      _status: true,
      _message: "Delivery logged in successfully",
    });
  } catch (error) {
    logger.error({ err: error }, "Delivery login error");
    res.status(500).json({ _status: false, _message: "Internal Server Error" });
  }
};

export const changeRole = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body as { role?: string };
    const requestingUser = req.user;

    if (!requestingUser) {
      res.status(401).json({ _status: false, _message: "Not authorized" });
      return;
    }

    if (String(requestingUser._id) === id && role !== "admin") {
      res.status(403).json({ _status: false, _message: "Cannot change your own role" });
      return;
    }

    const user = await userModel.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true },
    );

    if (!user) {
      res.status(404).json({ _status: false, _message: "User not found" });
      return;
    }

    logger.info(
      { action: "role_change", admin: requestingUser.email, target: user.email, newRole: role },
      "Admin changed user role",
    );

    await auditLogModel.create({
      action: "role_change",
      adminId: requestingUser._id,
      adminEmail: requestingUser.email,
      targetId: user._id,
      targetEmail: user.email,
      details: { roleBefore: user.role, roleAfter: role },
      ip: req.ip,
    });

    res.status(200).json({
      _status: true,
      _message: "User role updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error in changeRole");
    res.status(500).json({ _status: false, _message: "Error updating user role" });
  }
};

export const verifyPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { password } = req.body as { password?: string };
    const requestingUser = req.user;

    if (!requestingUser) {
      res.status(401).json({ _status: false, _message: "Not authorized" });
      return;
    }

    if (!password) {
      res.status(400).json({ _status: false, _message: "Password is required" });
      return;
    }

    const user = await userModel.findById(requestingUser._id).select("password");
    if (!user) {
      res.status(404).json({ _status: false, _message: "User not found" });
      return;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      res.status(403).json({ _status: false, _message: "Incorrect password" });
      return;
    }

    await auditLogModel.create({
      action: "login",
      adminId: requestingUser._id,
      adminEmail: requestingUser.email,
      details: { purpose: "role_change_verification" },
      ip: req.ip,
    });

    res.status(200).json({
      _status: true,
      _message: "Password verified successfully",
    });
  } catch (error) {
    logger.error({ err: error }, "Error in verifyPassword");
    res.status(500).json({ _status: false, _message: "Error verifying password" });
  }
};

export const createUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
    };

    if (!name || !email || !password) {
      res.status(400).json({ _status: false, _message: "Name, email, and password are required" });
      return;
    }

    const existing = await userModel.findOne({ email });
    if (existing) {
      res.status(409).json({ _status: false, _message: "A user with this email already exists" });
      return;
    }

    const hashed = await hashPassword(password);
    const user = await userModel.create({
      name,
      email,
      password: hashed,
      role: role || "user",
    });

    res.status(201).json({
      _status: true,
      _message: "User created successfully",
      _data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Error in createUser");
    res.status(500).json({ _status: false, _message: "Error creating user" });
  }
};

export const userDelete = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.params.id;
    const user = await userModel.findById(userId);

    if (!user) {
      res.status(404).json({ _status: false, _message: "User not found" });
      return;
    }

    // Clean up refresh tokens for deleted user
    if (typeof userId === "string") {
      const { revokeAllUserRefreshTokens } = await import("../../lib/tokens.js");
      await revokeAllUserRefreshTokens(userId);
    }

    await userModel.findByIdAndDelete(userId);

    const requestingUser = req.user;
    if (requestingUser) {
      await auditLogModel.create({
        action: "user_delete",
        adminId: requestingUser._id,
        adminEmail: requestingUser.email,
        targetId: user._id,
        targetEmail: user.email,
        details: { role: user.role },
        ip: req.ip,
      });
    }

    res.status(200).json({ _status: true, _message: "User permanently deleted successfully" });
  } catch (error) {
    logger.error({ err: error }, "Error in userDelete");
    res.status(500).json({ _status: false, _message: "Error deleting user" });
  }
};
