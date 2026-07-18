import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "@/components/comman/ProductCard";
import Link from "next/link";
import { Gem, Crown, Gift as GiftIcon, ArrowRight } from "lucide-react";
import type { ProductData } from "@/types";

const TAB_TIERS = {
  silver: {
    color: "#4DABF7",
    soft: "#E7F5FF",
    icon: Gem,
    label: "Silver Collection",
    tagline: "Timeless elegance in sterling silver",
  },
  gold: {
    color: "#F59F00",
    soft: "#FFF3BF",
    icon: Crown,
    label: "Gold Collection",
    tagline: "Luxury crafted in precious gold",
  },
  gift: {
    color: "#FF6B6B",
    soft: "#FFE3E3",
    icon: GiftIcon,
    label: "Gift Collection",
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
      className="py-5 lg:py-12 bg-section relative overflow-hidden"
      id="Products For You"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Tabs defaultValue="silver" className="w-full">
          <div className="flex flex-col items-center mb-12">
            <span className="text-sm font-medium text-muted-foreground tracking-wider uppercase mb-6">
              Discover Our Collections
            </span>

            <TabsList className="inline-flex bg-card rounded-full p-1.5 shadow-lg gap-1 border border-border">
              {(Object.keys(TAB_TIERS) as Array<keyof typeof TAB_TIERS>).map(
                (key) => {
                  const tier = TAB_TIERS[key];
                  const Icon = tier.icon;
                  return (
                    <TabsTrigger
                      key={key}
                      value={key}
                      style={{ ["--tab-active-bg" as string]: tier.color }}
                      className="flex items-center gap-1.5 px-6 md:px-8 py-3 rounded-full fw-cta text-sm uppercase transition-all duration-300 text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=active]:bg-[var(--tab-active-bg)] data-[state=active]:text-white data-[state=active]:shadow-md"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {key}
                    </TabsTrigger>
                  );
                },
              )}
            </TabsList>
          </div>

          <div className="text-center mb-10 min-h-[60px] flex items-center justify-center">
            {(Object.keys(TAB_TIERS) as Array<keyof typeof TAB_TIERS>).map(
              (key) => {
                const tier = TAB_TIERS[key];
                return (
                  <TabsContent
                    key={key}
                    value={key}
                    className="m-0 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
                  >
                    <h2 className="text-3xl text-center md:text-4xl lg:text-5xl fw-heading text-foreground flex items-center gap-3">
                      <span style={{ color: tier.color }}>✦</span>
                      {tier.label}
                      <span style={{ color: tier.color }}>✦</span>
                    </h2>
                    <p className="text-muted-foreground mt-3 text-sm md:text-base fw-body text-center">
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

          <div className="flex justify-center mt-12 lg:mt-16">
            <Link href="/category/new-arrivals">
              <button
                type="button"
                className="group inline-flex items-center gap-3 rounded-full px-10 py-4 fw-cta text-sm uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-section"
                style={{
                  backgroundColor: "var(--brand-primary)",
                  ["--tw-ring-color" as string]: "var(--brand-primary)",
                }}
              >
                View More
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </Tabs>
      </div>
    </section>
  );
}
