"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useReducedMotion } from "motion/react"
import { ArrowRight, Loader2, Sparkles } from "lucide-react"
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
  const reduceMotion = useReducedMotion()

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
    <section className="relative w-full h-[65vh] lg:h-[75vh] overflow-hidden bg-[#0c0a06]">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0c0a06]">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a1a05] via-[#0c0a06] to-[#1c1308]" />
      )}

      {/* Elegant dark scrim — keeps text readable over any banner without a washed-out white veil */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

      {/* Warm gold glow behind the content */}
      <div
        className="absolute -left-24 top-1/2 -translate-y-1/2 h-[460px] w-[460px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--brand-500) 22%, transparent) 0%, transparent 70%)" }}
      />

      {/* Jewellery ornaments — rotating gold rings + floating diamond sparkles */}
      <motion.div
        aria-hidden
        className="absolute top-16 right-24 w-36 h-36 border border-brand-400/25 rounded-full pointer-events-none"
        animate={reduceMotion ? undefined : { scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        aria-hidden
        className="absolute top-24 right-32 w-20 h-20 border border-brand-300/20 rounded-full pointer-events-none"
        animate={reduceMotion ? undefined : { scale: [1, 1.2, 1], rotate: [360, 180, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      <div
        aria-hidden
        className="absolute bottom-24 right-44 w-4 h-4 rotate-45 bg-brand-400/50 pointer-events-none"
        style={{ boxShadow: "0 0 18px 4px color-mix(in srgb, var(--brand-500) 45%, transparent)" }}
      />
      <div
        aria-hidden
        className="absolute top-1/3 right-16 w-2.5 h-2.5 rotate-45 bg-brand-300/40 pointer-events-none"
        style={{ boxShadow: "0 0 14px 3px color-mix(in srgb, var(--brand-400) 40%, transparent)" }}
      />

      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {/* Gold eyebrow ornament */}
            <motion.div
              aria-hidden
              className="flex items-center gap-3 mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="h-px w-14 bg-gradient-to-r from-transparent to-brand-400/80" />
              <Sparkles className="w-4 h-4 text-brand-400" aria-hidden />
              <div className="h-px w-14 bg-gradient-to-l from-transparent to-brand-400/80" />
            </motion.div>

            <motion.h2
              className="text-4xl md:text-6xl lg:text-7xl fw-heading mb-8 leading-[1.1] text-white break-words text-balance [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              {heading}
            </motion.h2>

            {buttonText && resolvedUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
              >
                <Link href={resolvedUrl}>
                  <Button
                    variant="gradient"
                    size="lg"
                    className="group relative rounded-full px-10 py-6 text-base font-medium tracking-wide shadow-[0_10px_30px_rgba(245,158,11,0.3)] transition-all duration-300 hover:shadow-[0_10px_44px_rgba(245,158,11,0.5)] hover:-translate-y-0.5"
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

      {/* Subtle bottom blend into the page */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
    </section>
  )
}
