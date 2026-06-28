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
    <section className="w-full py-10 md:py-16 bg-gradient-to-b from-white via-pink-50/20 to-white relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-100/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-100/20 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {heading && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-slate-800 tracking-wide">
                {heading}
              </h2>
              <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-pink-400" />
              <div className="w-2 h-2 rotate-45 bg-pink-500" />
              <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-pink-400" />
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
        "relative overflow-hidden rounded-2xl group cursor-pointer",
        "bg-gradient-to-br from-pink-50 to-rose-50",
        "border border-pink-100/50 shadow-md hover:shadow-xl",
        "transition-all duration-500 hover:-translate-y-1",
        className,
      )}
    >
      {cell.image ? (
        <div className="absolute inset-0">
          <Image
            src={cell.image}
            alt={cell.title || ""}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl text-pink-200/50">✦</div>
        </div>
      )}

      {/* Content */}
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

        {/* Hover shine */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        </div>

        {/* Corner accents on hover */}
        <div className="absolute top-3 left-3 w-8 h-8 border-l-2 border-t-2 border-white/40 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-x-1 -translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0" />
        <div className="absolute bottom-3 right-3 w-8 h-8 border-r-2 border-b-2 border-white/40 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0" />
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
