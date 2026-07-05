"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

interface BentoCell {
  image?: string;
  title?: string;
  subtitle?: string;
  linkType?: string;
  linkTarget?: string;
  linkExternalUrl?: string;
}

interface BentoGridSectionProps {
  heading?: string;
  layout?: string;
  cells?: BentoCell[];
}

function CellLink({
  cell,
  className,
  children,
}: {
  cell: BentoCell;
  className?: string;
  children: React.ReactNode;
}) {
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

function CellImage({ cell }: { cell: BentoCell }) {
  if (!cell.image) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800">
        <span className="text-3xl text-neutral-300 dark:text-neutral-600">✦</span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      <Image
        src={cell.image}
        alt={cell.title || ""}
        fill
        className="object-contain p-4"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}

export default function BentoGridSection({
  heading,
  layout = "featured-large",
  cells = [],
}: BentoGridSectionProps) {
  if (!cells || cells.length === 0) return null;

  const getColSpan = (index: number): string => {
    if (layout === "featured-large" && index === 0) return "md:col-span-2";
    if (layout === "featured-wide" && index === 0) return "md:col-span-2";
    return "";
  };

  const getRowSpan = (index: number): string => {
    if (layout === "featured-large" && index === 0) return "md:row-span-2";
    return "";
  };

  return (
    <section className="w-full py-8 md:py-12">
      <div className="section-container">
        {heading && (
          <div className="mb-8">
            <h2 className="section-heading">{heading}</h2>
          </div>
        )}

        <BentoGrid
          className={cn(
            layout === "two-col" && "md:grid-cols-2",
            layout === "three-col" && "md:grid-cols-3",
            layout === "four-col" && "md:grid-cols-4",
          )}
        >
          {cells.slice(0, getLayoutCellCount(layout)).map((cell, i) => (
            <CellLink key={i} cell={cell} className={cn(getColSpan(i), getRowSpan(i))}>
              <BentoGridItem
                title={cell.title}
                description={cell.subtitle || "Collection →"}
                header={<CellImage cell={cell} />}
                className="h-full cursor-pointer p-3"
              />
            </CellLink>
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}

function getLayoutCellCount(layout: string): number {
  switch (layout) {
    case "featured-large":
    case "featured-wide":
      return 3;
    case "two-col":
      return 2;
    case "three-col":
      return 3;
    case "four-col":
      return 4;
    default:
      return 3;
  }
}
