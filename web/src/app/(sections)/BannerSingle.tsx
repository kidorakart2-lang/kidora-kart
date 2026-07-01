import Image from "next/image"
import Link from "next/link"
import React from "react"
import type { Slide } from "@/components/ui/images-slider"

interface BannerSingleProps {
  slide: Slide
}

export default function BannerSingle({ slide }: BannerSingleProps) {
  if (!slide?.src) return null

  const img = (
    <div className="relative w-full h-full">
      <Image
        src={slide.src}
        alt="Banner"
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />
    </div>
  )

  const wrapper = (children: React.ReactNode) => (
    <div className="w-full z-0 h-[30vh] md:h-[50vh] lg:h-[70vh] overflow-hidden">
      {children}
    </div>
  )

  if (slide.href) {
    if (slide.external) {
      return wrapper(
        <a href={slide.href} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer">
          {img}
        </a>
      )
    }
    return wrapper(
      <Link href={slide.href} className="block w-full h-full cursor-pointer">
        {img}
      </Link>
    )
  }

  return wrapper(img)
}
