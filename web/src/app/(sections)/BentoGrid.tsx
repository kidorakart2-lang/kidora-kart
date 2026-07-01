"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";

interface BentoCell {
  image?: string;
  title?: string;
  subtitle?: string;
  linkType?: string;
  linkTarget?: string;
  linkExternalUrl?: string;
}

interface BentoGridProps {
  heading?: string;
  layout?: string;
  cells?: BentoCell[];
}

export default function BentoGrid({ heading, layout = "featured-large", cells = [] }: BentoGridProps) {
  if (!cells || cells.length === 0) return null;

  const cellCount = cells.length;

  return (
    <section className="w-full py-10 md:py-16 relative overflow-hidden bg-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {heading && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5" style={{ color: "var(--brand-primary)" }} />
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif tracking-wide section-heading">
                {heading}
              </h2>
              <Sparkles className="w-5 h-5" style={{ color: "var(--brand-primary)" }} />
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent" style={{ backgroundImage: `linear-gradient(to right, transparent, var(--brand-primary))` }} />
              <div className="w-2 h-2 rotate-45" style={{ backgroundColor: "var(--brand-primary)" }} />
              <div className="w-12 h-0.5 bg-gradient-to-l from-transparent" style={{ backgroundImage: `linear-gradient(to left, transparent, var(--brand-primary))` }} />
            </div>
          </div>
        )}

        {layout === "featured-large" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto md:h-[500px]">
            {cells[0] && <BentoCell cell={cells[0]} className="md:col-span-2 md:row-span-2" />}
            {cells[1] && <BentoCell cell={cells[1]} className="" />}
            {cells[2] && <BentoCell cell={cells[2]} className="" />}
          </div>
        )}

        {layout === "featured-wide" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-auto md:h-[600px]">
            {cells[0] && <BentoCell cell={cells[0]} className="md:col-span-2 h-64 md:h-72" />}
            {cells[1] && <BentoCell cell={cells[1]} className="" />}
            {cells[2] && <BentoCell cell={cells[2]} className="" />}
          </div>
        )}

        {layout === "two-col" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-auto md:h-[450px]">
            {cells[0] && <BentoCell cell={cells[0]} className="" />}
            {cells[1] && <BentoCell cell={cells[1]} className="" />}
          </div>
        )}

        {layout === "three-col" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto md:h-[400px]">
            {cells[0] && <BentoCell cell={cells[0]} className="" />}
            {cells[1] && <BentoCell cell={cells[1]} className="" />}
            {cells[2] && <BentoCell cell={cells[2]} className="" />}
          </div>
        )}

        {layout === "four-col" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-auto">
            {cells.slice(0, 4).map((cell, i) => (
              <BentoCell key={i} cell={cell} className="aspect-square" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function BentoCell({ cell, className }: { cell: BentoCell; className?: string }) {
  const hasLink = cell.linkType && (cell.linkTarget || cell.linkExternalUrl);
  const href =
    cell.linkType === "external"
      ? cell.linkExternalUrl
      : cell.linkTarget
        ? `/category/${cell.linkTarget}`
        : undefined;

  const content = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "border shadow-md",
        "transition-all duration-500",
        className,
      )}
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 10%, white), color-mix(in srgb, var(--brand-secondary, var(--brand-primary)) 10%, white))`,
        borderColor: "color-mix(in srgb, var(--brand-primary) 15%, transparent)",
      }}
    >
      {cell.image ? (
        <div className="absolute inset-0">
          <Image
            src={cell.image}
            alt={cell.title || ""}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl" style={{ color: "color-mix(in srgb, var(--brand-primary) 30%, transparent)" }}>✦</div>
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-end h-full p-6 min-h-[200px]">
        {cell.title && (
          <h3 className="text-xl md:text-2xl font-serif text-white font-semibold mb-1 drop-shadow-lg">
            {cell.title}
          </h3>
        )}
        {cell.subtitle && (
          <p className="text-sm text-white/80 font-light drop-shadow-md">
            {cell.subtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (hasLink && href) {
    if (cell.linkType === "external") {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
