import type { Request, Response } from "express";
import { generateToken } from "../../lib/jwt.js";
import userModel from "../../models/user.js";
import Cart from "../../models/cart.js";
import Order from "../../models/order.js";
import Wishlist from "../../models/wishlist.js";
import Reviews from "../../models/review.js";
import { comparePassword } from "../../lib/bcrypt.js";
import { env } from "../../config/env.js";

export const login = async (req: Request, res: Response): Promise<void> => {
  if (!req.body) {
    res.status(400).json({ _status: false, _message: "No data provided" });
    return;
  }
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({
        _status: false,
        _message: "All fields are required",
      });
      return;
    }
    const user = await userModel.findOne({ email, role: "admin" });
    if (!user) {
      res.status(404).json({
        _status: false,
        _message: "Admin not found",
      });
      return;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      res.status(200).json({
        _status: false,
        _message: "Password Doesnt Match ",
      });
      return;
    }
    const token = generateToken(user.toObject());
    res.cookie("adminToken", token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      _status: true,
      _message: "Admin logged in successfully",
      _token: token,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...((env as { NODE_ENV?: string }).NODE_ENV === "development" && {
        _error: error instanceof Error ? error.message : "Unknown error",
      }),
    });
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
    res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...((env as { NODE_ENV?: string }).NODE_ENV === "development" && {
        _error: error instanceof Error ? error.message : "Unknown error",
      }),
    });
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
      _message: "User found successfully",
      _user: user,
      _cart: cart,
      _orders: orders,
      _wishlist: wishlist,
      _reviews: reviews,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      _error: message,
    });
  }
};

export const delieveryLogin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({
        _status: false,
        _message: "All fields are required",
      });
      return;
    }
    const user = await userModel.findOne({ email, role: "delivery" });
    if (!user) {
      res.status(404).json({
        _status: false,
        _message: "Delivery Account not found",
      });
      return;
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      res.status(200).json({
        _status: false,
        _message: "Password Doesnt Match ",
      });
      return;
    }

    const token = generateToken(user.toObject());
    res.cookie("deliveryToken", token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      _status: true,
      _message: "Delivery logged in successfully",
      _token: token,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      ...((env as { NODE_ENV?: string }).NODE_ENV === "development" && {
        _error: error instanceof Error ? error.message : "Unknown error",
      }),
    });
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
      res.status(401).json({
        _status: false,
        _message: "Not authorized",
      });
      return;
    }

    // Prevent self-demotion
    if (String(requestingUser._id) === id && role !== "admin") {
      res.status(403).json({
        _status: false,
        _message: "Cannot change your own role",
      });
      return;
    }

    const user = await userModel.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true },
    );

    if (!user) {
      res.status(404).json({
        _status: false,
        _message: "User not found",
      });
      return;
    }

    console.log(
      `[AUDIT] Admin ${requestingUser.email} changed user ${user.email} role to ${role}`,
    );

    res.status(200).json({
      _status: true,
      _message: "User role updated to delivery successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error in changeRole:", error);
    res.status(500).json({
      _status: false,
      _message: "Error updating user role",
      error: error instanceof Error ? error.message : "Unknown error",
    });
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
      res.status(404).json({
        _status: false,
        _message: "User not found",
      });
      return;
    }

    await userModel.findByIdAndDelete(userId);
    res.status(200).json({
      _status: true,
      _message: "User permanently deleted successfully",
    });
  } catch (error) {
    console.error("Error in userDeletePermanent:", error);
    res.status(500).json({
      _status: false,
      _message: "Error deleting user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};