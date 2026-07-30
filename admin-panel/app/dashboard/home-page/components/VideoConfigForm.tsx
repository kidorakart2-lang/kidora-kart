"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import ItemPicker, { type PickerItem } from "./ItemPicker"
import type { SectionConfig } from "../types"
import type { Banner } from "@/lib/types"

interface Props {
  config: SectionConfig
  onChange: (cfg: SectionConfig) => void
}

export default function VideoConfigForm({ config, onChange }: Props) {
  const set = (key: string, value: unknown) => onChange({ ...config, [key]: value })
  const selectedBannerId = config.selectedBannerId as string | undefined
  const selectedIds = selectedBannerId ? [selectedBannerId] : []

  const handleSelection = (ids: string[]) => {
    onChange({ ...config, selectedBannerId: ids[0] || undefined })
  }

  const handleItemSelect = (item: PickerItem) => {
    const banner = item as unknown as Banner
    // If the same item was clicked again (deselect), don't re-select —
    // handleSelection already cleared selectedBannerId
    if (selectedBannerId === banner._id) return
    onChange({
      ...config,
      selectedBannerId: banner._id,
      bannerLinkData: banner.link ?? null,
    })
  }

  const clearBanner = () => {
    onChange({
      ...config,
      selectedBannerId: undefined,
      bannerLinkData: undefined,
    })
  }

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

      {config.videoUrl && (
        <div className="rounded-lg overflow-hidden border bg-muted/30">
          <div className="text-[10px] font-medium px-3 py-1.5 bg-muted text-muted-foreground border-b">
            Preview
          </div>
          <div className="aspect-video relative">
            {config.videoUrl.includes("youtube.com/embed") || config.videoUrl.includes("youtu.be") ? (
              <iframe
                src={
                  config.videoUrl.includes("youtu.be")
                    ? config.videoUrl.replace("youtu.be/", "youtube.com/embed/")
                    : config.videoUrl
                }
                className="w-full h-full"
                allow="accelerometer; autoplay; encrypted-media; gyroscope"
                allowFullScreen
                title="Video preview"
              />
            ) : (
              <video
                src={config.videoUrl}
                className="w-full h-full object-cover"
                controls
                preload="metadata"
              >
                <track kind="captions" label="No captions" />
              </video>
            )}
          </div>
          <div className="text-[10px] text-muted-foreground px-3 py-1.5 border-t text-right">
            {config.videoUrl.includes("youtube") || config.videoUrl.includes("youtu.be")
              ? "YouTube"
              : config.videoUrl.endsWith(".mp4")
                ? "Video file"
                : "Video"}
          </div>
        </div>
      )}

      <div className="border-t pt-3 space-y-3">
        <Label className="text-sm">Button URL (from banner link)</Label>
        <p className="text-[10px] text-muted-foreground">
          Select a banner to use its link as the button URL. Leave empty to keep the default button URL
          from legacy data.
        </p>

        {selectedBannerId && (
          <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
            <div className="w-8 h-8 rounded overflow-hidden shrink-0">
              <img
                src={config.bannerImage || "/placeholder.svg"}
                alt="Selected banner"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">Banner selected</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={clearBanner}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        <ItemPicker
          endpointUrl="/api/admin/banner/view"
          searchField="description"
          totalPagesPath="_total_pages"
          searchPlaceholder="Search banners..."
          selectedIds={selectedIds}
          onSelectionChange={handleSelection}
          onItemSelect={handleItemSelect}
          mode="single"
          maxHeight="max-h-36"
          renderLabel={(item) =>
            (item as unknown as Banner).description || "Untitled Banner"
          }
          renderSubLabel={(item) => {
            const b = item as unknown as Banner
            return b.link?.type || "no link"
          }}
        />
      </div>
    </div>
  )
}
