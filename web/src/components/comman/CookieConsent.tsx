"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consented = localStorage.getItem("cookieConsent");
    if (!consented) {
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookieConsent", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[9999] border-t border-amber-200/50 bg-gradient-to-r from-amber-50 via-white to-orange-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-4 md:p-5"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-slate-700 leading-relaxed">
            We use essential cookies only for authentication and site security. No tracking or analytics cookies are used. By continuing, you accept our{" "}
            <Link
              href="/our-policy"
              className="font-medium text-amber-700 underline underline-offset-2 hover:text-amber-800 transition-colors"
              onClick={accept}
            >
              Cookie & Data Usage Policy
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={accept}
            className="cursor-pointer rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
          >
            Got it
          </button>
          <button
            onClick={accept}
            aria-label="Close cookie notice"
            className="cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
