"use client"

import { useEffect, useState, useRef } from "react"
import { motion } from "motion/react"
import { Sparkles, ArrowRight, Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BannerLinkData {
  type?: string
  target?: string
  externalUrl?: string
  label?: string
}

interface VideoSectionProps {
  heading?: string
  subtitle?: string
  buttonText?: string
  buttonUrl?: string
  videoUrl?: string
  selectedBannerId?: string
  bannerLinkData?: BannerLinkData | null
  hidden?: boolean
}

export function VideoSection({
  heading = "New Trending Collection",
  subtitle = "We Believe that Good Design is Always in Season",
  buttonText = "Shop Now",
  buttonUrl = "/category/new-arrivals",
  videoUrl,
  selectedBannerId,
  bannerLinkData,
}: VideoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoLoading, setVideoLoading] = useState(true)
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null)
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
      fetchedRef.current = true
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}api/website/banner`,
        )
        const data = await res.json()
        const allBanners = data._data ?? []
        const found = allBanners.find((b: any) => b._id === selectedBannerId)

        if (found?.link?.url) {
          setResolvedUrl(found.link.url)
        } else if (found?.link?.type === "external" && found?.link?.externalUrl) {
          setResolvedUrl(found.link.externalUrl)
        }
      } catch {
        // silently fail
      }
    }
    fetchBannerData()
  }, [selectedBannerId, bannerLinkData, buttonUrl])

  const isYouTube = videoUrl?.includes("youtube") || videoUrl?.includes("youtu.be")
  const isDirectVideo = videoUrl && !isYouTube

  const youtubeEmbedUrl = isYouTube
    ? videoUrl?.includes("embed")
      ? videoUrl
      : videoUrl?.replace(
          /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/,
          "https://www.youtube.com/embed/$1"
        )
    : null

  return (
    <section className="relative w-full h-[65vh] lg:h-[75vh] overflow-hidden bg-card">
      {videoUrl ? (
        <>
          {isYouTube && youtubeEmbedUrl ? (
            <iframe
              src={`${youtubeEmbedUrl}?autoplay=1&mute=1&loop=1&playlist=${youtubeEmbedUrl.split("/").pop()}&controls=0&showinfo=0&rel=0`}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ filter: "brightness(0.5)" }}
              allow="autoplay; encrypted-media"
              allowFullScreen
              onLoad={() => setVideoLoading(false)}
            />
          ) : isDirectVideo ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: "brightness(0.5)" }}
              onLoadedData={() => setVideoLoading(false)}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : null}

          {videoLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0" style={{
          background: `linear-gradient(135deg, var(--brand-primary), var(--brand-secondary, var(--brand-primary)), var(--brand-accent, var(--brand-primary)))`,
        }} />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/30 to-transparent" />

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

      <motion.div
        className="absolute top-1/4 right-1/3"
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="w-6 h-6 text-foreground/30" />
      </motion.div>

      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-6 lg:px-12">
          <motion.div
            className="max-w-2xl text-foreground"
            initial={{ opacity: 0, x: -80 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <motion.div
              className="flex items-center gap-3 mb-6"
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: "auto", opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-[2px] bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, var(--brand-primary), var(--brand-secondary, var(--brand-primary)))` }} />
              <Play className="w-5 h-5" style={{ color: "var(--brand-primary)" }} />
            </motion.div>

            <motion.h2
              className="text-3xl md:text-5xl lg:text-6xl font-serif mb-6 leading-[1.2]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <span className="block text-foreground">{heading}</span>
            </motion.h2>

            {subtitle && (
              <motion.p
                className="text-base md:text-lg lg:text-xl mb-8 text-muted-foreground font-light max-w-lg leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
              >
                {subtitle}
              </motion.p>
            )}

            {buttonText && (resolvedUrl || buttonUrl) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                viewport={{ once: true }}
              >
                <Link href={resolvedUrl || buttonUrl || "#"}>
                  <Button
                    size="lg"
                    className="group relative overflow-hidden rounded-full px-8 py-6 text-base font-medium tracking-wide shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <span className="relative z-10 flex items-center gap-2 text-white">
                      {buttonText}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
              </motion.div>
            )}

            {videoUrl && !isPlaying && (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                viewport={{ once: true }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsPlaying(true)}
                  className="gap-2 rounded-full backdrop-blur-sm"
                >
                  <Play className="w-4 h-4" />
                  Watch Video
                </Button>
              </motion.div>
            )}

            <motion.div
              className="flex items-center gap-2 mt-8"
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: "200px", opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              viewport={{ once: true }}
            >
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent" style={{ backgroundImage: `linear-gradient(to right, var(--brand-primary), transparent)` }} />
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/30 via-background/10 to-transparent" />
    </section>
  )
}
