import React from "react";
import { cacheLife, cacheTag } from "next/cache";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "@/components/comman/ProductCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

import type { ProductData } from "@/types";
import { TAG_PRODUCTS } from "@/lib/revalidation-tags";

async function getProducts(q: string) {
  "use cache";
  cacheLife("search");
  cacheTag(TAG_PRODUCTS);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}api/website/product/get-by-search?search=${q}&limit=8`
    );
    if (!response.ok ) return [];
    const data = await response.json();
    return data._data;
  } catch {
    return [];
  }
}

export default async function ProductsTab() {
  const [payalData, necklaceData, braceletData] = await Promise.all([
    getProducts("earrings"),
    getProducts("necklace"),
    getProducts("bracelet"),
  ]);

  const tabItems = [
    { value: "earrings", label: "EarRings", data: payalData, icon: "✦" },
    { value: "necklace", label: "Necklaces", data: necklaceData, icon: "◆" },
    { value: "bracelet", label: "Bracelets", data: braceletData, icon: "○" },
  ];

  return (
    <section className="py-16 lg:py-20 relative overflow-hidden bg-section">
      <div className="section-container relative z-10">
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5" style={{ color: "var(--brand-primary)" }} />
            <span className="text-sm font-medium tracking-wider uppercase" style={{ color: "var(--muted-foreground)" }}>
              Explore Our Range
            </span>
            <Sparkles className="w-5 h-5" style={{ color: "var(--brand-primary)" }} />
          </div>

          <h2 className="section-heading mb-4">
            Our Products Collection
          </h2>

          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent" style={{ backgroundImage: `linear-gradient(to right, transparent, var(--brand-primary))` }} />
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "var(--brand-primary)" }} />
            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent" style={{ backgroundImage: `linear-gradient(to left, transparent, var(--brand-primary))` }} />
          </div>

          <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base lg:text-lg font-light leading-relaxed">
            Discover our exquisite collection of handcrafted jewellery, designed
            to add elegance to your every moment.
          </p>
        </div>

        <Tabs defaultValue={tabItems[0].value} className="w-full">
          <div className="flex justify-center mb-6 lg:mb-10">
            <TabsList className="inline-flex bg-card backdrop-blur-sm rounded-full p-1.5 shadow-xl border" style={{ borderColor: "color-mix(in srgb, var(--brand-primary) 15%, transparent)" }}>
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="px-6 md:px-8 py-3 md:py-3.5 rounded-full font-semibold text-xs md:text-sm uppercase transition-all duration-300"
                  style={{
                    color: "var(--muted-foreground)",
                  }}
                >
                  <span className="hidden md:inline mr-2">{tab.icon}</span>
                  {tab.label}
                </TabsTrigger>
              ))}
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
                      {tab.data.map((product: ProductData, index: number) => (
                        <div key={product._id}>
                          <ProductCard data={product} />
                        </div>
                      ))}
                    </div>

                    <div className="text-center mt-12">
                      <Link href={`/category/shop-by-category?q=${tab.value}`}>
                        <Button
                          variant="outline"
                          className="group relative px-8 py-6 rounded-full font-semibold text-sm uppercase tracking-wider shadow-md overflow-hidden"
                        >
                          <span className="relative flex items-center gap-3">
                            View All {tab.label}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                          </span>
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 bg-card/50 backdrop-blur-sm rounded-2xl border">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-4">
                      <Sparkles className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-light text-muted-foreground">
                      No {tab.label.toLowerCase()} found at the moment.
                    </p>
                    <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
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
