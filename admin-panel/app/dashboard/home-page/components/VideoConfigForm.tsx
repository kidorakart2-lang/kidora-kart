"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { api } from "@/lib/api"
import type { Banner } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Search, X } from "lucide-react"
import type { SectionConfig } from "../types"

interface Props {
  config: SectionConfig
  onChange: (cfg: SectionConfig) => void
}

export default function VideoConfigForm({ config, onChange }: Props) {
  const set = (key: string, value: unknown) => onChange({ ...config, [key]: value })
  const selectedBannerId = config.selectedBannerId as string | undefined
  const search = config.bannerSearch || ""

  const [banners, setBanners] = useState<Banner[]>([])
  const [loadingBanners, setLoadingBanners] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadBanners = useCallback(async (searchTerm: string, pageNum: number) => {
    setLoadingBanners(true)
    try {
      const res = await api.postRaw<{ _data: Banner[]; _total_pages: number }>("/api/admin/banner/view", {
        description: searchTerm || undefined,
        page: pageNum,
        limit: 20,
      })
      setBanners(res._data || [])
      setTotalPages(res._total_pages || 1)
    } catch {
      setBanners([])
    } finally {
      setLoadingBanners(false)
    }
  }, [])

  useEffect(() => {
    loadBanners(search, page)
  }, [loadBanners, search, page])

  const selectBanner = (banner: Banner) => {
    set("selectedBannerId", banner._id)
    set("bannerLinkData", banner.link ?? null)
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearch = (val: string) => {
    set("bannerSearch", val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
    }, 300)
  }

  const clearBanner = () => {
    set("selectedBannerId", undefined)
    set("bannerLinkData", undefined)
  }

  const selectedBanner = banners.find((b) => b._id === selectedBannerId)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Heading</Label>
        <Input
          value={config.heading ?? ""}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="New Trending Collection"
        />
      </div>

      <div className="space-y-2">
        <Label>Subtitle</Label>
        <Input
          value={config.subtitle ?? ""}
          onChange={(e) => set("subtitle", e.target.value)}
          placeholder="We Believe that Good Design is Always in Season"
        />
      </div>

      <div className="space-y-2">
        <Label>Button Text</Label>
        <Input
          value={config.buttonText ?? ""}
          onChange={(e) => set("buttonText", e.target.value)}
          placeholder="Shop Now"
        />
      </div>

      <div className="space-y-2">
        <Label>Video URL / Embed URL</Label>
        <Input
          value={config.videoUrl ?? ""}
          onChange={(e) => set("videoUrl", e.target.value)}
          placeholder="https://www.youtube.com/embed/... or /uploads/video.mp4"
        />
        <p className="text-xs text-muted-foreground">
          YouTube embed URL or direct video file URL for the background.
        </p>
      </div>

      <div className="border-t pt-3 space-y-3">
        <Label className="text-sm">Button URL (from banner link)</Label>
        <p className="text-[10px] text-muted-foreground">
          Select a banner to use its link as the button URL. Leave empty to keep the default button URL from legacy data.
        </p>

        {selectedBanner && (
          <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
            <div className="w-8 h-8 rounded overflow-hidden shrink-0">
              <img src={selectedBanner.image} alt={selectedBanner.description} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{selectedBanner.description}</p>
              <p className="text-[10px] text-muted-foreground">
                Link: {selectedBanner.link?.type || "none"}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={clearBanner}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search banners..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 text-xs"
          />
        </div>

        <div className="max-h-36 overflow-y-auto border rounded-lg p-1 space-y-0.5">
          {loadingBanners ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : banners.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              {search ? "No banners match your search" : "No banners found"}
            </p>
          ) : (
            banners.map((banner: Banner) => {
              const isSelected = banner._id === selectedBannerId
              return (
                <button
                  key={banner._id}
                  type="button"
                  onClick={() => selectBanner(banner)}
                  className={`w-full flex items-center gap-2 p-2 rounded-md text-left transition-all cursor-pointer text-xs ${
                    isSelected
                      ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                  }`}>
                    {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  {banner.image && (
                    <img src={banner.image} alt={banner.description} className="w-7 h-7 rounded object-cover shrink-0" />
                  )}
                  <span className="truncate flex-1">{banner.description}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {banner.link?.type || "no link"}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-6 text-[10px]" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <Button variant="outline" size="sm" className="h-6 text-[10px]" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
