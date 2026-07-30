"use client"

import { useEffect } from "react"
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

export default function PromoBannerConfigForm({ config, onChange }: Props) {
  const set = (key: string, value: unknown) => onChange({ ...config, [key]: value })
  const selectedBannerId = config.selectedBannerId as string | undefined
  const selectedIds = selectedBannerId ? [selectedBannerId] : []

  // Set default button text
  useEffect(() => {
    if (!config.buttonText) {
      set("buttonText", "View")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      bannerImage: banner.image,
      bannerLinkData: banner.link ?? null,
    })
  }

  const clearSelection = () => {
    onChange({
      ...config,
      selectedBannerId: undefined,
      bannerImage: undefined,
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
        <Label>Button Text</Label>
        <p className="text-xs text-muted-foreground italic">
          Fixed to &ldquo;View&rdquo;. URL comes from the selected banner&rsquo;s link data.
        </p>
      </div>

      <div className="border-t pt-3">
        <Label className="mb-2 block">Background Banner Image</Label>

        {selectedBannerId && (
          <div className="mb-3 relative rounded-lg overflow-hidden border">
            <img
              src={config.bannerImage || ""}
              alt="Selected banner"
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 bg-black/40 hover:bg-black/60 text-white"
              onClick={clearSelection}
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
          renderLabel={(item) =>
            (item as unknown as Banner).description || "Untitled Banner"
          }
          renderSubLabel={(item) => {
            const b = item as unknown as Banner
            return `${b.link?.type || "No link"} · ${b.status ? "Active" : "Inactive"}`
          }}
        />
      </div>
    </div>
  )
}
