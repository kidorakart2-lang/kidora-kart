import { siteConfig } from "@/lib/utils";

type BrandLogoSize = "sm" | "md" | "lg";

const SIZES: Record<
  BrandLogoSize,
  { gem: string; gap: string; text: string; tracking: string }
> = {
  sm: { gem: "h-3 w-4", gap: "gap-0.5", text: "text-base", tracking: "tracking-[0.26em]" },
  md: { gem: "h-3.5 w-5", gap: "gap-1", text: "text-xl", tracking: "tracking-[0.28em]" },
  lg: { gem: "h-5 w-7", gap: "gap-1.5", text: "text-3xl", tracking: "tracking-[0.3em]" },
};

/**
 * Jewel Box wordmark — brilliant-cut gem above a letter-spaced serif
 * "JEWEL BOX". Used as the fallback whenever no custom logo has been
 * uploaded through the admin panel.
 */
export default function BrandLogo({
  size = "md",
  className = "",
}: {
  size?: BrandLogoSize;
  className?: string;
}) {
  const s = SIZES[size];

  return (
    <span
      className={`inline-flex flex-col items-center leading-none text-[var(--brand-heading)] ${s.gap} ${className}`}
      aria-label={siteConfig.name}
    >
      <svg
        viewBox="0 0 32 24"
        className={s.gem}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 2h16l6 7-14 13L2 9Z" />
        <path d="M2 9h28" />
        <path d="M8 2 2 9l14 13" />
        <path d="M24 2l6 7-14 13" />
      </svg>
      <span
        className={`font-display font-semibold uppercase ${s.text} ${s.tracking}`}
      >
        {siteConfig.name}
      </span>
    </span>
  );
}
