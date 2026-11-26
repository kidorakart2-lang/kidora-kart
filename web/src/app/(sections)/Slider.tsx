"use client";
import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import ProductCard from "@/components/comman/ProductCard";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store/store";
import type { CategoryData, ProductData } from "@/types";
import { getCategoryHref } from "@/lib/category-nav";

interface SliderProps {
  data: ProductData[] | null | undefined;
  heading: string;
  /** Italic gold continuation of the heading, e.g. "Everyone Loves". */
  accent?: string;
  eyebrow?: string;
  href?: string;
}

const Slider = ({ data, heading, accent, eyebrow, href }: SliderProps) => {
  const navigation = useSelector((state: RootState) => state.ui.navigation);
  const categories = (navigation as { _data?: CategoryData[] })?._data ?? [];
  const viewMoreHref = href ?? getCategoryHref(categories);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <section
      className="relative overflow-hidden bg-white py-14 lg:py-20"
      id={heading}
    >
      <div className="section-container relative z-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 lg:mb-10">
          <div>
            {eyebrow && (
              <p className="eyebrow mb-3">
                <span className="mr-2">✦</span>
                {eyebrow}
              </p>
            )}
            <h2 className="display-heading text-3xl sm:text-4xl lg:text-[2.75rem]">
              {heading}{" "}
              {accent && <span className="accent-italic">{accent}</span>}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              ref={prevRef}
              className="rail-arrow text-[var(--brand-plum)]"
              aria-label={`Previous ${heading}`}
              type="button"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              ref={nextRef}
              className="rail-arrow text-[var(--brand-plum)]"
              aria-label={`Next ${heading}`}
              type="button"
            >
              <ChevronRight size={16} />
            </button>
            <Link
              href={viewMoreHref}
              className="btn-gold ml-1 !px-5 !py-2.5 !text-[10px] uppercase tracking-[0.16em]"
            >
              Shop More
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        <Swiper
          modules={[Autoplay, Navigation]}
          spaceBetween={20}
          slidesPerView="auto"
          autoplay={{
            delay: 4600,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          speed={750}
          grabCursor
          observer
          observeParents
          navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
          onBeforeInit={(swiper: SwiperClass) => {
            const nav = swiper.params.navigation;
            if (nav && typeof nav !== "boolean") {
              nav.prevEl = prevRef.current;
              nav.nextEl = nextRef.current;
            }
          }}
          onSwiper={(swiper: SwiperClass) => {
            // Recalculate after fonts, images and the streamed section settle —
            // otherwise the trailing cards can be measured as zero-width and the
            // right side of the rail stays blank until the first slide.
            swiper.update();
            requestAnimationFrame(() => swiper.update());
            if (typeof document !== "undefined" && "fonts" in document) {
              document.fonts.ready.then(() => swiper.update());
            }
          }}
          className="!py-1"
        >
          {data.map((item, index) => (
            <SwiperSlide
              key={item._id}
              className="!h-auto !w-[76%] pb-1 sm:!w-[44%] lg:!w-[31.5%] xl:!w-[23.4%]"
            >
              <ProductCard data={item} eager={index < 6} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default Slider;
