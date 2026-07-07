"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { api } from "@/lib/api"
import type { Banner } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, LayoutGrid, ImageIcon, Search, Check } from "lucide-react"
import type { SectionConfig } from "../types"

interface Props {
  config: SectionConfig
  onChange: (cfg: SectionConfig) => void
}

export default function BannerConfigForm({ config, onChange }: Props) {
  const set = (key: string, value: unknown) => onChange({ ...config, [key]: value })
  const mode = config.bannerMode || "slider"
  const selectedIds = config.selectedBannerIds || []
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

  const toggleBanner = (id: string) => {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : mode === "single"
        ? [id]
        : [...selectedIds, id]
    set("selectedBannerIds", updated)
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearch = (val: string) => {
    set("bannerSearch", val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
    }, 300)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Display Mode</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...config, bannerMode: "slider", ...(selectedIds.length > 1 ? { selectedBannerIds: [selectedIds[0]] } : {}) })}
            className={`flex-1 p-2 rounded-lg border text-sm transition-all cursor-pointer ${
              mode === "slider"
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <LayoutGrid className="h-4 w-4 mx-auto mb-1" />
            Slider (Multiple)
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...config, bannerMode: "single", ...(selectedIds.length > 1 ? { selectedBannerIds: [selectedIds[0]] } : {}) })}
            className={`flex-1 p-2 rounded-lg border text-sm transition-all cursor-pointer ${
              mode === "single"
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <ImageIcon className="h-4 w-4 mx-auto mb-1" />
            Single Banner
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search banners..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-8 text-xs"
        />
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
        {loadingBanners ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : banners.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {search ? "No banners match your search" : "No banners found. Create banners first in the Banners section."}
          </p>
        ) : (
          banners.map((banner: Banner) => {
            const isSelected = selectedIds.includes(banner._id)
            return (
              <button
                key={banner._id}
                type="button"
                onClick={() => toggleBanner(banner._id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                }`}>
                  {isSelected && <Check className="h-3 w-3 text-white" />}
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
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        {mode === "slider" ? `${selectedIds.length} banner(s) selected for slider` : selectedIds.length > 0 ? "1 banner selected" : "No banner selected"}
      </p>
    </div>
  )
}
