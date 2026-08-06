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
      className="bg-background rounded-2xl p-6 sm:p-8 shadow-sm border border-border transition-all hover:shadow-md"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <XCircle className="w-4 h-4" />
        </div>
        <h3 className="font-semibold text-foreground text-base">Cancellation Details</h3>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Reason</span>
          <span className="font-medium text-foreground">{cancellation.reason || "Not specified"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cancelled On</span>
          <span className="font-medium text-foreground">{new Date(cancellation.cancelledAt).toLocaleDateString()}</span>
        </div>
        {cancellation.refundStatus && (
          <>
            <div className="border-t border-border my-3" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Refund Status</span>
              <span className={`font-medium ${cancellation.refundStatus === "completed" ? "text-amber-600" : cancellation.refundStatus === "failed" ? "text-destructive" : "text-foreground"}`}>
                {cancellation.refundStatus.charAt(0).toUpperCase() + cancellation.refundStatus.slice(1)}
              </span>
            </div>
            {cancellation.refundAmount != null && cancellation.refundAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refund Amount</span>
                <span className="font-medium text-foreground">₹{cancellation.refundAmount.toLocaleString("en-IN")}</span>
              </div>
            )}
            {cancellation.refundedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processed On</span>
                <span className="font-medium text-foreground">{new Date(cancellation.refundedAt).toLocaleString()}</span>
              </div>
            )}
            {cancellation.refundError && (
              <div className="mt-2 p-2 bg-destructive/10 text-destructive text-sm rounded-lg">
                <span className="font-medium">Refund Error:</span> {cancellation.refundError}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
