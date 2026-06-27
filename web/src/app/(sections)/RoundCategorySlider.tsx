"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import Image from "next/image";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import type { CategoryData, SubCategoryData } from "@/types";

import "swiper/css";
import Link from "next/link";

export default function RoundCategorySlider() {
  const categories = useSelector((state: RootState) => state.ui.navigation as unknown as CategoryData[]);

  // Flatten all subcategories from all categories into one array
  const allSubCategories: (SubCategoryData & { parentSlug: string })[] =
    (categories?.flatMap((cat: CategoryData) =>
      (cat.subCategories ?? []).map((subCat: SubCategoryData) => ({
        ...subCat,
        parentSlug: cat.slug,
      }))
    ) ?? []).filter(Boolean);

  return (
    <section className="w-full py-6">
      {/* Heading */}
      <div className="text-center mb-8 font-serif mt-4">
        <div className="inline-flex items-center justify-center gap-3 mb-2">
          {/* Left Ornament */}
          <svg
            className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2L9.5 8.5L3 9.5L7.5 14L6.5 20.5L12 17.5L17.5 20.5L16.5 14L21 9.5L14.5 8.5L12 2Z" />
          </svg>

          <h2 className="text-3xl sm:text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 relative inline-block font-light tracking-wide">
            Discover Our Collection
            {/* Elegant underline with diamond accent */}
            <span className="absolute bottom-[-12px] left-1/2 transform -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent"></span>
            {/* Center diamond */}
            <span className="absolute bottom-[-16px] left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-amber-500 shadow-lg"></span>
            {/* Shine effect dots */}
            <span className="absolute top-[5px] right-[10%] w-1 h-1 rounded-full bg-yellow-300 animate-pulse"></span>
            <span className="absolute top-[15px] left-[15%] w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse delay-150"></span>
          </h2>

          {/* Right Ornament */}
          <svg
            className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2L9.5 8.5L3 9.5L7.5 14L6.5 20.5L12 17.5L17.5 20.5L16.5 14L21 9.5L14.5 8.5L12 2Z" />
          </svg>
        </div>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-gray-600 font-light tracking-widest italic mt-4">
          Timeless Elegance, Crafted for You
        </p>
      </div>

      {/* Single Slider for all subcategories */}
      <div className="max-w-7xl mx-auto px-4">
        {allSubCategories.length > 0 && (
          <Swiper
            modules={[Autoplay]}
            spaceBetween={10}
            slidesPerView={5}
            loop={allSubCategories.length < 3}
            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            speed={1000}
            breakpoints={{
              320: {
                slidesPerView: 2,
                spaceBetween: 10,
              },
              480: {
                slidesPerView: 2.4,
                spaceBetween: 15,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 15,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 20,
              },
            }}
            className="category-swiper"
          >
            {allSubCategories.map((subCat) => (
              <SwiperSlide key={subCat._id}>
                <Link href={`/category/${subCat.parentSlug}/${subCat.slug}`}>
                  <article
                    className="relative w-full aspect-square flex flex-col items-center group cursor-pointer"
                    itemScope
                    itemType="https://schema.org/Thing"
                  >
                    {/* Image Container with fixed aspect ratio */}
                    <div
                      className="relative w-full h-full overflow-hidden border-2 border-[rgb(192,149,120)] 
                      flex items-center justify-center transition-all duration-300
                      group-hover:border-yellow-400 group-hover:scale-105 group-hover:shadow-xl"
                    >
                      <Image
                        src={subCat.image ?? ""}
                        alt={subCat.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        itemProp="image"
                      />

                      {/* Overlay with category name */}
                      <div
                        className="absolute inset-0 bg-black/30 flex items-center justify-center
                        transition-all duration-300 group-hover:bg-black/20"
                      >
                        <p
                          className="text-base sm:text-lg md:text-xl font-semibold text-white text-center px-2
                          transition-all duration-300 group-hover:text-yellow-400 group-hover:scale-110
                          drop-shadow-lg"
                          itemProp="name"
                        >
                          {subCat.name}
                        </p>
                      </div>
                    </div>
                  </article>
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
}
