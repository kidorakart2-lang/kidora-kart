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
import { getAuthToken } from "@/lib/cookies";
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
      if (window.Razorpay) return true;
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      const loaded = await new Promise<boolean>((resolve) => {
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
      });
      if (loaded || window.Razorpay) return true;
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
        name: "Ratnavya",
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

      const RazorpayConstructor = window.Razorpay!;
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
      const token = getAuthToken();
      const res = await fetch(`/api/website/shipping/track/${orderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-white px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="display-heading mb-2 text-2xl">Order Not Found</h2>
          <p className="mb-6 text-sm text-[var(--brand-ink)]/60">
            We couldn&apos;t find an order with that ID. Please check and try again.
          </p>
          <Button onClick={() => setSearchOrderId("")} className="btn-gold !text-[11px] uppercase tracking-[0.18em]">
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
    <div className="min-h-screen bg-white px-4 py-10 md:px-8 md:py-14">
      {effectiveOrderId == "" || !effectiveOrderId ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <p className="eyebrow mb-2"><span className="mr-2">✦</span>Order concierge</p>
          <h1 className="display-heading mb-2 text-3xl md:text-4xl">Track Your <span className="accent-italic">Order</span></h1>
          <p className="mb-6 text-sm text-[var(--brand-ink)]/60">
            Enter your order details to see its current status. <br />
            <span className="text-[11.5px] text-[var(--brand-ink)]/45">
              You can also check your order status in your profile.
            </span>
          </p>

          <div className="mb-10 rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 sm:p-8">
            <div className="mb-4">
              <Label className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/55">
                Order Number
              </Label>
              <Input
                type="text"
                placeholder="ORD-1234567890-ABC123"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTrackOrder()}
                className="w-full rounded-lg border border-[var(--brand-gold)]/30 bg-white px-4 py-2.5 text-[var(--brand-ink)] transition-all focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30"
              />
            </div>
            <Button
              onClick={handleTrackOrder}
              className="btn-gold px-6 py-2.5 !text-[11px] uppercase tracking-[0.18em]"
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
            className="rounded-xl border border-[var(--brand-gold)]/30 bg-white p-6 sm:p-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-0">
                <p className="eyebrow mb-1.5 text-[10px]"><span className="mr-1.5">✦</span>Order details</p>
                <h1 className="display-heading mb-2 text-2xl md:text-3xl">
                  Order {orderDetails?.order?.orderId}
                </h1>

                {/* AWB / Tracking Number — prominent badge */}
                {orderDetails?.order?.shipping?.trackingNumber && (
                  <div className="mb-3 inline-flex flex-wrap items-center gap-2 rounded-lg border border-[var(--brand-gold)]/35 bg-[var(--brand-gold)]/10 px-4 py-2 text-[var(--brand-gold-dark)]">
                    <Package className="h-4 w-4" />
                    <span className="text-[10px] uppercase tracking-[0.14em]">AWB</span>
                    <span className="font-mono text-[12.5px] tracking-wide">
                      {orderDetails.order.shipping.trackingNumber}
                    </span>
                    {orderDetails?.order?.shipping?.trackingUrl && (
                      <a
                        href={orderDetails.order.shipping.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 inline-flex items-center gap-1 text-[11px] text-[var(--brand-plum)] underline decoration-[var(--brand-gold)]/60 underline-offset-4 hover:no-underline"
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
                    <div className="inline-flex flex-col rounded-lg border border-[var(--brand-gold)]/35 bg-[var(--brand-cream)] px-4 py-2 text-[var(--brand-ink)]">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-[var(--brand-gold-dark)]" />
                        <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/55">
                          Estimated delivery
                        </span>
                        <span className="text-[12.5px]">
                          {new Date(orderDetails.order.shipping.estimatedDelivery).toLocaleDateString("en-IN", {
                            weekday: "short",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {orderDetails?.order?.shipping?.carrier && (
                        <p className="mt-0.5 text-[10px] text-[var(--brand-ink)]/45">
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
                    <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10 px-4 py-2 text-[var(--brand-gold-dark)]">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-[10px] uppercase tracking-[0.14em]">
                        Delivered
                      </span>
                      <span className="text-[12.5px]">
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

                <p className="mt-2 flex items-center gap-2 text-[11.5px] text-[var(--brand-ink)]/50">
                  <Clock className="h-3.5 w-3.5" />
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
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-gold)]/35 px-3.5 py-2 text-[11px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/60 transition-colors hover:bg-[var(--brand-cream)]"
                  title="Print invoice"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                {orderDetails?.order?.shipping?.carrier && orderDetails?.order?.status !== "delivered" && !isCancelled && (
                  <div className="rounded-full border border-[var(--brand-mauve)]/30 bg-[var(--brand-rose)]/25 px-3.5 py-2" title={`Courier: ${orderDetails.order.shipping.carrier}`}>
                    <p className="flex items-center gap-1.5 whitespace-nowrap text-[11px] uppercase tracking-[0.12em] text-[var(--brand-plum)]/75">
                      <Truck className="h-3.5 w-3.5" />
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
                  <div className="rounded-full border border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10 px-4 py-2">
                    <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--brand-gold-dark)]">
                      <CheckCircle className="h-4 w-4" />
                      Delivered Successfully
                    </p>
                  </div>
                )}
                {isPaymentFailed && (
                  <div className="rounded-full border border-[var(--brand-gold)]/25 bg-[var(--brand-cream)] px-4 py-2">
                    <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--brand-ink)]/65">
                      <AlertTriangle className="h-4 w-4" />
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
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }} className="rounded-xl border border-destructive/25 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center"><XCircle className="w-8 h-8 text-destructive" /></div>
                <div>
                  <h3 className="display-heading text-xl">Order Cancelled</h3>
                  <p className="mt-1 text-[12px] text-[var(--brand-ink)]/55">This order was cancelled on {new Date(orderDetails?.order?.statusHistory?.find((s) => s.status === "cancelled")?.timestamp || orderDetails?.order?.updatedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</p>
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
              className="rounded-xl border border-destructive/25 bg-white p-6 sm:p-8"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <p className="text-[12.5px] text-[var(--brand-ink)]/60">
                    Your payment was unsuccessful. Please retry to complete your purchase.
                  </p>
                </div>
                <Button
                  onClick={handleRetryPayment}
                  disabled={retryLoading}
                  className="btn-gold shrink-0 !text-[11px] uppercase tracking-[0.16em]"
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
              className="rounded-xl border border-[var(--brand-gold)]/35 bg-white p-4 sm:p-6"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[var(--brand-gold-dark)]" />
                  <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--brand-gold-dark)]">
                    Delivered on
                  </span>
                </div>
                <span className="text-[12.5px] text-[var(--brand-ink)]">
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
            className="rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 sm:p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="grid size-8 place-items-center rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10 text-[12px] text-[var(--brand-gold-dark)]">
                3
              </div>
              <h2 className="display-heading text-lg">
                Payment Details
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--brand-ink)]/55">Payment Method</span>
                <span className="font-medium text-foreground">
                  {orderDetails?.order?.payment?.method === "COD"
                    ? "Cash on Delivery"
                    : orderDetails?.order?.payment?.method}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--brand-ink)]/55">Payment Status</span>
                <span className="font-medium text-foreground capitalize">
                  {orderDetails?.order?.payment?.status?.replace("_", " ")}
                </span>
              </div>
              {orderDetails?.order?.payment?.codAdvance && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--brand-ink)]/55">Advance Paid</span>
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
            className="rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 sm:p-8"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="grid size-8 place-items-center rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10 text-[12px] text-[var(--brand-gold-dark)]">
                    5
                  </div>
                  <h2 className="display-heading text-lg">
                    Shipping Address
                  </h2>
                </div>
                <div className="rounded-lg border border-[var(--brand-gold)]/20 bg-[var(--brand-cream)] p-4">
                  <address className="space-y-1 text-[12.5px] not-italic text-[var(--brand-ink)]/65">
                    <p className="display-heading text-[14px] italic text-[var(--brand-ink)]">
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
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--brand-gold)]/25 pt-3 text-[11px] text-[var(--brand-ink)]/45">
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
                    <div className="grid size-8 place-items-center rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10 text-[12px] text-[var(--brand-gold-dark)]">
                      6
                    </div>
                    <h2 className="display-heading text-lg">
                      Delivery Info
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {orderDetails?.order?.shippingAddress?.instructions && (
                      <div className="rounded-r-lg border-l-2 border-[var(--brand-gold)]/40 bg-[var(--brand-cream)] p-4">
                        <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/50">
                          Delivery Instructions
                        </p>
                        <p className="text-[12px] text-[var(--brand-ink)]/65">
                          {orderDetails?.order?.shippingAddress?.instructions}
                        </p>
                      </div>
                    )}

                    <div className="rounded-r-lg border-l-2 border-[var(--brand-gold)]/40 bg-[var(--brand-cream)] p-4">
                      <p className="mb-1 text-[10px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/50">
                        Package ID
                      </p>
                      <p className="font-mono text-[12px] text-[var(--brand-ink)]/70">
                        {orderDetails?.order?.packageId}
                      </p>
                    </div>

                    {orderDetails?.order?.shipping?.carrier && (
                      <>
                        {/* Shipping Estimate — richer details */}
                        <div className="rounded-r-lg border-l-2 border-[var(--brand-gold)] bg-[var(--brand-cream)] p-4">
                          <p className="mb-2 flex items-center gap-2 text-[12.5px] text-[var(--brand-ink)]">
                            <Truck className="w-4 h-4" />
                            Shipping Estimate
                          </p>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--brand-ink)]/55">Courier Partner</span>
                              <span className="text-[var(--brand-ink)]">{orderDetails.order.shipping.carrier}</span>
                            </div>
                            {orderDetails.order.shipping.estimatedDelivery && (
                              <div className="flex items-center justify-between">
                                <span className="text-[var(--brand-ink)]/55">Estimated Delivery</span>
                                <span className="text-[var(--brand-gold-dark)]">
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
                          <div className="rounded-r-lg border-l-2 border-[var(--brand-mauve)]/60 bg-[var(--brand-rose)]/20 p-4">
                            <p className="mb-2 flex items-center gap-2 text-[12.5px] text-[var(--brand-plum)]">
                              <Package className="w-4 h-4" />
                              Shipment Tracking
                            </p>

                            <div className="space-y-1.5 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-[var(--brand-ink)]/55">AWB Number</span>
                                <span className="font-mono text-[12px] text-[var(--brand-ink)]">
                                  {orderDetails.order.shipping.trackingNumber}
                                </span>
                              </div>

                              {orderDetails.order.shipping.carrier && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[var(--brand-ink)]/55">Courier</span>
                                  <span className="text-[var(--brand-ink)]">{orderDetails.order.shipping.carrier}</span>
                                </div>
                              )}

                              {orderDetails.order.shipping.shippedAt && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[var(--brand-ink)]/55">Shipped On</span>
                                  <span className="text-[var(--brand-ink)]">
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
                              <div className="mt-2 flex animate-pulse items-center gap-2 text-[11px] text-[var(--brand-ink)]/50">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Fetching tracking updates...
                              </div>
                            )}

                            {trackingData && (
                              <div className="mt-2 border-t border-[var(--brand-mauve)]/25 pt-2">
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
                                className="mt-2 inline-flex items-center gap-1 text-[11px] text-[var(--brand-plum)] underline decoration-[var(--brand-gold)]/60 underline-offset-4 hover:no-underline"
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
                <div className="rounded-r-lg border-l-2 border-[var(--brand-gold)] bg-[var(--brand-cream)] p-4">
                  <p className="mb-1 text-[12.5px] text-[var(--brand-ink)]">
                    Your Note
                  </p>
                  <p className="text-[12px] text-[var(--brand-ink)]/65">
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
            className="rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 sm:p-8"
          >
            <h2 className="display-heading mb-4 text-lg">
              Track Another Order
            </h2>
            <div className="flex gap-3 flex-wrap">
              <Input
                type="text"
                placeholder="Enter Order Number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTrackOrder()}
                className="min-w-[200px] flex-1 rounded-lg border border-[var(--brand-gold)]/30 bg-white px-4 py-2.5 text-[var(--brand-ink)] transition-all focus:border-[var(--brand-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/30"
              />
              <Button
                onClick={handleTrackOrder}
                className="btn-gold px-6 py-2.5 !text-[11px] uppercase tracking-[0.18em]"
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


