import { cacheLife, cacheTag } from "next/cache"
import BannerSingle from "./BannerSingle"
import BannerSlider from "./BannerSlider"
import { TAG_HOMEPAGE } from "@/lib/revalidation-tags"
import type { BannerItem } from "@/types"

async function GetBanners() {
  "use cache";
  cacheLife("homepage");
  cacheTag(TAG_HOMEPAGE);

  try {
    const res = await fetch("/api/website/banner")
    const data = await res.json()
    return (data._data as BannerItem[]) ?? []
  } catch {
    return []
  }
}

export default async function DefaultBanner() {
  const banners = await GetBanners()
  if (!banners || banners.length === 0) return null

  const slides = banners.map((item) => ({
    src: item.image,
    href: item.link?.url || undefined,
    external: item.link?.type === "external",
  }))

  if (slides.length === 1) {
    return <BannerSingle slide={slides[0]} />
  }

  return <BannerSlider slides={slides} />
}
