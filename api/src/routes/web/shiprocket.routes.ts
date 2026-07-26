/**
 * @openapi
 * tags:
 *   - name: Shipping (Shiprocket)
 *     description: Shipping order management via Shiprocket
 *
 * components:
 *   schemas:
 *     ShiprocketWebhookPayload:
 *       type: object
 *       properties:
 *         awb:
 *           type: integer
 *           description: AWB number assigned by Shiprocket
 *         current_status:
 *           type: string
 *           example: Delivered
 *           description: Current tracking status (Delivered, Cancelled, In Transit, Out for Delivery, etc.)
 *         order_id:
 *           type: string
 *           description: Shiprocket's internal order ID
 *         courier_name:
 *           type: string
 *           description: Name of the courier partner
 *         shipment_status:
 *           type: string
 *           description: Shipment-level status
 *         scans:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *               activity:
 *                 type: string
 *               location:
 *                 type: string
 *
 * /api/website/shipping/webhook:
 *   post:
 *     tags: [Shipping (Shiprocket)]
 *     summary: Receive Shiprocket tracking webhooks
 *     description: |
 *       **Webhook Setup Instructions:**
 *
 *       1. Log in to your **Shiprocket Dashboard** at https://app.shiprocket.in
 *       2. Go to **Settings** → **API** → **Webhooks** tab
 *       3. Add the webhook URL:
 *          `POST https://your-api-domain.com/api/website/shipping/webhook`
 *       4. Enable the webhook toggle and save
 *
 *       Shiprocket will POST to this endpoint whenever shipment status changes
 *       (Delivered, Out for Delivery, In Transit, Cancelled, etc.).
 *       The system automatically updates the order status in the database.
 *
 *       Example payload:
 *       ```json
 *       {
 *         "awb": 59629792084,
 *         "current_status": "Delivered",
 *         "order_id": "13905312",
 *         "current_timestamp": "2021-07-02 16:41:59",
 *         "etd": "2021-07-02 16:41:59",
 *         "current_status_id": 7,
 *         "shipment_status": "Delivered",
 *         "shipment_status_id": 7,
 *         "channel_order_id": "enter your channel order id",
 *         "channel": "enter your channel name",
 *         "courier_name": "enter courier_name",
 *         "scans": [
 *           { "date": "2019-06-25 12:08:00", "activity": "SHIPMENT DELIVERED", "location": "PATIALA" }
 *         ]
 *       }
 *       ```
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShiprocketWebhookPayload'
 *     responses:
 *       200:
 *         description: Webhook acknowledged
 *
 * /api/website/shipping/create:
 *   post:
 *     tags: [Shipping (Shiprocket)]
 *     summary: Create a shipment for a confirmed order
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId]
 *             properties:
 *               orderId: { type: string, description: "Our system's order ID" }
 *               pickupLocation: { type: string, description: "Pickup location name (configured in Shiprocket)" }
 *     responses:
 *       200:
 *         description: Shipment created successfully with AWB and tracking details
 *       400:
 *         description: Invalid request or order not confirmable
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Internal server error
 *
 * /api/website/shipping/track/{orderId}:
 *   get:
 *     tags: [Shipping (Shiprocket)]
 *     summary: Track a shipment by order ID
 *     description: Fetches live tracking data from Shiprocket. Also auto-updates the order status to delivered/cancelled when Shiprocket reports it.
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Tracking information
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 *
 * /api/website/shipping/cancel:
 *   post:
 *     tags: [Shipping (Shiprocket)]
 *     summary: Cancel a shipment
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId: { type: string }
 *     responses:
 *       200:
 *         description: Shipment cancelled
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 * /api/website/shipping/pickup-locations:
 *   get:
 *     tags: [Shipping (Shiprocket)]
 *     summary: Get configured pickup locations
 *     security:
 *       - BearerAuth: []
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: Pickup locations list
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 * /api/website/shipping/estimate:
 *   post:
 *     tags: [Shipping (Shiprocket)]
 *     summary: Get shipping cost estimate for checkout
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deliveryPincode:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId: { type: string }
 *                     quantity: { type: integer }
 *               isCod:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Shipping estimate
 *
 */

import { Router } from "express";
import {
  createShippingOrder,
  trackShippingOrder,
  cancelShippingOrder,
  getPickupLocationsHandler,
  getShippingEstimate,
  shiprocketWebhook,
  requestRtoForOrder,
  cancelOrRto,
} from "../../controller/web/shiprocket.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";

const router = Router();

// All shipping endpoints require authentication and admin role
router.post("/create", protect, adminOnly, createShippingOrder);
router.get("/track/:orderId", protect, trackShippingOrder);
router.post("/cancel", protect, adminOnly, cancelShippingOrder);
// Unified cancel + RTO endpoint — tries cancel, falls back to RTO if autoRto=true
router.post("/cancel-or-rto", protect, adminOnly, cancelOrRto);
// RTO (Return to Origin) — for shipments already picked up that can't be cancelled
router.post("/rto", protect, adminOnly, requestRtoForOrder);
router.get("/pickup-locations", protect, adminOnly, getPickupLocationsHandler);
// Shipping estimate — available without auth (just a shipping rate estimate)
router.post("/estimate", getShippingEstimate);

// Shiprocket webhook — receives tracking status updates
// Configure this URL in Shiprocket Dashboard → Settings → API → Webhooks
router.post("/webhook", shiprocketWebhook);

export default router;
