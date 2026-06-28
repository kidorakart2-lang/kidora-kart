"use client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useCallback } from "react";

export interface Slide {
  src: string;
  href?: string;
  external?: boolean;
}

interface ImagesSliderProps {
  images?: string[]
  slides?: Slide[]
  children?: React.ReactNode
  overlay?: boolean
  overlayClassName?: string
  className?: string
  autoplay?: boolean
  direction?: "up" | "down"
}

export const ImagesSlider = ({
  images,
  slides,
  children,
  overlay = true,
  overlayClassName,
  className,
  autoplay = true,
  direction = "up",
}: ImagesSliderProps) => {
  const resolvedSlides: Slide[] = slides ?? (images ?? []).map((src) => ({ src }));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState<string[]>([]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex + 1 === resolvedSlides.length ? 0 : prevIndex + 1
    );
  }, [resolvedSlides.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex - 1 < 0 ? resolvedSlides.length - 1 : prevIndex - 1
    );
  }, [resolvedSlides.length]);

  useEffect(() => {
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadImages = () => {
    setLoading(true);
    const srcs = resolvedSlides.map((s) => s.src);
    const loadPromises = srcs.map((src: string) => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(src);
        img.onerror = reject;
      });
    });

    Promise.all(loadPromises)
      .then((loadedImages) => {
        setLoadedImages(loadedImages);
        setLoading(false);
      })
      .catch((_error) => {

      });
  };
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        handleNext();
      } else if (event.key === "ArrowLeft") {
        handlePrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    let interval: ReturnType<typeof setInterval> | undefined;
    if (autoplay) {
      interval = setInterval(() => {
        handleNext();
      }, 4000);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearInterval(interval);
    };
  }, [handleNext, handlePrevious, autoplay]);

  const slideVariants = {
    initial: {
      scale: 0,
      opacity: 0,
      rotateX: 45,
    },
    visible: {
      scale: 1,
      rotateX: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.645, 0.045, 0.355, 1.0] as [number, number, number, number],
      },
    },
    upExit: {
      opacity: 1,
      y: "-150%",
      transition: {
        duration: 1,
      },
    },
    downExit: {
      opacity: 1,
      y: "150%",
      transition: {
        duration: 1,
      },
    },
  } as const;

  const router = useRouter();

  const handleSlideClick = (slide: Slide) => {
    if (!slide.href) return;
    if (slide.external) {
      window.open(slide.href, "_blank", "noopener,noreferrer");
    } else {
      router.push(slide.href);
    }
  };

  const slide = resolvedSlides[currentIndex];
  const areImagesLoaded = loadedImages.length > 0;
  const buttonStyles = `
  absolute z-50 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white
  transition-colors duration-300 backdrop-blur-sm
`;
  return (
    <div
      className={cn(
        "overflow-hidden h-full w-full relative flex items-center justify-center",
        className
      )}
      style={{
        perspective: "1000px",
      }}
    >
      {areImagesLoaded && children}
      {areImagesLoaded && overlay && (
        <div
          className={cn("absolute inset-0 bg-black/0 z-40", overlayClassName)}
        />
      )}
      {areImagesLoaded && (
        <AnimatePresence>
          <motion.div 
            key={currentIndex}
            initial="initial"
            animate="visible"
            exit={direction === "up" ? "upExit" : "downExit"}
            variants={slideVariants}
            className="h-full w-full absolute"
          >
            <img
              onClick={() => handleSlideClick(slide)}
              src={slide.src}
              loading="eager"
              fetchPriority="high"
              alt={slide.src || "banner image"}
              className="h-full w-full cursor-pointer aspect-video object-fill"
            />
          </motion.div>
        </AnimatePresence>
      )}
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        className={`${buttonStyles} left-4 hidden md:block`}
        aria-label="Previous image"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      {/* Next Button */}
      <button
        onClick={handleNext}
        className={`${buttonStyles} right-4 hidden md:block`}
        aria-label="Next image"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
};
