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
    case "pending": return <Clock className="w-5 h-5" />;
    case "confirmed": return <CheckCircle className="w-5 h-5" />;
    case "shipped": return <Truck className="w-5 h-5" />;
    case "delivered": return <Package className="w-5 h-5" />;
    case "cancelled": return <XCircle className="w-5 h-5" />;
    case "payment_failed": return <AlertTriangle className="w-5 h-5" />;
    default: return <Clock className="w-5 h-5" />;
  }
}

function getStatusColor(status: string, isActive: boolean, isCompleted: boolean) {
  if (status === "cancelled" || status === "payment_failed") return "bg-destructive text-destructive-foreground";
  if (isActive) return "bg-foreground text-background";
  if (isCompleted) return "bg-amber-500 text-background";
  return "bg-muted text-muted-foreground";
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
      className={`bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-border transition-all hover:shadow-md ${isPaymentFailed ? "opacity-70" : ""}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium shadow-sm">1</div>
        <div>
          <h2 className="font-semibold text-foreground text-base">Order Status</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Tracking your order progress</p>
        </div>
      </div>

      <div className="relative">
        {/* Desktop Timeline */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between mb-8 relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-muted mx-5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: getProgressWidth(status) }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-amber-500"
              />
            </div>
            {STATUSES.map((s, index) => {
              const item = statusHistory?.find((h) => h.status === s);
              const isActive = !!(item && item.status === status);
              const isCompleted = statusHistory?.some((h) => h.status === s) ?? false;
              return (
                <motion.div key={s} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1 * index }} className="flex flex-col items-center relative z-10">
                  <motion.div animate={isActive ? { scale: [1, 1.1, 1] } : {}} transition={{ repeat: Infinity, duration: 2 }} className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${getStatusColor(s, isActive, isCompleted)}`}>
                    {getStatusIcon(s)}
                  </motion.div>
                  <span className="text-sm font-medium mt-2 capitalize">{s}</span>
                  {item && <span className="text-xs text-muted-foreground mt-1">{new Date(item.timestamp).toLocaleDateString("en-IN")}</span>}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile Timeline */}
        <div className="md:hidden space-y-4">
          {STATUSES.map((s, index) => {
            const item = statusHistory?.find((h) => h.status === s);
            const isActive = !!(item && item.status === status);
            const isCompleted = statusHistory?.some((h) => h.status === s) ?? false;
            return (
              <motion.div key={s} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * index }} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(s, isActive, isCompleted)}`}>{getStatusIcon(s)}</div>
                <div className="flex-1">
                  <p className="font-medium capitalize">{s}</p>
                  {item && <p className="text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
