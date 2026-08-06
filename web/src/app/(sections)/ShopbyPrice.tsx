"use client";
import { setPriceRange } from "@/redux/features/filters";
import { Gift, Heart, IndianRupee, Star, Sparkles } from "lucide-react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import type { CategoryData } from "@/types";
import { getCategoryHref } from "@/lib/category-nav";

const ShopByPrice = ({ heading }: { heading?: string }) => {
  const dispatch = useDispatch();
  const navigation = useSelector((state: RootState) => state.ui.navigation);
  const categories = (navigation as { _data?: CategoryData[] })?._data ?? [];
  const categoryHref = getCategoryHref(categories);

  const priceCategories = [
    {
      icon: IndianRupee,
      label: "Under ₹599",
      sublabel: "Budget Friendly",
      priceFrom: 0,
      priceTo: 599,
      idx: 1,
    },
    {
      icon: Star,
      label: "₹600 - ₹999",
      sublabel: "Best Sellers",
      priceFrom: 600,
      priceTo: 999,
      idx: 2,
    },
    {
      icon: Gift,
      label: "₹1000 - ₹1999",
      sublabel: "Premium Choice",
      priceFrom: 1000,
      priceTo: 1999,
      idx: 3,
    },
    {
      icon: Heart,
      label: "₹2000 & Above",
      sublabel: "Luxury Collection",
      priceFrom: 2000,
      priceTo: 100000,
      idx: 4,
    },
  ];

  return (
    <div className="w-full bg-section py-6 md:py-10 overflow-hidden">
      <div className="section-container">
        <div className="text-center mb-12 relative">
          <div className="inline-block relative">
            <h2 className="text-4xl md:text-5xl font-serif font-light mb-3 tracking-wide text-gradient-brand">
              {heading || "Shop by Price"}
            </h2>
            <span
              className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent"
              style={{ backgroundImage: `linear-gradient(to right, transparent, var(--brand-primary), transparent)` }}
            />
          </div>

          <p className="text-muted-foreground mt-8 font-light tracking-widest text-sm">
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
                    border border-white/50 overflow-hidden p-6 flex flex-col items-center justify-center min-h-[200px] backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-1.5`}
                >
                  <div className="relative mb-4">
                    <div className="relative p-4 rounded-full bg-background/25 backdrop-blur-sm">
                      <Icon className="w-8 h-8 text-background" />
                    </div>
                  </div>

                  <div className="relative z-10 text-center">
                    <p className="text-xs font-light text-foreground/70 mb-1 tracking-wider uppercase">
                      {item.sublabel}
                    </p>
                    <p className="text-lg font-semibold text-foreground mb-3">
                      {item.label}
                    </p>

                    <Link href={categoryHref}>
                      <button
                        type="button"
                        onClick={() =>
                          dispatch(
                            setPriceRange({
                              priceFrom: item.priceFrom,
                              priceTo: item.priceTo,
                            }),
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-sm border-2 px-6 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:brightness-95 active:scale-95"
                        style={{
                          borderColor: "color-mix(in srgb, var(--brand-primary) 40%, transparent)",
                        }}
                      >
                        Shop Now
                        <span aria-hidden="true">→</span>
                      </button>
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
