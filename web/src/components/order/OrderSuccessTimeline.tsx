"use client";

import { Check } from "lucide-react";

interface OrderSuccessTimelineProps {
  status: string;
}

export default function OrderSuccessTimeline({
  status,
}: OrderSuccessTimelineProps) {
  const steps = [
    { key: "placed", label: "Placed" },
    { key: "confirmed", label: "Confirmed" },
    { key: "shipped", label: "Shipped" },
    { key: "out_for_delivery", label: "Out for Delivery" },
    { key: "delivered", label: "Delivered" },
  ];
  const statusOrder = [
    "placed",
    "confirmed",
    "shipped",
    "out_for_delivery",
    "delivered",
  ];
  const activeIndex = Math.max(statusOrder.indexOf(status), 0);

  return (
    <div className="flex items-center justify-between px-1 py-2">
      {steps.map((step, i) => {
        const isCompleted = i <= activeIndex;
        const isCurrent = i === activeIndex;
        return (
          <div
            key={step.key}
            className="flex flex-1 items-center last:flex-none"
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex size-8 items-center justify-center rounded-full transition-all duration-500 ${
                  isCompleted
                    ? "bg-[var(--brand-plum)] text-[var(--brand-cream)]"
                    : "border border-[var(--brand-gold)]/25 bg-[var(--brand-cream)] text-[var(--brand-ink)]/30"
                } ${isCurrent ? "ring-2 ring-[var(--brand-gold)]/40 ring-offset-2 ring-offset-white" : ""}`}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.4} />
                ) : (
                  <div className="size-1.5 rounded-full bg-[var(--brand-ink)]/20" />
                )}
              </div>
              <p
                className={`mt-2 whitespace-nowrap text-[9px] uppercase tracking-[0.1em] ${
                  isCompleted ? "text-[var(--brand-ink)]/75" : "text-[var(--brand-ink)]/35"
                }`}
              >
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-1.5 mt-[-1.4rem] h-px flex-1 transition-colors duration-500 ${
                  i < activeIndex ? "bg-[var(--brand-gold)]" : "bg-[var(--brand-gold)]/20"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
