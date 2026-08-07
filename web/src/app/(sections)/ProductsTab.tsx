import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "@/components/comman/ProductCard";
import HoverButton from "@/components/comman/HoverButton";
import { Gem, Crown, CircleDot, Sparkles } from "lucide-react";

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
  "var(--brand-card-1-icon)", // gold
  "var(--brand-card-2-icon)", // coral
  "var(--brand-card-5-icon)", // sky
  "var(--brand-card-3-icon)", // grass
] as const;

const TIER_ICONS = [Gem, Crown, CircleDot, Sparkles] as const;

// Default tab set used when the section is rendered without config
// (e.g. the static homepage layout). The dynamic home-page section passes
// its own comma-separated searchTerms instead.
const DEFAULT_TABS = [
  { value: "earrings", label: "Earrings" },
  { value: "necklace", label: "Necklaces" },
  { value: "bracelet", label: "Bracelets" },
];

interface ProductsTabProps {
  heading?: string;
  /** Comma-separated search terms — each becomes a tab (dynamic home section). */
  searchTerms?: string;
}

export default async function ProductsTab({
  heading,
  searchTerms,
}: ProductsTabProps = {}) {
  const termsInput = searchTerms?.trim();
  const hasDynamicTerms = !!termsInput;

  const rawTerms = hasDynamicTerms
    ? Array.from(
        new Set(
          termsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        ),
      )
    : DEFAULT_TABS.map((t) => t.value);

  if (rawTerms.length === 0) return null;

  // Title-case each word so multi-word search terms read nicely
  // e.g. "gold-necklaces" → "Gold Necklaces", "bridal sets" → "Bridal Sets"
  const toTitleCase = (term: string) =>
    term
      .split(/[-\s]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  const labels = hasDynamicTerms
    ? rawTerms.map(toTitleCase)
    : DEFAULT_TABS.map((t) => t.label);

  const [dataResults, categories] = await Promise.all([
    Promise.all(rawTerms.map((term) => getProducts(term))),
    getNavCategories(),
  ]);

  const tabItems = rawTerms.map((term, i) => ({
    value: term,
    label: labels[i],
    data: dataResults[i],
    icon: TIER_ICONS[i % TIER_ICONS.length],
    color: TIER_COLORS[i % TIER_COLORS.length],
  }));

  return (
    <section className="py-10 lg:py-14 relative overflow-hidden bg-section">
      <div className="section-container relative z-10">
        <div className="text-center mb-8 lg:mb-10">
          <h2 className="section-heading relative inline-block mb-4">
            {heading || "Our Products Collection"}
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
            Discover our exquisite collection of handcrafted jewellery,
            designed to bring timeless elegance to every occasion.
          </p>
        </div>

        <Tabs defaultValue={tabItems[0].value} className="w-full">
          <div className="flex justify-center mb-4 lg:mb-6">
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

          <div className="mt-4">
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

                    <div className="text-center mt-8">
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
