import rateLimit from "express-rate-limit";
import type { RequestHandler } from "express";

interface RateLimiters {
  register: RequestHandler;
  login: RequestHandler;
  updateProfile: RequestHandler;
  passwordReset: RequestHandler;
  sendDeliveryOTP: RequestHandler;
  verifyDeliveryOTP: RequestHandler;
  sendEmailOTP: RequestHandler;
  verifyEmail: RequestHandler;
  refreshToken: RequestHandler;
  orderCreate: RequestHandler;
  orderVerify: RequestHandler;
  orderCOD: RequestHandler;
  cancelOrder: RequestHandler;
  webhook: RequestHandler;
}

const rateLimiters: RateLimiters = {
  register: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: "Too many tries to Register, please try again later",
  }),

  login: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: "Too many tries to Login, please try again later",
  }),

  updateProfile: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many tries to Update Profile, please try again later",
  }),

  passwordReset: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 25,
    message: "Too many tries to Reset Password, please try again later",
  }),

  sendDeliveryOTP: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 15,
    message: "Too many tries to Send Delivery OTP, please try again later",
  }),

  verifyDeliveryOTP: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: "Too many OTP verification attempts, please try again later",
  }),

  sendEmailOTP: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many OTP requests, please try again later",
  }),

  verifyEmail: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many verification attempts, please try again later",
  }),

  refreshToken: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many refresh attempts, please try again later",
  }),

  orderCreate: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many order creation attempts, please try again later",
  }),

  orderVerify: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many payment verification attempts, please try again later",
  }),

  orderCOD: rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: "Too many COD order attempts, please try again later",
  }),

  cancelOrder: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many cancel attempts, please try again later",
  }),

  webhook: rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: "Too many webhook requests, please try again later",
  }),
};

export default rateLimiters;