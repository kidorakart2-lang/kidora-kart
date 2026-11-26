"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(window.pageYOffset > 300);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={cn(
        "no-print fixed bottom-40 right-5 z-40 grid size-11 place-items-center rounded-full border border-[var(--brand-gold)]/40 bg-white/95 text-[var(--brand-plum)] shadow-[0_16px_34px_-22px_rgba(74,37,66,0.6)] backdrop-blur-sm transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-[var(--brand-gold)] hover:bg-[var(--brand-cream)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]/50 focus-visible:ring-offset-2",
        "md:bottom-28 md:right-7",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ChevronUp className="size-5" strokeWidth={1.6} />
    </button>
  );
}
