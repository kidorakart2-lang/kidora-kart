import { env } from "../config/env.js";
import { logger } from "./logger.js";

// ── Types ────────────────────────────────────────────────────────────

interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
}

interface ShiprocketCreateOrderPayload {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_address: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  /** Shiprocket expects this as integer 1 (true) or 0 (false) */
  shipping_is_billing: 0 | 1;
  order_items: ShiprocketOrderItem[];
  payment_method: "Prepaid" | "COD";
  total_discount?: number;
  sub_total?: number;
  weight: number;
  length?: number;
  breadth?: number;
  height?: number;
  // Optional fields below — included as needed
  channel_id?: string;
  comment?: string;
  billing_last_name?: string;
  billing_address_2?: string;
  shipping_customer_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_address_2?: string;
  shipping_city?: string;
  shipping_pincode?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_email?: string;
  shipping_phone?: string;
  shipping_charges?: number;
  giftwrap_charges?: number;
  transaction_charges?: number;
}

interface ShiprocketAuthResponse {
  status_code: number;
  message: string;
  token: string;
}



// ── Helper: flatten Shiprocket response ──────────────────────────────
// Shiprocket endpoints return flat JSON with status_code, not wrapped in { data: ... }
type ShiprocketResponse<T> = T & { status_code?: number; message?: string };

// ── Shiprocket API client ────────────────────────────────────────────

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get a valid Shiprocket API token.
 * Uses cached token if still valid, otherwise logs in.
 */
async function getToken(): Promise<string> {
  // If env provides a static token (e.g. pre-fetched), use it directly
  if (env.SHIPROCKET_TOKEN) {
    return env.SHIPROCKET_TOKEN;
  }

  // Return cached token if still valid (tokens expire in 10 days)
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  // Login to get a fresh token
  if (!env.SHIPROCKET_EMAIL || !env.SHIPROCKET_PASSWORD) {
    throw new Error(
      "Shiprocket credentials not configured. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD env vars.",
    );
  }

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: env.SHIPROCKET_EMAIL,
      password: env.SHIPROCKET_PASSWORD,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({ status: response.status, body: errorText }, "Shiprocket auth failed");
    throw new Error(`Shiprocket auth failed: ${response.status}`);
  }

  const data = (await response.json()) as ShiprocketAuthResponse;
  // Token expires in 10 days — refresh after 9 days to be safe
  cachedToken = {
    token: data.token,
    expiresAt: Date.now() + 9 * 24 * 60 * 60 * 1000,
  };

  return data.token;
}

/** Shared fetch wrapper with auto-retry on 401 */
async function shiprocketFetch<T>(
  path: string,
  options: RequestInit & { retried?: boolean } = {},
): Promise<ShiprocketResponse<T>> {
  const token = await getToken();
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  // If 401 and not yet retried, clear cached token and retry once
  if (response.status === 401 && !options.retried) {
    cachedToken = null;
    return shiprocketFetch<T>(path, { ...options, retried: true });
  }

  const data = (await response.json()) as ShiprocketResponse<T>;
  return data;
}

/** Check if Shiprocket response indicates success (status_code === 1) */
export function isShiprocketSuccess<T>(
  result: ShiprocketResponse<T>,
): result is ShiprocketResponse<T> & { status_code: 1 } {
  return result.status_code === 1;
}

// ── Public API methods ───────────────────────────────────────────────

/**
 * Normalize an Indian phone number for Shiprocket.
 * Strips spaces, dashes, brackets and the +91 / 91 country code prefix.
 * Returns null if the result is not a 10-digit number.
 */
export function normalizePhone(phone: string | number | undefined | null): string | null {
  if (phone === undefined || phone === null) return null;
  let digits = String(phone).replace(/[^0-9]/g, "");
  // Strip country code: 91XXXXXXXXXX (12 digits) or +91XXXXXXXXXX
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^\d{10}$/.test(digits) ? digits : null;
}

/**
 * Normalize an Indian pincode to a 6-digit string.
 * Returns null if it can't be normalized.
 */
export function normalizePincode(pincode: string | number | undefined | null): string | null {
  if (pincode === undefined || pincode === null) return null;
  const digits = String(pincode).trim();
  return /^\d{6}$/.test(digits) ? digits : null;
}

/**
 * Derive a Shiprocket-safe order ID (max 20 alphanumeric characters).
 * Shiprocket's /orders/create/adhoc rejects order_id longer than 20 chars,
 * while our DB orderId is like `ORD-1785135707933-11AE1E4C` (26 chars).
 * We strip non-alphanumerics and keep the trailing 20 chars — the random hex
 * suffix (which is what makes it unique) is preserved.
 */
export function toShiprocketOrderId(orderId: string): string {
  return orderId.replace(/[^A-Za-z0-9]/g, "").slice(-20);
}

/**
 * 1. Create an order in Shiprocket.
 * This is the first step — registers the order with pickup and delivery details.
 */
export async function createOrder(
  payload: ShiprocketCreateOrderPayload,
): Promise<ShiprocketResponse<{ order_id: number; shipment_id: string }>> {
  return shiprocketFetch("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 2. Create a shipment for an existing Shiprocket order.
 * This assigns a courier partner and generates tracking details.
 */
export async function createShipment(
  orderId: number,
): Promise<ShiprocketResponse<{ shipment_id: number; courier_company_id: number; awb_code: string; courier_name: string; status: string }>> {
  return shiprocketFetch("/shipments/create", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId }),
  });
}

/**
 * 3. Generate shipping label for a shipment.
 */
export async function generateLabel(
  shipmentId: number,
): Promise<ShiprocketResponse<{ label_created: number; label_url: string }>> {
  return shiprocketFetch("/generate/label", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
}

/**
 * 4. Generate AWB / shipping invoice.
 */
export async function generateInvoice(
  orderId: number,
): Promise<ShiprocketResponse<{ is_printed: boolean; invoice_url: string }>> {
  return shiprocketFetch("/generate/invoice", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId }),
  });
}

/**
 * 5. Track shipment by AWB number.
 */
export async function trackShipment(
  awb: string,
): Promise<ShiprocketResponse<{ tracking_data: { shipment_status: number; status: string; status_code: number; EDD: string; etd: string } }>> {
  return shiprocketFetch(`/courier/track/awb/${awb}`, { method: "GET" });
}

/**
 * 6. Cancel an order/shipment.
 * Can only be cancelled before pickup/dispatch.
 */
export async function cancelOrder(
  orderIds: number[],
): Promise<ShiprocketResponse<{ cancelled: boolean; message: string }>> {
  return shiprocketFetch("/orders/cancel", {
    method: "POST",
    body: JSON.stringify({ ids: orderIds }),
  });
}

/**
 * 7. Check shipping serviceability — get estimated shipping charges for a route.
 * This allows the checkout to show dynamic shipping costs based on pincode + weight.
 */
export async function checkServiceability(
  pickupPostcode: string,
  deliveryPostcode: string,
  weightKg: number,
  isCod: boolean,
): Promise<ShiprocketResponse<{ available_courier_companies: Array<{ courier_name: string; rate: number; etd: string; delivery_performance?: string }> }>> {
  const params = new URLSearchParams({
    pickup_postcode: pickupPostcode,
    delivery_postcode: deliveryPostcode,
    weight: String(weightKg),
    cod: isCod ? "1" : "0",
  });
  return shiprocketFetch(`/courier/serviceability/?${params.toString()}`, { method: "GET" });
}

/**
 * 8. Get pickup locations configured in Shiprocket.
 */
export async function getPickupLocations(): Promise<
  ShiprocketResponse<{ pickup_locations: Array<{ pickup_location: string; address: string; city: string; state: string; pincode: string; phone: string }> }>
> {
  return shiprocketFetch("/settings/company/pickup", { method: "GET" });
}

/**
 * 9. Assign AWB to a Shiprocket order (alternative to createShipment).
 * Use when you need to assign a specific courier + AWB after order creation.
 */
export async function assignAwb(
  payload: { shipment_id: number; courier_id: number; awb_code?: string; weight?: number; order_id?: number },
): Promise<ShiprocketResponse<{ awb_code: string; courier_name: string; shipment_id: number }>> {
  return shiprocketFetch("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * 10. Generate pickup request for a shipment.
 * Schedules a pickup for the shipment from the configured pickup location.
 */
export async function generatePickup(
  shipmentId: number,
): Promise<ShiprocketResponse<{ pickup_status: string; pickup_scheduled_date: string; pickup_token_number: string }>> {
  return shiprocketFetch("/courier/generate/pickup", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
}

/**
 * 11. Generate manifest for a list of shipment IDs.
 */
export async function generateManifest(
  shipmentIds: number[],
): Promise<ShiprocketResponse<{ manifest_url: string }>> {
  return shiprocketFetch("/manifests/generate", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentIds }),
  });
}

/**
 * 12. Print manifest — returns a PDF URL.
 */
export async function printManifest(
  shipmentIds: number[],
): Promise<ShiprocketResponse<{ pdf_url: string }>> {
  return shiprocketFetch("/manifests/print", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentIds }),
  });
}

/**
 * 13. Print invoice for a Shiprocket order — returns a PDF URL.
 */
export async function printInvoice(
  orderId: number,
): Promise<ShiprocketResponse<{ invoice_url: string; pdf_url?: string }>> {
  return shiprocketFetch("/orders/print/invoice", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId }),
  });
}

/**
 * 14. Print label for a shipment — returns a PDF URL.
 */
export async function printLabel(
  shipmentId: number,
): Promise<ShiprocketResponse<{ label_url: string; pdf_url?: string }>> {
  return shiprocketFetch("/courier/generate/label", {
    method: "POST",
    body: JSON.stringify({ shipment_id: shipmentId }),
  });
}

/**
 * 15. Cancel a Shiprocket order with fallback logic.
 * First tries to cancel via /orders/cancel with the order IDs.
 * If that fails (e.g. shipment already picked up), returns the error
 * so the caller can decide whether to attempt RTO instead.
 *
 * Returns { cancelled: true } on success, or the Shiprocket error payload.
 */
export async function cancelOrderOrRto(
  orderIds: number[],
): Promise<ShiprocketResponse<{ cancelled: boolean; message: string; needsRto?: boolean }>> {
  const result = await cancelOrder(orderIds);

  // If cancellation succeeded, return success
  if (isShiprocketSuccess(result)) {
    return { ...result, cancelled: true };
  }

  // Shiprocket returns specific error messages when shipment is already in transit/picked up
  // In that case, the caller should attempt RTO instead
  const msg = (result?.message || "").toLowerCase();
  const needsRto =
    msg.includes("already shipped") ||
    msg.includes("already picked up") ||
    msg.includes("in transit") ||
    msg.includes("cannot be cancelled") ||
    msg.includes("dispatched") ||
    msg.includes("picked up");

  return {
    cancelled: false,
    message: result?.message || "Cancellation failed",
    needsRto,
  };
}

/**
 * 16. Request RTO (Return to Origin) for a shipment.
 * Shiprocket creates a return order for shipments that cannot be cancelled
 * because they have already been picked up or are in transit.
 */
export async function requestReturnOrder(
  orderId: number,
): Promise<ShiprocketResponse<{ rto_order_id: number; rto_status: string; message: string }>> {
  return shiprocketFetch("/orders/create/rto", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId }),
  });
}

/**
 * 17. Get shipment status by Shiprocket order ID.
 * Used to check whether a shipment can be cancelled before attempting.
 */
export async function getShipmentStatus(
  orderId: number,
): Promise<ShiprocketResponse<{
  status: string;
  shipment_status: string;
  current_status: string;
  pickup_status: string;
  awb_code: string;
  courier_name: string;
}>> {
  return shiprocketFetch(`/orders/show/${orderId}`, { method: "GET" });
}

// ── Helper: Build the create-order payload from our order data ───────

export interface ShiprocketOrderInput {
  orderId: string;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  /** Full billing address string — constructed from order's street, area, addressLine1, landmark */
  fullAddress: string;
  shippingAddress: {
    street: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  items: Array<{
    name: string;
    sku?: string;
    quantity: number;
    priceAtPurchase: number;
  }>;
  paymentMethod: "Prepaid" | "COD";
  subtotal: number;
  /** Total weight of all items in kg — will be used by Shiprocket to calculate shipping charges */
  totalWeightKg: number;
  discount: number;
  total: number;
  pickupLocation: string;
}

export function buildShiprocketOrderPayload(
  input: ShiprocketOrderInput,
): ShiprocketCreateOrderPayload {
  const addr = input.shippingAddress;

  const billingPhone = normalizePhone(input.customerPhone) ?? String(input.customerPhone ?? "");
  const billingPincode = normalizePincode(addr.pincode) ?? String(addr.pincode ?? "");
  const billingCity = String(addr.city ?? "").trim();
  const billingState = String(addr.state ?? "").trim();
  const billingAddress = String(input.fullAddress ?? "").trim();
  const billingName = String(input.customerName ?? "").trim();
  const billingEmail = String(input.customerEmail ?? "").trim();

  // Shiprocket's adhoc create API expects `shipping_is_billing` as the integer 1.
  // Some API versions also require the shipping_* fields to be populated even
  // when shipping_is_billing is set, otherwise it returns
  // "Please add billing/shipping address first". We mirror the billing values
  // into the shipping fields as a safety net.
  return {
    order_id: toShiprocketOrderId(input.orderId),
    order_date: input.orderDate,
    pickup_location: input.pickupLocation,
    billing_customer_name: billingName,
    billing_address: billingAddress,
    billing_city: billingCity,
    billing_pincode: billingPincode,
    billing_state: billingState,
    billing_country: addr.country || "India",
    billing_email: billingEmail,
    billing_phone: billingPhone,
    shipping_is_billing: 1,
    shipping_customer_name: billingName,
    shipping_address: billingAddress,
    shipping_city: billingCity,
    shipping_pincode: billingPincode,
    shipping_state: billingState,
    shipping_country: addr.country || "India",
    shipping_email: billingEmail,
    shipping_phone: billingPhone,
    order_items: input.items.map((item) => ({
      name: item.name,
      sku: item.sku || item.name.slice(0, 20),
      units: item.quantity,
      selling_price: item.priceAtPurchase,
    })),
    payment_method: input.paymentMethod,
    // Omit shipping_charges so Shiprocket calculates the actual rate based on weight & pincode
    total_discount: input.discount,
    sub_total: input.subtotal,
    weight: input.totalWeightKg,
    length: 20,
    breadth: 15,
    height: 10,
  };
}
