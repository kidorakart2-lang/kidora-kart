"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Search } from "lucide-react"
import type { SectionConfig, BentoCell } from "../types"
import { BENTO_LAYOUTS, BENTO_SOURCE_TYPES, EMPTY_CELL } from "../constants"

interface Props {
  config: SectionConfig
  onChange: (cfg: SectionConfig) => void
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

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearchState] = useState("")

  const loadItems = useCallback(async (type: string, searchTerm: string) => {
    setLoading(true)
    try {
      let items: any[] = []
      switch (type) {
        case "product": {
          const res = await api.postRaw<{ _data: any[] }>("/api/admin/product/view", { name: searchTerm || undefined, limit: 10 })
          items = res._data ?? []
          break
        }
        case "category": {
          const res = await api.postRaw<{ _data: any[] }>("/api/admin/category/view", { name: searchTerm || undefined, limit: 10 })
          items = res._data ?? []
          break
        }
        case "subCategory": {
          const res = await api.postRaw<{ _data: any[] }>("/api/admin/subcategory/view", { name: searchTerm || undefined, limit: 10 })
          items = res._data ?? []
          break
        }
        case "subSubCategory": {
          const res = await api.postRaw<{ _data: any[] }>("/api/admin/subsubcategory/view", { name: searchTerm || undefined, limit: 10 })
          items = res._data ?? []
          break
        }
        case "banner": {
          const res = await api.postRaw<{ _data: any[] }>("/api/admin/banner/view", { description: searchTerm || undefined, limit: 10 })
          items = res._data ?? []
          break
        }
        default:
          items = []
      }
      setItems(items)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems(sourceType, search)
  }, [loadItems, sourceType, search])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearch = (val: string) => {
    setSearchState(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      loadItems(sourceType, val)
    }, 300)
  }

  const handleSourceTypeChange = (newType: string) => {
    onChange({ sourceType: newType, sourceId: undefined, image: "", title: "", subtitle: "", linkType: "none", linkTarget: "" })
    setSearchState("")
  }

  const selectItem = (item: any) => {
    const title = item.name || item.title || ""
    const image = item.image || item.images?.[0] || ""
    let subtitle = ""
    let linkType = "category"
    let linkTarget = item._id || ""
    let linkExternalUrl = ""

    switch (sourceType) {
      case "product":
        subtitle = item.discount_price ? `₹${item.discount_price}` : item.price ? `₹${item.price}` : ""
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
          linkExternalUrl = item.link?.externalUrl || ""
          linkTarget = ""
        } else {
          linkType = item.link?.type || "category"
          linkTarget = item.link?.target || ""
        }
        break
    }

    onChange({
      sourceType,
      sourceId: item._id,
      image,
      title,
      subtitle,
      linkType,
      linkTarget,
      linkExternalUrl,
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

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${sourceType === "product" ? "products" : sourceType === "category" ? "categories" : sourceType === "subCategory" ? "sub categories" : sourceType === "banner" ? "banners" : "items"}...`}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      <div className="max-h-40 overflow-y-auto border rounded-md p-1 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            {search.trim() ? "No matches found" : `No ${sourceType === "product" ? "products" : "items"} available`}
          </p>
        ) : (
          items.map((item: any) => {
            const isSelected = cell.sourceId === item._id
            const itemImage = item.image || item.images?.[0] || ""
            const itemLabel = item.name || item.title || ""
            return (
              <button
                key={item._id}
                type="button"
                onClick={() => selectItem(item)}
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
                {itemImage ? (
                  <img src={itemImage} alt={itemLabel} className="w-7 h-7 rounded object-cover shrink-0" />
                ) : null}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{itemLabel}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {sourceType === "product"
                      ? item.discount_price ? `₹${item.discount_price}` : item.price ? `₹${item.price}` : ""
                      : sourceType === "banner"
                        ? item.link?.type ? `Link: ${item.link.type}` : ""
                        : `Slug: ${item.slug || "-"}`}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>

      {cell.image && cell.title && (
        <div className="text-[10px] text-muted-foreground flex items-center gap-2 pt-1 border-t">
          {cell.image && (
            <img src={cell.image} alt={cell.title} className="w-6 h-6 rounded object-cover shrink-0" />
          )}
          <span className="truncate flex-1">{cell.title}</span>
          <span className="shrink-0">{cell.linkType !== "none" ? `→ ${cell.linkTarget || "..."}` : "No link"}</span>
        </div>
      )}
    </div>
  )
}
