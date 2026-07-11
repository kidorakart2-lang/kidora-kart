"use client";
import { Button } from "@/components/ui/button";
import { setPriceRange } from "@/redux/features/filters";
import { Gift, Heart, IndianRupee, Star } from "lucide-react";
import Link from "next/link";
import { useDispatch } from "react-redux";

const ShopByPrice = ({ heading }: { heading?: string }) => {
  const priceCategories = [
    {
      icon: IndianRupee,
      label: "Under ₹599",
      sublabel: "Value Picks",
      priceFrom: 0,
      priceTo: 599,
      url: "/category/shop-by-category",
    },
    {
      icon: Star,
      label: "₹600 - ₹999",
      sublabel: "Popular Picks",
      priceFrom: 600,
      priceTo: 999,
      url: "/category/shop-by-category",
    },
    {
      icon: Gift,
      label: "₹1000 - ₹1999",
      sublabel: "Top Favourites",
      priceFrom: 1000,
      priceTo: 1999,
      url: "/category/shop-by-category",
    },
    {
      icon: Heart,
      label: "₹2000 & Above",
      sublabel: "Ultimate Fun",
      priceFrom: 2000,
      priceTo: 100000,
      url: "/category/shop-by-category",
    },
  ];

  const dispatch = useDispatch();

  return (
    <div className="w-full bg-section py-6 md:py-10 overflow-hidden">
      <div className="section-container">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl fw-heading mb-3 tracking-wide text-foreground">
            {heading || "Shop by Price"}
          </h2>
          <p className="text-muted-foreground mt-4 fw-body tracking-widest text-sm">
            Find the Perfect Toy for Every Age
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {priceCategories.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="group relative">
                <div className="relative bg-card rounded-2xl shadow-sm border border-border overflow-hidden p-6 md:p-8 flex flex-col items-center justify-center min-h-[200px] transition-all duration-300 hover:shadow-md hover:border-border/80">
                  <div className="mb-4">
                    <div className="p-4 rounded-full bg-muted">
                      <Icon className="w-7 h-7 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-xs fw-body text-muted-foreground mb-1 tracking-wider uppercase">
                      {item.sublabel}
                    </p>
                    <p className="text-lg font-semibold text-foreground mb-4">
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
      </div>
    </div>
  );
};

export default ShopByPrice;
