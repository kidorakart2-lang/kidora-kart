"use client";
import { Button } from "@/components/ui/button";
import { setPriceRange } from "@/redux/features/filters";
import { Gift, Heart, IndianRupee, Star, Sparkles } from "lucide-react";
import Link from "next/link";
import { useDispatch } from "react-redux";

const ShopByPrice = ({ heading }: { heading?: string }) => {
  const priceCategories = [
    {
      icon: IndianRupee,
      label: "Under ₹599",
      sublabel: "Budget Friendly",
      priceFrom: 0,
      priceTo: 599,
      url: "/category/shop-by-category",
      idx: 1,
    },
    {
      icon: Star,
      label: "₹600 - ₹999",
      sublabel: "Best Sellers",
      priceFrom: 600,
      priceTo: 999,
      url: "/category/shop-by-category",
      idx: 2,
    },
    {
      icon: Gift,
      label: "₹1000 - ₹1999",
      sublabel: "Premium Choice",
      priceFrom: 1000,
      priceTo: 1999,
      url: "/category/shop-by-category",
      idx: 3,
    },
    {
      icon: Heart,
      label: "₹2000 & Above",
      sublabel: "Luxury Collection",
      priceFrom: 2000,
      priceTo: 100000,
      url: "/category/shop-by-category",
      idx: 4,
    },
  ];

  const dispatch = useDispatch();

  return (
    <div className="w-full bg-section py-6 md:py-10 overflow-hidden">
      <div className="section-container">
        <div className="text-center mb-12 relative">
          <div className="inline-block relative">
            <h2 className="text-4xl md:text-5xl font-light mb-3 tracking-wide text-gradient-brand">
              {heading || "Shop by Price"}
            </h2>
          </div>

          <p className="text-muted-foreground mt-6 font-light tracking-widest text-sm">
            Find Your Perfect Match
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {priceCategories.map((item, index) => {
            const Icon = item.icon;
            const i = item.idx;
            return (
              <div key={index} className="group relative">
                <div
                  className={`relative bg-price-${i} rounded-2xl shadow-lg shadow-price-${i}
                    border border-white/50 overflow-hidden p-6 flex flex-col items-center justify-center min-h-[200px] backdrop-blur-sm`}
                >
                  <div className="relative mb-4">
                    <div className={`relative p-4 rounded-full bg-price-${i}`}>
                      <Icon className="w-8 h-8 text-background" />
                    </div>
                  </div>

                  <div className="relative z-10 text-center">
                    <p className="text-xs font-light text-muted-foreground mb-1 tracking-wider uppercase">
                      {item.sublabel}
                    </p>
                    <p className="text-lg font-semibold text-foreground mb-3">
                      {item.label}
                    </p>

                    <Link href={item.url}>
                      <Button
                        variant="gradient"
                        size="sm"
                        onClick={() =>
                          dispatch(
                            setPriceRange({
                              priceFrom: item.priceFrom,
                              priceTo: item.priceTo,
                            }),
                          )
                        }
                        className="rounded-full text-sm font-medium px-6"
                      >
                        <span className="flex items-center gap-2">
                          Shop Now
                          <span>→</span>
                        </span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 flex items-center justify-center gap-4">
          <span
            className="w-20 h-px bg-gradient-to-r from-transparent"
            style={{
              backgroundImage: `linear-gradient(to right, transparent, var(--brand-primary))`,
            }}
          />
          <Sparkles
            className="w-4 h-4"
            style={{ color: "var(--brand-primary)" }}
          />
          <span
            className="w-20 h-px bg-gradient-to-l from-transparent"
            style={{
              backgroundImage: `linear-gradient(to left, transparent, var(--brand-primary))`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ShopByPrice;
