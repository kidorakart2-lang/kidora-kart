"use client";
import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper";
import { Autoplay, EffectCoverflow, Navigation } from "swiper/modules";
import Image from "next/image";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import type { CategoryData, SubCategoryData } from "@/types";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

import "swiper/css";
import "swiper/css/effect-coverflow";
import Link from "next/link";

/**
 * "A Collection for Every Occasion" — the dark, ornamental coverflow band.
 * Each card is a category photograph with a gold serif caption; hovering lifts
 * the active card and the arrows walk the collection.
 */
export default function RoundCategorySlider({ heading }: { heading?: string }) {
  const navigation = useSelector((state: RootState) => state.ui.navigation);
  const categories = (navigation as { _data?: CategoryData[] })?._data ?? [];
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const allSubCategories: (SubCategoryData & { parentSlug: string })[] =
    categories
      .flatMap((cat: CategoryData) =>
        (cat.subCategories ?? []).map((subCat: SubCategoryData) => ({
          ...subCat,
          parentSlug: cat.slug,
        })),
      )
      .filter(Boolean);

  if (allSubCategories.length === 0) return null;

  return (
    <section className="relative w-full overflow-hidden bg-[#14100f] py-14 lg:py-20">
      {/* ornamental lace along the top edge */}
      <div className="ornament-band absolute inset-x-0 top-0" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_0%,rgba(62,39,57,0.55),transparent_70%)]" />

      <div className="relative z-10">
        <div className="section-container mb-10 text-center lg:mb-14">
          <p className="eyebrow mb-4">
            <span className="mr-2">✦</span>
            Discover your style
          </p>
          <h2 className="display-heading text-3xl text-[var(--brand-cream)] sm:text-4xl lg:text-5xl">
            {heading || (
              <>
                A Collection for <span className="accent-italic">Every Occasion</span>
              </>
            )}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[var(--brand-cream)]/65">
            From everyday essentials to statement jewellery, find the piece that
            complements your style and celebrates every occasion.
          </p>
        </div>

        <Swiper
          modules={[Autoplay, EffectCoverflow, Navigation]}
          effect="coverflow"
          grabCursor
          centeredSlides
          loop={allSubCategories.length > 3}
          slidesPerView={1.4}
          spaceBetween={14}
          autoplay={{
            delay: 4200,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          speed={900}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 140,
            modifier: 1.6,
            slideShadows: false,
          }}
          navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
          onBeforeInit={(swiper: SwiperClass) => {
            const nav = swiper.params.navigation;
            if (nav && typeof nav !== "boolean") {
              nav.prevEl = prevRef.current;
              nav.nextEl = nextRef.current;
            }
          }}
          breakpoints={{
            640: { slidesPerView: 2.4, spaceBetween: 18 },
            1024: { slidesPerView: 3.6, spaceBetween: 22 },
          }}
          className="!px-4 !py-2"
        >
          {allSubCategories.map((subCat) => (
            <SwiperSlide key={subCat._id} className="!h-auto">
              <Link
                href={`/category/${subCat.parentSlug}/${subCat.slug}`}
                className="group block h-full"
              >
                <article className="relative h-full overflow-hidden rounded-xl border border-[var(--brand-gold)]/25 bg-[#241621]">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image
                      src={subCat.image ?? ""}
                      alt={subCat.name}
                      fill
                      sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 28vw"
                      className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14100f] via-[#14100f]/20 to-transparent" />
                  </div>

                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-5 pb-5">
                    <h3 className="display-heading text-lg text-[var(--brand-cream)] sm:text-xl">
                      {subCat.name}
                    </h3>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--brand-gold)]/50 text-[var(--brand-gold)] transition-transform duration-300 group-hover:translate-x-1">
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </article>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>

        <div className="mt-8 flex items-center justify-center gap-3 text-[var(--brand-cream)]">
          <button
            ref={prevRef}
            className="rail-arrow"
            aria-label="Previous collection"
            type="button"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            ref={nextRef}
            className="rail-arrow"
            aria-label="Next collection"
            type="button"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
