"use client"

import { Label } from "@/components/ui/label"
import { LayoutGrid, ImageIcon } from "lucide-react"
import ItemPicker, { type PickerItem } from "./ItemPicker"
import type { SectionConfig } from "../types"
import type { Banner } from "@/lib/types"

interface Props {
  config: SectionConfig
  onChange: (cfg: SectionConfig) => void
}

export default function BannerConfigForm({ config, onChange }: Props) {
  const mode = config.bannerMode || "slider"
  const selectedIds = config.selectedBannerIds || []

  const renderBannerLabel = (item: PickerItem) =>
    (item as unknown as Banner).description || "Untitled Banner"

  const renderBannerSubLabel = (item: PickerItem) => {
    const b = item as unknown as Banner
    return `${b.link?.type || "No link"} · ${b.status ? "Active" : "Inactive"}`
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Display Mode</Label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              onChange({
                ...config,
                bannerMode: "slider",
                ...(selectedIds.length > 1
                  ? { selectedBannerIds: [selectedIds[0]] }
                  : {}),
              })
            }
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
            onClick={() =>
              onChange({
                ...config,
                bannerMode: "single",
                ...(selectedIds.length > 1
                  ? { selectedBannerIds: [selectedIds[0]] }
                  : {}),
              })
            }
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

      <ItemPicker
        endpointUrl="/api/admin/banner/view"
        searchField="description"
        totalPagesPath="_total_pages"
        searchPlaceholder="Search banners..."
        selectedIds={selectedIds}
        onSelectionChange={(ids) => onChange({ ...config, selectedBannerIds: ids })}
        mode={mode === "single" ? "single" : "multi"}
        renderLabel={renderBannerLabel}
        renderSubLabel={renderBannerSubLabel}
      />

      <p className="text-[10px] text-muted-foreground">
        {mode === "slider"
          ? `${selectedIds.length} banner(s) selected for slider`
          : selectedIds.length > 0
            ? "1 banner selected"
            : "No banner selected"}
      </p>
    </div>
  )
}
