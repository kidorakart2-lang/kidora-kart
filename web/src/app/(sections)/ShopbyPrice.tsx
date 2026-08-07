"use client";
import { setPriceRange } from "@/redux/features/filters";
import { Gift, Heart, IndianRupee, Star, Sparkles, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useDispatch } from "react-redux";

const SHOP_BY_PRICE_HREF = "/category/new-arrivals";

const ShopByPrice = ({ heading }: { heading?: string }) => {
  const dispatch = useDispatch();

  const priceCategories = [
    {
      icon: IndianRupee,
      label: "Under ₹599",
      sublabel: "Budget Friendly",
      priceFrom: 0,
      priceTo: 599,
    },
    {
      icon: Star,
      label: "₹600 - ₹999",
      sublabel: "Best Sellers",
      priceFrom: 600,
      priceTo: 999,
    },
    {
      icon: Gift,
      label: "₹1000 - ₹1999",
      sublabel: "Premium Choice",
      priceFrom: 1000,
      priceTo: 1999,
    },
    {
      icon: Heart,
      label: "₹2000 & Above",
      sublabel: "Luxury Collection",
      priceFrom: 2000,
      priceTo: 100000,
    },
  ];

  return (
    <div className="w-full bg-section py-4 overflow-hidden">
      <div className="section-container">
        <div className="text-center mb-6 relative">
          <div className="inline-block relative">
            <h2 className="text-2xl md:text-3xl font-serif font-light mb-2 tracking-wide text-gradient-brand">
              {heading || "Shop by Price"}
            </h2>
            <span
              className="absolute bottom-[-8px] left-1/2 transform -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent"
              style={{ backgroundImage: `linear-gradient(to right, transparent, var(--brand-primary), transparent)` }}
            />
          </div>

          <p className="text-muted-foreground mt-4 font-light tracking-widest text-sm">
            Find Your Perfect Match
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {priceCategories.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="group relative">
                <div
                  className={`relative rounded-2xl border border-border bg-card overflow-hidden p-6 flex flex-col items-center justify-center min-h-[240px]
                    shadow-[0_1px_2px_rgba(16,24,40,0.04)]
                    transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform
                    group-hover:-translate-y-1.5
                    hover:shadow-[0_12px_24px_-8px_rgba(16,24,40,0.14)]
                    hover:border-brand-200`}
                >
                  <div className="relative mb-5">
                    <div className="relative flex items-center justify-center w-14 h-14 rounded-full border border-border bg-muted text-brand-700 transition-colors duration-300 group-hover:border-brand-200 group-hover:bg-brand-50">
                      <Icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                  </div>

                  <div className="relative z-10 text-center">
                    <p className="text-[11px] font-medium text-muted-foreground mb-2 tracking-[0.2em] uppercase">
                      {item.sublabel}
                    </p>
                    <p className="text-xl font-serif text-foreground mb-6 tracking-wide">
                      {item.label}
                    </p>

                    <Link href={SHOP_BY_PRICE_HREF} aria-label={`Shop products ${item.label}`}>
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
                        className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full border border-border text-sm font-medium text-muted-foreground
                          transition-colors duration-300 group-hover:border-brand-500/60 group-hover:text-brand-700 group-hover:bg-brand-50/60 active:scale-[0.98]"
                      >
                        Shop Now
                        <ArrowUpRight
                          className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden="true"
                        />
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
