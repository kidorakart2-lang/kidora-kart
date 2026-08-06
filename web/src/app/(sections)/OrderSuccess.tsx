"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import dynamic from "next/dynamic";
import {
  ShoppingBag,
  ArrowRight,
  CreditCard,
  Clock,
  Gift,
  Mail,
  Phone,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOrderById } from "@/lib/orderService";
import type {
  OrderData,
  OrderDetailApiResponse,
} from "@/types/order";

import FallbackCheckmark from "@/components/order/FallbackCheckmark";
import OrderSuccessItemsList from "@/components/order/OrderSuccessItemsList";
import OrderSuccessTimeline from "@/components/order/OrderSuccessTimeline";
import ErrorBoundary from "@/components/order/ErrorBoundary";
import LottieTimeout from "@/components/order/LottieTimeout";

/* ── Client-only Lottie (SSR crashes WebGL) ────────────────────────── */
const SuccessLottie = dynamic(() => import("@/components/SuccessLottie"), {
  ssr: false,
});

/* ── Helpers ───────────────────────────────────────────────────────── */
function estimatedDelivery(createdAt: string) {
  try {
    const d = new Date(createdAt);
    d.setDate(d.getDate() + 5 + Math.floor(Math.random() * 3));
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  } catch {
    return "5–7 business days";
  }
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main Page                                                         */
/* ═══════════════════════════════════════════════════════════════════ */
export default function OrderSuccess() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const packageId = searchParams.get("packageId");

  const [order, setOrder] = useState<OrderData | null>(null);
  const [lottieFailed, setLottieFailed] = useState(false);
  const [phase, setPhase] = useState<"splash" | "slideUp" | "reveal">("splash");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* ── Fetch order ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = (await getOrderById(orderId)) as OrderDetailApiResponse;
        if (!cancelled) setOrder(res.order ?? null);
      } catch (err) {
        console.error("Failed to load order:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  /* ── Phase: splash → slideUp → reveal ────────────────────────────── */
  const startSlideUp = useCallback(() => setPhase("slideUp"), []);
  const startReveal = useCallback(() => setPhase("reveal"), []);

  const handleLottieComplete = useCallback(() => {
    if (phase === "splash") startSlideUp();
  }, [phase, startSlideUp]);

  useEffect(() => {
    const t = setTimeout(() => startSlideUp(), 4000);
    return () => clearTimeout(t);
  }, [startSlideUp]);

  /* ── After slide-up animation ends, fully remove the splash layer ── */
  useEffect(() => {
    if (phase !== "slideUp") return;
    const t = setTimeout(() => startReveal(), 700);
    return () => clearTimeout(t);
  }, [phase, startReveal]);

  /* ── Lottie load error → show fallback ───────────────────────────── */
  const handleLottieError = useCallback(() => {
    setLottieFailed(true);
    setTimeout(() => startSlideUp(), 2000);
  }, [startSlideUp]);

  /* ── Audio ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!audioRef.current || !order) return;
    const tryPlay = async () => {
      try {
        await audioRef.current?.play();
      } catch {}
    };
    tryPlay();
    const onInteract = () => {
      tryPlay();
      window.removeEventListener("click", onInteract);
      window.removeEventListener("touchstart", onInteract);
    };
    window.addEventListener("click", onInteract);
    window.addEventListener("touchstart", onInteract);
    return () => {
      window.removeEventListener("click", onInteract);
      window.removeEventListener("touchstart", onInteract);
    };
  }, [order]);

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  SPLASH — Full-screen celebration overlay, slides up to exit   */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {phase !== "reveal" && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 overflow-hidden"
          initial={{ y: 0 }}
          animate={
            phase === "slideUp"
              ? { y: "-100vh", transition: { duration: 0.7, ease: [0.65, 0, 0.35, 1] } }
              : { y: 0 }
          }
        >
          {/* Ambient blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl" />
            <div className="absolute top-1/3 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          </div>

          {/* Lottie / Fallback */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {lottieFailed ? (
              <FallbackCheckmark />
            ) : (
              <div className="relative">
                <ErrorBoundary onError={handleLottieError}>
                  <SuccessLottie
                    width={240}
                    height={240}
                    onComplete={handleLottieComplete}
                  />
                </ErrorBoundary>
                <LottieTimeout ms={3000} onTimeout={handleLottieError} />
              </div>
            )}
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center mt-6"
          >
             <h1 className="text-3xl md:text-4xl fw-heading text-white mb-2">
              Order Placed!
            </h1>
            <p className="text-amber-100/80">
              Confirming your order...
            </p>
            <Badge className="mt-3 bg-white/15 text-white border-white/20 px-4 py-1.5 text-xs font-mono">
              {orderId}
            </Badge>
          </motion.div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  MAIN CONTENT — Standard e-commerce layout                     */}
      {/*  Always rendered behind splash; animates in as splash lifts     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.div
        className="min-h-screen bg-gradient-to-b from-background to-brand-50/30"
        initial={false}
        animate={
          phase === "reveal"
            ? { opacity: 1 }
            : { opacity: 0.3 }
        }
        transition={{ duration: 0.5 }}
      >
        {/* ── Success header ──────────────────────────────────────── */}
        <motion.div
          className="pt-10 sm:pt-14 pb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={phase === "reveal" ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: phase === "reveal" ? 0.1 : 0, duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 18,
              delay: 0.2,
            }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center shadow-lg shadow-amber-200/50"
          >
            <Check className="w-8 h-8 text-amber-600" strokeWidth={3} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
             className="text-3xl md:text-4xl fw-heading text-foreground tracking-tight"
          >
            Thank you for your order!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-sm mt-2"
          >
            We&apos;ll send you a confirmation when your order ships.
          </motion.p>
          {orderId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Badge
                variant="outline"
                className="mt-3 text-xs font-mono border-brand-200 text-brand-700"
              >
                {orderId}
              </Badge>
            </motion.div>
          )}
        </motion.div>

        {/* Decorative divider */}
        <motion.div
          className="h-px bg-gradient-to-r from-transparent via-brand-200/50 to-transparent max-w-2xl mx-auto"
          initial={{ scaleX: 0 }}
          animate={phase === "reveal" ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
        />

        {/* ── Order details ──────────────────────────────────────── */}
        {order && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
              {/* ── Left column: Items + Address + Gift ─────────── */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Timeline */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={phase === "reveal" ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                  transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                  className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-background flex items-center justify-center text-sm font-medium shadow-sm">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-base">
                        Order Progress
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Estimated delivery by {estimatedDelivery(order.createdAt)}
                      </p>
                    </div>
                    <span className="ml-auto flex items-center gap-1.5 text-xs text-brand-600 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {estimatedDelivery(order.createdAt)}
                    </span>
                  </div>
                  <OrderSuccessTimeline status={order.status} />
                </motion.div>

                {/* Items */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={phase === "reveal" ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                  transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                  className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-background flex items-center justify-center text-sm font-medium shadow-sm">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-base">
                        Your Items
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {order.items.length}{" "}
                        {order.items.length === 1 ? "item" : "items"} in this
                        order
                      </p>
                    </div>
                  </div>
                  <OrderSuccessItemsList items={order.items} />
                </motion.div>

                {/* Shipping Address */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={phase === "reveal" ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                  transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
                  className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-background flex items-center justify-center text-sm font-medium shadow-sm">
                      3
                    </div>
                    <h3 className="font-semibold text-foreground text-base">
                      Delivery Address
                    </h3>
                  </div>
                  <div className="bg-muted p-4 rounded-xl">
                    <p className="font-medium text-foreground text-sm">
                      {order.shippingAddress.fullName}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.shippingAddress.street},{" "}
                      {order.shippingAddress.area}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state} -{" "}
                      {order.shippingAddress.pincode}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {order.shippingAddress.phone}
                      </span>
                      {order.shippingAddress.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {order.shippingAddress.email}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Gift Message */}
                {order.isGift && order.giftMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={phase === "reveal" ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                    transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
                    className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-brand-100 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-brand-accent-100 text-brand-accent-700 flex items-center justify-center">
                        <Gift className="w-4 h-4" />
                      </div>
                      <h3 className="font-semibold text-foreground text-base">
                        Gift Message
                      </h3>
                    </div>
                    <div className="bg-brand-accent-50 border-l-4 border-brand-accent-400 rounded-r-lg p-4 italic text-brand-accent-700 text-sm">
                      &ldquo;{order.giftMessage}&rdquo;
                    </div>
                  </motion.div>
                )}
              </div>

              {/* ── Right column: Order Summary (sticky) ───────── */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={phase === "reveal" ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                  transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
                  className="bg-background rounded-2xl p-6 sm:p-8 shadow-xl border border-brand-100 sticky top-6"
                >
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-1.5 h-5 rounded-full bg-brand-600" />
                    <h3 className="font-semibold text-foreground text-base">
                      Order Summary
                    </h3>
                  </div>

                  {/* Price breakdown */}
                  <div className="space-y-3 py-4 border-y border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">
                        ₹{order.pricing.subtotal}
                      </span>
                    </div>
                    {order.pricing.discount?.amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-600">Discount</span>
                        <span className="text-amber-600">
                          -₹{order.pricing.discount.amount}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-foreground">
                        {order.pricing.shipping > 0
                          ? `₹${order.pricing.shipping}`
                          : "Free"}
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between items-baseline pt-4">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-2xl fw-heading text-brand-600">
                      ₹{order.pricing.total}
                    </span>
                  </div>

                  {/* Payment method */}
                  <div className="mt-5 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="w-4 h-4" />
                      <span>
                        Paid via{" "}
                        <span className="font-medium text-foreground">
                          {order.payment.method === "COD"
                            ? "Cash on Delivery"
                            : order.payment.method}
                        </span>
                      </span>
                    </div>
                    {order.payment.codAdvance &&
                      order.pricing.advance > 0 && (
                        <p className="text-xs text-amber-600 mt-1 ml-6">
                          Advance paid: ₹{order.pricing.advance}
                        </p>
                      )}
                  </div>

                  {/* Package ID */}
                  {packageId && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">
                        Package ID
                      </p>
                      <p className="text-sm font-mono font-medium text-foreground">
                        {packageId}
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-6 space-y-3">
                    <Button
                      onClick={() =>
                        (window.location.href = "/profile?tab=orders")
                      }
                       className="w-full h-12 btn-gradient fw-cta rounded-xl shadow-sm group"
                    >
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      View My Orders
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <Button
                      onClick={() => (window.location.href = "/")}
                      variant="outline"
                      className="w-full h-12 border-2 border-brand-200 hover:border-brand-400 hover:bg-brand-50/50 text-foreground fw-cta rounded-xl"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        )}

        {/* ── Loading state ─────────────────────────────────────── */}
        {!order && (
          <div className="max-w-7xl mx-auto px-4 py-16 text-center">
            <p className="text-muted-foreground text-sm">
              Loading order details...
            </p>
          </div>
        )}
      </motion.div>
    </>
  );
}
