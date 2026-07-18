"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useOrderById } from "@/lib/useOrders";
import { retryPayment, verifyPayment } from "@/lib/orderService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import LoadingOverlay from "@/components/comman/LoadingOverlay";
import { motion } from "motion/react";
import {
  Package, CheckCircle, Truck, Clock, XCircle, AlertTriangle,
  Loader2, RefreshCw, Phone, Mail, Search, Printer,
} from "lucide-react";
import { toast } from "sonner";
import { getAuthToken } from "@/lib/getAuthToken";
import OrderTimeline from "@/components/track/OrderTimeline";
import OrderItemsList from "@/components/track/OrderItemsList";
import OrderSummaryCard from "@/components/track/OrderSummaryCard";
import CancellationDetails from "@/components/track/CancellationDetails";
import PrintInvoice from "@/components/track/PrintInvoice";
import ShiprocketTrackingStatus, { type ShiprocketTrackingData } from "@/components/track/ShiprocketTrackingStatus";

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [searchOrderId, setSearchOrderId] = useState<string>("");
  const [retryLoading, setRetryLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<{ shiprocketTracking?: ShiprocketTrackingData; currentStatus?: string } | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const searchParams = useSearchParams();
  const urlOrderId = searchParams?.get("orderId") || "";
  const effectiveOrderId = searchOrderId || urlOrderId;

  const {
    data: orderDetails,
    isLoading,
    refetch,
  } = useOrderById(effectiveOrderId || null);

  useEffect(() => {
    if (urlOrderId) {
      setSearchOrderId("");
    }
  }, [urlOrderId]);

  const loadRazorpayScript = async (): Promise<boolean> => {
    for (let i = 0; i < 2; i++) {
      if ((window as unknown as { Razorpay?: unknown }).Razorpay) return true;
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      const loaded = await new Promise<boolean>((resolve) => {
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
      });
      if (loaded || (window as unknown as { Razorpay?: unknown }).Razorpay) return true;
      await new Promise((r) => setTimeout(r, 1000));
    }
    return false;
  };

  const handleRetryPayment = async () => {
    setRetryLoading(true);
    try {
      const orderIdVal = orderDetails?.order?.orderId;
      if (!orderIdVal) return;

      const retryRes = await retryPayment(orderIdVal);
      if (!retryRes.success) {
        toast.error(retryRes.message || "Failed to retry payment");
        setRetryLoading(false);
        return;
      }

      if (retryRes.alreadyPaid) {
        setRetryLoading(false);
        toast.success("Payment already completed!");
        fetchOrder();
        return;
      }

      const { razorpayOrderId, amount, currency, keyId } = retryRes;

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Payment gateway could not be loaded. Please try again or use a different payment method.");
        setRetryLoading(false);
        return;
      }

      const options = {
        key: keyId,
        amount: amount * 100,
        currency: currency,
        name: "Kidora Kart",
        description: `Order ${orderIdVal}`,
        order_id: razorpayOrderId,
        prefill: {
          name: orderDetails?.order?.shippingAddress?.fullName,
          email: orderDetails?.order?.shippingAddress?.email,
          contact: orderDetails?.order?.shippingAddress?.phone,
        },
        theme: { color: typeof window !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--brand-primary').trim() || '#f59e0b' : '#f59e0b' },
        handler: async function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          setRetryLoading(true);
          try {
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderIdVal,
            });
            if (verifyRes.success) {
              toast.success("Payment successful!");
              fetchOrder();
            } else {
              toast.error(verifyRes.message || "Payment verification failed. Please contact support.");
            }
          } catch {
            toast.error("Payment verification failed. Please contact support.");
          } finally {
            setRetryLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setRetryLoading(false);
            toast.error("Payment cancelled");
          },
        },
      };

      const RazorpayConstructor = (window as unknown as { Razorpay: new (options: unknown) => { open: () => void } }).Razorpay;
      const paymentObject = new RazorpayConstructor(options);
      paymentObject.open();
    } catch (error) {
      toast.error("Failed to initiate payment. Please try again.");
      setRetryLoading(false);
    }
  };

  // ── Fetch Shiprocket tracking data when order has tracking info ──
  useEffect(() => {
    if (effectiveOrderId && orderDetails?.order?.shipping?.trackingNumber) {
      fetchShiprocketTracking(effectiveOrderId);
    } else {
      setTrackingData(null);
    }
  }, [effectiveOrderId, orderDetails?.order?.shipping?.trackingNumber]);

  const fetchShiprocketTracking = async (orderId: string) => {
    setTrackingLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL + "api/website";
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/shipping/track/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      if (res.ok) {
        const json = await res.json() as { success: boolean; data?: { shiprocketTracking?: ShiprocketTrackingData; currentStatus?: string } };
        if (json.success && json.data) {
          setTrackingData(json.data);
        }
      }
    } catch {
      // Tracking fetch failed silently
      setTrackingData(null);
    }
    setTrackingLoading(false);
  };

  const handleTrackOrder = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (orderNumber.trim()) {
      setSearchOrderId(orderNumber);
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Invoice-${orderDetails?.order?.orderId || "order"}`;
    window.print();
    document.title = originalTitle;
  };

  const fetchOrder = () => {
    refetch();
  };


  if (isLoading) {
    return <LoadingOverlay hidden={isLoading} />;
  }

  if (effectiveOrderId && !orderDetails?.order) {
    return (
      <div className="min-h-[50vh] bg-gradient-to-b from-background to-muted/30 p-4 md:p-10 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t find an order with that ID. Please check and try again.
          </p>
          <Button onClick={() => setSearchOrderId("")} className="btn-gradient">
            Try Another Order
          </Button>
        </motion.div>
      </div>
    );
  }

  const isCancelled =
    orderDetails?.order?.status === "cancelled" ||
    orderDetails?.order?.status === "refunded";
  const isDelivered = orderDetails?.order?.status === "delivered";
  const isPaymentFailed =
    orderDetails?.order?.status === "payment_failed" ||
    orderDetails?.order?.status === "pending";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 md:p-10">
      {effectiveOrderId == "" || !effectiveOrderId ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
           <h1 className="text-3xl fw-heading text-foreground tracking-tight mb-2">Track Your Order</h1>
          <p className="text-muted-foreground font-sans mb-6">
            Enter your order details to see its current status. <br />
            <span className="text-muted-foreground text-sm">
              or You Can Check your order status in Profile
            </span>
          </p>

          <div className="bg-background rounded-2xl shadow-sm border border-border p-6 mb-10">
            <div className="mb-4">
              <Label className="block text-muted-foreground font-medium mb-1">
                Order Number
              </Label>
              <Input
                type="text"
                placeholder="ORD-1234567890-ABC123"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTrackOrder()}
                className="w-full border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <Button
              onClick={handleTrackOrder}
              className="btn-gradient fw-cta px-6 py-2 rounded-xl"
            >
              <Search className="w-4 h-4 mr-2" />
              Track Order
            </Button>
          </div>
        </motion.div>
      ) : (
        <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-5xl mx-auto space-y-6 screen-only"
        >
          {/* Print styles — hide everything except the invoice section */}
          <style>{`
            @media print {
              body { background: white !important; }
              @page { margin: 1.5cm; }
              .no-print { display: none !important; }
              .print-break-inside { break-inside: avoid; }
              .bg-gradient-to-b { background: white !important; }
              .print-only { display: block !important; }
              .print-only-table { display: table !important; }
              .screen-only { display: none !important; }
              .print\:hidden { display: none !important; }
            }
            .print-only { display: none; }
          `}</style>

          {/* ── Screen-only order header ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background rounded-2xl p-6 shadow-sm border border-border"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl md:text-3xl fw-heading text-foreground tracking-tight mb-2">
                  Order {orderDetails?.order?.orderId}
                </h1>

                {/* AWB / Tracking Number — prominent badge */}
                {orderDetails?.order?.shipping?.trackingNumber && (
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-indigo-600/5 text-indigo-700 px-4 py-2 rounded-xl border border-indigo-200 shadow-sm mb-3">
                    <Package className="w-4 h-4 text-indigo-500" />
                    <span className="font-semibold text-sm">AWB:</span>
                    <span className="font-mono font-bold text-sm tracking-wide">
                      {orderDetails.order.shipping.trackingNumber}
                    </span>
                    {orderDetails?.order?.shipping?.trackingUrl && (
                      <a
                        href={orderDetails.order.shipping.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 underline ml-2"
                      >
                        Track on Shiprocket →
                      </a>
                    )}
                  </div>
                )}

                {/* Estimated Delivery Subheading — prominent at top */}
                {orderDetails?.order?.shipping?.estimatedDelivery && !isDelivered && !isCancelled && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="mb-2"
                  >
                    <div className="inline-flex flex-col bg-gradient-to-r from-brand-500/10 to-brand-600/5 text-brand-700 px-4 py-2 rounded-xl border border-brand-200 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-brand-500" />
                        <span className="font-semibold text-sm">
                          Estimated Delivery:
                        </span>
                        <span className="font-bold text-sm">
                          {new Date(orderDetails.order.shipping.estimatedDelivery).toLocaleDateString("en-IN", {
                            weekday: "short",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {orderDetails?.order?.shipping?.carrier && (
                        <p className="text-[10px] text-brand-600/70 mt-0.5">
                          via {orderDetails.order.shipping.carrier}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* For delivered orders — show 'Delivered on' instead */}
                {isDelivered && orderDetails?.order?.statusHistory?.find((s) => s.status === "delivered") && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="mb-2"
                  >
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200 shadow-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-sm">
                        Delivered:
                      </span>
                      <span className="font-bold text-sm">
                        {new Date(
                          orderDetails.order.statusHistory.find((s) => s.status === "delivered")!.timestamp
                        ).toLocaleDateString("en-IN", {
                          weekday: "short",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </motion.div>
                )}

                <p className="text-muted-foreground text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Placed on{" "}
                  {new Date(orderDetails?.order?.createdAt ?? "").toLocaleDateString(
                    "en-IN",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 no-print">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                  title="Print invoice"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                {orderDetails?.order?.shipping?.carrier && orderDetails?.order?.status !== "delivered" && !isCancelled && (
                  <div className="bg-blue-50 px-3 py-2 rounded-xl border border-blue-200" title={`Courier: ${orderDetails.order.shipping.carrier}`}>
                    <p className="font-semibold flex items-center gap-1.5 text-blue-700 text-xs whitespace-nowrap">
                      <Truck className="w-3.5 h-3.5" />
                      {orderDetails.order.shipping.carrier}
                    </p>
                  </div>
                )}
                {isCancelled && (
                  <div className="bg-destructive/10 px-4 py-2 rounded-xl border border-destructive/20">
                    <p className="font-semibold flex items-center gap-2 text-destructive">
                      <XCircle className="w-5 h-5" />
                      Order Cancelled
                    </p>
                  </div>
                )}
                {isDelivered && (
                  <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                    <p className="font-semibold flex items-center gap-2 text-emerald-700">
                      <CheckCircle className="w-5 h-5" />
                      Delivered Successfully
                    </p>
                  </div>
                )}
                {isPaymentFailed && (
                  <div className="bg-muted px-4 py-2 rounded-xl border border-border">
                    <p className="font-semibold flex items-center gap-2 text-foreground">
                      <AlertTriangle className="w-5 h-5" />
                      Payment Failed
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <OrderTimeline
            status={orderDetails?.order?.status ?? "pending"}
            statusHistory={orderDetails?.order?.statusHistory}
            isCancelled={isCancelled}
            isPaymentFailed={isPaymentFailed}
          />

          {isCancelled && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }} className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-destructive/20">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center"><XCircle className="w-8 h-8 text-destructive" /></div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Order Cancelled</h3>
                  <p className="text-sm text-muted-foreground mt-1">This order was cancelled on {new Date(orderDetails?.order?.statusHistory?.find((s) => s.status === "cancelled")?.timestamp || orderDetails?.order?.updatedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Retry Purchase — white card */}
          {isPaymentFailed && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-destructive/20"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your payment was unsuccessful. Please retry to complete your purchase.
                  </p>
                </div>
                <Button
                  onClick={handleRetryPayment}
                  disabled={retryLoading}
                  className="btn-gradient shrink-0"
                >
                  {retryLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Purchase
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Delivered Badge — white card */}
          {isDelivered && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
              className="bg-background rounded-2xl p-4 sm:p-6 shadow-sm border border-emerald-200"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="font-semibold text-emerald-700">
                    Delivered On:
                  </span>
                </div>
                <span className="font-semibold text-emerald-600">
                  {new Date(
                    orderDetails?.order?.statusHistory?.find(
                      (s) => s.status === "delivered"
                    )?.timestamp ?? ""
                  ).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </motion.div>
          )}          <OrderItemsList
            items={orderDetails?.order?.items ?? []}
            isGift={orderDetails?.order?.isGift}
            giftMessage={orderDetails?.order?.giftMessage}
          />

          {/* Payment Method — white card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
            className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-border transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium shadow-sm">
                3
              </div>
              <h2 className="font-semibold text-foreground text-base">
                Payment Details
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium text-foreground">
                  {orderDetails?.order?.payment?.method === "COD"
                    ? "Cash on Delivery"
                    : orderDetails?.order?.payment?.method}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Payment Status</span>
                <span className="font-medium text-foreground capitalize">
                  {orderDetails?.order?.payment?.status?.replace("_", " ")}
                </span>
              </div>
              {orderDetails?.order?.payment?.codAdvance && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Advance Paid</span>
                  <span className="font-medium text-foreground">
                    ₹{orderDetails?.order?.pricing?.advance}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          <CancellationDetails cancellation={orderDetails?.order?.cancellation} />          <OrderSummaryCard
            pricing={orderDetails?.order?.pricing}
            isCodAdvance={orderDetails?.order?.payment?.codAdvance}
          />

          {/* Shipping Address — white card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5, ease: "easeOut" }}
            className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-border transition-all hover:shadow-md"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium shadow-sm">
                    5
                  </div>
                  <h2 className="font-semibold text-foreground text-base">
                    Shipping Address
                  </h2>
                </div>
                <div className="bg-muted p-4 rounded-xl">
                  <address className="not-italic text-muted-foreground space-y-1 text-sm">
                    <p className="font-semibold text-foreground">
                      {orderDetails?.order?.shippingAddress?.fullName}
                    </p>
                    <p>{orderDetails?.order?.shippingAddress?.street}</p>
                    <p>{orderDetails?.order?.shippingAddress?.area}</p>
                    <p>
                      {orderDetails?.order?.shippingAddress?.city},{" "}
                      {orderDetails?.order?.shippingAddress?.state}
                    </p>
                    <p>
                      India - {orderDetails?.order?.shippingAddress?.pincode}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {orderDetails?.order?.shippingAddress?.phone}
                      </span>
                      {orderDetails?.order?.shippingAddress?.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {orderDetails?.order?.shippingAddress?.email}
                        </span>
                      )}
                    </div>
                  </address>
                </div>
              </div>

              {!isDelivered && !isCancelled && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium shadow-sm">
                      6
                    </div>
                    <h2 className="font-semibold text-foreground text-base">
                      Delivery Info
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {orderDetails?.order?.shippingAddress?.instructions && (
                      <div className="bg-muted p-4 rounded-xl border-l-4 border-border">
                        <p className="text-sm font-medium text-foreground mb-1">
                          Delivery Instructions
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {orderDetails?.order?.shippingAddress?.instructions}
                        </p>
                      </div>
                    )}

                    <div className="bg-muted p-4 rounded-xl border-l-4 border-border">
                      <p className="text-sm font-medium text-foreground mb-1">
                        Package ID
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {orderDetails?.order?.packageId}
                      </p>
                    </div>

                    {orderDetails?.order?.shipping?.carrier && (
                      <>
                        {/* Shipping Estimate — richer details */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 p-4 rounded-xl border-l-4 border-blue-400">
                          <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <Truck className="w-4 h-4" />
                            Shipping Estimate
                          </p>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-blue-600">Courier Partner</span>
                              <span className="font-medium text-blue-900">{orderDetails.order.shipping.carrier}</span>
                            </div>
                            {orderDetails.order.shipping.estimatedDelivery && (
                              <div className="flex items-center justify-between">
                                <span className="text-blue-600">Estimated Delivery</span>
                                <span className="font-semibold text-blue-800">
                                  {new Date(orderDetails.order.shipping.estimatedDelivery).toLocaleDateString("en-IN", {
                                    weekday: "short",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Live Shiprocket Tracking */}
                        {orderDetails?.order?.shipping?.trackingNumber && (
                          <div className="bg-gradient-to-br from-indigo-50 to-indigo-50/50 p-4 rounded-xl border-l-4 border-indigo-400">
                            <p className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              Shipment Tracking
                            </p>

                            <div className="space-y-1.5 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-indigo-600">AWB Number</span>
                                <span className="font-mono font-bold text-indigo-900">
                                  {orderDetails.order.shipping.trackingNumber}
                                </span>
                              </div>

                              {orderDetails.order.shipping.carrier && (
                                <div className="flex items-center justify-between">
                                  <span className="text-indigo-600">Courier</span>
                                  <span className="font-medium text-indigo-800">{orderDetails.order.shipping.carrier}</span>
                                </div>
                              )}

                              {orderDetails.order.shipping.shippedAt && (
                                <div className="flex items-center justify-between">
                                  <span className="text-indigo-600">Shipped On</span>
                                  <span className="font-medium text-indigo-800">
                                    {new Date(orderDetails.order.shipping.shippedAt).toLocaleDateString("en-IN", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>

                            {trackingLoading && (
                              <div className="animate-pulse flex items-center gap-2 text-xs text-indigo-600 mt-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Fetching tracking updates...
                              </div>
                            )}

                            {trackingData && (
                              <div className="mt-2 pt-2 border-t border-indigo-200">
                                <ShiprocketTrackingStatus
                                  shiprocketTracking={trackingData.shiprocketTracking ?? null}
                                  currentStatus={trackingData.currentStatus ?? "Pending"}
                                />
                              </div>
                            )}

                            {orderDetails?.order?.shipping?.trackingUrl && (
                              <a
                                href={orderDetails.order.shipping.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 hover:text-indigo-900 underline mt-2"
                              >
                                <Truck className="w-3 h-3" />
                                Track on Shiprocket →
                              </a>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Customer's own order note */}
              {orderDetails?.order?.notes?.customer && (
                <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-400">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Your Note
                  </p>
                  <p className="text-sm text-blue-700">
                    {orderDetails?.order?.notes?.customer}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Track Another Order — white card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
            className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-border transition-all hover:shadow-md"
          >
            <h2 className="font-semibold text-foreground text-base mb-4">
              Track Another Order
            </h2>
            <div className="flex gap-3 flex-wrap">
              <Input
                type="text"
                placeholder="Enter Order Number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTrackOrder()}
                className="flex-1 min-w-[200px] border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button
                onClick={handleTrackOrder}
                className="btn-gradient fw-cta px-6 py-2 rounded-xl"
              >
                <Search className="w-4 h-4 mr-2" />
                Track Order
              </Button>
            </div>
          </motion.div>
        </motion.div>

        <PrintInvoice order={orderDetails?.order} />
        </>
      )}
    </div>
  );
}


