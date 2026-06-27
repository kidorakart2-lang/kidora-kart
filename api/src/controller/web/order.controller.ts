import type { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../../models/order.js";
import Product from "../../models/product.js";
import Cart from "../../models/cart.js";
import User from "../../models/user.js";
import { sendEmail } from "../../lib/nodemailer.js";
import { env } from "../../config/env.js";

interface RefundResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  payment_id: string;
  created_at: number;
}

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID ?? "",
  key_secret: env.RAZORPAY_KEY_SECRET ?? "",
});

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generatePackageId = (): string => {
  const string = env.APP_NAME;
  return `${string}-${Math.floor(100000 + Math.random() * 900000).toString()}`;
};

type OrderItemInput = {
  productId: string;
  colorId: string;
  sizeId: string | null;
  name: string;
  description?: string;
  quantity: number;
  isPersonalized: boolean;
  personalizedName: string | null;
  priceAtPurchase: number;
  subtotal: number;
  addedFrom: string;
  images: string[];
  sku?: string;
};

// 1. Create Order (from Cart or Direct Purchase)
export const createOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      purchaseType,
      items,
      isPersonalizedName,
      shippingAddress,
      billingAddress,
      notes,
      isGift,
      giftMessage,
      giftWrap,
      isCodAdvance,
      idempotencyKey,
    } = req.body as {
      purchaseType: "cart" | "direct";
      items?: Array<{
        productId: string;
        quantity: number;
        colorId: string;
        sizeId?: string;
      }>;
      isPersonalizedName?: string;
      shippingAddress: {
        fullName: string;
        phone: string;
        email: string;
        area: string;
        street: string;
        city: string;
        state: string;
        pincode: string;
      };
      billingAddress?: unknown;
      notes?: string;
      isGift?: boolean;
      giftMessage?: string;
      giftWrap?: boolean;
      isCodAdvance?: boolean;
      idempotencyKey?: string;
    };

    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey, userId });
      if (existingOrder) {
        res.status(200).json({
          success: true,
          message: "Order already created",
          order: {
            orderId: existingOrder.orderId,
            _id: existingOrder._id,
            total: existingOrder.pricing?.total,
          },
        });
        return;
      }
    }

    const orderItems: OrderItemInput[] = [];
    let subtotal = 0;

    if (purchaseType === "cart") {
      const cart = await Cart.findOne({ user: userId })
        .populate("items.product")
        .lean();

      if (!cart || cart.items.length === 0) {
        res.status(400).json({ success: false, message: "Cart is empty" });
        return;
      }

      for (const cartItem of cart.items) {
        const cartItemProduct = cartItem.product as unknown as {
          _id: string;
          name: string;
          description?: string;
          price: number;
          discount_price: number;
          images: string[];
          code?: string;
          isPersonalized?: boolean;
        } | null;

        if (!cartItemProduct) {
          res.status(400).json({ success: false, message: "Cart item product not found" });
          return;
        }

        const itemSubtotal = cartItemProduct.discount_price * cartItem.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
          productId: String(cartItemProduct._id),
          colorId: cartItem.color?.toString() ?? "",
          sizeId: cartItem.size?.toString() ?? null,
          name: cartItemProduct.name,
          description: cartItemProduct.description,
          quantity: cartItem.quantity,
          isPersonalized: cartItemProduct.isPersonalized ?? false,
          personalizedName: (cartItemProduct.isPersonalized && isPersonalizedName) ? isPersonalizedName : null,
          priceAtPurchase: cartItemProduct.discount_price || cartItemProduct.price,
          subtotal: itemSubtotal,
          addedFrom: "cart",
          images: cartItemProduct.images ?? [],
          sku: cartItemProduct.code,
        });
      }
    } else if (purchaseType === "direct") {
      for (const item of items ?? []) {
        const product = await Product.findById(item.productId);
        if (!product) {
          res.status(404).json({ success: false, message: "Product not found" });
          return;
        }

        const itemSubtotal = product.discount_price * item.quantity;
        subtotal += itemSubtotal;

        orderItems.push({
          productId: String(product._id),
          colorId: item.colorId,
          sizeId: item.sizeId || null,
          name: product.name,
          description: product.description,
          quantity: item.quantity,
          isPersonalized: product.isPersonalized ?? false,
          personalizedName: product.isPersonalized ? (isPersonalizedName ?? null) : null,
          priceAtPurchase: product.discount_price,
          subtotal: itemSubtotal,
          addedFrom: "direct",
          images: product.images ?? [],
          sku: product.code,
        });
      }
    }

    const discount = isCodAdvance
      ? 0
      : subtotal < 500
        ? 0
        : Math.round(subtotal * 0.05);
    const shipping = subtotal > 1000 ? 0 : 50;
    const giftWrapCharges = giftWrap ? 50 : 0;
    const total = subtotal - discount + shipping + giftWrapCharges;
    const codAdvance = isCodAdvance
      ? Math.max(100, Math.round(subtotal * 0.1))
      : 0;

    const order = new Order({
      userId,
      purchaseType,
      idempotencyKey,
      items: orderItems,
      pricing: {
        subtotal,
        advance: codAdvance,
        discount: { amount: discount, couponCode: null, couponId: null },
        shipping,
        total,
      },
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      notes: { customer: notes || "" },
      isGift: isGift || false,
      giftMessage: giftMessage || null,
      giftWrap: giftWrap || false,
      giftWrapCharges,
      status: "pending",
      payment: { status: "pending" },
    });

    try {
      await order.save();
    } catch (err) {
      // Race condition: two requests with the same idempotency key hit
      // save() at nearly the same time. The unique index rejects the
      // second insert — fetch and return the one that won instead of erroring.
      if (
        err &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: number }).code === 11000 &&
        "keyPattern" in err &&
        (err as { keyPattern: Record<string, unknown> }).keyPattern?.idempotencyKey
      ) {
        const existingOrder = await Order.findOne({ idempotencyKey, userId });
        if (existingOrder) {
          res.status(200).json({
            success: true,
            message: "Order already created",
            order: {
              orderId: existingOrder.orderId,
              _id: existingOrder._id,
              total: existingOrder.pricing?.total,
            },
          });
          return;
        }
      }
      throw err;
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        orderId: order.orderId,
        _id: order._id,
        total: order.pricing?.total,
      },
    });

    setImmediate(async () => {
      try {
        const user = await User.findById(userId);
        if (!user) return;
        if (!user.mobile) {
          user.mobile = Number(shippingAddress.phone);
          user.isMobileVerified = true;
        }
        if (!user.address) {
          user.address = {
            pincode: null,
            state: "",
            city: "",
            street: "",
            area: "",
            instructions: "",
          };
        }
        if (!user.address.pincode)
          user.address.pincode = Number(shippingAddress.pincode);
        if (!user.address.state) user.address.state = shippingAddress.state;
        if (!user.address.city) user.address.city = shippingAddress.city;
        if (!user.address.street)
          user.address.street = shippingAddress.street;
        if (!user.address.area) user.address.area = shippingAddress.area;
        await user.save();
      } catch (error) {
        console.error("Error updating user details:", error);
      }
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 2. Create Razorpay Order
export const createRazorpayOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId, isCodAdvance } = req.body as {
      orderId: string;
      isCodAdvance?: boolean;
    };
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const order = await Order.findOne({ orderId, userId });
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (order.status !== "pending") {
      res
        .status(400)
        .json({ success: false, message: "Order is not in pending state" });
      return;
    }

    const options = {
      amount: isCodAdvance
        ? (order.pricing?.advance ?? 0) * 100
        : (order.pricing?.total ?? 0) * 100,
      currency: "INR",
      receipt: order.orderId,
      notes: {
        orderId: order.orderId,
        userId: userId.toString(),
      },
    };

    if (isCodAdvance && order.pricing) {
      order.pricing.advance = 50;
    }
    if (isCodAdvance && order.payment) {
      order.payment.codAdvance = true;
    }

    const razorpayOrder = await razorpay.orders.create(options);
    if (order.payment) {
      if (!order.payment.razorpay) {
        order.payment.razorpay = { orderId: "" };
      }
      order.payment.razorpay.orderId = razorpayOrder.id;
    }
    await order.save();

    res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: isCodAdvance ? 100 : order.pricing?.total,
      currency: "INR",
      keyId: env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create Razorpay Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 3. Verify Payment (MOST CRITICAL)
export const verifyPayment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } =
      req.body as {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
        orderId: string;
      };

    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const order = await Order.findOne({ orderId, userId }).populate(
      "items.productId",
    );
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    const generatedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET ?? "")
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      order.status = "payment_failed";
      if (order.payment) {
        order.payment.status = "failed";
      }
      await order.save();

      await sendEmail(order.shippingAddress?.email ?? "", "paymentFailed", {
        orderId: order.orderId,
        customerName: order.shippingAddress?.fullName || "Customer",
        orderTotal: `₹${order.pricing?.total}`,
        contactEmail: env.MY_GMAIL,
      }).catch((err) =>
        console.error("Failed to send payment failure email:", err),
      );

      res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
      return;
    }

    const razorpayOrderDetails = await razorpay.orders.fetch(razorpay_order_id);
    const expectedAmount = (order.pricing?.total ?? 0) * 100;

    if (
      !order.payment?.codAdvance &&
      razorpayOrderDetails.amount !== expectedAmount
    ) {
      res.status(400).json({ success: false, message: "Amount mismatch" });
      return;
    }

    order.status = "confirmed";
    if (order.payment) {
      order.payment.status = !order.payment.codAdvance
        ? "completed"
        : "cod-advance";
      order.payment.verified = true;
      if (!order.payment.razorpay) {
        order.payment.razorpay = {};
      }
      order.payment.razorpay.paymentId = razorpay_payment_id;
      order.payment.razorpay.signature = razorpay_signature;
      order.payment.transactionId = razorpay_payment_id;
      order.payment.paidAt = new Date();
    }

    const deliveryOTP = generateOTP();
    if (!order.notes) {
      order.notes = {};
    }
    order.notes.internal = `Delivery OTP: ${deliveryOTP}`;

    const packageId = generatePackageId();
    order.packageId = packageId;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      order: {
        orderId: order.orderId,
        status: order.status,
        deliveryOTP,
        packageId,
      },
    });

    setImmediate(async () => {
      try {
        const stockUpdatePromises = order.items.map((item) =>
          Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity },
          }).catch((err) =>
            console.error(
              `Failed to update stock for product ${item.productId}:`,
              err,
            ),
          ),
        );

        let cartClearPromise: Promise<unknown> = Promise.resolve();
        if (order.purchaseType === "cart") {
          cartClearPromise = Cart.findOneAndUpdate(
            { user: userId },
            { $set: { items: [] } },
          ).catch((err) => console.error("Failed to clear cart:", err));
        }

        const emailPromise = sendEmail(
          order.shippingAddress?.email ?? "",
          "orderConfirmed",
          {
            orderId: order.orderId,
            packageId,
            orderDate: new Date().toLocaleString(),
            customerName: order.shippingAddress?.fullName || "Customer",
            orderTotal: order.pricing?.total,
            subtotal: order.pricing?.subtotal,
            discount: order.pricing?.discount?.amount || 0,
            shipping: order.pricing?.shipping,
            total: order.pricing?.total,
            deliveryOTP,
            contactEmail: env.MY_GMAIL,
            items: order.items,
            shippingAddress: order.shippingAddress,
            billingAddress: order.billingAddress || order.shippingAddress,
            paymentMethod: "Online Payment",
          },
        ).catch((err) =>
          console.error("Failed to send order confirmation email:", err),
        );

        await Promise.all([
          ...stockUpdatePromises,
          cartClearPromise,
          emailPromise,
        ]);
      } catch (error) {
        console.error("Error in post-payment operations:", error);
      }
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 5. Get User Orders
export const getUserOrders = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { status, page = "1", limit = "10" } = req.query as {
      status?: string;
      page?: string;
      limit?: string;
    };

    const query: Record<string, unknown> = { userId };
    if (status) query.status = status;

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), 100);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .populate("items.productId", "name images slug")
      .populate("items.sizeId", "name value")
      .lean();

    const count = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      orders,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
      totalOrders: count,
    });
  } catch (error) {
    console.error("Get User Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 6. Get Single Order
export const getOrderById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const order = await Order.findOne({ orderId, userId })
      .populate("items.productId", "name images slug")
      .select("-payment.razorpay.signature")
      .populate("items.colorId", "name code")
      .populate("items.sizeId", "name value")
      .lean();

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const filter: Record<string, unknown> = { orderId };
    if (req.user?.role !== "admin" && req.user?.role !== "delivery") {
      filter.userId = userId;
    }

    const order = await Order.findOne(filter)
      .populate("items.productId", "name images slug")
      .populate("items.colorId", "name code")
      .populate("items.sizeId", "name value")
      .select("-payment.razorpay.signature")
      .lean();

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 7. Cancel Order
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body as { reason?: string };
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const order = await Order.findOne({ orderId, userId });
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    const orderCreatedAt = new Date(order.createdAt);
    const currentTime = new Date();
    const timeDifference = currentTime.getTime() - orderCreatedAt.getTime();
    const twelveHoursInMs = 12 * 60 * 60 * 1000;

    if (
      order.payment?.status !== "pending" &&
      timeDifference > twelveHoursInMs
    ) {
      res.status(400).json({
        success: false,
        message: "Order can only be cancelled within 12 hours of placement",
      });
      return;
    }

    order.status = "cancelled";
    order.cancellation = {
      reason,
      cancelledBy: "customer",
      cancelledAt: new Date(),
    };

    if (order.payment?.status !== "pending") {
      const refundAmount = order.payment?.codAdvance
        ? (order.pricing?.advance ?? 0)
        : (order.pricing?.total ?? 0);

      try {
        const refundResponse = await razorpay.payments.refund(
          order.payment?.razorpay?.paymentId ?? "",
          {
            amount: refundAmount * 100,
            notes: { orderId: order.orderId, reason: reason ?? null },
          },
        );
        const refundResult = refundResponse as RefundResponse;

        order.cancellation = {
          ...order.cancellation,
          refundStatus: "initiated",
          refundId: refundResult.id,
          refundAmount,
        };
      } catch (error) {
        console.error("Refund initiation failed:", error);
        order.cancellation = {
          ...order.cancellation,
          refundStatus: "failed",
          refundError: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });

    (async () => {
      try {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity },
          });
        }
      } catch (stockError) {
        console.error("Failed to restore stock:", stockError);
      }
    })();

    sendEmail(order.shippingAddress?.email ?? "", "orderCancelled", {
      user: {
        name: order.shippingAddress?.fullName ?? "Customer",
        email: order.shippingAddress?.email ?? "",
      },
      order: {
        _id: order._id,
        orderId: order.orderId,
        createdAt: order.createdAt,
        pricing: order.pricing,
        cancellation: order.cancellation,
        shippingAddress: order.shippingAddress,
        pendingStatus: !!order.payment?.status,
      },
    }).catch((emailError) => {
      console.error("Failed to send cancellation email:", emailError);
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 8. Verify Delivery OTP
export const verifyDeliveryOTP = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId, otp } = req.body as { orderId: string; otp: string };

    const order = await Order.findOne({ orderId });
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (order.status !== "shipped") {
      res
        .status(400)
        .json({ success: false, message: "Order cannot be marked as delivered" });
      return;
    }

    const storedOTP =
      order.notes?.internal?.match(/Delivery OTP: (\d{6})/)?.[1];

    if (!storedOTP || storedOTP !== otp) {
      res.status(400).json({ success: false, message: "Invalid OTP" });
      return;
    }

    order.status = "delivered";
    if (order.shipping) {
      order.shipping.deliveredAt = new Date();
    }
    if (order.payment?.method === "cod") {
      order.payment.status = "completed";
      order.payment.paidAt = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order delivered successfully",
    });

    sendEmail(order.shippingAddress?.email ?? "", "orderDelivered", {
      user: {
        name: order.shippingAddress?.fullName ?? "Customer",
        email: order.shippingAddress?.email ?? "",
      },
      order: {
        _id: order._id,
        orderId: order.orderId,
        shipping: order.shipping,
        shippingAddress: order.shippingAddress,
        items: order.items,
        totalAmount: order.pricing?.total,
      },
    }).catch((emailError) => {
      console.error("Failed to send delivery confirmation email:", emailError);
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const markToShipped = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId } = req.body as { orderId: string };
    const order = await Order.findOne({ orderId });
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (order.status !== "confirmed") {
      res
        .status(400)
        .json({ success: false, message: "Order cannot be marked as shipped" });
      return;
    }

    order.status = "shipped";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order marked as shipped successfully",
    });

    sendEmail(order.shippingAddress?.email ?? "", "orderShipped", {
      user: {
        name: order.shippingAddress?.fullName ?? "Customer",
        email: order.shippingAddress?.email ?? "",
      },
      order: { _id: order._id, orderId: order.orderId },
    }).catch((emailError) => {
      console.error("Failed to send shipping email:", emailError);
    });
  } catch (error) {
    console.error("Mark to Shipped Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark order as shipped",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const sendDeliveryOTP = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId } = req.body as { orderId: string };
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const filter: Record<string, unknown> = { orderId };
    if (req.user?.role !== "admin" && req.user?.role !== "delivery") {
      filter.userId = userId;
    }

    const order = await Order.findOne(filter).lean();
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    try {
      sendEmail(order.shippingAddress?.email ?? "", "orderDeliveryOTP", {
        user: {
          name: order.shippingAddress?.fullName ?? "Customer",
          email: order.shippingAddress?.email ?? "",
        },
        order: { orderId: order.orderId, _id: order._id },
        otp: order.notes?.internal,
      });
    } catch (emailError) {
      console.error("Failed to send delivery OTP email:", emailError);
    }

    res.status(200).json({
      success: true,
      message: "Delivery OTP sent successfully",
    });
  } catch (error) {
    console.error("Send Delivery OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send delivery OTP",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getAllOrders = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;
  if (!userId) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }
  if (req.user?.role !== "admin") {
    res.status(403).json({ success: false, message: "Forbidden" });
    return;
  }

  const query: Record<string, unknown> = { deletedAt: null };
  if (req.body?.status) {
    query.status = req.body.status;
  }
  try {
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("items.productId", "name images slug")
      .populate("items.colorId", "name")
      .populate("items.sizeId", "name")
      .select("-payment.razorpay.signature")
      .lean();

    res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    console.error("Get All Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Webhook handler — note the route uses express.raw so req.body is a Buffer
export const handleWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const secret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      res.status(500).json({ error: "Webhook secret not configured" });
      return;
    }

    const signature = req.headers["x-razorpay-signature"] as string | undefined;
    const rawBody =
      typeof req.body === "string"
        ? req.body
        : Buffer.isBuffer(req.body)
          ? (req.body as Buffer).toString("utf8")
          : JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    const eventPayload =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : Buffer.isBuffer(req.body)
          ? JSON.parse((req.body as Buffer).toString("utf8"))
          : req.body;
    const event = eventPayload?.event;
    const payload = eventPayload?.payload?.refund?.entity;

    switch (event) {
      case "refund.created":
        await handleRefundCreated(payload);
        break;
      case "refund.processed":
        await handleRefundProcessed(payload);
        break;
      case "refund.failed":
        await handleRefundFailed(payload);
        break;
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

async function handleRefundProcessed(refundData: { id: string }): Promise<void> {
  const order = await Order.findOne({
    "cancellation.refundId": refundData.id,
  });
  if (order && order.cancellation) {
    order.cancellation.refundStatus = "completed";
    order.cancellation.refundedAt = new Date();
    await order.save();

    await sendEmail(order.shippingAddress?.email ?? "", "RefundProcessed", {
      user: {
        name: order.shippingAddress?.fullName ?? "Customer",
        email: order.shippingAddress?.email ?? "",
      },
      order: {
        _id: order._id,
        orderId: order.orderId,
        createdAt: order.createdAt,
        pricing: order.pricing,
        cancellation: order.cancellation,
        shippingAddress: order.shippingAddress,
        pendingStatus: !!order.payment?.status,
      },
    });
  }
}

async function handleRefundFailed(refundData: {
  id: string;
  error_description?: string;
}): Promise<void> {
  const order = await Order.findOne({
    "cancellation.refundId": refundData.id,
  });
  if (order && order.cancellation) {
    order.cancellation.refundStatus = "failed";
    order.cancellation.refundError = refundData.error_description;
    await order.save();
  }
}

async function handleRefundCreated(refundData: { id: string }): Promise<void> {
  const order = await Order.findOne({
    "cancellation.refundId": refundData.id,
  });
  if (order && order.cancellation) {
    order.cancellation.refundStatus = "initiated";
    await order.save();

    sendEmail(order.shippingAddress?.email ?? "", "orderCancelled", {
      user: {
        name: order.shippingAddress?.fullName ?? "Customer",
        email: order.shippingAddress?.email ?? "",
      },
      order: {
        _id: order._id,
        orderId: order.orderId,
        createdAt: order.createdAt,
        pricing: order.pricing,
        cancellation: order.cancellation,
        shippingAddress: order.shippingAddress,
        pendingStatus: true,
        paymentRefundStatus: order.cancellation.refundStatus,
      },
    }).catch((emailError) => {
      console.error("Failed to send cancellation email:", emailError);
    });
  }
}

export const confirmCODOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId } = req.body as { orderId: string };
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const order = await Order.findOne({ orderId, userId }).populate(
      "items.productId",
    );
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (!order.payment) {
      order.payment = {
        method: "cod",
        status: "pending",
        verified: false,
        codAdvance: false,
        codCharges: 0,
      };
    }
    order.payment.method = "cod";
    order.payment.status = "pending";
    order.payment.verified = true;
    order.status = "confirmed";

    order.statusHistory.push({
      status: "confirmed",
      timestamp: new Date(),
      note: "Order confirmed with Cash on Delivery",
      updatedBy: userId,
    });

    const deliveryOTP = generateOTP();
    if (!order.notes) {
      order.notes = {};
    }
    order.notes.internal = `Delivery OTP: ${deliveryOTP}`;
    const packageId = generatePackageId();
    order.packageId = packageId;

    await order.save();

    res.status(200).json({
      success: true,
      message: "COD order confirmed successfully",
      order: {
        orderId: order.orderId,
        status: order.status,
        deliveryOTP,
        packageId,
      },
    });

    setImmediate(async () => {
      try {
        const stockUpdatePromises = order.items.map((item) =>
          Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: -item.quantity },
          }).catch((err) =>
            console.error(
              `Failed to update stock for product ${item.productId}:`,
              err,
            ),
          ),
        );

        let cartClearPromise: Promise<unknown> = Promise.resolve();
        if (order.purchaseType === "cart") {
          cartClearPromise = Cart.findOneAndUpdate(
            { user: userId },
            { $set: { items: [] } },
          ).catch((err) => console.error("Failed to clear cart:", err));
        }

        const emailPromise = sendEmail(
          order.shippingAddress?.email ?? "",
          "orderConfirmed",
          {
            orderId: order.orderId,
            packageId,
            orderDate: new Date().toLocaleString(),
            customerName: order.shippingAddress?.fullName || "Customer",
            orderTotal: order.pricing?.total,
            subtotal: order.pricing?.subtotal,
            discount: order.pricing?.discount?.amount || 0,
            shipping: order.pricing?.shipping,
            total: order.pricing?.total,
            deliveryOTP,
            contactEmail: env.MY_GMAIL,
            items: order.items,
            shippingAddress: order.shippingAddress,
            billingAddress: order.billingAddress || order.shippingAddress,
            paymentMethod: "Cash on Delivery (COD)",
          },
        ).catch((err) =>
          console.error("Failed to send order confirmation email:", err),
        );

        await Promise.all([
          ...stockUpdatePromises,
          cartClearPromise,
          emailPromise,
        ]);
      } catch (error) {
        console.error("Error in post-COD confirmation operations:", error);
      }
    });
  } catch (error) {
    console.error("COD Order Confirmation Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm COD order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const cancelOrderByAdmin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { orderId, reason } = req.body as { orderId: string; reason?: string };
  try {
    const order = await Order.findOne({ orderId });
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (order.payment?.status !== "pending") {
      const refundAmount = order.pricing?.total ?? 0;

      try {
        const refundResponse = await razorpay.payments.refund(
          order.payment?.razorpay?.paymentId ?? "",
          {
            amount: refundAmount * 100,
            notes: { orderId: order.orderId, reason: reason ?? null },
          },
        );
        const refundResult = refundResponse as RefundResponse;

        order.cancellation = {
          ...(order.cancellation ?? {}),
          refundStatus: "initiated",
          refundId: refundResult.id,
          refundAmount,
        };
      } catch (error) {
        console.error("Refund initiation failed:", error);
        order.cancellation = {
          ...(order.cancellation ?? {}),
          refundStatus: "failed",
          refundError: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }

    order.status = "cancelled";
    order.cancellation = {
      ...(order.cancellation ?? {}),
      reason,
      cancelledBy: "admin",
      cancelledAt: new Date(),
    };
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
    });

    sendEmail(order.shippingAddress?.email ?? "", "orderCancelled", {
      user: {
        name: order.shippingAddress?.fullName ?? "Customer",
        email: order.shippingAddress?.email ?? "",
      },
      order: {
        _id: order._id,
        orderId: order.orderId,
        createdAt: order.createdAt,
        pricing: order.pricing,
        cancellation: order.cancellation,
        shippingAddress: order.shippingAddress,
        pendingStatus: !!order.payment?.status,
        adminReason: reason,
      },
    }).catch((emailError) => {
      console.error("Failed to send cancellation email:", emailError);
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
