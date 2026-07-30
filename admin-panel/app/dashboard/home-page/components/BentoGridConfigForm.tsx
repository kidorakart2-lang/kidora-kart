"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"
import ItemPicker, { type PickerItem } from "./ItemPicker"
import type { SectionConfig, BentoCell } from "../types"
import { BENTO_LAYOUTS, BENTO_SOURCE_TYPES, EMPTY_CELL } from "../constants"

interface Props {
  config: SectionConfig
  onChange: (cfg: SectionConfig) => void
}

const SOURCE_ENDPOINTS: Record<string, {
  url: string
  searchField: string
  searchPlaceholder: string
}> = {
  product: {
    url: "/api/admin/product/view",
    searchField: "name",
    searchPlaceholder: "Search products...",
  },
  category: {
    url: "/api/admin/category/view",
    searchField: "name",
    searchPlaceholder: "Search categories...",
  },
  subCategory: {
    url: "/api/admin/subcategory/view",
    searchField: "name",
    searchPlaceholder: "Search sub categories...",
  },
  subSubCategory: {
    url: "/api/admin/subsubcategory/view",
    searchField: "name",
    searchPlaceholder: "Search sub sub categories...",
  },
  banner: {
    url: "/api/admin/banner/view",
    searchField: "description",
    searchPlaceholder: "Search banners...",
  },
}

export default function BentoGridConfigForm({ config, onChange }: Props) {
  const set = (k: string, v: unknown) => onChange({ ...config, [k]: v })
  const layout = (config.layout as string) || "featured-large"
  const layoutMeta = BENTO_LAYOUTS.find((l) => l.value === layout) ?? BENTO_LAYOUTS[0]
  const cells = (config.cells as BentoCell[] | undefined) ?? []

  const cellCountChanged = (newLayout: string) => {
    const meta = BENTO_LAYOUTS.find((l) => l.value === newLayout)
    if (!meta) return
    const newCells: BentoCell[] = Array.from({ length: meta.cells }, (_, i) =>
      cells[i] || { ...EMPTY_CELL },
    )
    newCells.forEach((c) => {
      if (!c.sourceType) c.sourceType = "product"
    })
    onChange({ ...config, layout: newLayout, cells: newCells })
  }

  const updateCell = (index: number, updates: Partial<BentoCell>) => {
    const newCells = cells.map((cell, i) =>
      i === index ? { ...cell, ...updates } : cell,
    )
    while (newCells.length < layoutMeta.cells) {
      newCells.push({ ...EMPTY_CELL })
    }
    set("cells", newCells)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Heading (optional)</Label>
        <Input
          value={config.heading ?? ""}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="Featured Collection"
        />
      </div>

      <div className="space-y-2">
        <Label>Layout Pattern</Label>
        <div className="grid grid-cols-2 gap-2">
          {BENTO_LAYOUTS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => cellCountChanged(l.value)}
              className={`border rounded-lg p-2 text-left transition-all cursor-pointer ${
                layout === l.value
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              {l.preview}
              <p className="text-xs font-medium mt-1">{l.label}</p>
              <p className="text-[10px] text-muted-foreground">{l.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 border-t pt-3">
        <Label className="text-sm">Cells</Label>
        <p className="text-[10px] text-muted-foreground -mt-3">
          Configure each cell independently. Choose a data source type and select an item.
        </p>
        {Array.from({ length: layoutMeta.cells }, (_, i) => (
          <BentoCellEditor
            key={i}
            index={i}
            cell={cells[i] ?? { ...EMPTY_CELL }}
            onChange={(updates) => updateCell(i, updates)}
          />
        ))}
      </div>
    </div>
  )
}

// ── Per-Cell Editor ──

function BentoCellEditor({
  index,
  cell,
  onChange,
}: {
  index: number
  cell: BentoCell
  onChange: (updates: Partial<BentoCell>) => void
}) {
  const sourceType = cell.sourceType || "product"
  const endpointCfg = SOURCE_ENDPOINTS[sourceType] || SOURCE_ENDPOINTS.product
  const selectedIds = cell.sourceId ? [cell.sourceId] : []

  const handleSourceTypeChange = (newType: string) => {
    onChange({
      sourceType: newType,
      sourceId: undefined,
      image: "",
      title: "",
      subtitle: "",
      linkType: "none",
      linkTarget: "",
    })
  }

  const handleItemSelect = (item: PickerItem) => {
    const title = item.name || item.title || ""
    const image = item.image || item.images?.[0] || ""
    let subtitle = ""
    let linkType = "category"
    let linkTarget = item._id || ""

    switch (sourceType) {
      case "product":
        subtitle = item.discount_price
          ? `₹${item.discount_price}`
          : item.price
            ? `₹${item.price}`
            : ""
        linkType = "product"
        linkTarget = item.slug || item._id
        break
      case "category":
        subtitle = item.description || ""
        linkType = "category"
        linkTarget = item.slug || item._id
        break
      case "subCategory":
        subtitle = item.description || ""
        linkType = "category"
        const parentCatSlug = item.category?.[0]?.slug || ""
        linkTarget = parentCatSlug ? `${parentCatSlug}/${item.slug}` : item.slug
        break
      case "subSubCategory":
        subtitle = item.description || ""
        linkType = "category"
        const parentSubCatSlug = item.subCategory?.[0]?.slug || ""
        const grandParentCatSlug = item.subCategory?.[0]?.category?.[0]?.slug || ""
        if (grandParentCatSlug && parentSubCatSlug) {
          linkTarget = `${grandParentCatSlug}/${parentSubCatSlug}/${item.slug}`
        } else if (parentSubCatSlug) {
          linkTarget = `${parentSubCatSlug}/${item.slug}`
        } else {
          linkTarget = item.slug
        }
        break
      case "banner":
        subtitle = item.description || ""
        if (item.link?.type === "external") {
          linkType = "external"
          linkTarget = ""
        } else {
          linkType = item.link?.type || "category"
          linkTarget = item.link?.target || ""
        }
        break
    }

    onChange({ sourceType, sourceId: item._id, image, title, subtitle, linkType, linkTarget })
  }

  const clearSelection = () => {
    onChange({
      sourceId: undefined,
      image: "",
      title: "",
      subtitle: "",
      linkType: "none",
      linkTarget: "",
      linkExternalUrl: "",
    })
  }

  return (
    <div className="border rounded-lg p-3 space-y-3 bg-card">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">Cell {index + 1}</Label>
        {cell.image && (
          <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full font-medium">
            ✓ Configured
          </span>
        )}
      </div>

      <Select value={sourceType} onValueChange={handleSourceTypeChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {BENTO_SOURCE_TYPES.map((st) => (
            <SelectItem key={st.value} value={st.value} className="text-xs">
              {st.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ItemPicker
        endpointUrl={endpointCfg.url}
        searchField={endpointCfg.searchField}
        extraBody={{ limit: 10 }}
        key={`${index}-${sourceType}`}
        searchPlaceholder={endpointCfg.searchPlaceholder}
        selectedIds={selectedIds}
        onSelectionChange={() => {}}
        onItemSelect={handleItemSelect}
        mode="single"
        maxHeight="max-h-40"
        renderLabel={(item) => item.name || item.title || ""}
        renderSubLabel={(item) => {
          if (sourceType === "product") {
            return item.discount_price
              ? `₹${item.discount_price}`
              : item.price
                ? `₹${item.price}`
                : ""
          }
          if (sourceType === "banner") {
            return item.link?.type ? `Link: ${item.link.type}` : ""
          }
          return `Slug: ${item.slug || "-"}`
        }}
      />

      {cell.image && cell.title && (
        <div className="text-[10px] text-muted-foreground flex items-center gap-2 pt-1 border-t">
          {cell.image && (
            <img
              src={cell.image}
              alt={cell.title}
              className="w-6 h-6 rounded object-cover shrink-0"
            />
          )}
          <span className="truncate flex-1">{cell.title}</span>
          <span className="shrink-0">
            {cell.linkType !== "none" ? `→ ${cell.linkTarget || "..."}` : "No link"}
          </span>
          <button
            type="button"
            onClick={clearSelection}
            className="h-5 w-5 rounded-full hover:bg-destructive/10 hover:text-destructive flex items-center justify-center shrink-0 transition-colors"
            title="Clear selection"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
