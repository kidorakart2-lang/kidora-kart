import { Router, raw } from "express";
import {
  createOrder,
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  getUserOrders,
  getOrderById,
  cancelOrder,
  verifyDeliveryOTP,
  markToShipped,
  getAllOrders,
  getOrder,
  sendDeliveryOTP,
  confirmCODOrder,
  cancelOrderByAdmin,
} from "../../controller/web/order.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";
import rateLimit from "../../middleware/rateLimit.js";

const router = Router();

// Create order (from cart or direct purchase)
router.post("/create", protect, createOrder);

// Create Razorpay order
router.post("/create-razorpay-order", protect, createRazorpayOrder);

// Verify payment
router.post("/verify-payment", protect, verifyPayment);

// Get all user orders (with pagination and filters)
router.get("/my-orders", protect, uploadNone, getUserOrders);

// Get single order details
router.get("/:orderId", protect, uploadNone, getOrderById);

// Get single order details
router.post("/delivery/:orderId", protect, uploadNone, getOrder);

// Cancel order
router.put("/:orderId/cancel", protect, uploadNone, cancelOrder);

// Razorpay webhook
router.post(
  "/webhooks/razorpay",
  raw({ type: "application/json" }),
  handleWebhook,
);

// Verify delivery OTP (can be used by delivery person)
router.post("/verify-delivery-otp", protect, uploadNone, rateLimit.verifyDeliveryOTP, verifyDeliveryOTP);

router.post("/mark-to-shipped", protect, adminOnly, uploadNone, markToShipped);
router.post(
  "/send-delivery-otp",
  protect,
  rateLimit.sendDeliveryOTP,
  uploadNone,
  sendDeliveryOTP,
);

router.post("/buy-with-cod", protect, uploadNone, confirmCODOrder);

router.post("/cancel-by-admin", protect, adminOnly, uploadNone, cancelOrderByAdmin);

router.post("/all", protect, adminOnly, uploadNone, getAllOrders);

export default router;
