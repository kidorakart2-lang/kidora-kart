"use client";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import type { CategoryData, SubCategoryData } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function GenderCategorySection() {
  const navigation = useSelector((state: RootState) => state.ui.navigation as unknown as CategoryData[]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  function getCategoryWithMensAndWomens(categories: CategoryData[]) {
    const categoryWithSubs = categories?.find(
      (cat: CategoryData) => cat?.subCategories && cat?.subCategories?.length > 0
    );

    if (!categoryWithSubs) {
      return [];
    }

    const filteredSubCategories = categoryWithSubs?.subCategories?.filter(
      (sub: SubCategoryData) => sub.name === "Mens" || sub.name === "Womens"
    );

    return [
      {
        ...categoryWithSubs,
        subCategories: filteredSubCategories,
      },
    ];
  }

  const result = getCategoryWithMensAndWomens(navigation);

  if (!result[0]?.subCategories) return null;

  return (
    <div className="w-full max-w-[100vw] mx-auto py-10 px-4 overflow-hidden">
      {/* Enhanced Heading */}
      <div className="text-center mb-12 relative">
        <div className="inline-block relative">
          {/* Decorative top accent */}
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 flex gap-1">
            <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse delay-75"></span>
            <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse delay-150"></span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-light text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 mb-3 tracking-wide">
            {result[0].name}
          </h2>
          
          {/* Elegant underline */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-amber-500"></div>
        </div>
        
        <p className="text-gray-600 mt-6 font-light tracking-widest text-sm md:text-base">
          Explore our collection
        </p>
      </div>

      {result.map((category) => (
        <div
          key={category._id}
          className="grid grid-cols-1 md:grid-cols-2 gap-2 h-[75vh] max-h-[600px]"
        >
          {category.subCategories?.map((subCategory, index) => (
            <Link
              key={subCategory._id}
              className="h-full group relative"
              href={`/category/${category.slug}/${subCategory.slug}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="relative overflow-hidden h-full rounded-lg shadow-lg">
                {/* Image with parallax effect */}
                <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
                  <Image
                    src={subCategory.image ?? ""}
                    alt={subCategory.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/50"></div>
                
                {/* Animated corner accents */}
                <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-amber-400 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0"></div>
                <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-amber-400 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-2 translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0"></div>
                
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </div>
                
                {/* Content container */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 transition-all duration-500">
                  {/* Decorative top line */}
                  <div className="mb-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 transform -translate-y-4 group-hover:translate-y-0">
                    <span className="w-8 h-[1px] bg-amber-400"></span>
                    <span className="w-2 h-2 rotate-45 bg-amber-400"></span>
                    <span className="w-8 h-[1px] bg-amber-400"></span>
                  </div>
                  
                  {/* Category name */}
                  <h3 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-4 tracking-wider transition-all duration-500 transform group-hover:scale-110 group-hover:text-amber-300">
                    {subCategory.name}
                  </h3>
                  
                  {/* Shop now button */}
                  <div className="relative overflow-hidden">
                    <button className="px-8 py-3 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-light tracking-widest text-sm transition-all duration-500 transform group-hover:bg-amber-500 group-hover:border-amber-500 group-hover:scale-105 group-hover:shadow-2xl">
                      <span className="relative z-10">SHOP NOW</span>
                      
                      {/* Button shine effect */}
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></span>
                    </button>
                  </div>
                  
                  {/* Decorative bottom line */}
                  <div className="mt-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 transform translate-y-4 group-hover:translate-y-0">
                    <span className="w-8 h-[1px] bg-amber-400"></span>
                    <span className="w-2 h-2 rotate-45 bg-amber-400"></span>
                    <span className="w-8 h-[1px] bg-amber-400"></span>
                  </div>
                </div>
                
                {/* Floating sparkles */}
                {hoveredIndex === index && (
                  <>
                    <span className="absolute top-[20%] left-[15%] w-2 h-2 rounded-full bg-amber-300 animate-ping"></span>
                    <span className="absolute top-[70%] right-[20%] w-1.5 h-1.5 rounded-full bg-yellow-200 animate-ping delay-150"></span>
                    <span className="absolute bottom-[30%] left-[25%] w-1 h-1 rounded-full bg-amber-400 animate-ping delay-300"></span>
                    <span className="absolute top-[40%] right-[30%] w-1.5 h-1.5 rounded-full bg-yellow-300 animate-ping delay-500"></span>
                  </>
                )}
              </div>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}