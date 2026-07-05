"use client";

import { useState } from "react";
import Image from "next/image";
import type { Variants } from "motion/react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ImageZoom from "./image-zoom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

export default function ImageSlider({
  images,
  productName,
  isNewArrival,
  isMobile,
}: {
  images: string[];
  productName: string;
  isNewArrival: boolean;
  isMobile: boolean;
}) {
  const [currentImage, setCurrentImage] = useState(0);
  const [direction, setDirection] = useState(0);

  const slideVariants: Variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 10 : -10,
      opacity: 1,
    }),
    center: {
      zIndex: 1,
      x: 1,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 10 : -10,
      opacity: 1,
    }),
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    setCurrentImage((prev) => {
      const next = prev + newDirection;
      if (next < 0) return images.length - 1;
      if (next >= images.length) return 0;
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <motion.div
        className="relative bg-gradient-to-br from-brand-50/50 to-brand-100/50  overflow-hidden h-96 sm:h-[500px] shadow-2xl border border-brand-100/50 glass-effect"
        whileHover={!isMobile ? { scale: 1.01 } : {}}
        transition={{ duration: 0.2 }}
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentImage}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 200, damping: 20 },
              opacity: { duration: 0.4 },
            }}
            className="absolute inset-0"
          >
            <ImageZoom
              src={images[currentImage] || "/placeholder.svg"}
              alt={`${productName} - ${currentImage + 1}`}
              isMobile={isMobile}
            />
          </motion.div>
        </AnimatePresence>

        {/* New Arrival Badge */}
        {isNewArrival && (
          <motion.span
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="absolute top-4 right-4 bg-gradient-to-r from-brand-500 to-brand-600 text-background text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm"
          >
            NEW
          </motion.span>
        )}

        {/* Navigation Arrows - Desktop Only */}
        {!isMobile && images.length > 1 && (
          <>
            <motion.button
              whileHover={{ scale: 1.1, x: -4 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => paginate(-1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-brand-600 p-3 rounded-full shadow-lg backdrop-blur-md transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, x: 4 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => paginate(1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-brand-600 p-3 rounded-full shadow-lg backdrop-blur-md transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          </>
        )}

        {/* Image Counter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 bg-black/40 text-background px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-md"
        >
          {currentImage + 1} / {images.length}
        </motion.div>
      </motion.div>

      {/* Thumbnail Slider */}
      {images.length > 1 && (
        <div className="relative group mt-4 px-2">
          <div className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 cursor-pointer p-2 bg-white/80 rounded-full shadow-md text-brand-600 hover:bg-white transition-all border border-brand-100 disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronLeft className="w-5 h-5" />
          </div>
          <div className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 cursor-pointer p-2 bg-white/80 rounded-full shadow-md text-brand-600 hover:bg-white transition-all border border-brand-100 disabled:opacity-50 disabled:cursor-not-allowed">
            <ChevronRight className="w-5 h-5" />
          </div>

          <Swiper
            modules={[Navigation]}
            navigation={{
              prevEl: ".swiper-button-prev-custom",
              nextEl: ".swiper-button-next-custom",
            }}
            spaceBetween={12}
            slidesPerView="auto"
            className="w-[90%] mx-auto px-8 py-2"
          >
            {images.map((img: string, index: number) => (
              <SwiperSlide key={index} className="!w-auto">
                <motion.button
                  onClick={() => {
                    setDirection(index > currentImage ? 1 : -1);
                    setCurrentImage(index);
                  }}
                  whileHover={{ scale: 1, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`View ${productName} image ${index + 1}`}
                  tabIndex={0}
                  className={`flex-shrink-0 size-20 md:size-28 overflow-hidden border-3 transition-all rounded-md ${
                    currentImage === index
                      ? "border-brand-500 shadow-lg ring-2 ring-brand-200"
                      : "border-brand-100 hover:border-brand-300"
                  }`}
                >
                  <Image
                    src={img || "/placeholder.svg"}
                    alt={`${productName} - ${index + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
}
