"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useOrderById } from "@/lib/useOrders";
import { retryPayment, verifyPayment } from "@/lib/orderService";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { LoadingUi } from "./Cart";
import { siteConfig } from "@/lib/utils";
import { motion } from "motion/react";
import {
  Package,
  CheckCircle,
  Truck,
  MapPin,
  Clock,
  XCircle,
  Gift,
  FileText,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Check,
  CreditCard,
  Phone,
  Mail,
  Search,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { getAuthToken } from "@/lib/getAuthToken";
import type { OrderTrackingResponse } from "@/types";

export default function OrderTracking() {
  const [orderNumber, setOrderNumber] = useState("");
  const [searchOrderId, setSearchOrderId] = useState<string>("");
  const [retryLoading, setRetryLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<Record<string, unknown> | null>(null);
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
        const json = await res.json() as { success: boolean; data?: Record<string, unknown> };
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "confirmed":
        return <CheckCircle className="w-5 h-5" />;
      case "shipped":
        return <Truck className="w-5 h-5" />;
      case "delivered":
        return <Package className="w-5 h-5" />;
      case "cancelled":
        return <XCircle className="w-5 h-5" />;
      case "payment_failed":
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string, isActive: boolean, isCompleted: boolean) => {
    if (status === "cancelled") {
      return "bg-destructive text-destructive-foreground";
    }
    if (status === "payment_failed") {
      return "bg-destructive text-destructive-foreground";
    }
    if (isActive) {
      return "bg-foreground text-background";
    }
    if (isCompleted) {
      return "bg-emerald-500 text-background";
    }
    return "bg-muted text-muted-foreground";
  };

  const getProgressWidth = (status: string) => {
    if (status === "cancelled") return "0%";
    if (status === "pending") return "0%";
    if (status === "confirmed") return "33%";
    if (status === "shipped") return "66%";
    if (status === "delivered") return "100%";
    return "0%";
  };
  if (isLoading) {
    return <LoadingUi hidden={isLoading} />;
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

          {/* Order Status Timeline — white card */}
          {!isCancelled && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
              className={`bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-border transition-all hover:shadow-md ${isPaymentFailed ? "opacity-70" : ""}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium shadow-sm">
                  1
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-base">
                    Order Status
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tracking your order progress
                  </p>
                </div>
              </div>
              <div className="relative">
                {/* Desktop Timeline */}
                <div className="hidden md:block">
                  <div className="flex items-center justify-between mb-8 relative">
                    {/* Progress Line */}
                    <div className="absolute top-5 left-0 right-0 h-1 bg-muted mx-5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: getProgressWidth(
                            orderDetails?.order?.status ?? "pending"
                          ),
                        }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-emerald-500"
                      />
                    </div>

                    {/* Status Points */}
                    {["pending", "confirmed", "shipped", "delivered"].map(
                      (status, index) => {
                        const statusItem =
                          orderDetails?.order?.statusHistory.find(
                            (s) => s.status === status
                          );
                        const isActive = !!(
                          statusItem &&
                          statusItem.status === orderDetails?.order?.status
                        );
                        const isCompleted =
                          orderDetails?.order?.statusHistory.some(
                            (s) => s.status === status
                          ) ?? false;

                        return (
                          <motion.div
                            key={status}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1 * index }}
                            className="flex flex-col items-center relative z-10"
                          >
                            <motion.div
                              animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${getStatusColor(
                                status,
                                isActive,
                                isCompleted
                              )}`}
                            >
                              {getStatusIcon(status)}
                            </motion.div>
                            <span className="text-sm font-medium mt-2 capitalize">
                              {status}
                            </span>
                            {statusItem && (
                              <span className="text-xs text-muted-foreground mt-1">
                                {new Date(
                                  statusItem.timestamp
                                ).toLocaleDateString("en-IN")}
                              </span>
                            )}
                          </motion.div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Mobile Timeline */}
                <div className="md:hidden space-y-4">
                  {["pending", "confirmed", "shipped", "delivered"].map(
                    (status, index) => {
                      const statusItem =
                        orderDetails?.order?.statusHistory.find(
                          (s) => s.status === status
                        );
                      const isActive = !!(
                        statusItem &&
                        statusItem.status === orderDetails?.order?.status
                      );
                      const isCompleted =
                        orderDetails?.order?.statusHistory.some(
                          (s) => s.status === status
                        ) ?? false;

                      return (
                        <motion.div
                          key={status}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="flex items-center gap-4"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(
                              status,
                              isActive,
                              isCompleted
                            )}`}
                          >
                            {getStatusIcon(status)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium capitalize">{status}</p>
                            {statusItem && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(
                                  statusItem.timestamp
                                ).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    }
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Cancelled Status — white card */}
          {isCancelled && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
              className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-destructive/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Order Cancelled</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This order was cancelled on{" "}
                    {new Date(
                      orderDetails?.order?.statusHistory?.find(
                        (s) => s.status === "cancelled"
                      )?.timestamp || orderDetails?.order?.updatedAt
                    ).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
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
          )}

          {/* Order Items — white card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
            className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-border transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium shadow-sm">
                2
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-base">
                  Order Items
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {orderDetails?.order?.items?.length ?? 0} items in this order
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {orderDetails?.order?.items?.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-4 p-3 bg-muted rounded-xl hover:bg-muted/80 transition-colors"
                >
                  <Link href={`/product-details/${item.productId.slug}`}>
                    <div className="w-24 h-24 bg-background rounded-lg overflow-hidden shadow-sm flex-shrink-0 border border-border">
                      <Image
                        src={item.images?.[0] || "/placeholder.jpg"}
                        alt={item.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 flex-wrap">
                      <span className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </span>
                      <span className="text-lg font-semibold text-foreground">
                        ₹{item.priceAtPurchase.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                      <span>Color :</span>{" "}
                      <span
                        style={{
                          backgroundColor: `${item?.colorId?.code}`,
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          display: "inline-block",
                          marginRight: "5px",
                        }}
                      ></span>{" "}
                      {item?.colorId?.name}
                    </p>
                    {item?.sizeId && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span>Size :</span> {item?.sizeId?.name}
                      </p>
                    )}
                    {item.isPersonalized && item.personalizedName && (
                      <p className="text-sm text-muted-foreground mt-2 bg-muted px-2 py-1 rounded inline-block">
                        <span className="font-medium">Personalized:</span>{" "}
                        <span className="text-foreground">
                          {item.personalizedName}
                        </span>
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {orderDetails?.order?.isGift && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg"
              >
                <div className="flex items-start gap-2">
                  <Gift className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">Gift Order</p>
                    {orderDetails?.order?.giftMessage && (
                      <p className="text-sm text-blue-700 mt-1">
                        <span className="font-medium">Message:</span>{" "}
                        {orderDetails?.order?.giftMessage}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

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

          {/* Refund Status — white card */}
          {orderDetails?.order?.status === "cancelled" &&
            orderDetails?.order?.cancellation && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5, ease: "easeOut" }}
                className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-border transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                    <XCircle className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-foreground text-base">
                    Cancellation Details
                  </h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reason</span>
                    <span className="font-medium text-foreground">
                      {orderDetails.order.cancellation.reason || "Not specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cancelled On</span>
                    <span className="font-medium text-foreground">
                      {new Date(
                        orderDetails.order.cancellation.cancelledAt
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  {orderDetails.order.cancellation.refundStatus && (
                    <>
                      <div className="border-t border-border my-3"></div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Refund Status</span>
                        <span
                          className={`font-medium ${
                            orderDetails.order.cancellation.refundStatus ===
                            "completed"
                              ? "text-emerald-600"
                              : orderDetails.order.cancellation
                                  .refundStatus === "failed"
                              ? "text-destructive"
                              : "text-foreground"
                          }`}
                        >
                          {orderDetails.order.cancellation.refundStatus
                            .charAt(0)
                            .toUpperCase() +
                            orderDetails.order.cancellation.refundStatus.slice(
                              1
                            )}
                        </span>
                      </div>

                      {orderDetails.order.cancellation.refundAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Refund Amount</span>
                          <span className="font-medium text-foreground">
                            ₹
                            {orderDetails.order.cancellation.refundAmount.toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        </div>
                      )}

                      {orderDetails.order.cancellation.refundedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Processed On</span>
                          <span className="font-medium text-foreground">
                            {new Date(
                              orderDetails.order.cancellation.refundedAt
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {orderDetails.order.cancellation.refundError && (
                        <div className="mt-2 p-2 bg-destructive/10 text-destructive text-sm rounded-lg">
                          <span className="font-medium">Refund Error:</span>{" "}
                          {orderDetails.order.cancellation.refundError}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </motion.div>
            )}

          {/* Order Summary — white card, sticky */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
            className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-border transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium shadow-sm">
                4
              </div>
              <h2 className="font-semibold text-foreground text-base">
                Order Summary
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">
                  ₹
                  {orderDetails?.order?.pricing?.subtotal?.toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-foreground">
                  {orderDetails?.order?.pricing?.shipping?.toLocaleString(
                    "en-IN"
                  ) === "0"
                    ? "Free"
                    : `₹${orderDetails?.order?.pricing?.shipping?.toLocaleString("en-IN")}`}
                </span>
              </div>
              {orderDetails?.order?.pricing?.discount?.amount != null &&
                orderDetails.order.pricing.discount.amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600">Discount</span>
                  <span className="text-emerald-600">
                    -₹
                    {orderDetails?.order?.pricing?.discount?.amount?.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
              )}
              {orderDetails?.order?.payment?.codAdvance && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Left</span>
                  <span className="text-foreground">
                    ₹
                    {orderDetails?.order?.pricing.total -
                      orderDetails?.order?.pricing.advance}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-3 border-t border-border">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">
                  ₹
                  {orderDetails?.order?.pricing?.total?.toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>
            </div>
          </motion.div>

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
                                  shiprocketTracking={trackingData.shiprocketTracking as Record<string, unknown> | null}
                                  currentStatus={trackingData.currentStatus as string}
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

        {/* ── Print-only Invoice Section ── */}
        <div className="print-only bg-white" id="print-invoice">
            {/* Company Header */}
            <div className="border-b-2 border-black pb-4 mb-6">
              <h1 className="text-2xl font-bold mb-1">{siteConfig.name}</h1>
              <p className="text-sm text-gray-600">Order Invoice</p>
            </div>

            {/* Order Info Bar */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Order Number</p>
                  <p className="font-semibold">{orderDetails?.order?.orderId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Order Date</p>
                  <p className="font-semibold">
                    {new Date(orderDetails?.order?.createdAt ?? "").toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Tracking / AWB Info */}
            {orderDetails?.order?.shipping?.trackingNumber && (
              <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-indigo-600" />
                  <div>
                    <p className="text-xs text-gray-600 uppercase font-semibold">AWB / Tracking ID</p>
                    <p className="text-lg font-bold text-indigo-900">
                      {orderDetails.order.shipping.trackingNumber}
                    </p>
                  </div>
                </div>
                {orderDetails.order.shipping.carrier && (
                  <p className="text-xs text-indigo-700 mt-1">
                    Courier: {orderDetails.order.shipping.carrier}
                  </p>
                )}
                {orderDetails.order.shipping.trackingUrl && (
                  <p className="text-xs text-indigo-700 mt-1">
                    Track at: {orderDetails.order.shipping.trackingUrl}
                  </p>
                )}
              </div>
            )}

            {/* Package ID */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Package ID</p>
                  <p className="text-lg font-bold text-blue-900">{orderDetails?.order?.packageId}</p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase text-gray-700 mb-3 pb-1 border-b border-gray-300">
                Shipping Address
              </h3>
              <div className="text-sm space-y-1">
                <p className="font-semibold">{orderDetails?.order?.shippingAddress?.fullName}</p>
                <p>{orderDetails?.order?.shippingAddress?.street}</p>
                <p>{orderDetails?.order?.shippingAddress?.area}</p>
                <p>{orderDetails?.order?.shippingAddress?.city}, {orderDetails?.order?.shippingAddress?.state} {orderDetails?.order?.shippingAddress?.pincode}</p>
                <p>India</p>
                <p className="pt-2">Phone: {orderDetails?.order?.shippingAddress?.phone}</p>
                <p>Email: {orderDetails?.order?.shippingAddress?.email}</p>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase text-gray-700 mb-3 pb-1 border-b border-gray-300">
                Order Items
              </h3>
              <table className="print-only-table w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-y border-gray-300">
                    <th className="text-left py-3 px-2 font-semibold">Product</th>
                    <th className="text-center py-3 px-2 font-semibold">Qty</th>
                    <th className="text-right py-3 px-2 font-semibold">Price</th>
                    <th className="text-right py-3 px-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails?.order?.items?.map((item, i) => (
                    <tr key={i} className="border-b border-gray-200">
                      <td className="py-3 px-2">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">Color: {item.colorId?.name}</p>
                        {item.sizeId && <p className="text-xs text-gray-500">Size: {item.sizeId.name}</p>}
                        {item.isPersonalized && item.personalizedName && (
                          <p className="text-xs text-gray-500">Personalized: {item.personalizedName}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">{item.quantity}</td>
                      <td className="py-3 px-2 text-right">₹{item.priceAtPurchase?.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-2 text-right font-semibold">
                        ₹{(item.priceAtPurchase * item.quantity)?.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order Summary */}
            <div className="flex justify-end mb-6">
              <div className="w-80">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">₹{orderDetails?.order?.pricing?.subtotal?.toLocaleString("en-IN")}</span>
                  </div>
                  {(orderDetails?.order?.pricing?.discount?.amount ?? 0) > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Discount:</span>
                      <span className="font-semibold text-green-600">
                        -₹{orderDetails?.order?.pricing?.discount?.amount?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-semibold">
                      {(orderDetails?.order?.pricing?.shipping ?? 0) > 0
                        ? `₹${orderDetails?.order?.pricing?.shipping?.toLocaleString("en-IN")}`
                        : "FREE"}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-gray-300 text-base">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-lg">₹{orderDetails?.order?.pricing?.total?.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mb-6 text-sm text-gray-600">
              <p>Payment Method: {orderDetails?.order?.payment?.method === "COD" ? "Cash on Delivery" : orderDetails?.order?.payment?.method}</p>
              <p>Payment Status: <span className="capitalize">{orderDetails?.order?.payment?.status?.replace("_", " ")}</span></p>
            </div>

            {/* Customer Note */}
            {orderDetails?.order?.notes?.customer && (
              <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                <h4 className="font-semibold text-sm mb-2">Customer Note:</h4>
                <p className="text-sm text-gray-700">{orderDetails.order.notes.customer}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t-2 border-gray-200 pt-6 mt-6">
              <div className="text-center space-y-2">
                <p className="font-semibold">Thank you for your order!</p>
                <p className="text-sm text-gray-600">
                  Questions? Contact us at {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@kidorakart.com"}
                </p>
                <p className="text-xs text-gray-500 mt-4">
                  This is a computer-generated invoice and does not require a signature.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ShiprocketTrackingStatus({
  shiprocketTracking,
  currentStatus,
}: {
  shiprocketTracking: Record<string, unknown> | null;
  currentStatus: string;
}) {
  const status =
    (shiprocketTracking?.status as string) || currentStatus || "Pending";
  const isDelivered = status === "Delivered";
  const isInTransit =
    status === "In Transit" || status === "Out for Delivery";
  const edd = shiprocketTracking?.EDD as string | undefined;

  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-indigo-600">Status:</span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
            isDelivered
              ? "bg-green-100 text-green-800"
              : isInTransit
                ? "bg-blue-100 text-blue-800"
                : "bg-amber-100 text-amber-800"
          }`}
        >
          {status}
        </span>
      </div>
      {edd && (
        <p className="text-xs text-indigo-600">
          EDD:{" "}
          {new Date(edd).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          })}
        </p>
      )}
    </div>
  );
}
