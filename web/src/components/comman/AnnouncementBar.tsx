"use client";
import { useState, useCallback } from "react";
import { Truck, X, Youtube } from "lucide-react";
import { InstagramIcon, FacebookIcon } from "../icons";
import { siteConfig } from "@/lib/utils";

const SOCIALS = [
  { label: "Instagram", href: siteConfig.social.instagram, Icon: InstagramIcon },
  { label: "Facebook", href: siteConfig.social.facebook, Icon: FacebookIcon },
  { label: "YouTube", href: siteConfig.social.youtube, Icon: Youtube },
];

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
    <div className="relative w-full bg-[var(--brand-primary-darker)] text-[var(--brand-cream)]">
      <div className="mx-auto flex h-9 max-w-[1400px] items-center justify-between px-4 sm:px-6">
        {/* Social row */}
        <div className="flex items-center gap-3">
          {SOCIALS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="text-[var(--brand-cream)]/70 transition-colors hover:text-[var(--brand-gold)]"
            >
              <Icon className="size-3.5" />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11.5px] tracking-wide">
          <Truck size={13} className="text-[var(--brand-gold)]" />
          <span className="truncate">
            Free shipping on orders over ₹499
          </span>
        </div>

        <div className="flex items-center gap-3 text-[10.5px] uppercase tracking-[0.18em] text-[var(--brand-cream)]/60">
          <span className="hidden sm:inline">India · INR ₹</span>
        </div>
      </div>

      <button
        onClick={dismiss}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-white/15"
        aria-label="Dismiss announcement"
      >
        <X size={12} />
      </button>
    </div>
  );
}
