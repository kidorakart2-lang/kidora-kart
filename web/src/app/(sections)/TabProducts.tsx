import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "@/components/comman/ProductCard";
import Link from "next/link";
import { Gem, Crown, Gift as GiftIcon, ArrowRight } from "lucide-react";
import type { ProductData } from "@/types";

const TAB_TIERS = {
  silver: {
    color: "var(--brand-card-5-icon)",
    soft: "var(--brand-card-5-bg)",
    icon: Gem,
    label: "Silver",
    tagline: "Timeless elegance in sterling silver",
  },
  gold: {
    color: "var(--brand-card-1-icon)",
    soft: "var(--brand-card-1-bg)",
    icon: Crown,
    label: "Gold",
    tagline: "Luxury crafted in precious gold",
  },
  gift: {
    color: "var(--brand-card-2-icon)",
    soft: "var(--brand-card-2-bg)",
    icon: GiftIcon,
    label: "Gifting",
    tagline: "Perfect presents for every occasion",
  },
} as const;

export default function TabProducts({
  data,
}: {
  data: Record<string, ProductData[]>;
}) {
  return (
    <section
      className="relative overflow-hidden bg-[var(--brand-section-bg)] py-16 lg:py-20"
      id="Products For You"
    >
      <div className="section-container relative z-10">
        <Tabs defaultValue="silver" className="w-full">
          <div className="mb-10 flex flex-col items-center lg:mb-12">
            <p className="eyebrow mb-3">
              <span className="mr-2">✦</span>
              Discover our collections
            </p>
            <h2 className="display-heading text-center text-3xl sm:text-4xl lg:text-[2.75rem]">
              Shop the <span className="accent-italic">Collections</span>
            </h2>

            <TabsList className="tab-pill-track mt-7">
              {(Object.keys(TAB_TIERS) as Array<keyof typeof TAB_TIERS>).map(
                (key) => {
                  const tier = TAB_TIERS[key];
                  const Icon = tier.icon;
                  return (
                    <TabsTrigger key={key} value={key} className="tab-pill">
                      <Icon className="h-3.5 w-3.5" />
                      {tier.label}
                    </TabsTrigger>
                  );
                },
              )}
            </TabsList>
          </div>

          <div className="mb-9 flex min-h-[64px] items-center justify-center text-center">
            {(Object.keys(TAB_TIERS) as Array<keyof typeof TAB_TIERS>).map(
              (key) => {
                const tier = TAB_TIERS[key];
                return (
                  <TabsContent
                    key={key}
                    value={key}
                    className="m-0 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                  >
                    <h3 className="display-heading flex items-center justify-center gap-3 text-center text-2xl sm:text-3xl">
                      <span className="text-[var(--brand-gold)]">✦</span>
                      {tier.label} Collection
                      <span className="text-[var(--brand-gold)]">✦</span>
                    </h3>
                    <p className="mt-2 text-center text-[13px] text-[var(--brand-ink)]/65">
                      {tier.tagline}
                    </p>
                  </TabsContent>
                );
              },
            )}
          </div>

          {(Object.keys(TAB_TIERS) as Array<keyof typeof TAB_TIERS>).map(
            (key) => (
              <TabsContent
                key={key}
                value={key}
                className="m-0 animate-in fade-in-0 duration-700"
              >
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                  {data?.[key]?.map((p) => (
                    <div key={p._id}>
                      <ProductCard data={p} />
                    </div>
                  ))}
                </div>
              </TabsContent>
            ),
          )}

          <div className="mt-11 flex justify-center lg:mt-14">
            <Link
              href="/category/new-arrivals"
              className="btn-gold group !px-8 !py-3"
            >
              View More
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </Tabs>
      </div>
    </section>
  );
}
