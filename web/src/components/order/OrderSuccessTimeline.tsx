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
            className="flex items-center flex-1 last:flex-none"
          >
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCompleted
                    ? "bg-brand-500 text-background shadow-md"
                    : "bg-muted text-muted-foreground"
                } ${isCurrent ? "ring-4 ring-brand-100" : ""}`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" strokeWidth={3} />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-border" />
                )}
              </div>
              <p
                className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                  isCompleted ? "text-brand-700" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1.5 mt-[-1.5rem] transition-colors duration-500 ${
                  i < activeIndex ? "bg-brand-500" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
