"use client"

import { ImagesSlider } from "@/components/ui/images-slider"
import type { Slide } from "@/components/ui/images-slider"

interface BannerSliderProps {
  slides: Slide[]
}

export default function BannerSlider({ slides }: BannerSliderProps) {
  if (!slides || slides.length === 0) return null

  return (
    <div className="w-full z-0 h-[30vh] md:h-[50vh] lg:h-[70vh] overflow-hidden">
      <ImagesSlider slides={slides} />
    </div>
  )
}
