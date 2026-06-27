"use client";
import { Button } from "@/components/ui/button";
import { setPriceRange } from "@/redux/features/filters";
import { Gift, Heart, IndianRupee, Star, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useDispatch } from "react-redux";

const ShopByPrice = ({ bg = "" }: { bg?: string }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const priceCategories = [
    {
      icon: IndianRupee,
      label: "Under ₹599",
      sublabel: "Budget Friendly",
      priceFrom: 0,
      priceTo: 599,
      url: "/category/shop-by-category",
      gradient: "from-amber-400 via-yellow-500 to-amber-600",
      bgGradient: "from-amber-50 to-yellow-50",
      shadowColor: "shadow-amber-200",
      glowColor: "group-hover:shadow-amber-300/50",
    },
    {
      icon: Star,
      label: "₹600 - ₹999",
      sublabel: "Best Sellers",
      priceFrom: 600,
      priceTo: 999,
      url: "/category/shop-by-category",
      gradient: "from-purple-400 via-fuchsia-500 to-purple-600",
      bgGradient: "from-purple-50 to-fuchsia-50",
      shadowColor: "shadow-purple-200",
      glowColor: "group-hover:shadow-purple-300/50",
    },
    {
      icon: Gift,
      label: "₹1000 - ₹1999",
      sublabel: "Premium Choice",
      priceFrom: 1000,
      priceTo: 1999,
      url: "/category/shop-by-category",
      gradient: "from-rose-400 via-pink-500 to-rose-600",
      bgGradient: "from-rose-50 to-pink-50",
      shadowColor: "shadow-rose-200",
      glowColor: "group-hover:shadow-rose-300/50",
    },
    {
      icon: Heart,
      label: "₹2000 & Above",
      sublabel: "Luxury Collection",
      priceFrom: 2000,
      priceTo: 100000,
      url: "/category/shop-by-category",
      gradient: "from-emerald-400 via-teal-500 to-emerald-600",
      bgGradient: "from-emerald-50 to-teal-50",
      shadowColor: "shadow-emerald-200",
      glowColor: "group-hover:shadow-emerald-300/50",
    },
  ];

  const dispatch = useDispatch();

  return (
    <div className={`w-full ${bg} bg-gradient-to-br from-slate-50 via-amber-50/30 to-slate-50 py-6 md:py-10 overflow-hidden`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Enhanced Heading */}
        <div className="text-center mb-12 relative">
          {/* Floating sparkle decorations */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>

          <div className="inline-block relative">
            {/* Top decorative line */}
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              <span className="w-8 h-[1px] bg-gradient-to-r from-transparent to-amber-400"></span>
              <span className="w-1.5 h-1.5 rotate-45 bg-amber-500"></span>
              <span className="w-8 h-[1px] bg-gradient-to-l from-transparent to-amber-400"></span>
            </div>

            <h2 className="text-4xl md:text-5xl font-light text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 mb-3 tracking-wide">
              Shop by Price
            </h2>

            {/* Elegant underline */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-amber-500"></div>
          </div>

          <p className="text-gray-600 mt-6 font-light tracking-widest text-sm">
            Find Your Perfect Match
          </p>
        </div>

        {/* Price Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {priceCategories.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group relative"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Card */}
                <div
                  className={`relative bg-gradient-to-br ${item.bgGradient} rounded-2xl 
                  shadow-lg ${item.shadowColor} ${item.glowColor}
                  hover:shadow-2xl transition-all duration-500 cursor-pointer
                  border border-white/50 overflow-hidden 
                  hover:-translate-y-2 p-6 flex flex-col items-center justify-center min-h-[200px]
                  backdrop-blur-sm`}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>

                  {/* Animated corner accents */}
                  <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 border-amber-300/50 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-x-1 -translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0"></div>
                  <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 border-amber-300/50 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0"></div>

                  {/* Icon with animated background */}
                  <div className="relative mb-4">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${item.gradient} rounded-full blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 scale-150`}
                    ></div>
                    <div
                      className={`relative p-4 rounded-full bg-gradient-to-br ${item.gradient} 
                      shadow-lg group-hover:shadow-xl transition-all duration-500
                      group-hover:scale-110 group-hover:rotate-12`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Floating sparkles on hover */}
                  {hoveredIndex === index && (
                    <>
                      <span className="absolute top-[15%] left-[20%] w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      <span className="absolute top-[25%] right-[15%] w-1 h-1 rounded-full bg-yellow-300 animate-ping delay-150"></span>
                      <span className="absolute bottom-[30%] left-[15%] w-1 h-1 rounded-full bg-amber-300 animate-ping delay-300"></span>
                      <span className="absolute bottom-[20%] right-[25%] w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping delay-500"></span>
                    </>
                  )}

                  {/* Text content */}
                  <div className="relative z-10 text-center">
                    <p className="text-xs font-light text-gray-500 mb-1 tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-y-2 group-hover:translate-y-0">
                      {item.sublabel}
                    </p>
                    <p className="text-lg font-semibold text-gray-800 group-hover:text-gray-900 mb-3 transition-all duration-300 group-hover:scale-105">
                      {item.label}
                    </p>

                    {/* Animated divider */}
                    <div className="flex items-center justify-center gap-1 mb-4">
                      <span className="w-0 h-[2px] bg-gradient-to-r from-transparent to-gray-400 group-hover:w-6 transition-all duration-500"></span>
                      <span className="w-1 h-1 rounded-full bg-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200"></span>
                      <span className="w-0 h-[2px] bg-gradient-to-l from-transparent to-gray-400 group-hover:w-6 transition-all duration-500"></span>
                    </div>

                    {/* CTA Button */}
                    <Link href={item.url}>
                      <Button
                        onClick={() =>
                          dispatch(
                            setPriceRange({
                              priceFrom: item.priceFrom,
                              priceTo: item.priceTo,
                            })
                          )
                        }
                        className={`relative overflow-hidden bg-white/80 backdrop-blur-sm 
                        border-2 border-gray-200 hover:border-transparent
                        text-gray-700 hover:text-white text-sm font-medium
                        px-6 py-2 rounded-full
                        transition-all duration-500
                        group-hover:scale-105 group-hover:shadow-lg
                        before:absolute before:inset-0 before:bg-gradient-to-r before:${item.gradient}
                        before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500`}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Shop Now
                          <span className="transform group-hover:translate-x-1 transition-transform duration-300">
                            →
                          </span>
                        </span>
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Pulsing glow effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${item.gradient} 
                  rounded-2xl blur-2xl opacity-0 group-hover:opacity-20 
                  transition-opacity duration-700 -z-10 scale-95`}
                ></div>
              </div>
            );
          })}
        </div>

        {/* Decorative bottom section */}
        <div className="mt-16 flex items-center justify-center gap-4">
          <span className="w-20 h-[1px] bg-gradient-to-r from-transparent to-amber-300"></span>
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="w-20 h-[1px] bg-gradient-to-l from-transparent to-amber-300"></span>
        </div>
      </div>
    </div>
  );
};

export default ShopByPrice;
