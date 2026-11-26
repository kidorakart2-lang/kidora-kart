"use client";

import { motion } from "motion/react";
import { XCircle } from "lucide-react";

interface CancellationInfo {
  reason?: string;
  cancelledAt: string;
  refundStatus?: string;
  refundAmount?: number;
  refundedAt?: string;
  refundError?: string;
}

interface CancellationDetailsProps {
  cancellation?: CancellationInfo;
}

export default function CancellationDetails({ cancellation }: CancellationDetailsProps) {
  if (!cancellation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45, duration: 0.5, ease: "easeOut" }}
      className="rounded-xl border border-destructive/25 bg-white p-6 sm:p-8"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="grid size-8 place-items-center rounded-full border border-destructive/25 bg-destructive/5 text-destructive">
          <XCircle className="h-4 w-4" strokeWidth={1.7} />
        </div>
        <h3 className="display-heading text-lg">Cancellation Details</h3>
      </div>
      <div className="space-y-3 text-[12.5px]">
        <div className="flex justify-between gap-4">
          <span className="text-[var(--brand-ink)]/65">Reason</span>
          <span className="text-right text-[var(--brand-ink)]">{cancellation.reason || "Not specified"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[var(--brand-ink)]/65">Cancelled On</span>
          <span className="text-[var(--brand-ink)]">{new Date(cancellation.cancelledAt).toLocaleDateString()}</span>
        </div>
        {cancellation.refundStatus && (
          <>
            <div className="my-3 border-t border-[var(--brand-gold)]/20" />
            <div className="flex justify-between gap-4">
              <span className="text-[var(--brand-ink)]/65">Refund Status</span>
              <span className={`uppercase text-[11px] tracking-[0.12em] ${cancellation.refundStatus === "completed" ? "text-[var(--brand-gold-dark)]" : cancellation.refundStatus === "failed" ? "text-destructive" : "text-[var(--brand-ink)]/70"}`}>
                {cancellation.refundStatus.charAt(0).toUpperCase() + cancellation.refundStatus.slice(1)}
              </span>
            </div>
            {cancellation.refundAmount != null && cancellation.refundAmount > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-[var(--brand-ink)]/65">Refund Amount</span>
                <span className="text-[var(--brand-ink)]">₹{cancellation.refundAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
            {cancellation.refundedAt && (
              <div className="flex justify-between gap-4">
                <span className="text-[var(--brand-ink)]/65">Processed On</span>
                <span className="text-[var(--brand-ink)]">{new Date(cancellation.refundedAt).toLocaleString()}</span>
              </div>
            )}
            {cancellation.refundError && (
              <div className="mt-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2 text-[11.5px] text-destructive">
                <span className="font-medium">Refund Error:</span> {cancellation.refundError}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
