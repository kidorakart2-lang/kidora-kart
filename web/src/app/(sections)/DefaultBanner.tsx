import { cache } from "react"
import BannerSingle from "./BannerSingle"
import BannerSlider from "./BannerSlider"

interface BannerItem {
  _id?: string
  image: string
  link?: { url?: string | null; type?: string }
}

const GetBanners = cache(async () => {
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "api/website/banner",
      { next: { revalidate: 3600 } },
    )
    const data = await res.json()
    return (data._data as BannerItem[]) ?? []
  } catch {
    return []
  }
})

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
