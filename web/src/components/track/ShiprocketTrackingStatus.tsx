"use client";

export interface ShiprocketTrackingData {
  status?: string;
  EDD?: string;
}

export default function ShiprocketTrackingStatus({
  shiprocketTracking,
  currentStatus,
}: {
  shiprocketTracking: ShiprocketTrackingData | null;
  currentStatus: string;
}) {
  const status = shiprocketTracking?.status || currentStatus || "Pending";
  const isDelivered = status === "Delivered";
  const isInTransit = status === "In Transit" || status === "Out for Delivery";
  const edd = shiprocketTracking?.EDD;

  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-[var(--brand-ink)]/50">Status:</span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] uppercase tracking-[0.1em] ${
          isDelivered
            ? "border-[var(--brand-gold)]/50 bg-[var(--brand-gold)]/15 text-[var(--brand-gold-dark)]"
            : isInTransit
              ? "border-[var(--brand-mauve)]/40 bg-[var(--brand-rose)]/25 text-[var(--brand-plum)]"
              : "border-[var(--brand-gold)]/25 bg-[var(--brand-cream)] text-[var(--brand-ink)]/60"
        }`}>
          {status}
        </span>
      </div>
      {edd && (
        <p className="text-[11px] text-[var(--brand-ink)]/50">
          Estimated delivery: {new Date(edd).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </p>
      )}
    </div>
  );
}
