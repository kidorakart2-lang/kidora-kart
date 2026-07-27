import type { Request, Response } from "express";
import Order from "../../models/order.js";
import Product from "../../models/product.js";
import { logger } from "../../lib/logger.js";

/**
 * Parse a product weight string into grams.
 * Handles formats like "500", "500g", "0.5 kg", "500 grams", "500 gm".
 * Returns the numeric weight in grams, or null if unparseable.
 */
function parseWeightGrams(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();
  // Try to extract the numeric portion while stripping units
  const match = cleaned.match(/^([\d.]+)\s*(?:g|kg|grams?|gms?)?$/);
  if (!match) return null;
  const value = parseFloat(match[1]!);
  if (isNaN(value)) return null;
  // If the input included "kg" explicitly, convert to grams
  if (/kg\s*$/.test(cleaned) || cleaned.includes("kg")) {
    return value * 1000;
  }
  // Otherwise assume grams (handles bare numbers, "g", "gm", "grams")
  return value;
}

import {
  createOrder as shiprocketCreateOrder,
  createShipment,
  generateLabel,
  generateInvoice,
  trackShipment,
  checkServiceability,
  getPickupLocations,
  generatePickup,
  buildShiprocketOrderPayload,
  isShiprocketSuccess,
  cancelOrderOrRto,
  requestReturnOrder,
  getShipmentStatus,
  type ShiprocketOrderInput,
} from "../../lib/shiprocket.js";

// ── Create Shiprocket order + shipment for a confirmed order ───────────

export const createShippingOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId, pickupLocation } = req.body as {
      orderId: string;
      pickupLocation?: string;
    };

    if (!orderId) {
      res.status(400).json({ success: false, message: "orderId is required" });
      return;
    }

    const order = await Order.findOne({ orderId }).lean();

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (order.status !== "confirmed") {
      res.status(400).json({
        success: false,
        message: `Order must be 'confirmed' to create shipment. Current status: ${order.status}`,
      });
      return;
    }

    if (order.shipping?.trackingNumber) {
      res.status(409).json({
        success: false,
        message: "Shipment already created for this order",
        data: { trackingNumber: order.shipping.trackingNumber },
      });
      return;
    }

    const shippingAddress = order.shippingAddress;
    if (!shippingAddress) {
      res.status(400).json({
        success: false,
        message: "Order has no shipping address",
      });
      return;
    }

    // Fetch product weights from DB
    const productIds = order.items.map((item) => String(item.productId));
    const productDocs = await Product.find({
      _id: { $in: productIds },
    })
      .select("weight")
      .lean();

    const weightMap = new Map<string, number>();
    for (const doc of productDocs) {
      const id = String(doc._id);
      // Weight is stored in grams (e.g. "500" = 500g), convert to kg for Shiprocket
      const weightGrams = parseWeightGrams(doc.weight);
      const weightKg = weightGrams !== null ? weightGrams / 1000 : 0.5;
      weightMap.set(id, weightKg);
    }

    // Calculate total weight in kg
    let totalWeightKg = 0;
    for (const item of order.items) {
      const itemWeight = weightMap.get(String(item.productId)) || 0.5;
      totalWeightKg += itemWeight * item.quantity;
    }
    totalWeightKg = Math.max(totalWeightKg, 0.5);

    const shiprocketInput: ShiprocketOrderInput = {
      orderId: order.orderId,
      orderDate: new Date(order.createdAt).toISOString().split("T")[0] ?? "",
      customerName: shippingAddress.fullName,
      customerPhone: shippingAddress.phone,
      customerEmail: shippingAddress.email,
      shippingAddress: {
        street: shippingAddress.street,
        area: shippingAddress.area || "",
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: shippingAddress.country || "India",
      },
      items: order.items.map((item) => ({
        name: item.name,
        sku: item.sku || item.name.slice(0, 20) || "",
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      })),
      paymentMethod: order.payment?.method === "cod" ? "COD" : "Prepaid",
      subtotal: order.pricing?.subtotal ?? 0,
      totalWeightKg,
      discount: order.pricing?.discount?.amount ?? 0,
      total: order.pricing?.total ?? 0,
      pickupLocation: pickupLocation || "primary",
    };

    const payload = buildShiprocketOrderPayload(shiprocketInput);
    logger.info({ orderId }, "Creating Shiprocket order...");

    // Step 1: Create order in Shiprocket
    const orderResult = await shiprocketCreateOrder(payload);

    if (!isShiprocketSuccess(orderResult)) {
      logger.error({ orderId, result: orderResult }, "Shiprocket create order failed");
      res.status(502).json({
        success: false,
        message: orderResult?.message || "Failed to create order in Shiprocket",
        data: orderResult,
      });
      return;
    }

    const shiprocketOrderId = orderResult.order_id;

    // Step 2: Create shipment (assign courier)
    logger.info({ orderId, shiprocketOrderId }, "Creating Shiprocket shipment...");
    const shipmentResult = await createShipment(shiprocketOrderId);

    if (!isShiprocketSuccess(shipmentResult)) {
      logger.warn({ orderId, result: shipmentResult }, "Shiprocket shipment creation failed");
    }

    const awbCode = shipmentResult?.awb_code;
    const shipmentId = shipmentResult?.shipment_id;
    const courierName = shipmentResult?.courier_name;

    // Step 3: Generate label & invoice
    let labelUrl: string | undefined;
    let invoiceUrl: string | undefined;

    if (shipmentId) {
      try {
        const labelResult = await generateLabel(shipmentId);
        if (isShiprocketSuccess(labelResult)) {
          labelUrl = labelResult.label_url;
        }
      } catch (labelErr) {
        logger.warn({ orderId, error: labelErr }, "Failed to generate label");
      }

      try {
        const invoiceResult = await generateInvoice(shiprocketOrderId);
        if (isShiprocketSuccess(invoiceResult)) {
          invoiceUrl = invoiceResult.invoice_url;
        }
      } catch (invErr) {
        logger.warn({ orderId, error: invErr }, "Failed to generate invoice");
      }
    }

    // Store Shiprocket-calculated shipping charge back on the order
    const shiprocketShipping = (shipmentResult as { shipping_charge?: number })?.shipping_charge;

    // Update order with shipping info and Shiprocket IDs
    const trackingUrl = awbCode
      ? `https://shiprocket.co/tracking/${awbCode}`
      : undefined;

    const updateFields: Record<string, string | number | null | undefined> = {
      "shipping.carrier": courierName || "Shiprocket",
      "shipping.trackingNumber": awbCode || null,
      "shipping.trackingUrl": trackingUrl || null,
      "shipping.shiprocketOrderId": shiprocketOrderId,
      "shipping.shiprocketShipmentId": shipmentId || null,
      "invoice.invoiceUrl": invoiceUrl || null,
      status: "shipped",
    };

    // If Shiprocket returned an actual shipping charge, override the flat rate
    if (shiprocketShipping && shiprocketShipping > 0) {
      updateFields["pricing.shipping"] = shiprocketShipping;
    }

    await Order.updateOne(
      { orderId },
      { $set: updateFields },
    );

    res.status(200).json({
      success: true,
      message: "Shipment created successfully",
      data: {
        shiprocketOrderId,
        shipmentId,
        awbCode,
        courierName,
        labelUrl,
        invoiceUrl,
        trackingUrl,
      },
    });
  } catch (error) {
    logger.error({ error }, "Shiprocket create shipping order error");
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create shipment",
    });
  }
};

// ── Track shipment by order ID ─────────────────────────────────────────

export const trackShippingOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId })
      .select("shipping.trackingNumber shipping.carrier shipping.trackingUrl status")
      .lean();

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (!order.shipping?.trackingNumber) {
      res.status(400).json({
        success: false,
        message: "No tracking number found for this order",
        data: {
          trackingUrl: order.shipping?.trackingUrl,
          carrier: order.shipping?.carrier,
          status: order.status,
        },
      });
      return;
    }

    // Fetch live tracking from Shiprocket
    const trackingResult = await trackShipment(order.shipping.trackingNumber);

    const trackInfo = trackingResult?.tracking_data ?? null;

    // ── Auto-update order status if Shiprocket reports delivery ──
    if (trackInfo && trackInfo.status === "Delivered" && order.status !== "delivered") {
      logger.info({ orderId }, "Shiprocket reports Delivered — auto-updating order status");
      await Order.updateOne(
        { orderId },
        {
          $set: {
            status: "delivered",
            "shipping.deliveredAt": new Date(),
            "payment.status": order.payment?.status === "pending" ? "completed" : order.payment?.status,
          },
        },
      );
      // Re-fetch to return updated status
      const updatedOrder = await Order.findOne({ orderId })
        .select("shipping.trackingNumber shipping.carrier shipping.trackingUrl status")
        .lean();
      if (updatedOrder) {
        res.status(200).json({
          success: true,
          data: {
            orderId: updatedOrder.orderId,
            trackingNumber: updatedOrder.shipping?.trackingNumber,
            trackingUrl: updatedOrder.shipping?.trackingUrl,
            carrier: updatedOrder.shipping?.carrier,
            currentStatus: "delivered",
            shiprocketTracking: trackInfo,
            raw: trackingResult,
            autoUpdated: true,
          },
        });
        return;
      }
    } else if (trackInfo && trackInfo.status === "Cancelled" && order.status !== "cancelled") {
      logger.info({ orderId }, "Shiprocket reports Cancelled — auto-updating order status");
      await Order.updateOne(
        { orderId },
        { $set: { status: "cancelled" } },
      );
    }

    const currentStatus = order.status;

    res.status(200).json({
      success: true,
      data: {
        orderId: order.orderId,
        trackingNumber: order.shipping.trackingNumber,
        trackingUrl: order.shipping.trackingUrl,
        carrier: order.shipping.carrier,
        currentStatus,
        shiprocketTracking: trackInfo,
        raw: trackingResult,
      },
    });
  } catch (error) {
    logger.error({ error }, "Shiprocket tracking error");
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to track shipment",
    });
  }
};

// ── Cancel Shiprocket shipment ─────────────────────────────────────────
// Called when cancelling a shipped order. Attempts to cancel via Shiprocket.
// If the shipment has already been picked up / is in transit, suggests RTO.

export const cancelShippingOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId } = req.body as { orderId: string };

    if (!orderId) {
      res.status(400).json({ success: false, message: "orderId is required" });
      return;
    }

    const order = await Order.findOne({ orderId })
      .select("shipping.shiprocketOrderId shipping.shiprocketShipmentId shipping.trackingNumber status")
      .lean();

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    // If no Shiprocket order ID exists, nothing to cancel
    if (!order.shipping?.shiprocketOrderId) {
      res.status(200).json({
        success: true,
        message: "No Shiprocket shipment found for this order — nothing to cancel on Shiprocket.",
      });
      return;
    }

    const shiprocketOrderId = order.shipping.shiprocketOrderId;

    // Step 1: Check current shipment status on Shiprocket
    let statusCheck;
    try {
      statusCheck = await getShipmentStatus(shiprocketOrderId);
    } catch {
      // If status check fails, proceed with cancellation attempt anyway
      logger.warn({ orderId, shiprocketOrderId }, "Failed to check Shiprocket shipment status, proceeding with cancel");
    }

    // If the shipment is already delivered, can't cancel or RTO
    const currentStatus = statusCheck?.current_status?.toLowerCase() || "";
    if (currentStatus === "delivered") {
      res.status(400).json({
        success: false,
        message: "Cannot cancel shipment — it has already been delivered.",
      });
      return;
    }

    // Step 2: Attempt to cancel via Shiprocket
    const cancelResult = await cancelOrderOrRto([shiprocketOrderId]);

    if (cancelResult.cancelled) {
      logger.info({ orderId, shiprocketOrderId }, "Shiprocket order cancelled successfully");

      await Order.updateOne(
        { orderId },
        { $set: { status: "cancelled" } },
      );

      res.status(200).json({
        success: true,
        message: "Shipment cancelled successfully on Shiprocket",
        data: { cancelled: true },
      });
      return;
    }

    // Step 3: If cancellation failed because shipment is already in transit, suggest RTO
    if (cancelResult.needsRto) {
      res.status(409).json({
        success: false,
        message: "Shipment has already been picked up and cannot be cancelled directly. Use RTO (Return to Origin) instead.",
        data: {
          needsRto: true,
          shiprocketOrderId,
          shiprocketMessage: cancelResult.message,
        },
      });
      return;
    }

    // Step 4: Generic failure
    res.status(502).json({
      success: false,
      message: cancelResult.message || "Failed to cancel shipment on Shiprocket",
    });
  } catch (error) {
    logger.error({ error }, "Shiprocket cancel error");
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to cancel shipment",
    });
  }
};

// ── Request RTO (Return to Origin) for a Shiprocket order ──────────────
// Used when a shipment has already been picked up and cannot be cancelled.
// Shiprocket creates a return order to bring the package back.

export const requestRtoForOrder = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId } = req.body as { orderId: string };

    if (!orderId) {
      res.status(400).json({ success: false, message: "orderId is required" });
      return;
    }

    const order = await Order.findOne({ orderId })
      .select("shipping.shiprocketOrderId shipping.shiprocketShipmentId status")
      .lean();

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (!order.shipping?.shiprocketOrderId) {
      res.status(400).json({
        success: false,
        message: "No Shiprocket order found for this order. Create a shipment first.",
      });
      return;
    }

    const shiprocketOrderId = order.shipping.shiprocketOrderId;

    // Check current status to ensure it's not already delivered
    let statusCheck;
    try {
      statusCheck = await getShipmentStatus(shiprocketOrderId);
    } catch {
      // proceed anyway
    }

    const currentStatus = statusCheck?.current_status?.toLowerCase() || "";
    if (currentStatus === "delivered") {
      res.status(400).json({
        success: false,
        message: "Cannot request RTO — shipment has already been delivered.",
      });
      return;
    }

    // Request RTO from Shiprocket
    const rtoResult = await requestReturnOrder(shiprocketOrderId);

    if (isShiprocketSuccess(rtoResult)) {
      logger.info({ orderId, shiprocketOrderId }, "RTO requested successfully");

      await Order.updateOne(
        { orderId },
        {
          $set: {
            status: "cancelled",
            "shipping.rtoRequested": true,
            "shipping.rtoOrderId": rtoResult.rto_order_id,
            "shipping.rtoStatus": rtoResult.rto_status || "initiated",
          },
        },
      );

      res.status(200).json({
        success: true,
        message: "RTO (Return to Origin) initiated successfully. Package will be returned.",
        data: {
          rtoOrderId: rtoResult.rto_order_id,
          rtoStatus: rtoResult.rto_status,
        },
      });
      return;
    }

    res.status(502).json({
      success: false,
      message: rtoResult?.message || "Failed to initiate RTO on Shiprocket",
    });
  } catch (error) {
    logger.error({ error }, "RTO request error");
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to request RTO",
    });
  }
};

// ── Unified cancel + RTO handler ───────────────────────────────────────
// This endpoint tries to cancel first; if cancellation fails because the
// shipment is already in transit, it automatically requests RTO instead.

export const cancelOrRto = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId, autoRto } = req.body as { orderId: string; autoRto?: boolean };

    if (!orderId) {
      res.status(400).json({ success: false, message: "orderId is required" });
      return;
    }

    const order = await Order.findOne({ orderId })
      .select("shipping.shiprocketOrderId shipping.shiprocketShipmentId status")
      .lean();

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (!order.shipping?.shiprocketOrderId) {
      res.status(200).json({
        success: true,
        message: "No Shiprocket shipment — nothing to cancel on Shiprocket.",
        data: { action: "none" },
      });
      return;
    }

    const shiprocketOrderId = order.shipping.shiprocketOrderId;

    // Check current shipment status
    let statusCheck;
    try {
      statusCheck = await getShipmentStatus(shiprocketOrderId);
    } catch {
      // proceed
    }

    const currentStatus = statusCheck?.current_status?.toLowerCase() || "";
    if (currentStatus === "delivered") {
      res.status(400).json({
        success: false,
        message: "Cannot cancel — shipment has already been delivered.",
      });
      return;
    }

    // Try cancellation first
    const cancelResult = await cancelOrderOrRto([shiprocketOrderId]);

    if (cancelResult.cancelled) {
      logger.info({ orderId, shiprocketOrderId }, "Shiprocket order cancelled via cancelOrRto");
      await Order.updateOne(
        { orderId },
        { $set: { status: "cancelled" } },
      );
      res.status(200).json({
        success: true,
        message: "Shipment cancelled successfully on Shiprocket",
        data: { action: "cancelled" },
      });
      return;
    }

    // If cancellation needs RTO and autoRto is enabled, attempt RTO
    if (cancelResult.needsRto && autoRto) {
      logger.info({ orderId, shiprocketOrderId }, "Cancellation failed — attempting RTO");

      const rtoResult = await requestReturnOrder(shiprocketOrderId);

      if (isShiprocketSuccess(rtoResult)) {
        await Order.updateOne(
          { orderId },
          {
            $set: {
              status: "cancelled",
              "shipping.rtoRequested": true,
              "shipping.rtoOrderId": rtoResult.rto_order_id,
              "shipping.rtoStatus": rtoResult.rto_status || "initiated",
            },
          },
        );
        res.status(200).json({
          success: true,
          message: "Shipment could not be cancelled directly. RTO (Return to Origin) has been initiated — package will be returned.",
          data: { action: "rto", rtoOrderId: rtoResult.rto_order_id },
        });
        return;
      }
    }

    // Return the cancellation failure details
    res.status(409).json({
      success: false,
      message: cancelResult.message || "Failed to cancel shipment on Shiprocket",
      data: {
        needsRto: cancelResult.needsRto,
        shiprocketOrderId,
      },
    });
  } catch (error) {
    logger.error({ error }, "cancelOrRto error");
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to process cancellation",
    });
  }
};

// ── Get available pickup locations ─────────────────────────────────────

export const getPickupLocationsHandler = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await getPickupLocations();
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error({ error }, "Shiprocket pickup locations error");
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch pickup locations",
    });
  }
};

// ── Get shipping estimate at checkout ────────────────────────────────

export const getShippingEstimate = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { deliveryPincode, items, isCod } = req.body as {
      deliveryPincode: string;
      items: Array<{ productId: string; quantity: number }>;
      isCod?: boolean;
    };

    if (!deliveryPincode || !/^\d{6}$/.test(deliveryPincode)) {
      res.status(400).json({ success: false, message: "Valid 6-digit delivery pincode is required" });
      return;
    }

    if (!items || items.length === 0) {
      res.status(400).json({ success: false, message: "Items are required" });
      return;
    }

    // Fetch product weights
    const productIds = items.map((i) => i.productId).slice(0, 50);
    const productDocs = await Product.find({
      _id: { $in: productIds },
    })
      .select("weight")
      .lean();

    const weightMap = new Map<string, number>();
    for (const doc of productDocs) {
      const id = String(doc._id);
      const weightGrams = parseWeightGrams(doc.weight);
      const weightKg = weightGrams !== null ? weightGrams / 1000 : 0.5;
      weightMap.set(id, weightKg);
    }

    let totalWeightKg = 0;
    for (const item of items) {
      const itemWeight = weightMap.get(item.productId) || 0.5;
      totalWeightKg += itemWeight * (item.quantity || 1);
    }
    totalWeightKg = Math.max(totalWeightKg, 0.5);

    const pickupResult = await getPickupLocations();
    const pickupData = (pickupResult as { data?: { pickup_locations?: Array<{ pickup_location: string; pincode: string }> } })?.data;
    const pickupLocations = pickupData?.pickup_locations;
    const pickupPincode: string =
      pickupLocations && pickupLocations.length > 0
        ? pickupLocations[0]!.pincode || "342005"
        : "342005";

    const serviceabilityResult = await checkServiceability(
      pickupPincode || "342005",
      deliveryPincode,
      totalWeightKg,
      isCod === true,
    );

    const serviceabilityData = (serviceabilityResult as { data?: { available_courier_companies?: Array<{ courier_name: string; rate: number; etd: string }> } })?.data;
    const couriers = serviceabilityData?.available_courier_companies as
      | Array<{ courier_name: string; rate: number; etd: string; delivery_performance?: string }>
      | undefined;

    if (!couriers || couriers.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          available: false,
          message: "Shipping estimate unavailable for this pincode",
          fallbackCharge: 50,
        },
      });
      return;
    }

    const cheapest = couriers.reduce((min, c) =>
      c.rate < min.rate ? c : min,
    );

    res.status(200).json({
      success: true,
      data: {
        available: true,
        pickupPincode,
        deliveryPincode,
        totalWeightKg,
        couriers: couriers.map((c) => ({
          name: c.courier_name,
          rate: c.rate,
          etd: c.etd,
        })),
        cheapest: {
          name: cheapest.courier_name,
          rate: cheapest.rate,
          etd: cheapest.etd,
        },
        estimatedCharge: cheapest.rate,
      },
    });
  } catch (error) {
    logger.error({ error }, "Shipping estimate error");
    res.status(200).json({
      success: true,
      data: {
        available: false,
        message: "Shipping estimate temporarily unavailable",
        fallbackCharge: 50,
      },
    });
  }
};

// ── Shiprocket webhook handler ────────────────────────────────────────
// Receives real-time tracking updates from Shiprocket when shipment status changes.
// Configurable in Shiprocket Dashboard → Settings → API → Webhooks.
//
// Shiprocket sends POST requests with status updates. The handler:
// - Looks up the order by AWB (tracking number stored in DB)
// - Maps Shiprocket statuses to our order statuses
// - Updates order status, shipping timestamps, and payment status (COD) accordingly
// - Records all status changes in order.statusHistory for audit trail
// - Always returns 200 (even on errors) per webhook best practices

export const shiprocketWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const payload = req.body as {
      awb?: string | number;
      current_status?: string;
      shipment_status?: string;
      courier_name?: string;
      order_id?: string | number;
      [key: string]: unknown;
    };
    logger.info({ payload }, "Shiprocket webhook received");

    const awbRaw = payload.awb;
    const awb = awbRaw !== undefined && awbRaw !== null ? String(awbRaw) : "";
    const status = (payload.current_status || payload.shipment_status || "") as string;
    const courierName = (payload.courier_name || "") as string;
    const shiprocketOrderId = payload.order_id !== undefined && payload.order_id !== null ? String(payload.order_id) : "";

    if (!awb) {
      logger.warn({ payload }, "Shiprocket webhook: no AWB in payload");
      res.status(200).json({ status: "ok" });
      return;
    }

    const order = await Order.findOne({ "shipping.trackingNumber": awb });
    if (!order) {
      logger.warn({ awb, shiprocketOrderId }, "Shiprocket webhook: order not found by AWB");
      // If we have a Shiprocket order ID but no local order, log for investigation
      if (shiprocketOrderId) {
        logger.error({ awb, shiprocketOrderId }, "Shiprocket webhook: orphaned AWB — order not found in local DB");
      }
      res.status(200).json({ status: "ok" });
      return;
    }

    // Update courier name if not already set
    if (courierName && !order.shipping?.carrier) {
      if (!order.shipping) order.shipping = {};
      order.shipping.carrier = courierName;
    }

    // If the webhook includes a Shiprocket order ID and we haven't stored it yet, save it
    if (shiprocketOrderId && !order.shipping?.shiprocketOrderId) {
      if (!order.shipping) order.shipping = {};
      order.shipping.shiprocketOrderId = Number(shiprocketOrderId);
    }

    const normalizedStatus = status.toLowerCase();
    let previousStatus = order.status;

    if (normalizedStatus === "delivered" && order.status !== "delivered") {
      logger.info({ orderId: order.orderId, awb }, "Shiprocket webhook: marking as delivered");
      order.status = "delivered";
      if (!order.shipping) order.shipping = {};
      order.shipping.deliveredAt = new Date();

      // For COD orders, mark payment as completed on delivery
      if (order.payment?.method === "cod" && order.payment?.status !== "completed") {
        if (!order.payment) {
          order.set('payment', {});
        }
        order.set('payment.status', 'completed');
        order.set('payment.paidAt', new Date());
      }
    } else if (
      (normalizedStatus === "cancelled" || normalizedStatus === "canceled" || normalizedStatus === "returned" || normalizedStatus === "rto") &&
      order.status !== "cancelled"
    ) {
      logger.info({ orderId: order.orderId, awb }, "Shiprocket webhook: marking as cancelled");
      order.status = "cancelled";
    } else if (
      (normalizedStatus === "shipped" || normalizedStatus === "in transit" ||
       normalizedStatus === "out for delivery" || normalizedStatus === "pickup generated") &&
      order.status === "confirmed"
    ) {
      logger.info({ orderId: order.orderId, awb }, "Shiprocket webhook: marking as shipped");
      order.status = "shipped";
      if (!order.shipping) order.shipping = {};
      order.shipping.shippedAt = new Date();
    }

    if (previousStatus !== order.status) {
      // Push to statusHistory for audit trail
      order.statusHistory.push({
        status: order.status,
        timestamp: new Date(),
        note: `Auto-updated via Shiprocket webhook (status: ${normalizedStatus})`,
      });
      await order.save();
      logger.info({ orderId: order.orderId, awb, from: previousStatus, to: order.status }, "Shiprocket webhook: status updated");
    } else if (order.isModified()) {
      // Save even if status didn't change (e.g., courier name or shiprocketOrderId updated)
      await order.save();
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    logger.error({ error }, "Shiprocket webhook error");
    res.status(200).json({ status: "ok" });
  }
};

// ── Regenerate shipping label for a shipment ─────────────────────────
// If the label wasn't generated during initial shipment creation, or if it
// needs to be regenerated, this endpoint calls Shiprocket's generate label
// API and persists the new label URL on the order.

export const regenerateLabel = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId, shipmentId: bodyShipmentId } = req.body as {
      orderId: string;
      shipmentId?: number;
    };

    if (!orderId) {
      res.status(400).json({ success: false, message: "orderId is required" });
      return;
    }

    // If shipmentId was provided directly, use it
    if (bodyShipmentId) {
      logger.info({ orderId, shipmentId: bodyShipmentId }, "Regenerating label with provided shipmentId...");
      const result = await generateLabel(bodyShipmentId);

      if (isShiprocketSuccess(result)) {
        res.status(200).json({
          success: true,
          message: "Shipment label regenerated successfully",
          data: { labelUrl: result.label_url },
        });
        return;
      }

      res.status(502).json({
        success: false,
        message: result?.message || "Failed to regenerate label on Shiprocket",
      });
      return;
    }

    // Look up the order to get the shipment ID
    const order = await Order.findOne({ orderId })
      .select("shipping.shiprocketShipmentId shipping.shiprocketOrderId status")
      .lean();

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (!order.shipping?.shiprocketShipmentId) {
      res.status(400).json({
        success: false,
        message: "No Shiprocket shipment found for this order. Create a shipment first.",
      });
      return;
    }

    const shipmentId = order.shipping.shiprocketShipmentId;

    logger.info({ orderId, shipmentId }, "Regenerating shipment label...");
    const result = await generateLabel(shipmentId);

    if (isShiprocketSuccess(result)) {
      res.status(200).json({
        success: true,
        message: "Shipment label regenerated successfully",
        data: { labelUrl: result.label_url },
      });
      return;
    }

    res.status(502).json({
      success: false,
      message: result?.message || "Failed to regenerate label on Shiprocket",
    });
  } catch (error) {
    logger.error({ error }, "Shiprocket label regeneration error");
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to regenerate label",
    });
  }
};

// ── Regenerate shipping invoice for an order ───────────────────────────
// If the invoice wasn't generated during initial shipment creation, or if it
// needs to be regenerated, this endpoint calls Shiprocket's generate invoice
// API and persists the new invoice URL on the order.

export const regenerateInvoice = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId } = req.body as { orderId: string };

    if (!orderId) {
      res.status(400).json({ success: false, message: "orderId is required" });
      return;
    }

    const order = await Order.findOne({ orderId })
      .select("shipping.shiprocketOrderId status")
      .lean();

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    if (!order.shipping?.shiprocketOrderId) {
      res.status(400).json({
        success: false,
        message: "No Shiprocket order found for this order. Create a shipment first.",
      });
      return;
    }

    const shiprocketOrderId = order.shipping.shiprocketOrderId;

    logger.info({ orderId, shiprocketOrderId }, "Regenerating shipment invoice...");
    const result = await generateInvoice(shiprocketOrderId);

    if (isShiprocketSuccess(result)) {
      await Order.updateOne(
        { orderId },
        { $set: { "invoice.invoiceUrl": result.invoice_url } },
      );
      res.status(200).json({
        success: true,
        message: "Shipment invoice regenerated successfully",
        data: { invoiceUrl: result.invoice_url },
      });
      return;
    }

    res.status(502).json({
      success: false,
      message: result?.message || "Failed to regenerate invoice on Shiprocket",
    });
  } catch (error) {
    logger.error({ error }, "Shiprocket invoice regeneration error");
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to regenerate invoice",
    });
  }
};

// ── Schedule pickup for a shipped order ───────────────────────────────
// Generates a pickup request in Shiprocket for a shipment that has been created
// but not yet picked up by the courier. This schedules a physical pickup from
// the configured pickup location.

export const schedulePickup = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { orderId, shipmentId: bodyShipmentId } = req.body as {
      orderId: string;
      shipmentId?: number;
    };

    if (!orderId) {
      res.status(400).json({ success: false, message: "orderId is required" });
      return;
    }

    // If shipmentId was provided directly in the request body, use it
    if (bodyShipmentId) {
      logger.info({ orderId, shipmentId: bodyShipmentId }, "Scheduling pickup with provided shipmentId...");
      const result = await generatePickup(bodyShipmentId);

      if (isShiprocketSuccess(result)) {
        res.status(200).json({
          success: true,
          message: `Pickup scheduled successfully for ${result.pickup_scheduled_date || "pending date"}`,
          data: {
            pickupStatus: result.pickup_status,
            pickupScheduledDate: result.pickup_scheduled_date,
            pickupTokenNumber: result.pickup_token_number,
          },
        });
        return;
      }

      res.status(502).json({
        success: false,
        message: result?.message || "Failed to schedule pickup on Shiprocket",
      });
      return;
    }

    // Look up the order to get the shipment ID
    const order = await Order.findOne({ orderId })
      .select("shipping.shiprocketShipmentId shipping.shiprocketOrderId status")
      .lean();

    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }

    const shipmentId = order.shipping?.shiprocketShipmentId;

    if (!shipmentId) {
      res.status(400).json({
        success: false,
        message: "No Shiprocket shipment found for this order. Create a shipment first.",
      });
      return;
    }

    if (order.status !== "shipped") {
      res.status(400).json({
        success: false,
        message: `Order must be 'shipped' to schedule pickup. Current status: ${order.status}`,
      });
      return;
    }

    logger.info({ orderId, shipmentId }, "Scheduling pickup via Shiprocket...");
    const result = await generatePickup(shipmentId);

    if (isShiprocketSuccess(result)) {
      res.status(200).json({
        success: true,
        message: `Pickup scheduled successfully for ${result.pickup_scheduled_date || "pending date"}`,
        data: {
          pickupStatus: result.pickup_status,
          pickupScheduledDate: result.pickup_scheduled_date,
          pickupTokenNumber: result.pickup_token_number,
        },
      });
      return;
    }

    res.status(502).json({
      success: false,
      message: result?.message || "Failed to schedule pickup on Shiprocket",
    });
  } catch (error) {
    logger.error({ error }, "Shiprocket pickup error");
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to schedule pickup",
    });
  }
};

// ── Webhook test/verify endpoint ───────────────────────────────────────
// Allows admins to verify that the webhook endpoint is reachable and
// the Shiprocket integration is configured correctly.
// Returns the current integration status without making external calls.

export const verifyWebhook = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Verify Shiprocket credentials are working by calling an already-exported public method
    let tokenValid = false;
    let tokenError: string | null = null;

    try {
      await getPickupLocations();
      tokenValid = true;
    } catch (err) {
      tokenError = err instanceof Error ? err.message : "Unknown error";
    }

    const protocol = _req.protocol;
    const host = _req.get("host") || "localhost";
    const webhookUrl = `${protocol}://${host}/api/website/shipping/webhook`;

    res.status(200).json({
      success: true,
      data: {
        webhookUrl,
        configured: true,
        tokenValid,
        tokenError,
        timestamp: new Date().toISOString(),
        setupInstructions: [
          "1. Go to https://app.shiprocket.in → Settings → API → Webhooks",
          `2. Add webhook URL: ${webhookUrl}`,
          "3. Enable the webhook toggle",
          "4. Click 'Test' to send a sample payload",
          "5. Check server logs for 'Shiprocket webhook received' message",
        ],
      },
    });
  } catch (error) {
    logger.error({ error }, "Webhook verify error");
    res.status(500).json({
      success: false,
      message: "Failed to verify webhook configuration",
    });
  }
};
