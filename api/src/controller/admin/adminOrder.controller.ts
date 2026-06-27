import type { Request, Response } from "express";
import Order from "../../models/order.js";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import { env } from "../../config/env.js";
import { sendEmail } from "../../lib/nodemailer.js";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

interface RazorpayRefundStatus {
  status?: string;
  amount?: number;
  id?: string;
  created_at?: number;
  speed?: string;
  error: string | null;
}

const fetchRazorpayRefundStatus = async (
  paymentId: string | undefined,
  refundId: string | undefined,
): Promise<RazorpayRefundStatus> => {
  try {
    if (!paymentId) {
      return { error: "Payment ID not found" };
    }

    if (refundId) {
      const refund = await razorpay.refunds.fetch(refundId);
      return {
        status: refund.status,
        amount: (refund.amount ?? 0) / 100,
        id: refund.id,
        created_at: refund.created_at,
        error: null,
      };
    }

    const refunds = await razorpay.refunds.all({ payment_id: paymentId } as Record<string, string>);

    const refundsItems = (refunds as unknown as { items?: Array<{ status: string; amount: number; id: string; created_at: number }> }).items;
    if (refundsItems && refundsItems.length > 0) {
      const latestRefund = refundsItems[0]!;
      return {
        status: latestRefund.status,
        amount: latestRefund.amount / 100,
        id: latestRefund.id,
        created_at: latestRefund.created_at,
        error: null,
      };
    }

    return { error: "No refunds found for this payment" };
  } catch (error) {
    console.error("Razorpay refund fetch error:", error);
    const rzpErr = error as { error?: { description?: string } };
    return {
      error:
        rzpErr?.error?.description ||
        (error instanceof Error ? error.message : undefined) ||
        "Failed to fetch from Razorpay",
    };
  }
};

const mapRazorpayStatus = (status: string | undefined): string => {
  if (status === "processed") return "completed";
  if (status === "failed") return "failed";
  if (status === "pending") return "initiated";
  return "pending";
};

export const getRefundedOrdersForAdmin = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const refundedOrders = await Order.find({
      $or: [
        { status: "refunded" },
        { status: "cancelled", "cancellation.refundStatus": { $exists: true } },
        { "payment.status": "refunded" },
        { "payment.status": "partially_refunded" },
      ],
    })
      .populate("userId", "name email phone")
      .sort({ "cancellation.refundedAt": -1, updatedAt: -1 })
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const categorizedOrders: Record<string, unknown[]> = {
      pending: [],
      initiated: [],
      completed: [],
      failed: [],
      mismatched: [],
    };

    refundedOrders.forEach((order) => {
      const o = order as { cancellation?: { refundStatus?: string; refundedAt?: Date }; status?: string };
      const refundStatus = o.cancellation?.refundStatus || "unknown";

      if (o.cancellation?.refundedAt && refundStatus !== "completed") {
        categorizedOrders.mismatched!.push({
          ...order,
          suggestedStatus: "completed",
          issue: "Refund processed but status not updated to completed",
        });
      } else if (refundStatus === "failed" && o.status === "refunded") {
        categorizedOrders.mismatched!.push({
          ...order,
          suggestedStatus: "cancelled",
          issue: "Refund failed but order marked as refunded",
        });
      } else if (categorizedOrders[refundStatus]) {
        categorizedOrders[refundStatus].push(order);
      }
    });

    res.status(200).json({
      success: true,
      message: "Refunded orders fetched successfully",
      data: {
        total: refundedOrders.length,
        categorized: categorizedOrders,
        summary: {
          pending: categorizedOrders.pending!.length,
          initiated: categorizedOrders.initiated!.length,
          completed: categorizedOrders.completed!.length,
          failed: categorizedOrders.failed!.length,
          mismatched: categorizedOrders.mismatched!.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching refunded orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch refunded orders",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const verifyRefundStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      $or: [{ orderId }, { _id: orderId }],
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    const paymentId = order.payment?.razorpay?.paymentId;
    const refundId = order.cancellation?.refundId;

    if (!paymentId) {
      res.status(400).json({
        success: false,
        message: "No payment ID found for this order",
      });
      return;
    }

    const razorpayStatus = await fetchRazorpayRefundStatus(paymentId ?? undefined, refundId ?? undefined);

    if (razorpayStatus.error) {
      res.status(400).json({
        success: false,
        message: "Failed to fetch refund status from Razorpay",
        error: razorpayStatus.error,
        data: {
          orderId: order.orderId,
          currentStatus: order.cancellation?.refundStatus,
          paymentId,
          refundId,
        },
      });
      return;
    }

    const mappedStatus = mapRazorpayStatus(razorpayStatus.status);
    const currentDbStatus = order.cancellation?.refundStatus;
    const isMatched = currentDbStatus === mappedStatus;

    res.status(200).json({
      success: true,
      message: "Refund status verified from Razorpay",
      data: {
        orderId: order.orderId,
        razorpayStatus: {
          status: razorpayStatus.status,
          mappedStatus,
          amount: razorpayStatus.amount,
          refundId: razorpayStatus.id,
          createdAt: razorpayStatus.created_at,
          speed: razorpayStatus.speed,
        },
        databaseStatus: {
          refundStatus: currentDbStatus,
          orderStatus: order.status,
          paymentStatus: order.payment?.status,
        },
        isMatched,
        needsUpdate: !isMatched,
        suggestedAction: !isMatched
          ? `Update database status from "${currentDbStatus}" to "${mappedStatus}"`
          : "Status is already up to date",
      },
    });
  } catch (error) {
    console.error("Error verifying refund status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify refund status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateRefundStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const {
      refundStatus,
      refundAmount,
      refundId,
      refundError,
      notes,
      skipVerification = false,
    } = req.body as {
      refundStatus: string;
      refundAmount?: number;
      refundId?: string;
      refundError?: string;
      notes?: string;
      skipVerification?: boolean;
    };

    const validStatuses = ["pending", "initiated", "completed", "failed"];
    if (!validStatuses.includes(refundStatus)) {
      res.status(400).json({
        success: false,
        message:
          "Invalid refund status. Must be one of: pending, initiated, completed, failed",
      });
      return;
    }

    const order = await Order.findOne({
      $or: [{ orderId }, { _id: orderId }],
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    let resolvedRefundId = refundId;
    let resolvedRefundAmount = refundAmount;

    if (!skipVerification && order.payment?.razorpay?.paymentId) {
      const razorpayStatus = await fetchRazorpayRefundStatus(
        order.payment?.razorpay?.paymentId ?? undefined,
        order.cancellation?.refundId ?? undefined,
      );

      if (!razorpayStatus.error) {
        const razorpayMappedStatus = mapRazorpayStatus(razorpayStatus.status);

        if (refundStatus !== razorpayMappedStatus) {
          res.status(400).json({
            success: false,
            message: "Requested status doesn't match Razorpay records",
            data: {
              requestedStatus: refundStatus,
              razorpayStatus: razorpayStatus.status,
              mappedRazorpayStatus: razorpayMappedStatus,
              suggestion: `Razorpay shows status as "${razorpayStatus.status}". Please update to "${razorpayMappedStatus}" instead.`,
            },
          });
          return;
        }

        if (!resolvedRefundId && razorpayStatus.id) {
          resolvedRefundId = razorpayStatus.id;
        }
        if (!resolvedRefundAmount && razorpayStatus.amount) {
          resolvedRefundAmount = razorpayStatus.amount;
        }
      } else {
        console.warn("Razorpay verification failed:", razorpayStatus.error);
      }
    }

    const updateData: Record<string, unknown> = {
      "cancellation.refundStatus": refundStatus,
    };

    if (resolvedRefundAmount !== undefined) {
      updateData["cancellation.refundAmount"] = resolvedRefundAmount;
    }
    if (resolvedRefundId) {
      updateData["cancellation.refundId"] = resolvedRefundId;
    }
    if (refundError) {
      updateData["cancellation.refundError"] = refundError;
    }

    if (refundStatus === "completed" && !order.cancellation?.refundedAt) {
      updateData["cancellation.refundedAt"] = new Date();
      updateData["status"] = "refunded";
      updateData["payment.status"] = "refunded";
    }

    if (refundStatus === "failed") {
      updateData["status"] = "cancelled";
      updateData["payment.status"] = "failed";
    }
    if (notes) {
      const timestamp = new Date().toISOString();
      const noteLine = `[${timestamp}] Refund Update: ${notes}`;
      updateData["notes.internal"] = order.notes?.internal
        ? `${order.notes.internal}\n${noteLine}`
        : noteLine;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      order._id,
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("userId", "name email phone");

    res.status(200).json({
      success: true,
      message: "Refund status updated successfully",
      data: updatedOrder,
      verified: !skipVerification,
    });
  } catch (error) {
    console.error("Error updating refund status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update refund status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const syncRefundStatusesFromRazorpay = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const orders = await Order.find({
      "payment.razorpay.paymentId": { $exists: true },
      $or: [
        { "cancellation.refundStatus": { $in: ["pending", "initiated"] } },
        {
          status: "refunded",
          "cancellation.refundStatus": { $ne: "completed" },
        },
      ],
    });

    const results = {
      total: orders.length,
      updated: 0,
      alreadyUpToDate: 0,
      failed: [] as { orderId: string; error: string }[],
      details: [] as Record<string, unknown>[],
    };

    for (const order of orders) {
      try {
        const razorpayStatus = await fetchRazorpayRefundStatus(
          order.payment?.razorpay?.paymentId ?? undefined,
          order.cancellation?.refundId ?? undefined,
        );

        if (razorpayStatus.error) {
          results.failed.push({
            orderId: order.orderId,
            error: razorpayStatus.error,
          });
          continue;
        }

        const mappedStatus = mapRazorpayStatus(razorpayStatus.status);
        const currentStatus = order.cancellation?.refundStatus;

        if (currentStatus === mappedStatus) {
          results.alreadyUpToDate++;
          continue;
        }

    const syncUpdate: Record<string, unknown> = {
      "cancellation.refundStatus": mappedStatus,
      "cancellation.refundId": razorpayStatus.id,
      "cancellation.refundAmount": razorpayStatus.amount,
    };

        if (mappedStatus === "completed") {
          syncUpdate["cancellation.refundedAt"] = new Date(
            (razorpayStatus.created_at ?? Date.now() / 1000) * 1000,
          );
          syncUpdate["status"] = "refunded";
          syncUpdate["payment.status"] = "refunded";
        } else if (mappedStatus === "failed") {
          syncUpdate["status"] = "cancelled";
          syncUpdate["payment.status"] = "failed";
        }

        await Order.findByIdAndUpdate(order._id, { $set: syncUpdate });

        results.updated++;
        results.details.push({
          orderId: order.orderId,
          oldStatus: currentStatus,
          newStatus: mappedStatus,
          razorpayRefundId: razorpayStatus.id,
        });
      } catch (error) {
        results.failed.push({
          orderId: order.orderId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Sync completed. Updated ${results.updated} orders.`,
      data: results,
    });
  } catch (error) {
    console.error("Error syncing refund statuses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync refund statuses",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const bulkUpdateRefundStatus = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderIds, refundStatus } = _req.body as {
      orderIds?: string[];
      refundStatus?: string;
    };

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      res.status(400).json({
        success: false,
        message: "orderIds must be a non-empty array",
      });
      return;
    }

    const validStatuses = ["pending", "initiated", "completed", "failed"];
    if (!refundStatus || !validStatuses.includes(refundStatus)) {
      res.status(400).json({
        success: false,
        message: "Invalid refund status",
      });
      return;
    }

    const bulkUpdate: Record<string, unknown> = {
      "cancellation.refundStatus": refundStatus,
    };

    if (refundStatus === "completed") {
      bulkUpdate["cancellation.refundedAt"] = new Date();
      bulkUpdate["status"] = "refunded";
      bulkUpdate["payment.status"] = "refunded";
    }

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: bulkUpdate },
    );

    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} orders`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Error in bulk update:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk update refund status",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const delieverOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId } = req.body as { orderId: string };

    const order = await Order.findOne({ orderId });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    if (order.status === "cancelled" || order.status === "refunded") {
      res.status(400).json({
        success: false,
        message: "Cannot deliver a cancelled or refunded order",
      });
      return;
    }

    order.status = "delivered";
    if (order.shipping) {
      order.shipping.deliveredAt = new Date();
    }
    if (order.payment?.method === "cod" && order.payment) {
      order.payment.status = "completed";
      order.payment.paidAt = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order marked as delivered successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error marking order as delivered:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark order as delivered",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const verifyPendingPayments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { time } = req.body as { time?: string };
    const hoursToCheck = time ? parseInt(time) : 24;

    const cutoffTime = new Date(Date.now() - hoursToCheck * 60 * 60 * 1000);

    const pendingOrders = await Order.find({
      status: "pending",
      "payment.razorpay.orderId": { $exists: true, $ne: null },
      createdAt: { $gte: cutoffTime },
    })
      .populate("userId", "name email phone")
      .lean();

    const mismatchedOrders = [];

    for (const order of pendingOrders) {
      try {
      const razorpayOrderId = order.payment?.razorpay?.orderId;
      if (!razorpayOrderId) continue;
        const payments = await razorpay.orders.fetchPayments(razorpayOrderId);
        const paymentsItems = (payments as unknown as { items?: Array<{ status: string; id: string; amount: number; created_at: number }> }).items;

        if (paymentsItems) {
          const successfulPayment = paymentsItems.find(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (p: { status: string }) => p.status === "captured" || p.status === "authorized",
          );

          if (successfulPayment) {
            mismatchedOrders.push({
              _id: order._id,
              orderId: order.orderId,
              user: order.userId,
              orderTotal: order.pricing?.total,
              dbStatus: order.status,
              dbPaymentStatus: order.payment?.status,
              razorpay: {
                paymentId: successfulPayment.id,
                status: successfulPayment.status,
                amount: successfulPayment.amount / 100,
                createdAt: successfulPayment.created_at
                  ? new Date(successfulPayment.created_at * 1000)
                  : null,
              },
              suggestion:
                "Payment exists in Razorpay but order is pending in DB",
            });
          }
        }
      } catch (rzpError) {
        console.error(
          `Error fetching Razorpay payments for order ${(order as { orderId: string }).orderId}:`,
          rzpError instanceof Error ? rzpError.message : rzpError,
        );
      }
    }

    res.status(200).json({
      success: true,
      message: `Found ${mismatchedOrders.length} orders with pending status but successful payments in last ${hoursToCheck} hours`,
      data: {
        checkedOrdersCount: pendingOrders.length,
        timeWindowHours: hoursToCheck,
        mismatches: mismatchedOrders,
      },
    });
  } catch (error) {
    console.error("Error verifying pending payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify pending payments",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const confirmPendingPayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId, paymentId, paymentDate } = req.body as {
      orderId: string;
      paymentId?: string;
      paymentDate?: string;
    };

    if (!orderId) {
      res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: Record<string, unknown> = { orderId };

    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query = { $or: [{ orderId }, { _id: orderId }] };
    }

    const order = await Order.findOne(query).populate(
      "userId",
      "name email",
    );

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
      return;
    }

    order.status = "confirmed";
    if (!order.payment) {
      order.payment = {
        method: "razorpay",
        status: "pending",
        verified: false,
        codAdvance: false,
        codCharges: 0,
      };
    }
    order.payment.status = "completed";
    order.payment.paidAt = paymentDate ? new Date(paymentDate) : new Date();

    if (
      paymentId &&
      (!order.payment.razorpay || !order.payment.razorpay.paymentId)
    ) {
      if (!order.payment.razorpay) order.payment.razorpay = {};
      order.payment.razorpay.paymentId = paymentId;
    }

    await order.save();

    try {
      const populatedUser = order.userId as mongoose.Types.ObjectId & {
        name: string;
        email: string;
      };
      if (populatedUser && populatedUser.email) {
        await sendEmail(populatedUser.email, "orderConfirmed", {
          userName: populatedUser.name,
          orderId: order.orderId,
          orderDate: new Date(order.createdAt).toLocaleDateString(),
          totalAmount: order.pricing?.total ?? 0,
          items: order.items,
          shippingAddress: order.shippingAddress,
        });
      }
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Order confirmed and updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("Error confirming pending payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};