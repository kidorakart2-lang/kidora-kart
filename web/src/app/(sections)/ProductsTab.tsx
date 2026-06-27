import React, { cache } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "@/components/comman/ProductCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

import type { ProductData } from "@/types";

const getProducts = cache(async (q: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}api/website/product/get-by-search?search=${q}&limit=8`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!response.ok ) return [];
    const data = await response.json();
    return data._data;
  } catch {
    return [];
  }
});

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
    <section className="py-16 lg:py-20 bg-gradient-to-b from-amber-50/30 via-white to-amber-50/30 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-100/40 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-rose-100/40 to-transparent rounded-full blur-3xl"></div>

      {/* Floating Decorative Shapes */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-3 h-3 bg-rose-400 rounded-full animate-pulse [animation-delay:500ms]"></div>
      <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-purple-400 rounded-full animate-pulse [animation-delay:1000ms]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
            <span className="text-sm font-medium text-slate-600 tracking-wider uppercase">
              Explore Our Range
            </span>
            <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-slate-800 mb-4 tracking-wide">
            Our Products Collection
          </h2>

          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-amber-600"></div>
            <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
            <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-amber-600"></div>
          </div>

          <p className="text-slate-600 max-w-2xl mx-auto text-sm md:text-base lg:text-lg font-light leading-relaxed">
            Discover our exquisite collection of handcrafted jewellery, designed
            to add elegance to your every moment.
          </p>
        </div>

        <Tabs defaultValue={tabItems[0].value} className="w-full">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-6 lg:mb-10">
            <TabsList className="inline-flex bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-xl border border-amber-100/50 gap-1">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="px-6 md:px-8 py-3 md:py-3.5 rounded-full font-semibold text-xs md:text-sm uppercase transition-all duration-300 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800 data-[state=inactive]:hover:bg-slate-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30"
                >
                  <span className="hidden md:inline mr-2">{tab.icon}</span>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content */}
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
                        <div
                          key={product._id}
                          className="animate-in fade-in-0 slide-in-from-bottom-8 duration-500"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <ProductCard data={product} />
                        </div>
                      ))}
                    </div>

                    {/* View All Button */}
                    <div className="text-center mt-12">
                      <Link href={`/category/shop-by-category?q=${tab.value}`}>
                        <Button className="group relative bg-white hover:bg-amber-50 text-amber-600 border-2 border-amber-500 hover:border-amber-600 px-8 py-6 rounded-full font-semibold text-sm uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-amber-500/20 transform hover:scale-105 overflow-hidden">
                          <span className="relative flex items-center gap-3">
                            View All {tab.label}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                          </span>
                          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/10 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                        </Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                      <Sparkles className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 text-lg font-light">
                      No {tab.label.toLowerCase()} found at the moment.
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
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
