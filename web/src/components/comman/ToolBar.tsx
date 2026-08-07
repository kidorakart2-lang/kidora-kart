"use client";
import React, { useEffect, useState } from "react";
import { Instagram } from "lucide-react";
import { siteConfig } from "@/lib/utils";

const ToolBar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const whatsappNumber = siteConfig.contact.whatsapp;
  const instagram = siteConfig.social.instagram;
  const message = "Hello! I have a question about your products.";

  const handleWhatsAppClick = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(url, "_blank");
  };

  const handleInstagramClick = () => {
    window.open(instagram, "_blank");
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExpanded(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="no-print fixed bottom-20 right-6 z-50 flex flex-col gap-3 items-end">
      {/* Instagram Button */}
      <div
        className={`transform transition-all duration-500 ${
          isExpanded
            ? "translate-y-0 opacity-100 visible"
            : "translate-y-20 opacity-0 pointer-events-none invisible"
        }`}
      >
        <button
          onClick={handleInstagramClick}
          className="group relative bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white rounded-full p-3 shadow-2xl transition-all duration-300 hover:shadow-lg hover:scale-110 active:scale-95 overflow-hidden"
          aria-label="Chat on Instagram"
        >
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Pulse effect */}
          <div className="absolute inset-0 rounded-full bg-[#DD2A7B]/40 animate-ping opacity-20" />

          <Instagram className="w-5 h-5 relative z-10" />
        </button>
      </div>

      {/* WhatsApp Button */}
      <div
        className={`transform transition-all duration-500 delay-75 ${
          isExpanded
            ? "translate-y-0 opacity-100 visible"
            : "translate-y-20 opacity-0 pointer-events-none invisible"
        }`}
      >
        <button
          onClick={handleWhatsAppClick}
          className="group relative bg-[#25D366] hover:bg-[#1DA851] text-white rounded-full p-3 shadow-2xl transition-all duration-300 hover:shadow-[#25D366]/40 hover:scale-110 active:scale-95 overflow-hidden"
          aria-label="Chat on WhatsApp"
        >
          {/* Ripple effect on hover */}
          <div className="absolute inset-0 rounded-full bg-[#1DA851] scale-0 group-hover:scale-150 transition-transform duration-500 opacity-30" />

          <svg
            className="w-5 h-5 relative z-10"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.197.297-.767.963-.94 1.16-.173.199-.347.222-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.795-1.484-1.784-1.66-2.087-.173-.297-.018-.458.13-.606.136-.133.296-.345.445-.523.146-.181.194-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.508-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.078 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.005-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.345m-5.446 7.443h-.016a9.87 9.87 0 01-5.031-1.378l-.36-.214-3.741.982.998-3.648-.235-.373a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.549 4.142 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 005.723 1.465h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </button>
      </div>

      {/* Main Toggle Button */}
      <button
        onClick={handleToggle}
        className={`relative bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-full p-3 shadow-2xl transition-all duration-300 hover:shadow-rose-500/50 hover:scale-105 active:scale-95 ${
          isExpanded ? "rotate-45" : "rotate-0"
        }`}
        aria-label="Toggle social media menu"
      >
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />

        <div className="relative z-10">
          {isExpanded ? (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
          )}
        </div>

        {/* Rotating border animation */}
        <div
          className="absolute inset-0 rounded-full border-2 border-white/30 animate-spin"
          style={{ animationDuration: "3s" }}
        />
      </button>

    </div>
  );
};

export default ToolBar;
