"use client";

import { BentoCell } from "./BentoCell";
import FeaturedLargeLayout from "./FeaturedLargeLayout";
import FeaturedWideLayout from "./FeaturedWideLayout";
import TwoColLayout from "./TwoColLayout";
import ThreeColLayout from "./ThreeColLayout";
import FourColLayout from "./FourColLayout";

export interface BentoGridSectionProps {
  heading?: string;
  layout?: string;
  cells?: BentoCell[];
}

export default function BentoGridSection({
  heading,
  layout = "featured-large",
  cells = [],
}: BentoGridSectionProps) {
  if (!cells || cells.length === 0) return null;

  const renderLayout = () => {
    switch (layout) {
      case "featured-large":
        return <FeaturedLargeLayout cells={cells} />;
      case "featured-wide":
        return <FeaturedWideLayout cells={cells} />;
      case "two-col":
        return <TwoColLayout cells={cells} />;
      case "three-col":
        return <ThreeColLayout cells={cells} />;
      case "four-col":
        return <FourColLayout cells={cells} />;
      default:
        return <FeaturedLargeLayout cells={cells} />;
    }
  };

  return (
    <section className="w-full py-8 md:py-12">
      <div className="section-container">
        {heading && (
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h2 className="section-heading">{heading}</h2>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-12 h-0.5"
                style={{ backgroundImage: "linear-gradient(to right, transparent, var(--brand-primary))" }}
              />
              <div
                className="w-8 h-1.5 rounded-full"
                style={{
                  backgroundColor: "var(--brand-primary)",
                  boxShadow: "0 4px 6px -1px color-mix(in srgb, var(--brand-primary) 30%, transparent)",
                }}
              />
              <div
                className="w-12 h-0.5"
                style={{ backgroundImage: "linear-gradient(to left, transparent, var(--brand-primary))" }}
              />
            </div>
          </div>
        )}
        {renderLayout()}
      </div>
    </section>
  );
}

export type { BentoCell };
