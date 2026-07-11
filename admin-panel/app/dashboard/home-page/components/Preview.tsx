"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import type { Banner } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { X, Monitor, Tablet, Smartphone, ImageIcon, LayoutGrid, ShoppingBag, Film, Code2, Sparkles } from "lucide-react"
import type { SectionConfig, HomeSection } from "../types"
import { getTypeMeta, getSectionTitle, BENTO_LAYOUTS } from "../constants"

// ── Home Page Preview ──

export function PreviewDialog({
  open,
  onClose,
  sections,
  device,
  onDeviceChange,
}: {
  open: boolean
  onClose: () => void
  sections: HomeSection[]
  device: "desktop" | "tablet" | "mobile"
  onDeviceChange: (d: "desktop" | "tablet" | "mobile") => void
}) {
  const visible = sections
    .filter((s) => !s.config?.hidden)
    .sort((a, b) => a.order - b.order)

  if (!open) return null

  const deviceWidths = {
    desktop: "max-w-5xl",
    tablet: "max-w-lg",
    mobile: "max-w-xs",
  }

  const deviceFrames = {
    desktop: "rounded-none",
    tablet: "rounded-2xl",
    mobile: "rounded-3xl",
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-background border-b shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Home Page Preview</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {visible.length} section{visible.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            {(
              [
                { key: "desktop" as const, icon: Monitor, label: "Desktop" },
                { key: "tablet" as const, icon: Tablet, label: "Tablet" },
                { key: "mobile" as const, icon: Smartphone, label: "Mobile" },
              ] as const
            ).map(({ key, icon: DevIcon, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => onDeviceChange(key)}
                className={`p-2 rounded-md transition-all cursor-pointer ${
                  device === key
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={label}
              >
                <DevIcon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-muted p-4 md:p-8">
        <div
          className={`mx-auto bg-background ${deviceWidths[device]} ${deviceFrames[device]} shadow-xl overflow-hidden transition-all duration-300 min-h-[600px]`}
        >
          {visible.length > 0 ? (
            <div className="divide-y divide-border">
              {visible.map((section, i) => (
                <PreviewSectionCard key={section._id} section={section} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <LayoutGrid className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No visible sections to preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Section preview card ──

function PreviewSectionCard({
  section,
  index,
}: {
  section: HomeSection
  index: number
}) {
  const meta = getTypeMeta(section.type)
  const Icon = meta.icon
  const title = getSectionTitle(section)
  const cfg = section.config ?? ({} as SectionConfig)

  return (
    <div className="group">
      <div className="flex items-center gap-2 px-4 py-1.5 bg-muted border-b border-border">
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
          #{index + 1}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${meta.color}`}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
        <span className="text-[10px] text-muted-foreground truncate flex-1">{title}</span>
        {cfg?.hidden && (
          <span className="text-[10px] text-muted-foreground bg-amber-50 px-1.5 py-0.5 rounded">
            Hidden
          </span>
        )}
      </div>

      <div className="p-4 bg-background">
        <SectionPreviewContent type={section.type} config={cfg} />
      </div>
    </div>
  )
}

// ── Promo Banner Preview ──

function PromoBannerPreview({ config }: { config: SectionConfig }) {
  const [resolvedImage, setResolvedImage] = useState<string | undefined>(config.bannerImage)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (config.bannerImage) {
      setResolvedImage(config.bannerImage)
      return
    }
    if (config.selectedBannerId) {
      setLoading(true)
      api
        .postRaw<{ _data: Banner[] }>("/api/admin/banner/view", { limit: 100 })
        .then((res) => {
          const found = (res._data ?? []).find((b: Banner) => b._id === config.selectedBannerId)
          if (found?.image) {
            setResolvedImage(found.image)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [config.bannerImage, config.selectedBannerId])

  return (
    <div
      className="rounded-lg p-6 flex flex-col items-center justify-center text-background relative overflow-hidden"
      style={{
        background: resolvedImage
          ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${resolvedImage}) center/cover`
          : undefined,
      }}
    >
      {!resolvedImage && !loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-sky-500" />
      )}
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-sky-500 flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-background/30 border-t-background" />
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent_60%)]" />
      {loading ? null : (
        <>
          <ImageIcon className="h-6 w-6 mb-2 relative z-10" />
          <p className="text-sm font-semibold relative z-10">
            {config.heading || "Promo Banner"}
          </p>
          {config.subtitle && (
            <p className="text-xs text-background/70 mt-1 relative z-10">{config.subtitle}</p>
          )}
          {config.buttonText && (
            <div className="mt-2 px-4 py-1 bg-background/20 backdrop-blur-sm rounded-full text-xs font-medium relative z-10">
              {config.buttonText}
            </div>
          )}
          {resolvedImage ? (
            <p className="text-[10px] text-background/50 mt-2 relative z-10">Banner image loaded</p>
          ) : config.selectedBannerId ? (
            <p className="text-[10px] text-amber-300 mt-2 relative z-10">Could not load banner image</p>
          ) : null}
        </>
      )}
    </div>
  )
}

// ── Section visual content preview ──

function SectionPreviewContent({
  type,
  config,
}: {
  type: string
  config: SectionConfig
}) {
  switch (type) {
    case "banner": {
      const bannerMode = config.bannerMode || "slider"
      const selectedIds = config.selectedBannerIds || []
      return (
        <div className="rounded-lg h-36 flex items-center justify-center relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="text-center text-background relative z-10">
            {selectedIds.length > 0 ? (
              <>
                <LayoutGrid className="h-5 w-5 mx-auto mb-1" />
                <p className="text-sm font-semibold tracking-tight">
                  {bannerMode === "slider" ? "Banner Slider" : "Single Banner"}
                </p>
                <p className="text-xs text-background/70 mt-1">
                  {selectedIds.length} banner{selectedIds.length > 1 ? "s" : ""} selected
                </p>
              </>
            ) : (
              <>
                <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-80" />
                <p className="text-sm font-semibold tracking-tight">
                  {bannerMode === "slider" ? "Banner Slider" : "Single Banner"}
                </p>
                <p className="text-xs text-background/70 mt-1">No banners selected yet</p>
              </>
            )}
          </div>
        </div>
      )
    }

    case "round-categories":
      return (
        <div className="space-y-3">
          {config.heading && (
            <p className="text-sm font-medium text-center text-foreground">{config.heading}</p>
          )}
          <div className="flex justify-center gap-4">
            {["Ring", "Earring", "Necklace", "Bracelet"].map((cat) => (
              <div key={cat} className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 ring-2 ring-emerald-100 flex items-center justify-center">
                  <span className="text-lg">{["💍", "✨", "📿", "💎"][cat === "Ring" ? 0 : cat === "Earring" ? 1 : cat === "Necklace" ? 2 : 3]}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      )

    case "square-categories":
      return (
        <div className="space-y-3">
          {config.heading && (
            <p className="text-sm font-medium text-center text-foreground">{config.heading}</p>
          )}
          <div className="flex justify-center gap-4">
            {["Ring", "Earring", "Necklace", "Bracelet"].map((cat) => (
              <div key={cat} className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 ring-2 ring-emerald-100 flex items-center justify-center">
                  <span className="text-lg">{["💍", "✨", "📿", "💎"][cat === "Ring" ? 0 : cat === "Earring" ? 1 : cat === "Necklace" ? 2 : 3]}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      )

    case "category-grid": {
      const items = (config.categoryItems as { name?: string; image?: string }[] | undefined) ?? []
      const selectedIds = (config.categorySelectedIds as string[] | undefined) ?? []
      if (items.length > 0) {
        return (
          <div className="grid grid-cols-2 gap-3 h-32">
            {items.slice(0, 4).map((item, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center text-white text-xs font-medium p-2 text-center"
              >
                {item.name || "Item"}
              </div>
            ))}
          </div>
        )
      }
      return (
        <div className="rounded-lg h-32 flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-500">
          <div className="text-center text-white text-xs">
            <LayoutGrid className="h-5 w-5 mx-auto mb-1" />
            <p className="font-medium">Category Grid</p>
            <p className="text-white/70 mt-0.5">
              {selectedIds.length > 0 ? `${selectedIds.length} item(s) selected` : "No items selected"}
            </p>
          </div>
        </div>
      )
    }

    case "product-slider":
      return (
        <div className="space-y-3">
          {config.heading && (
            <p className="text-sm font-medium text-foreground">{config.heading}</p>
          )}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-28 space-y-2">
                <div className="h-28 bg-gradient-to-b from-amber-100 to-amber-50 rounded-lg border border-amber-100 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-amber-300" />
                </div>
                <div className="h-2 bg-muted rounded w-3/4 mx-auto" />
                <div className="h-2 bg-muted rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Source: {(config.productSource || "new-arrivals").replace(/-/g, " ")} · Limit: {config.limit || "10"}
          </p>
        </div>
      )

    case "products-tab":
      return (
        <div className="space-y-3">
          {config.heading && (
            <p className="text-sm font-medium text-foreground">{config.heading}</p>
          )}
          <div className="flex gap-2 border-b pb-2">
            {(config.searchTerms || "earrings,necklace,bracelet")
              .split(",")
              .slice(0, 4)
              .map((term) => (
                <span key={term} className="text-xs px-3 py-1 rounded-full bg-rose-100 text-rose-700">
                  {term.trim()}
                </span>
              ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gradient-to-b from-rose-50 to-pink-50 rounded border border-rose-100" />
            ))}
          </div>
        </div>
      )

    case "shop-by-price":
      return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {["Under ₹500", "₹500-₹1K", "₹1K-₹5K", "₹5K+"]
            .slice(0, 4)
            .map((range) => (
              <div
                key={range}
                className="h-16 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg border border-teal-200 flex items-center justify-center text-xs font-medium text-teal-700"
              >
                {range}
              </div>
            ))}
        </div>
      )

    case "why-choose-us":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "\u{1f6e1}\u{fe0f}", label: "Quality" },
              { icon: "\u{1f69a}", label: "Free Shipping" },
              { icon: "\u{1f4af}", label: "100% Original" },
            ].map((f) => (
              <div
                key={f.label}
                className="text-center p-3 bg-gradient-to-b from-indigo-50 to-white rounded-lg border border-indigo-100"
              >
                <div className="text-xl mb-1">{f.icon}</div>
                <p className="text-[10px] font-medium text-indigo-700">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      )

    case "testimonial":
      return (
        <div className="space-y-3">
          <div className="flex gap-3 justify-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-32 p-3 rounded-lg bg-gradient-to-b from-orange-50 to-white border border-orange-100 text-center">
                <div className="w-8 h-8 rounded-full bg-orange-200 mx-auto mb-2 flex items-center justify-center text-xs font-bold text-orange-600">
                  {["SK", "AP", "MR"][i - 1]}
                </div>
                <div className="h-1.5 bg-orange-100 rounded w-3/4 mx-auto mb-1" />
                <div className="h-1.5 bg-orange-100 rounded w-1/2 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      )

    case "bento-grid": {
      const layout = (config.layout as string) || "featured-large"
      const cells = (config.cells as { image?: string; title?: string; subtitle?: string }[] | undefined) ?? []
      const layoutMeta = BENTO_LAYOUTS.find((l) => l.value === layout)

      const cellBox = (i: number, className = "") => {
        const cell = cells[i]
        return (
          <div
            key={i}
            className={`relative rounded-lg bg-card border border-border overflow-hidden ${className}`}
          >
            {cell?.image ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cell.image}
                  alt={cell.title || ""}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  {cell.title && (
                    <p className="text-[9px] font-semibold text-foreground truncate">{cell.title}</p>
                  )}
                  {cell.subtitle && (
                    <p className="text-[7px] text-muted-foreground truncate">{cell.subtitle}</p>
                  )}
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                {cell?.title ? (
                  <span className="text-[9px] text-muted-foreground font-medium truncate px-1">
                    {cell.title}
                  </span>
                ) : (
                  <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                )}
              </div>
            )}
          </div>
        )
      }

      const grid =
        layout === "featured-large" ? (
          <div className="grid grid-cols-3 gap-1.5 h-[120px]">
            {cellBox(0, "col-span-2 row-span-2")}
            {cellBox(1)}
            {cellBox(2)}
          </div>
        ) : layout === "featured-wide" ? (
          <div className="grid grid-cols-2 gap-1.5">
            {cellBox(0, "col-span-2 h-16")}
            <div className="grid grid-cols-2 gap-1.5">
              {cellBox(1, "h-16")}
              {cellBox(2, "h-16")}
            </div>
          </div>
        ) : layout === "two-col" ? (
          <div className="grid grid-cols-2 gap-1.5 h-[100px]">
            {cellBox(0)}
            {cellBox(1)}
          </div>
        ) : layout === "three-col" ? (
          <div className="grid grid-cols-3 gap-1.5 h-[80px]">
            {cellBox(0)}
            {cellBox(1)}
            {cellBox(2)}
          </div>
        ) : layout === "four-col" ? (
          <div className="grid grid-cols-2 gap-1.5 h-[100px]">
            {Array.from({ length: 4 }, (_, i) => cellBox(i, "h-full"))}
          </div>
        ) : (
          <div className="flex gap-1.5">
            {layoutMeta &&
              Array.from({ length: layoutMeta.cells }, (_, i) => cellBox(i, "flex-1 h-12"))}
          </div>
        )

      return (
        <div className="space-y-2">
          {config.heading && (
            <p className="text-sm font-medium text-foreground">{config.heading}</p>
          )}
          {grid}
          <p className="text-[10px] text-muted-foreground">
            Layout: {layoutMeta?.label || layout} · {cells.filter(c => c.image).length}/{cells.length} cells with images
          </p>
        </div>
      )
    }

    case "promo-banner":
      return <PromoBannerPreview config={config} />

    case "video":
      return (
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg p-6 flex flex-col items-center justify-center text-background relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent_60%)]" />
          <Film className="h-6 w-6 mb-2 relative z-10" />
          <p className="text-sm font-semibold relative z-10">
            {config.heading || "Video Section"}
          </p>
          {config.subtitle && (
            <p className="text-xs text-background/70 mt-1 relative z-10">{config.subtitle}</p>
          )}
          {config.buttonText && (
            <div className="mt-2 px-4 py-1 bg-background/20 backdrop-blur-sm rounded-full text-xs font-medium relative z-10">
              {config.buttonText}
            </div>
          )}
          {config.videoUrl && (
            <p className="text-[10px] text-background/50 mt-2 relative z-10 truncate max-w-full">
              Video: {config.videoUrl}
            </p>
          )}
        </div>
      )

    case "custom":
      return (
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
          <Code2 className="h-6 w-6 mx-auto mb-1 text-muted" />
          <p className="text-xs text-muted-foreground">Custom HTML Section</p>
          {config.html && (
            <div className="mt-2 max-h-16 overflow-hidden relative">
              <div className="text-[10px] text-muted-foreground font-mono bg-muted rounded p-2 text-left line-clamp-3">
                {config.html.slice(0, 200)}
              </div>
            </div>
          )}
        </div>
      )

    default:
      return (
        <div className="h-16 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">
          Preview not available
        </div>
      )
  }
}
