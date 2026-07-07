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
      className="py-5 lg:py-12 bg-section relative overflow-hidden"
      id="Products For You"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Tabs defaultValue="silver" className="w-full">
          {/* Tab Navigation */}
          <div className="flex flex-col items-center mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5" style={{ color: 'var(--brand-heading)' }} />
              <span className="text-sm font-medium text-muted-foreground tracking-wider uppercase">
                Discover Our Collections
              </span>
              <Sparkles className="w-5 h-5" style={{ color: 'var(--brand-heading)' }} />
            </div>

            <TabsList
              className="inline-flex bg-background/80 backdrop-blur-sm rounded-full p-1.5 shadow-lg gap-1"
              style={{ borderColor: 'color-mix(in srgb, var(--brand-primary) 40%, transparent)' }}
            >
              <TabsTrigger
                value="silver"
                className="px-8 py-3 rounded-full font-semibold text-sm uppercase transition-all duration-300 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-700 data-[state=active]:to-slate-900 data-[state=active]:text-background data-[state=active]:shadow-md"
              >
                Silver
              </TabsTrigger>
              <TabsTrigger
                value="gold"
                className="px-8 py-3 rounded-full font-semibold text-sm uppercase transition-all duration-300 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--brand-primary-dark)] data-[state=active]:to-[var(--brand-primary)] data-[state=active]:text-background data-[state=active]:shadow-md"
              >
                Gold
              </TabsTrigger>
              <TabsTrigger
                value="gift"
                className="px-8 py-3 rounded-full font-semibold text-sm uppercase transition-all duration-300 data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--brand-secondary)] data-[state=active]:to-[var(--brand-secondary-dark)] data-[state=active]:text-background data-[state=active]:shadow-md"
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
              <h2 className="text-3xl text-center md:text-4xl lg:text-5xl font-serif text-foreground flex items-center gap-3">
                <span className="text-muted-foreground">✦</span>
                Silver Collection
                <span className="text-muted-foreground">✦</span>
              </h2>
              <p className="text-muted-foreground mt-3 text-sm md:text-base font-light text-center">
                Timeless elegance in sterling silver
              </p>
            </TabsContent>

            <TabsContent
              value="gold"
              className="m-0 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
            >
              <h2 className="text-3xl text-center md:text-4xl lg:text-5xl font-serif flex items-center gap-3"
                style={{ color: 'var(--brand-heading)' }}
              >
                <span style={{ color: 'var(--brand-primary-light)' }}>✦</span>
                Gold Collection
                <span style={{ color: 'var(--brand-primary-light)' }}>✦</span>
              </h2>
              <p className="text-muted-foreground mt-3 text-sm md:text-base font-light text-center">
                Luxury crafted in precious gold
              </p>
            </TabsContent>

            <TabsContent
              value="gift"
              className="m-0 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
            >
              <h2 className="text-3xl text-center md:text-4xl lg:text-5xl font-serif flex items-center gap-3"
                style={{ color: 'var(--brand-secondary)' }}
              >
                <span style={{ color: 'var(--brand-secondary)' }}>✦</span>
                Gift Collection
                <span style={{ color: 'var(--brand-secondary)' }}>✦</span>
              </h2>
              <p className="text-muted-foreground mt-3 text-sm md:text-base font-light text-center">
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
                <div key={p._id}>
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
                <div key={p._id}>
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
                <div key={p._id}>
                  <ProductCard data={p} />
                </div>
              ))}
            </div>
          </TabsContent>

          {/* View More Button */}
          <div className="flex justify-center mt-12 lg:mt-16">
            <Link href="/category/new-arrivals">
              <Button variant="gradient" className="group relative px-10 py-6 rounded-full font-semibold text-sm uppercase tracking-wider shadow-lg transition-all duration-500 overflow-hidden">
                <span className="relative flex items-center gap-3">
                  View More
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </Button>
            </Link>
          </div>
        </Tabs>
      </div>
    </section>
  );
}
