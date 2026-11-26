"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import ImageZoom from "./image-zoom";
import ProductVideoPlayer, { VideoThumbnail } from "./product-video";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperClass } from "swiper";
import "swiper/css";

export default function ImageSlider({
  images,
  productName,
  isNewArrival,
  isMobile,
  videoUrl,
  showVideo,
  onShowVideo,
}: {
  images: string[];
  productName: string;
  isNewArrival: boolean;
  isMobile: boolean;
  videoUrl?: string;
  showVideo?: boolean;
  onShowVideo?: () => void;
}) {
  const [currentImage, setCurrentImage] = useState(0);
  const mainRef = useRef<SwiperClass | null>(null);
  const thumbsRef = useRef<SwiperClass | null>(null);

  const goTo = (index: number) => {
    mainRef.current?.slideTo(index);
    setCurrentImage(index);
    if (showVideo && onShowVideo) onShowVideo();
  };

  const paginate = (delta: number) => {
    const total = images.length;
    const next = (currentImage + delta + total) % total;
    mainRef.current?.slideTo(next);
    setCurrentImage(next);
  };

  return (
    <div className="space-y-4">
      {showVideo && videoUrl ? (
        <ProductVideoPlayer
          videoUrl={videoUrl}
          onClose={() => onShowVideo?.()}
          isActive
        />
      ) : (
        <div className="group relative overflow-hidden rounded-[4px] border border-[var(--brand-gold)]/30 bg-white p-1.5 shadow-[0_30px_70px_-55px_rgba(74,37,66,0.6)] sm:p-2">
          <div className="relative overflow-hidden rounded-[2px] bg-[var(--brand-section-bg)]">
            <Swiper
              onSwiper={(swiper) => {
                mainRef.current = swiper;
              }}
              onSlideChange={(swiper) => {
                setCurrentImage(swiper.activeIndex);
                thumbsRef.current?.slideTo(swiper.activeIndex);
              }}
              spaceBetween={0}
              slidesPerView={1}
              className="aspect-square w-full"
            >
              {images.map((img, index) => (
                <SwiperSlide key={index}>
                  <div className="relative h-full w-full">
                    <ImageZoom
                      src={img || "/placeholder.svg"}
                      alt={`${productName} - ${index + 1}`}
                      isMobile={isMobile}
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {isNewArrival && (
              <span className="absolute left-4 top-4 z-20 rounded-full bg-[var(--brand-gold)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--brand-plum)]">
                New
              </span>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => paginate(-1)}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-[var(--brand-gold)]/35 bg-white/90 text-[var(--brand-plum)] shadow-sm backdrop-blur-sm transition-all hover:bg-white md:opacity-0 md:group-hover:opacity-100"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => paginate(1)}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 z-20 grid size-10 -translate-y-1/2 place-items-center rounded-full border border-[var(--brand-gold)]/35 bg-white/90 text-[var(--brand-plum)] shadow-sm backdrop-blur-sm transition-all hover:bg-white md:opacity-0 md:group-hover:opacity-100"
                >
                  <ChevronRight size={17} />
                </button>
              </>
            )}

            <span className="absolute bottom-3 right-3 z-20 rounded-full border border-[var(--brand-gold)]/30 bg-white/90 px-2.5 py-1 text-[10px] tracking-[0.08em] text-[var(--brand-plum)] backdrop-blur-sm">
              {currentImage + 1} / {images.length}
            </span>
          </div>
        </div>
      )}

      {/* Thumbnails — always sit under the main image, swipeable on mobile */}
      {(images.length > 1 || videoUrl) && (
        <Swiper
          onSwiper={(swiper) => {
            thumbsRef.current = swiper;
          }}
          spaceBetween={10}
          slidesPerView="auto"
          className="!px-1"
        >
          {images.map((img, index) => (
            <SwiperSlide key={index} className="!w-auto">
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-label={`View ${productName} image ${index + 1}`}
                aria-current={!showVideo && currentImage === index}
                className={`size-[58px] overflow-hidden rounded-[2px] border bg-[var(--brand-surface)] transition-all sm:size-[68px] ${
                  !showVideo && currentImage === index
                    ? "border-[var(--brand-gold)] opacity-100 shadow-[0_6px_16px_-12px_rgba(74,37,66,0.6)]"
                    : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img || "/placeholder.svg"}
                  alt={`${productName} - ${index + 1}`}
                  width={76}
                  height={76}
                  className="h-full w-full object-cover"
                  sizes="64px"
                />
              </button>
            </SwiperSlide>
          ))}

          {videoUrl && (
            <SwiperSlide className="!w-auto">
              <div className="relative">
                <VideoThumbnail
                  videoUrl={videoUrl}
                  onClick={() => onShowVideo?.()}
                  isActive={!!showVideo}
                />
                <span className="pointer-events-none absolute inset-0 grid place-items-center rounded-lg bg-black/25 text-white">
                  <Play size={16} />
                </span>
              </div>
            </SwiperSlide>
          )}
        </Swiper>
      )}
    </div>
  );
}
