import { siteConfig } from "@/lib/utils";

type BrandLogoSize = "sm" | "md" | "lg";

const SIZES: Record<BrandLogoSize, string> = {
  sm: "h-6",
  md: "h-8",
  lg: "h-12",
};

/**
 * Ratnavya gold-leaf wordmark. Used whenever no custom logo has been
 * uploaded through the admin panel.
 */
export default function BrandLogo({
  size = "md",
  className = "",
}: {
  size?: BrandLogoSize;
  className?: string;
}) {
  return (
    <img
      src="/Ratnavya Gold Leaf Logo.webp"
      alt={siteConfig.name}
      decoding="async"
      className={`w-auto max-w-full object-contain ${SIZES[size]} ${className}`}
    />
  );
}
