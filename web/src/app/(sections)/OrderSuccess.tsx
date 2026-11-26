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
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-[#14100f]"
          initial={{ y: 0 }}
          animate={
            phase === "slideUp"
              ? { y: "-100vh", transition: { duration: 0.7, ease: [0.65, 0, 0.35, 1] } }
              : { y: 0 }
          }
        >
          {/* Ambient blobs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[var(--brand-gold)]/15 blur-3xl" />
            <div className="absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-[var(--brand-mauve)]/15 blur-3xl" />
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
            <p className="eyebrow mb-2">
              <span className="mr-2">✦</span>
              Your next treasure
            </p>
            <h1 className="display-heading mb-2 text-3xl text-[var(--brand-cream)] md:text-4xl">
              Order Placed!
            </h1>
            <p className="text-[var(--brand-cream)]/60">
              Confirming your order...
            </p>
            <Badge className="mt-3 border border-[var(--brand-gold)]/45 bg-transparent px-4 py-1.5 font-mono text-[11px] text-[var(--brand-gold)]">
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
        className="min-h-screen bg-white"
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
            className="mx-auto mb-4 grid size-16 place-items-center rounded-full border border-[var(--brand-gold)]/50 bg-white text-[var(--brand-gold-dark)]"
          >
            <Check className="h-7 w-7" strokeWidth={2} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="display-heading text-3xl md:text-4xl"
          >
            Thank you for your <span className="accent-italic">order.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 text-sm text-[var(--brand-ink)]/60"
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
                className="mt-3 border-[var(--brand-gold)]/40 font-mono text-[11px] text-[var(--brand-gold-dark)]"
              >
                {orderId}
              </Badge>
            </motion.div>
          )}
        </motion.div>

        {/* Decorative divider */}
        <motion.div
          className="mx-auto h-px max-w-2xl bg-gradient-to-r from-transparent via-[var(--brand-gold)]/45 to-transparent"
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
                  className="rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 sm:p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="grid size-8 place-items-center rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10 text-[12px] text-[var(--brand-gold-dark)]">
                      1
                    </div>
                    <div>
                      <h3 className="display-heading text-lg">
                        Order Progress
                      </h3>
                      <p className="mt-0.5 text-[11px] text-[var(--brand-ink)]/50">
                        Estimated delivery by {estimatedDelivery(order.createdAt)}
                      </p>
                    </div>
                    <span className="ml-auto flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[var(--brand-gold-dark)]">
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
                  className="rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 sm:p-8"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div className="grid size-8 place-items-center rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10 text-[12px] text-[var(--brand-gold-dark)]">
                      2
                    </div>
                    <div>
                      <h3 className="display-heading text-lg">
                        Your Items
                      </h3>
                      <p className="mt-0.5 text-[11px] text-[var(--brand-ink)]/50">
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
                  className="rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 sm:p-8"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="grid size-8 place-items-center rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10 text-[12px] text-[var(--brand-gold-dark)]">
                      3
                    </div>
                    <h3 className="font-semibold text-foreground text-base">
                      Delivery Address
                    </h3>
                  </div>
                  <div className="rounded-lg border border-[var(--brand-gold)]/20 bg-[var(--brand-cream)] p-4">
                    <p className="text-sm text-[var(--brand-ink)]">
                      {order.shippingAddress.fullName}
                    </p>
                    <p className="mt-1 text-[12.5px] text-[var(--brand-ink)]/65">
                      {order.shippingAddress.street},{" "}
                      {order.shippingAddress.area}
                    </p>
                    <p className="text-[12.5px] text-[var(--brand-ink)]/65">
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state} -{" "}
                      {order.shippingAddress.pincode}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[var(--brand-gold)]/25 pt-3 text-[11px] text-[var(--brand-ink)]/45">
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
                    className="rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 sm:p-8"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="grid size-8 place-items-center rounded-full border border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10 text-[var(--brand-gold-dark)]">
                        <Gift className="h-4 w-4" />
                      </div>
                      <h3 className="display-heading text-lg">
                        Gift Message
                      </h3>
                    </div>
                    <div className="rounded-r-lg border-l-2 border-[var(--brand-gold)] bg-[var(--brand-cream)] p-4 text-sm italic text-[var(--brand-ink)]/75">
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
                  className="sticky top-6 rounded-xl border border-[var(--brand-gold)]/30 bg-white p-6 sm:p-7"
                >
                  <p className="eyebrow mb-1.5 text-[10px]">
                    <span className="mr-1.5">✦</span>
                    Your order
                  </p>
                  <h3 className="display-heading mb-4 border-b border-[var(--brand-gold)]/20 pb-3 text-xl">
                    Order Summary
                  </h3>

                  {/* Price breakdown */}
                  <div className="space-y-3 border-y border-[var(--brand-gold)]/20 py-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--brand-ink)]/60">Subtotal</span>
                      <span className="text-foreground">
                        ₹{order.pricing.subtotal}
                      </span>
                    </div>
                    {order.pricing.discount?.amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--brand-mauve)]">Discount</span>
                        <span className="text-[var(--brand-mauve)]">
                          -₹{order.pricing.discount.amount}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--brand-ink)]/60">Shipping</span>
                      <span className="text-foreground">
                        {order.pricing.shipping > 0
                          ? `₹${order.pricing.shipping}`
                          : "Free"}
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-baseline justify-between pt-4">
                    <span className="text-[10.5px] uppercase tracking-[0.18em] text-[var(--brand-ink)]/55">
                      Total
                    </span>
                    <span className="display-heading text-2xl text-[var(--brand-plum)]">
                      ₹{order.pricing.total}
                    </span>
                  </div>

                  {/* Payment method */}
                  <div className="mt-5 border-t border-[var(--brand-gold)]/20 pt-4">
                    <div className="flex items-center gap-2 text-[12.5px] text-[var(--brand-ink)]/60">
                      <CreditCard className="h-4 w-4 text-[var(--brand-gold-dark)]" />
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
                        <p className="ml-6 mt-1 text-[11px] text-[var(--brand-mauve)]">
                          Advance paid: ₹{order.pricing.advance}
                        </p>
                      )}
                  </div>

                  {/* Package ID */}
                  {packageId && (
                    <div className="mt-4 border-t border-[var(--brand-gold)]/20 pt-4">
                      <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-[var(--brand-ink)]/45">
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
                      className="btn-gold group h-12 w-full !text-[11px] uppercase tracking-[0.18em]"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      View My Orders
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <Button
                      onClick={() => (window.location.href = "/")}
                      variant="outline"
                      className="h-12 w-full rounded-full border border-[var(--brand-gold)]/40 text-[11px] uppercase tracking-[0.18em] text-[var(--brand-ink)]/70 hover:bg-[var(--brand-cream)]"
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
            <p className="text-sm text-[var(--brand-ink)]/50">
              Loading order details...
            </p>
          </div>
        )}
      </motion.div>
    </>
  );
}
