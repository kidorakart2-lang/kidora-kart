"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "motion/react"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { BannerLinkData } from "@/types"

interface PromoBannerSectionProps {
  heading?: string
  buttonText?: string
  buttonUrl?: string
  selectedBannerId?: string
  bannerImage?: string
  bannerLinkData?: BannerLinkData | null
  hidden?: boolean
}

export function PromoBannerSection({
  heading = "New Trending Collection",
  buttonText = "View",
  buttonUrl,
  selectedBannerId,
  bannerImage: initialBannerImage,
  bannerLinkData,
}: PromoBannerSectionProps) {
  const [bannerImage, setBannerImage] = useState(initialBannerImage || "")
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(!initialBannerImage && !!selectedBannerId)

  const fetchedRef = useRef(false)

  useEffect(() => {
    if (bannerLinkData?.type === "external" && bannerLinkData.externalUrl) {
      setResolvedUrl(bannerLinkData.externalUrl)
      return
    }

    if (buttonUrl) {
      setResolvedUrl(buttonUrl)
    }

    if (fetchedRef.current) return

    if (!selectedBannerId) return

    const fetchBannerData = async () => {
      setLoading(true)
      fetchedRef.current = true
      try {
        const res = await fetch("/api/website/banner")
        const data = await res.json()
        const allBanners = data._data ?? []
        const found = allBanners.find((b: any) => b._id === selectedBannerId)

        if (found?.image && !initialBannerImage) {
          setBannerImage(found.image)
        }

        if (found?.link?.url) {
          setResolvedUrl(found.link.url)
        } else if (found?.link?.type === "external" && found?.link?.externalUrl) {
          setResolvedUrl(found.link.externalUrl)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchBannerData()
  }, [selectedBannerId, initialBannerImage, bannerLinkData, buttonUrl])

  return (
    <section className="relative w-full h-[65vh] lg:h-[75vh] overflow-hidden bg-card">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : bannerImage ? (
        <motion.div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url('${bannerImage}')` }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/60 to-primary/40" />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />

      <motion.div
        className="absolute top-20 right-20 w-32 h-32 border border-foreground/10 rounded-full"
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute bottom-32 right-40 w-20 h-20 border border-foreground/5 rounded-full"
        animate={{ scale: [1, 1.3, 1], rotate: [360, 180, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      />

      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-2xl text-foreground"
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <motion.h2
              className="text-3xl md:text-5xl lg:text-6xl fw-heading mb-6 leading-[1.2]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <span className="block text-foreground">{heading}</span>
            </motion.h2>

            {buttonText && resolvedUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                viewport={{ once: true }}
              >
                <Link href={resolvedUrl}>
                  <Button
                    variant="gradient"
                    size="lg"
                    className="group relative rounded-full px-8 py-6 text-base font-medium tracking-wide shadow-sm transition-all duration-300"
                  >
                    <span className="relative flex items-center gap-2">
                      {buttonText}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/30 via-background/10 to-transparent" />
    </section>
  )
}
