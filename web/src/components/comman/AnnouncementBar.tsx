"use client";
import { useState, useCallback } from "react";
import { Truck, X } from "lucide-react";

export default function AnnouncementBar() {
  const [announcementDismissed, setAnnouncementDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("announcement-dismissed") === "true";
  });

  const dismiss = useCallback(() => {
    setAnnouncementDismissed(true);
    localStorage.setItem("announcement-dismissed", "true");
  }, []);

  if (announcementDismissed) return null;

  return (
    <div className="w-full bg-[var(--brand-primary-dark)] text-background text-[13px] py-2 relative">
      <div className="flex items-center justify-center gap-2 px-10">
        <Truck size={14} />
        <span className="fw-body">Free shipping on orders over ₹999</span>
      </div>
      <button
        onClick={dismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/15 transition-colors"
        aria-label="Dismiss announcement"
      >
        <X size={13} />
      </button>
    </div>
  );
}
