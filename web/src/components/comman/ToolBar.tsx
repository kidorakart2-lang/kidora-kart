"use client";
import { useState } from "react";
import { MessageCircle, Instagram, X } from "lucide-react";
import { siteConfig } from "@/lib/utils";

const ToolBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const whatsappNumber = siteConfig.contact.whatsapp;
  const instagram = siteConfig.social.instagram;
  const message = "Hello! I have a question about your products.";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    message,
  )}`;

  return (
    <div className="no-print pointer-events-none fixed bottom-24 right-5 z-50 flex flex-col items-end gap-3 md:bottom-8 md:right-7">
      <div
        className={`w-60 origin-bottom-right overflow-hidden rounded-2xl border border-[var(--brand-gold)]/30 bg-white shadow-[0_26px_60px_-30px_rgba(74,37,66,0.5)] transition-all duration-300 ${
          isExpanded
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-95 opacity-0"
        }`}
        aria-hidden={!isExpanded}
      >
        <div className="border-b border-[var(--brand-gold)]/20 bg-[var(--brand-section-bg)] px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.22em] text-[var(--brand-gold-dark)]">
            We&apos;re here to help
          </p>
          <p className="display-heading mt-1 text-base">Chat with Ratnavya</p>
        </div>

        <div className="space-y-1.5 p-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--brand-section-bg)]"
          >
            <span className="grid size-8 place-items-center rounded-full border border-[var(--brand-gold)]/35 bg-white text-[var(--brand-gold-dark)]">
              <MessageCircle size={15} strokeWidth={1.6} />
            </span>
            <span>
              <span className="block text-[12px] text-[var(--brand-ink)]">
                WhatsApp
              </span>
              <span className="block text-[10px] text-[var(--brand-ink)]/65">
                Usually replies in minutes
              </span>
            </span>
          </a>

          <a
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--brand-section-bg)]"
          >
            <span className="grid size-8 place-items-center rounded-full border border-[var(--brand-gold)]/35 bg-white text-[var(--brand-gold-dark)]">
              <Instagram size={15} strokeWidth={1.6} />
            </span>
            <span>
              <span className="block text-[12px] text-[var(--brand-ink)]">
                Instagram
              </span>
              <span className="block text-[10px] text-[var(--brand-ink)]/65">
                See the latest edits
              </span>
            </span>
          </a>
        </div>
      </div>

      <button
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? "Close contact menu" : "Open contact menu"}
        className="pointer-events-auto group flex size-12 items-center justify-center gap-2 rounded-full border border-[var(--brand-gold)]/45 bg-[var(--brand-plum)] p-0 text-[var(--brand-cream)] shadow-[0_18px_40px_-24px_rgba(74,37,66,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--brand-primary-dark)] sm:h-auto sm:w-auto sm:justify-start sm:py-3 sm:pl-4 sm:pr-[18px]"
      >
        {isExpanded ? (
          <X size={16} strokeWidth={1.8} />
        ) : (
          <MessageCircle size={16} strokeWidth={1.8} />
        )}
        <span className="hidden text-[9.5px] uppercase tracking-[0.2em] sm:inline">
          {isExpanded ? "Close" : "Chat"}
        </span>
      </button>
    </div>
  );
};

export default ToolBar;
