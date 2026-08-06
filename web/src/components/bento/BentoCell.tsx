"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BentoCell {
  image?: string;
  title?: string;
  subtitle?: string;
  linkType?: string;
  linkTarget?: string;
  linkExternalUrl?: string;
  /** Which admin picker produced this cell (product / category / banner / ...) */
  sourceType?: string;
}

interface CellLinkProps {
  cell: BentoCell;
  className?: string;
  children: React.ReactNode;
}

export function CellLink({ cell, className, children }: CellLinkProps) {
  const hasLink =
    cell.linkType &&
    cell.linkType !== "none" &&
    (cell.linkTarget || cell.linkExternalUrl);

  const href =
    cell.linkType === "external"
      ? cell.linkExternalUrl
      : cell.linkType === "product"
        ? `/product-details/${cell.linkTarget}`
        : cell.linkTarget
          ? `/category/${cell.linkTarget}`
          : undefined;

  const linkClass = cn("block h-full", className);

  if (hasLink && href) {
    if (cell.linkType === "external") {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={linkClass}>
        {children}
      </Link>
    );
  }

  return <div className={linkClass}>{children}</div>;
}

interface BentoCellContentProps {
  cell: BentoCell;
  className?: string;
}

export function BentoCellContent({ cell, className }: BentoCellContentProps) {
  // Banner cells are full-bleed image tiles — hide the caption + scrim so the
  // banner artwork shows clean, edge-to-edge without overlay text. If a banner
  // cell has no image (fallback placeholder), keep the title visible instead.
  const hideCaption = cell.sourceType === "banner" && !!cell.image;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover-lift",
        className
      )}
    >
      {cell.image ? (
        <>
          <div className="absolute inset-0">
            <Image
              src={cell.image}
              alt={cell.title || ""}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              sizes="(max-width: 768px) 100vw, 50vw"
              draggable={false}
            />
          </div>
          {/* Readability scrim behind the caption (not on banner tiles) */}
          {!hideCaption && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0) 70%)",
              }}
            />
          )}
        </>
      ) : (
        <>
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--brand-card-1-ring)]">
            <span className="text-4xl" style={{ color: "var(--brand-card-1-icon)" }}>✦</span>
          </div>
          {/* Same readability scrim as the image branch */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 45%, rgba(0,0,0,0) 70%)",
            }}
          />
        </>
      )}
      {!hideCaption && (
        <div className="relative z-10">
          <h3 className="font-sans text-base font-semibold text-white drop-shadow-sm">
            {cell.title}
          </h3>
          {(cell.subtitle || cell.linkType) && (
            <p className="mt-0.5 font-sans text-sm text-white/85 drop-shadow-sm">
              {cell.subtitle || "Collection"} →
            </p>
          )}
        </div>
      )}
    </div>
  );
}
