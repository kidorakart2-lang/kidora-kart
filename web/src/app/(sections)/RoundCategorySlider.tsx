"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import Image from "next/image";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import type { CategoryData, SubCategoryData } from "@/types";

import "swiper/css";
import Link from "next/link";

const TOY_PALETTE = [
  "#FF6B6B", // coral
  "#4DABF7", // sky
  "#F59F00", // amber
  "#51CF66", // grass
  "#9775FA", // plum
] as const;

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
    <section className="w-full py-8 md:py-10 bg-section">
      <div className="text-center mb-10 mt-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl fw-heading tracking-wide text-foreground relative inline-block mb-3">
          {heading || "Discover Our Collection"}
          <svg
            viewBox="0 0 120 12"
            className="absolute -bottom-3 left-1/2 h-3 w-28 -translate-x-1/2"
            style={{ color: "var(--brand-primary)" }}
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 8 Q 20 1 40 7 T 78 6 T 118 4"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground fw-body tracking-widest mt-5">
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
            className="category-swiper !pb-3"
          >
            {allSubCategories.map((subCat, index) => {
              const ring = TOY_PALETTE[index % TOY_PALETTE.length];
              return (
                <SwiperSlide key={subCat._id}>
                  <Link href={`/category/${subCat.parentSlug}/${subCat.slug}`}>
                    <article
                      className="group relative w-full flex flex-col items-center cursor-pointer pb-3"
                      itemScope
                      itemType="https://schema.org/Thing"
                    >
                      <div
                        className="relative w-full aspect-square overflow-hidden rounded-full  transition-transform duration-300 motion-safe:group-hover:-translate-y-1 motion-safe:group-hover:rotate-3"
                        style={{
                          borderColor: ring,
                          boxShadow: `0 3px 0 0 ${ring}`,
                        }}
                      >
                        <Image
                          src={subCat.image ?? ""}
                          alt={subCat.name}
                          fill
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover rounded-full"
                          itemProp="image"
                        />
                      </div>

                      <span
                        className="mt-3 inline-flex max-w-full items-center rounded-full border-2 bg-card px-3 py-1 text-xs sm:text-sm font-semibold text-foreground shadow-sm truncate"
                        style={{ borderColor: ring }}
                        itemProp="name"
                      >
                        {subCat.name}
                      </span>
                    </article>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}
      </div>
    </section>
  );
}
