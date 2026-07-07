"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { api } from "@/lib/api"
import type { Banner } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ImageIcon, Search, X } from "lucide-react"
import type { SectionConfig } from "../types"

interface Props {
  config: SectionConfig
  onChange: (cfg: SectionConfig) => void
}

export default function PromoBannerConfigForm({ config, onChange }: Props) {
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
    onChange({ ...config, selectedBannerId: banner._id, bannerImage: banner.image, bannerLinkData: banner.link ?? null })
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearch = (val: string) => {
    set("bannerSearch", val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
    }, 300)
  }

  const selectedBanner = banners.find((b) => b._id === selectedBannerId)

  useEffect(() => {
    if (!config.buttonText) {
      set("buttonText", "View")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        <Label>Button Text</Label>
        <p className="text-xs text-muted-foreground italic">
          Fixed to &ldquo;View&rdquo;. URL comes from the selected banner&rsquo;s link data.
        </p>
      </div>

      <div className="border-t pt-3">
        <Label className="mb-2 block">Background Banner Image</Label>

        {selectedBanner && (
          <div className="mb-3 relative rounded-lg overflow-hidden border">
            <img
              src={selectedBanner.image}
              alt={selectedBanner.description}
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
              <div className="text-white text-xs">
                <p className="font-medium truncate">{selectedBanner.description}</p>
                {selectedBanner.link?.type ? (
                  <p className="opacity-70">
                    Link: {selectedBanner.link.type}
                    {selectedBanner.link.type === "external"
                      ? ` → ${selectedBanner.link.externalUrl || ""}`
                      : ` → ${selectedBanner.link.target || ""}`}
                  </p>
                ) : (
                  <p className="opacity-70">No link — button will have no URL</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 bg-black/40 hover:bg-black/60 text-white"
              onClick={() => onChange({ ...config, selectedBannerId: undefined, bannerImage: undefined, bannerLinkData: undefined })}
            >
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

        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2 mt-2">
          {loadingBanners ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : banners.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              {search ? "No banners match your search" : "No banners found. Create banners first in the Banners section."}
            </p>
          ) : (
            banners.map((banner: Banner) => {
              const isSelected = banner._id === selectedBannerId
              return (
                <button
                  key={banner._id}
                  type="button"
                  onClick={() => selectBanner(banner)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                  }`}>
                    {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  {banner.image && (
                    <img
                      src={banner.image}
                      alt={banner.description}
                      className="w-10 h-10 rounded object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {banner.description || "Untitled Banner"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {banner.link?.type || "No link"} · {banner.status ? "Active" : "Inactive"}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-2">
            <p className="text-[10px] text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
