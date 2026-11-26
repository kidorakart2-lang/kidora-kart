"use client";

import { motion } from "motion/react";
import { Clock, CheckCircle, Truck, Package, XCircle, AlertTriangle } from "lucide-react";

interface StatusHistoryItem {
  status: string;
  timestamp: string;
}

interface OrderTimelineProps {
  status: string;
  statusHistory?: StatusHistoryItem[];
  isCancelled: boolean;
  isPaymentFailed: boolean;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "pending": return <Clock className="h-5 w-5" strokeWidth={1.6} />;
    case "confirmed": return <CheckCircle className="h-5 w-5" strokeWidth={1.6} />;
    case "shipped": return <Truck className="h-5 w-5" strokeWidth={1.6} />;
    case "delivered": return <Package className="h-5 w-5" strokeWidth={1.6} />;
    case "cancelled": return <XCircle className="h-5 w-5" strokeWidth={1.6} />;
    case "payment_failed": return <AlertTriangle className="h-5 w-5" strokeWidth={1.6} />;
    default: return <Clock className="h-5 w-5" strokeWidth={1.6} />;
  }
}

function getStatusColor(status: string, isActive: boolean, isCompleted: boolean) {
  if (status === "cancelled" || status === "payment_failed") return "bg-destructive text-destructive-foreground";
  if (isActive) return "bg-[var(--brand-plum)] text-[var(--brand-cream)]";
  if (isCompleted) return "border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/15 text-[var(--brand-gold-dark)]";
  return "border border-[var(--brand-gold)]/20 bg-[var(--brand-cream)] text-[var(--brand-ink)]/35";
}

function getProgressWidth(status: string) {
  if (status === "cancelled" || status === "pending") return "0%";
  if (status === "confirmed") return "33%";
  if (status === "shipped") return "66%";
  if (status === "delivered") return "100%";
  return "0%";
}

const STATUSES = ["pending", "confirmed", "shipped", "delivered"];

export default function OrderTimeline({ status, statusHistory, isCancelled, isPaymentFailed }: OrderTimelineProps) {
  if (isCancelled) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
      className={`rounded-xl border border-[var(--brand-gold)]/25 bg-white p-6 sm:p-8 ${isPaymentFailed ? "opacity-70" : ""}`}
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="grid size-8 place-items-center rounded-full border border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/10 text-[12px] text-[var(--brand-gold-dark)]">1</div>
        <div>
          <h2 className="display-heading text-lg">Order Status</h2>
          <p className="mt-0.5 text-[11px] text-[var(--brand-ink)]/50">Tracking your order progress</p>
        </div>
      </div>

      <div className="relative">
        {/* Desktop Timeline */}
        <div className="hidden md:block">
          <div className="relative mb-8 flex items-center justify-between">
            <div className="absolute left-0 right-0 top-5 mx-5 h-px bg-[var(--brand-gold)]/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: getProgressWidth(status) }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-[var(--brand-gold)]"
              />
            </div>
            {STATUSES.map((s, index) => {
              const item = statusHistory?.find((h) => h.status === s);
              const isActive = !!(item && item.status === status);
              const isCompleted = statusHistory?.some((h) => h.status === s) ?? false;
              return (
                <motion.div key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 * index }} className="relative z-10 flex flex-col items-center">
                  <motion.div animate={isActive ? { scale: [1, 1.06, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }} className={`flex size-11 items-center justify-center rounded-full ${getStatusColor(s, isActive, isCompleted)}`}>
                    {getStatusIcon(s)}
                  </motion.div>
                  <span className="mt-2 text-[10.5px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">{s}</span>
                  {item && <span className="mt-1 text-[10.5px] text-[var(--brand-ink)]/40">{new Date(item.timestamp).toLocaleDateString("en-IN")}</span>}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile Timeline */}
        <div className="space-y-4 md:hidden">
          {STATUSES.map((s, index) => {
            const item = statusHistory?.find((h) => h.status === s);
            const isActive = !!(item && item.status === status);
            const isCompleted = statusHistory?.some((h) => h.status === s) ?? false;
            return (
              <motion.div key={s} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * index }} className="flex items-center gap-4">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${getStatusColor(s, isActive, isCompleted)}`}>{getStatusIcon(s)}</div>
                <div className="flex-1">
                  <p className="text-[12px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/75">{s}</p>
                  {item && <p className="text-[11px] text-[var(--brand-ink)]/40">{new Date(item.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
