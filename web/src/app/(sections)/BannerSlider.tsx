"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface Slide {
  src: string;
  href?: string;
  external?: boolean;
}

interface BannerSliderProps {
  slides: Slide[];
}

/**
 * Homepage hero — a dynamic editorial carousel.
 * Slide imagery streams from the banner API; the copy is brand-level so the
 * hero always reads like a magazine cover even when a banner has no text.
 */
export default function BannerSlider({ slides }: BannerSliderProps) {
  const router = useRouter();
  const hasSlides = slides.length > 0;

  const handleSlideClick = (slide: Slide) => {
    if (!slide.href) return;
    if (slide.external) {
      window.open(slide.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(slide.href);
    }
  };

  const copy = (
    <div className="relative z-20 max-w-xl px-5 sm:px-8 lg:px-14">
      <p className="eyebrow mb-5 tracking-[0.32em]">
        <span className="mr-2 text-[var(--brand-gold)]">✦</span>
        The art of fine jewellery
      </p>

      <h2 className="display-heading text-4xl leading-[1.08] text-[var(--brand-cream)] sm:text-5xl lg:text-6xl">
        A Touch of Royalty.
        <br />
        <span className="accent-italic">A Lifetime of Beauty.</span>
      </h2>

      <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--brand-cream)]/75 sm:text-base">
        Discover exquisite gold, diamond and gemstone jewellery, thoughtfully
        chosen to make every moment unforgettable.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link href="/category" className="btn-gold">
          Shop Now
          <ArrowRight size={15} />
        </Link>
        <Link href="/story" className="btn-ghost-gold">
          Our Story
        </Link>
      </div>
    </div>
  );

  return (
    <section
      className="jb-hero relative w-full overflow-hidden bg-[#4b3147]"
      aria-label="Featured collections"
    >
      <div className="relative h-[78vh] min-h-[520px] w-full">
        {hasSlides ? (
          <Swiper
            modules={[Autoplay, Pagination, Navigation]}
            autoplay={{ delay: 5200, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            navigation
            loop={slides.length > 1}
            speed={900}
            className="h-full w-full"
          >
            {slides.map((slide, i) => (
              <SwiperSlide key={i}>
                <div className="relative h-full w-full">
                  <Image
                    width={1920}
                    height={1080}
                    src={slide.src}
                    alt={`Banner ${i + 1}`}
                    onClick={() => handleSlideClick(slide)}
                    className={`h-full w-full object-cover ${
                      slide.href ? "cursor-pointer" : ""
                    }`}
                    loading={i === 0 ? "eager" : "lazy"}
                    priority={i === 0}
                    sizes="100vw"
                  />
                  {/* Plum scrim so the copy stays legible over any photograph */}
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,#4b3147_0%,rgba(75,49,71,0.88)_34%,rgba(75,49,71,0.35)_62%,rgba(75,49,71,0.05)_100%)]" />
                  <div className="absolute inset-0 flex items-center">{copy}</div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="relative h-full w-full bg-[radial-gradient(120%_120%_at_70%_10%,#7d5a74_0%,#4b3147_45%,#2a1a27_100%)]">
            <div className="ornament-band absolute inset-x-0 top-0 opacity-30" />
            <div className="absolute inset-0 flex items-center">{copy}</div>
          </div>
        )}
      </div>

      {/* Soft seam into the cream page below */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[var(--brand-cream)]/10" />
    </section>
  );
}
