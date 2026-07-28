import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "@/components/comman/ProductCard";
import HoverButton from "@/components/comman/HoverButton";
import { Zap, Dices, Boxes, Sparkles } from "lucide-react";

import type { ProductData } from "@/types";
import { getProducts } from "@/lib/get-products";
import { getCategoryHref } from "@/lib/category-nav";
import { serverFetch } from "@/lib/server-fetch";

async function getNavCategories(): Promise<import("@/types").CategoryData[]> {
  try {
    const res = await serverFetch("/api/website/nav", { timeout: 5000 });
    if (!res.ok) return [];
    const data = await res.json();
    return data._data ?? [];
  } catch {
    return [];
  }
}

const TIER_COLORS = [
  "var(--brand-card-3-icon)", // action figures — green
  "var(--brand-card-5-icon)", // board games — sky
  "var(--brand-card-1-icon)", // building blocks — gold
] as const;

export default async function ProductsTab() {
  const [actionFiguresData, boardGamesData, buildingBlocksData, categories] =
    await Promise.all([
      getProducts("action-figures"),
      getProducts("board-games"),
      getProducts("building-blocks"),
      getNavCategories(),
    ]);

  const tabItems = [
    {
      value: "action-figures",
      label: "Action Figures",
      data: actionFiguresData,
      icon: Zap,
      color: TIER_COLORS[0],
    },
    {
      value: "board-games",
      label: "Board Games",
      data: boardGamesData,
      icon: Dices,
      color: TIER_COLORS[1],
    },
    {
      value: "building-blocks",
      label: "Building Blocks",
      data: buildingBlocksData,
      icon: Boxes,
      color: TIER_COLORS[2],
    },
  ];

  return (
    <section className="py-16 lg:py-20 relative overflow-hidden bg-section">
      <div className="section-container relative z-10">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="section-heading relative inline-block mb-4">
            Our Products Collection
            <svg
              viewBox="0 0 120 12"
              className="absolute -bottom-3 left-1/2 h-3 w-28 -translate-x-1/2"
              style={{ color: "var(--brand-primary)" }}
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 8 Q 20 1 40 7 T 78 6 T 118 4"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base lg:text-lg fw-body leading-relaxed mt-6">
            Discover our exciting collection of toys and games, designed to
            bring joy and learning to every child&apos;s day.
          </p>
        </div>

        <Tabs defaultValue={tabItems[0].value} className="w-full">
          <div className="flex justify-center mb-6 lg:mb-10">
            <TabsList className="inline-flex bg-card rounded-full p-1.5 shadow-xl border border-border gap-1">
              {tabItems.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    style={{ ["--tab-active-bg" as string]: tab.color }}
                    className="flex items-center px-6 md:px-8 py-3 md:py-3.5 rounded-full fw-cta text-xs md:text-sm uppercase transition-all duration-300 text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=active]:bg-[var(--tab-active-bg)] data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    <Icon className="h-4 w-4 md:mr-2" />
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
