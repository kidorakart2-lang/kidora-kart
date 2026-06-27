import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductCard from "@/components/comman/ProductCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import type { ProductData } from "@/types";

export default function TabProducts({ data }: { data: Record<string, ProductData[]> }) {
  return (
    <section
      className="py-5 lg:py-1- bg-gradient-to-b from-white via-amber-50/10 to-white relative overflow-hidden"
      id="Products For You"
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-20 right-10 w-64 h-64 bg-amber-100/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-rose-100/20 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 relative z-10">
        <Tabs defaultValue="silver" className="w-full">
          {/* Tab Navigation */}
          <div className="flex flex-col items-center mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
              <span className="text-sm font-medium text-slate-600 tracking-wider uppercase">
                Discover Our Collections
              </span>
              <Sparkles className="w-5 h-5 text-amber-600 animate-pulse" />
            </div>

            <TabsList className="inline-flex bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-lg border border-amber-100/50 gap-1">
              <TabsTrigger
                value="silver"
                className="px-8 py-3 rounded-full font-semibold text-sm uppercase transition-all duration-300 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-700 data-[state=active]:to-slate-900 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Silver
              </TabsTrigger>
              <TabsTrigger
                value="gold"
                className="px-8 py-3 rounded-full font-semibold text-sm uppercase transition-all duration-300 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Gold
              </TabsTrigger>
              <TabsTrigger
                value="gift"
                className="px-8 py-3 rounded-full font-semibold text-sm uppercase transition-all duration-300 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-800 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Gift
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dynamic Collection Titles */}
          <div className="text-center mb-10 min-h-[60px] flex items-center justify-center">
            <TabsContent
              value="silver"
              className="m-0 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
            >
              <h2 className="text-3xl text-center md:text-4xl lg:text-5xl font-serif text-slate-800 flex items-center gap-3">
                <span className="text-slate-400">✦</span>
                Silver Collection
                <span className="text-slate-400">✦</span>
              </h2>
              <p className="text-slate-600 mt-3 text-sm md:text-base font-light text-center">
                Timeless elegance in sterling silver
              </p>
            </TabsContent>

            <TabsContent
              value="gold"
              className="m-0 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
            >
              <h2 className="text-3xl text-center md:text-4xl lg:text-5xl font-serif text-amber-800 flex items-center gap-3">
                <span className="text-amber-400">✦</span>
                Gold Collection
                <span className="text-amber-400">✦</span>
              </h2>
              <p className="text-slate-600 mt-3 text-sm md:text-base font-light text-center">
                Luxury crafted in precious gold
              </p>
            </TabsContent>

            <TabsContent
              value="gift"
              className="m-0 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
            >
              <h2 className="text-3xl text-center md:text-4xl lg:text-5xl font-serif text-rose-800 flex items-center gap-3">
                <span className="text-rose-400">✦</span>
                Gift Collection
                <span className="text-rose-400">✦</span>
              </h2>
              <p className="text-slate-600 mt-3 text-sm md:text-base font-light text-center">
                Perfect presents for every occasion
              </p>
            </TabsContent>
          </div>

          {/* Product Grids */}
          <TabsContent
            value="silver"
            className="m-0 animate-in fade-in-0 duration-700"
          >
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
              {data?.silver?.map((p) => (
                <div
                  key={p._id}
                  className="animate-in fade-in-0 slide-in-from-bottom-8 duration-500"
                  style={{ animationDelay: `${Math.random() * 200}ms` }}
                >
                  <ProductCard data={p} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent
            value="gold"
            className="m-0 animate-in fade-in-0 duration-700"
          >
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-4">
              {data?.gold?.map((p) => (
                <div
                  key={p._id}
                  className="animate-in fade-in-0 slide-in-from-bottom-8 duration-500"
                  style={{ animationDelay: `${Math.random() * 200}ms` }}
                >
                  <ProductCard data={p} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent
            value="gift"
            className="m-0 animate-in fade-in-0 duration-700"
          >
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-4">
              {data?.gift?.map((p) => (
                <div
                  key={p._id}
                  className="animate-in fade-in-0 slide-in-from-bottom-8 duration-500"
                  style={{ animationDelay: `${Math.random() * 200}ms` }}
                >
                  <ProductCard data={p} />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* View More Button */}
          <div className="flex justify-center mt-12 lg:mt-16">
            <Link href="/category/new-arrivals">
              <Button className="group relative bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-10 py-6 rounded-full font-semibold text-sm uppercase tracking-wider shadow-lg hover:shadow-2xl hover:shadow-amber-500/40 transition-all duration-500 transform hover:scale-105 overflow-hidden">
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-500"></span>
                <span className="relative flex items-center gap-3">
                  View More
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <span className="absolute inset-0 rounded-full ring-2 ring-white/0 group-hover:ring-white/50 transition-all duration-500 group-hover:scale-110"></span>
              </Button>
            </Link>
          </div>
        </Tabs>
      </div>
    </section>
  );
}
