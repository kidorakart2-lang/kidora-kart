import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "@/components/comman/ProductCard";
import HoverButton from "@/components/comman/HoverButton";
import { Gem, Crown, Sparkles } from "lucide-react";

import type { ProductData } from "@/types";
import { getProducts } from "@/lib/get-products";
import { getCategoryHref } from "@/lib/category-nav";
// ponytail: nav is fetched server-side with the same cache tag as the root
// layout (home-data.ts) — one API hit, shared cache.
import { getNavCategories } from "@/lib/home-data";

const TIER_COLORS = [
  "var(--brand-card-2-icon)", // earrings — wine
  "var(--brand-card-1-icon)", // necklaces — gold
  "var(--brand-card-3-icon)", // bangles — emerald
] as const;

export default async function ProductsTab() {
  const [earringsData, necklacesData, banglesData, categories] =
    await Promise.all([
      getProducts("earrings"),
      getProducts("necklaces"),
      getProducts("bangles"),
      getNavCategories(),
    ]);

  const tabItems = [
    {
      value: "earrings",
      label: "Earrings",
      data: earringsData,
      icon: Gem,
      color: TIER_COLORS[0],
    },
    {
      value: "necklaces",
      label: "Necklaces",
      data: necklacesData,
      icon: Crown,
      color: TIER_COLORS[1],
    },
    {
      value: "bangles",
      label: "Bangles",
      data: banglesData,
      icon: Sparkles,
      color: TIER_COLORS[2],
    },
  ];

  return (
    <section className="relative overflow-hidden bg-white py-16 lg:py-20">
      <div className="section-container relative z-10">
        <div className="mb-10 text-center lg:mb-12">
          <p className="eyebrow mb-3">
            <span className="mr-2">✦</span>
            The full collection
          </p>
          <h2 className="display-heading text-3xl sm:text-4xl lg:text-[2.75rem]">
            Our Jewellery <span className="accent-italic">Collection</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[13px] leading-relaxed text-[var(--brand-ink)]/60 sm:text-sm">
            Exquisite, everyday jewellery crafted to add a little sparkle to
            every occasion.
          </p>
        </div>

        <Tabs defaultValue={tabItems[0].value} className="w-full">
          <div className="mb-8 flex justify-center lg:mb-10">
            <TabsList className="tab-pill-track">
              {tabItems.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="tab-pill"
                  >
                    <Icon className="h-3.5 w-3.5 md:mr-1.5" />
                    <span className="hidden md:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <div className="mt-8">
            {tabItems.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="m-0 animate-in fade-in-0 slide-in-from-bottom-6 duration-700"
              >
                {tab.data && tab.data.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
                      {tab.data.map((product: ProductData) => (
                        <div key={product._id}>
                          <ProductCard data={product} />
                        </div>
                      ))}
                    </div>

                    <div className="text-center mt-12">
                      <HoverButton href={getCategoryHref(categories, tab.value)} label={tab.label} color={tab.color} />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 bg-card/50 rounded-2xl border">
                    <div
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                      style={{ backgroundColor: "color-mix(in srgb, " + tab.color + " 10%, transparent)" }}
                    >
                      <Sparkles
                        className="w-8 h-8"
                        style={{ color: tab.color }}
                      />
                    </div>
                    <p className="text-lg fw-body text-muted-foreground">
                      No {tab.label.toLowerCase()} found at the moment.
                    </p>
                    <p className="text-sm mt-2 text-muted-foreground">
                      Check back soon for new arrivals!
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </section>
  );
}
