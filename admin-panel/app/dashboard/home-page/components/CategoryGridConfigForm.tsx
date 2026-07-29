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
import { Loader2, Search, Check } from "lucide-react"
import type { SectionConfig } from "../types"

interface SelectableItem {
  _id: string
  name?: string
  title?: string
  image?: string
  slug?: string
  images?: string[]
}

interface Props {
  config: SectionConfig
  onChange: (cfg: SectionConfig) => void
}

export default function CategoryGridConfigForm({ config, onChange }: Props) {
  const set = (key: string, value: unknown) => onChange({ ...config, [key]: value })
  const sourceType = (config.categorySourceType as string) || "category"
  const selectedIds = (config.categorySelectedIds as string[]) || []
  const search = (config.categorySearch as string) || ""

  const [items, setItems] = useState<SelectableItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadItems = useCallback(async (type: string, searchTerm: string) => {
    setLoading(true)
    try {
      let data: SelectableItem[] = []
      switch (type) {
        case "category": {
          const res = await api.postRaw<{ _data: SelectableItem[] }>("/api/admin/category/view", { name: searchTerm || undefined })
          data = res._data ?? []
          break
        }
        case "subCategory": {
          const res = await api.postRaw<{ _data: SelectableItem[] }>("/api/admin/subcategory/view", { name: searchTerm || undefined })
          data = res._data ?? []
          break
        }
        case "subSubCategory": {
          const res = await api.postRaw<{ _data: SelectableItem[] }>("/api/admin/subsubcategory/view", { name: searchTerm || undefined })
          data = res._data ?? []
          break
        }
        default:
          data = []
      }
      setItems(data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems(sourceType, search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadItems, sourceType])

  const toggleItem = (id: string) => {
    const item = items.find((i: SelectableItem) => i._id === id)
    const updatedIds = selectedIds.includes(id)
      ? selectedIds.filter((i) => i !== id)
      : [...selectedIds, id]

    const currentItems = (config.categoryItems as SelectableItem[]) || []
    let updatedItems
    if (selectedIds.includes(id)) {
      updatedItems = currentItems.filter((i) => i._id !== id)
    } else if (item) {
      updatedItems = [...currentItems, { _id: item._id, name: item.name || item.title || "", image: item.image || item.images?.[0] || "", slug: item.slug || "" }]
    } else {
      updatedItems = currentItems
    }

    set("categorySelectedIds", updatedIds)
    set("categoryItems", updatedItems)
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = (val: string) => {
    set("categorySearch", val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      loadItems(sourceType, val)
    }, 300)
  }

  const handleSourceTypeChange = (newType: string) => {
    set("categorySourceType", newType)
    set("categorySelectedIds", [])
    set("categoryItems", [])
    set("categorySearch", "")
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Heading</Label>
        <Input
          value={config.heading ?? ""}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="e.g. Explore Our Collection"
        />
      </div>

      <div className="space-y-2">
        <Label>Source Type</Label>
        <Select value={sourceType} onValueChange={handleSourceTypeChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="category">Categories</SelectItem>
            <SelectItem value="subCategory">Sub Categories</SelectItem>
            <SelectItem value="subSubCategory">Sub Sub Categories</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${sourceType === "category" ? "categories" : sourceType === "subCategory" ? "sub categories" : "sub sub categories"}...`}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8 text-xs"
        />
      </div>

      <div className="max-h-48 overflow-y-auto border rounded-lg p-1 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {search.trim() ? "No matches found" : `No ${sourceType === "category" ? "categories" : "items"} available`}
          </p>
        ) : (
          items.map((item: SelectableItem) => {
            const isSelected = selectedIds.includes(item._id)
            const itemImage = item.image || item.images?.[0] || ""
            const itemLabel = item.name || item.title || ""
            return (
              <button
                key={item._id}
                type="button"
                onClick={() => toggleItem(item._id)}
                className={`w-full flex items-center gap-2 p-2 rounded-md text-left transition-all cursor-pointer text-xs ${
                  isSelected
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "hover:bg-muted"
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                }`}>
                  {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                {itemImage ? (
                  <img src={itemImage} alt={itemLabel} className="w-7 h-7 rounded object-cover shrink-0" />
                ) : null}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{itemLabel}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Slug: {item.slug || "-"}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>

      <p className="text-[10px] text-muted-foreground">
        {selectedIds.length > 0
          ? `${selectedIds.length} item(s) selected`
          : "No items selected — section will not render"}
      </p>


    </div>
  )
}
