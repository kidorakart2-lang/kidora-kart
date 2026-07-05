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

  if (hasLink && href) {
    if (cell.linkType === "external") {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  return <div className={className}>{children}</div>;
}

interface BentoCellContentProps {
  cell: BentoCell;
  className?: string;
}

export function BentoCellContent({ cell, className }: BentoCellContentProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-end rounded-2xl bg-[var(--brand-section-bg,#f8f8f8)] p-4 transition-all duration-300 hover:shadow-lg hover-lift overflow-hidden",
        className
      )}
    >
      {cell.image ? (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <Image
            src={cell.image}
            alt={cell.title || ""}
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 50vw"
            draggable={false}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--brand-card-1-ring)]">
          <span className="text-4xl" style={{ color: "var(--brand-card-1-icon)" }}>✦</span>
        </div>
      )}
      <div className="relative z-10">
        <h3 className="font-sans text-base font-semibold" style={{ color: "var(--brand-primary)" }}>
          {cell.title}
        </h3>
        {(cell.subtitle || cell.linkType) && (
          <p className="mt-0.5 font-sans text-sm text-muted-foreground">
            {cell.subtitle || "Collection"} →
          </p>
        )}
      </div>
    </div>
  );
}
