"use client";
import { useRef, useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface TestimonialItem {
  id?: string;
  image?: string;
  title?: string;
  description?: string;
  rating?: number;
}

const Testimonial = ({ data }: { data: TestimonialItem[] | null | undefined }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperClass | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const renderStars = (rating = 5) =>
    Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={14}
        className={
          index < rating
            ? "fill-[var(--brand-gold)] text-[var(--brand-gold)]"
            : "fill-white/15 text-white/15"
        }
      />
    ));

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden bg-white py-14 lg:py-20"
      itemScope
      itemType="https://schema.org/Review"
    >
      <div className="section-container relative z-10">
        <div className="mb-10 text-center lg:mb-14">
          <p className="eyebrow mb-4">
            <span className="mr-2">✦</span>
            Words that matter
          </p>
          <h2 className="display-heading text-3xl sm:text-4xl lg:text-[2.75rem]">
            Loved by <span className="accent-italic">Our Customers</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[var(--brand-ink)]/65">
            Real stories from our valued customers who chose us for their special
            moments.
          </p>
        </div>

        {isMounted && (
          <Swiper
            modules={[Autoplay, Navigation]}
            slidesPerView={1}
            spaceBetween={24}
            loop={data.length > 1}
            autoplay={{
              delay: 5200,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            speed={800}
            observer
            observeParents
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            breakpoints={{ 1024: { slidesPerView: 1 } }}
            className="!overflow-hidden"
          >
            {data.map((t, index) => (
              <SwiperSlide key={t.id || index}>
                <article
                  className="grid overflow-hidden rounded-2xl bg-[var(--brand-surface)] md:grid-cols-[38%_1fr]"
                  itemScope
                  itemType="https://schema.org/Review"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden md:aspect-auto md:h-full md:min-h-[320px]">
                    {t.image ? (
                      <Image
                        src={t.image}
                        alt={`Customer ${t.title ?? ""}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 40vw"
                        className="object-cover"
                        itemProp="image"
                      />
                    ) : (
                      <div className="h-full w-full bg-[radial-gradient(120%_120%_at_30%_20%,#7d5a74,#4b3147)]" />
                    )}
                  </div>

                  <div className="relative flex flex-col justify-center bg-[#4b3147] px-6 pb-8 pt-12 sm:px-10 md:px-12">
                    <div
                      className="ornament-band absolute inset-x-0 top-0 !h-8 opacity-40"
                      aria-hidden="true"
                    />
                    <div className="mb-4 flex gap-1">{renderStars(t.rating)}</div>

                    <blockquote className="display-heading text-lg italic leading-snug text-[var(--brand-cream)] sm:text-xl md:text-2xl">
                      &ldquo;{t.description}&rdquo;
                    </blockquote>

                    <figcaption className="mt-6 flex items-center gap-3">
                      <span className="h-px w-8 bg-[var(--brand-gold)]" />
                      <span className="text-[13px] uppercase tracking-[0.2em] text-[var(--brand-gold)]">
                        {t.title}
                      </span>
                    </figcaption>
                    <p className="sr-only">Verified Customer</p>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        {/* Dots left, arrows right — mirrors the reference's slider chrome */}
        <div className="mt-7 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {data.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to testimonial ${i + 1}`}
                onClick={() => swiperRef.current?.slideToLoop?.(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeIndex === i
                    ? "w-8 bg-[var(--brand-plum)]"
                    : "w-5 bg-[var(--brand-rose)]"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2.5 text-[var(--brand-plum)]">
            <button
              type="button"
              className="rail-arrow"
              aria-label="Previous testimonial"
              onClick={() => swiperRef.current?.slidePrev()}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="rail-arrow"
              aria-label="Next testimonial"
              onClick={() => swiperRef.current?.slideNext()}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
