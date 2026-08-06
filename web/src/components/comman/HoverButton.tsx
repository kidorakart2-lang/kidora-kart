"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface HoverButtonProps {
  href: string;
  label: string;
  color: string;
}

export default function HoverButton({ href, label, color }: HoverButtonProps) {
  return (
    <Link href={href}>
      <button
        type="button"
        className="group inline-flex items-center gap-3 rounded-full border-2 px-8 py-4 fw-cta text-sm uppercase tracking-wider text-[var(--btn-color)] transition-all duration-300 hover:bg-[var(--btn-color)] hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-section"
        style={
          {
            borderColor: color,
            "--btn-color": color,
            "--tw-ring-color": color,
          } as React.CSSProperties
        }
      >
        View All {label}
        <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
      </button>
    </Link>
  );
}
