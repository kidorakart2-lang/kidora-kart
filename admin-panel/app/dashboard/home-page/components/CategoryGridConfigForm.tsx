"use client"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import ItemPicker, { type PickerItem } from "./ItemPicker"
import type { SectionConfig } from "../types"

interface Props {
  config: SectionConfig
  onChange: (cfg: SectionConfig) => void
}

type SourceType = "category" | "subCategory" | "subSubCategory"

const SOURCE_CONFIG: Record<SourceType, {
  label: string
  endpointUrl: string
  searchPlaceholder: string
}> = {
  category: {
    label: "Categories",
    endpointUrl: "/api/admin/category/view",
    searchPlaceholder: "Search categories...",
  },
  subCategory: {
    label: "Sub Categories",
    endpointUrl: "/api/admin/subcategory/view",
    searchPlaceholder: "Search sub categories...",
  },
  subSubCategory: {
    label: "Sub Sub Categories",
    endpointUrl: "/api/admin/subsubcategory/view",
    searchPlaceholder: "Search sub sub categories...",
  },
}

export default function CategoryGridConfigForm({ config, onChange }: Props) {
  const set = (key: string, value: unknown) => onChange({ ...config, [key]: value })
  const sourceType = (config.categorySourceType as SourceType) || "category"
  const selectedIds = (config.categorySelectedIds as string[]) || []
  const sourceCfg = SOURCE_CONFIG[sourceType]

  const handleSourceTypeChange = (newType: SourceType) => {
    onChange({
      ...config,
      categorySourceType: newType,
      categorySelectedIds: [],
      categoryItems: [],
      categorySearch: "",
    })
  }

  // Sync IDs on every selection change, cleanup removed items from categoryItems
  const handleSelection = (ids: string[]) => {
    const currentItems = (config.categoryItems as PickerItem[]) || []
    const updatedItems = currentItems.filter((i) => ids.includes(i._id))
    onChange({
      ...config,
      categorySelectedIds: ids,
      categoryItems: updatedItems.map((i) => ({
        _id: i._id,
        name: i.name || i.title || "",
        image: i.image || i.images?.[0],
        slug: i.slug,
      })),
    })
  }

  // When a NEW item is selected (not deselected), add its full data to categoryItems
  // so it shows up in extraItems when search results change.
  // This runs AFTER handleSelection — only touches categoryItems, not selectedIds,
  // so there's no race condition.
  const handleItemSelect = (item: PickerItem) => {
    const currentItems = (config.categoryItems as PickerItem[]) || []
    const isAlreadyTracked = currentItems.some((i) => i._id === item._id)
    if (!isAlreadyTracked) {
      onChange({
        ...config,
        categoryItems: [
          ...currentItems.map((i) => ({
            _id: i._id,
            name: i.name || i.title || "",
            image: i.image || i.images?.[0],
            slug: i.slug,
          })),
          {
            _id: item._id,
            name: item.name || item.title || "",
            image: item.image || item.images?.[0],
            slug: item.slug,
          },
        ],
      })
    }
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

      <ItemPicker
        endpointUrl={sourceCfg.endpointUrl}
        key={sourceType}
        searchPlaceholder={sourceCfg.searchPlaceholder}
        selectedIds={selectedIds}
        onSelectionChange={handleSelection}
        onItemSelect={handleItemSelect}
        mode="multi"
        extraItems={(config.categoryItems as PickerItem[]) || []}
      />
    </div>
  )
}
