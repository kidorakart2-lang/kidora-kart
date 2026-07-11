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
    categories.flatMap((cat: CategoryData) =>
      (cat.subCategories ?? []).map((subCat: SubCategoryData) => ({
        ...subCat,
        parentSlug: cat.slug,
      }))
    ).filter(Boolean);

  return (
    <section className="w-full py-6 bg-section">
      <div className="text-center mb-8 font-sans mt-4">
        <div className="inline-flex items-center justify-center gap-3 mb-2">
          <h2 className="text-3xl sm:text-4xl md:text-5xl text-foreground relative inline-block fw-heading tracking-wide">
            {heading || "Discover Our Collection"}
          </h2>
        </div>

        <p className="text-sm sm:text-base text-muted-foreground fw-body tracking-widest mt-4">
          Fun for Kids of All Ages
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
              320: { slidesPerView: 2, spaceBetween: 10 },
              480: { slidesPerView: 3.4, spaceBetween: 15 },
              768: { slidesPerView: 5, spaceBetween: 15 },
              1024: { slidesPerView: 7, spaceBetween: 20 },
            }}
            className="category-swiper"
          >
            {allSubCategories.map((subCat) => (
              <SwiperSlide key={subCat._id}>
                <Link href={`/category/${subCat.parentSlug}/${subCat.slug}`}>
                  <article
                    className="relative w-full aspect-square flex flex-col items-center cursor-pointer"
                    itemScope
                    itemType="https://schema.org/Thing"
                  >
                    <div
                      className="relative w-full h-full overflow-hidden flex items-center justify-center rounded-full border-2 border-border"
                    >
                      <Image
                        src={subCat.image ?? ""}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover rounded-full"
                        itemProp="image"
                      />

                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-full">
                          <p className="text-base sm:text-lg md:text-xl font-semibold text-background text-center px-2 drop-shadow-lg"
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
