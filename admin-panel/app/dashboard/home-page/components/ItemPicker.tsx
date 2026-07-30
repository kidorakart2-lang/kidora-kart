"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { api } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Search, Check } from "lucide-react"

// ── Types ──

export interface PickerItem {
  _id: string
  name?: string
  title?: string
  image?: string
  slug?: string
  images?: string[]
  [key: string]: unknown
}

export type SelectionMode = "single" | "multi"

interface ItemPickerProps {
  /** API endpoint URL, e.g. "/api/admin/category/view" */
  endpointUrl: string
  /** Search field name sent in the request body, e.g. "name" or "description" */
  searchField?: string
  /** Extra body fields merged into every request */
  extraBody?: Record<string, unknown>
  /** Response path to extract items. Default "_data" */
  dataPath?: string
  /** Response path to extract total pages */
  totalPagesPath?: string
  /** Label for the fieldset */
  label?: string
  /** Placeholder for search input */
  searchPlaceholder?: string
  /** Selected item IDs (controlled) */
  selectedIds: string[]
  /** Callback when selection changes */
  onSelectionChange: (ids: string[]) => void
  /** Callback with full item data when an item is clicked (after selection change) */
  onItemSelect?: (item: PickerItem) => void
  /** Single or multi select */
  mode?: SelectionMode
  /** How to render each item's primary label */
  renderLabel?: (item: PickerItem) => string
  /** How to render each item's secondary info */
  renderSubLabel?: (item: PickerItem) => string
  /** How to render each item's image URL */
  renderImage?: (item: PickerItem) => string | undefined
  /** Max height of the scrollable list */
  maxHeight?: string
  /** Additional items to show (e.g. pre-selected items not in current search results) */
  extraItems?: PickerItem[]
  /** Key to use for item identity (default "_id") */
  idKey?: string
}

// ── Component ──

export default function ItemPicker({
  endpointUrl,
  searchField = "name",
  extraBody,
  dataPath = "_data",
  totalPagesPath,
  label,
  searchPlaceholder = "Search...",
  selectedIds,
  onSelectionChange,
  onItemSelect,
  mode = "multi",
  renderLabel,
  renderSubLabel,
  renderImage,
  maxHeight = "max-h-48",
  extraItems,
  idKey = "_id",
}: ItemPickerProps) {
  const [items, setItems] = useState<PickerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Use a stable ref to prevent re-fetch on every render from new extraBody reference
  const extraBodyRef = useRef(extraBody)
  if (JSON.stringify(extraBody) !== JSON.stringify(extraBodyRef.current)) {
    extraBodyRef.current = extraBody
  }

  const loadItems = useCallback(async (searchTerm: string, pageNum: number) => {
    setLoading(true)
    setLoadError(null)
    try {
      const body: Record<string, unknown> = {
        ...extraBodyRef.current,
        [searchField]: searchTerm || undefined,
        page: pageNum,
        limit: 20,
      }
      const res = (await api.postRaw(endpointUrl, body)) as Record<string, unknown>
      const data = (res[dataPath] as PickerItem[]) ?? []
      setItems(data)

      if (totalPagesPath) {
        setTotalPages((res[totalPagesPath] as number) ?? 1)
      }

      if (data.length === 0 && !searchTerm.trim()) {
        setLoadError(`No items found. Create some first in the relevant section.`)
      }
    } catch (err) {
      setItems([])
      setLoadError(
        `Failed to load items. ${err instanceof Error ? err.message : "Check your connection and try again."}`,
      )
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpointUrl, searchField, dataPath, totalPagesPath])

  // Initial load — only when URL or search/page changes
  useEffect(() => {
    loadItems(search, page)
  }, [loadItems, search, page])

  // Debounced search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = (val: string) => {
    setSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
    }, 300)
  }

  const getLabel = (item: PickerItem): string => {
    if (renderLabel) return renderLabel(item)
    return item.name || item.title || "Untitled"
  }

  const getSubLabel = (item: PickerItem): string => {
    if (renderSubLabel) return renderSubLabel(item)
    return item.slug ? `Slug: ${item.slug}` : ""
  }

  const getImage = (item: PickerItem): string | undefined => {
    if (renderImage) return renderImage(item)
    return item.image || item.images?.[0]
  }

  const toggleItem = (item: PickerItem) => {
    const id = String(item[idKey])
    let updated: string[]
    if (mode === "single") {
      updated = selectedIds[0] !== id ? [id] : []
    } else {
      updated = selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
    }
    // Call selection change first, then item select for additional side-effects
    onSelectionChange(updated)
    onItemSelect?.(item)
  }

  // Merge extra items (for showing already-selected items not in results)
  const allItems = extraItems && extraItems.length > 0
    ? [...extraItems.filter((ei) => !items.some((i) => String(i[idKey]) === String(ei[idKey]))), ...items]
    : items

  return (
    <div className="space-y-3">
      {label && <Label>{label}</Label>}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-8 text-xs"
        />
      </div>

      {/* Items list */}
      <div className={`${maxHeight} overflow-y-auto border rounded-lg p-1 space-y-0.5`}>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : loadError ? (
          <div className="text-center py-4 px-2">
            <p className="text-xs text-destructive mb-2">{loadError}</p>
            <button
              type="button"
              onClick={() => loadItems(search, page)}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : allItems.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            {search.trim()
              ? "No matches found"
              : "No items available. Create some first."}
          </p>
        ) : (
          allItems.map((item) => {
            const id = String(item[idKey])
            const isSelected = selectedIds.includes(id)
            const imageUrl = getImage(item)
            const labelText = getLabel(item)
            const subLabelText = getSubLabel(item)

            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleItem(item)}
                className={`w-full flex items-center gap-2 p-2 rounded-md text-left transition-all cursor-pointer text-xs ${
                  isSelected
                    ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "hover:bg-muted"
                }`}
              >
                <div
                  className={`w-4 h-4 ${mode === "single" ? "rounded-full" : "rounded-sm"} border-2 flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected &&
                    (mode === "single" ? (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    ) : (
                      <Check className="h-2.5 w-2.5 text-white" />
                    ))}
                </div>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={labelText}
                    className="w-7 h-7 rounded object-cover shrink-0"
                  />
                ) : null}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{labelText}</p>
                  {subLabelText && (
                    <p className="text-[10px] text-muted-foreground">
                      {subLabelText}
                    </p>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Selection count */}
      <p className="text-[10px] text-muted-foreground">
        {selectedIds.length > 0
          ? `${selectedIds.length} item(s) selected`
          : "No items selected"}
      </p>
    </div>
  )
}
