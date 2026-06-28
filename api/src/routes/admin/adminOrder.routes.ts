import { Router } from "express";
import {
  getRefundedOrdersForAdmin,
  verifyRefundStatus,
  updateRefundStatus,
  syncRefundStatusesFromRazorpay,
  bulkUpdateRefundStatus,
  delieverOrder,
  verifyPendingPayments,
  confirmPendingPayment,
} from "../../controller/admin/adminOrder.controller.js";
import {
  getAllOrders,
  markToShipped,
  cancelOrderByAdmin,
} from "../../controller/web/order.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";

const router = Router();

router.post("/all", protect, adminOnly, getAllOrders);
router.post("/mark-to-shipped", protect, adminOnly, uploadNone, markToShipped);
router.post("/cancel-by-admin", protect, adminOnly, uploadNone, cancelOrderByAdmin);

// Get all refunded orders (admin only)
router.get("/admin/refunded", protect, adminOnly, getRefundedOrdersForAdmin);

// Verify refund status from Razorpay
router.get("/admin/refund/verify/:orderId", protect, adminOnly, verifyRefundStatus);

// Update single order refund status (with Razorpay verification)
router.patch("/admin/refund/:orderId", protect, adminOnly, updateRefundStatus);

// Sync all refund statuses from Razorpay
router.post("/admin/refund/sync", protect, adminOnly, syncRefundStatusesFromRazorpay);

// Bulk update refund status
router.post("/admin/refund/bulk", protect, adminOnly, bulkUpdateRefundStatus);

router.post("/deliever/order", protect, adminOnly, delieverOrder);

// verify pending payments
router.post("/verify-pending-payments", protect, adminOnly, verifyPendingPayments);

// confirm pending payment
router.post("/confirm-pending-payment", protect, adminOnly, confirmPendingPayment);

export default router;
