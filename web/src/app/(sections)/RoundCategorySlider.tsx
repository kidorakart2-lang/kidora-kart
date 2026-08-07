"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import Image from "next/image";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import type { CategoryData, SubCategoryData } from "@/types";

import "swiper/css";
import Link from "next/link";

export default function RoundCategorySlider({ heading }: { heading?: string }) {
  const navigation = useSelector((state: RootState) => state.ui.navigation);
  const categories = (navigation as { _data?: CategoryData[] })?._data ?? [];

  const allSubCategories: (SubCategoryData & { parentSlug: string })[] =
    categories
      .flatMap((cat: CategoryData) =>
        (cat.subCategories ?? []).map((subCat: SubCategoryData) => ({
          ...subCat,
          parentSlug: cat.slug,
        })),
      )
      .filter(Boolean);

  return (
    <section className="w-full py-4 bg-section">
      <div className="text-center mb-6 mt-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl text-gradient-brand relative inline-block font-serif tracking-wide">
          {heading || "Discover Our Collection"}
          <span
            className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent"
            style={{ backgroundImage: `linear-gradient(to right, transparent, var(--brand-primary), transparent)` }}
          />
          <span
            className="absolute bottom-[-14px] left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 shadow-lg"
            style={{ backgroundColor: "var(--brand-primary)" }}
          />
        </h2>

        <p className="text-sm text-muted-foreground font-light tracking-widest italic mt-3">
          Timeless Elegance, Crafted for You
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              320: { slidesPerView: 2.2, spaceBetween: 8 },
              480: { slidesPerView: 3, spaceBetween: 12 },
              768: { slidesPerView: 4, spaceBetween: 15 },
              1024: { slidesPerView: 6, spaceBetween: 20 },
            }}
            className="category-swiper !pb-2"
          >
            {allSubCategories.map((subCat) => (
              <SwiperSlide key={subCat._id}>
                <Link href={`/category/${subCat.parentSlug}/${subCat.slug}`}>
                  <article
                    className="group relative w-full aspect-square flex flex-col items-center cursor-pointer pb-2 max-w-[140px] mx-auto sm:max-w-[180px] md:max-w-[200px] lg:max-w-[220px]"
                    itemScope
                    itemType="https://schema.org/Thing"
                  >
                    <div
                      className="relative w-full h-full overflow-hidden rounded-full transition-transform duration-300 motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:rotate-3"
                      style={{
                        border: "2px solid var(--brand-border, color-mix(in srgb, var(--brand-primary) 50%, transparent))",
                        boxShadow: "0 6px 14px -4px color-mix(in srgb, var(--brand-primary) 40%, transparent)",
                      }}
                    >
                      <Image
                        src={subCat.image ?? ""}
                        alt={subCat.name}
                        fill
                        sizes="(max-width: 768px) 40vw, (max-width: 1024px) 22vw, 16vw"
                        className="object-cover rounded-full"
                        itemProp="image"
                      />

                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-full transition-colors duration-300 group-hover:bg-black/20">
                        <p
                          className="text-sm sm:text-base md:text-lg font-semibold text-white text-center px-3 drop-shadow-lg"
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
