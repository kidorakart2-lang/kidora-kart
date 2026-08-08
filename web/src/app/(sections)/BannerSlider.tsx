"use client";

import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import Image from "next/image";

export interface Slide {
  src: string;
  href?: string;
  external?: boolean;
}

interface BannerSliderProps {
  slides: Slide[];
}

export default function BannerSlider({ slides }: BannerSliderProps) {
  const router = useRouter();

  if (!slides || slides.length === 0) return null;

  const handleSlideClick = (slide: Slide) => {
    if (!slide.href) return;
    if (slide.external) {
      window.open(slide.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(slide.href);
    }
  };

  return (
    <div className="w-full z-0 h-[30vh] md:h-[50vh] lg:h-[80vh] overflow-hidden banner-swiper">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop
        className="h-full w-full"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={i}>
            <Image
              width={800}
              height={400}
              src={slide.src}
              alt={`Banner ${i + 1}`}
              onClick={() => handleSlideClick(slide)}
              className="h-full w-full cursor-pointer aspect-video"
              loading={i === 0 ? "eager" : "lazy"}
              priority={i === 0}
              sizes="100vw"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
