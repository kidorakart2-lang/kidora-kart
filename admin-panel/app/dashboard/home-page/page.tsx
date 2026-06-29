"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { api, ApiClientError } from "@/lib/api"
import type { Product, Banner } from "@/lib/types"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Grid3X3,
  GripVertical,
  Plus,
  Save,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  ImageIcon,
  LayoutGrid,
  ShoppingBag,
  Sparkles,
  MessageSquareQuote,
  Film,
  Code2,
  CircleDollarSign,
  Tag,
  Monitor,
  X,
  Smartphone,
  Tablet,
  Search,
  Check,
} from "lucide-react"

// ── Helpers ──

function generateObjectId(): string {
  const hex = "0123456789abcdef"
  return Array.from({ length: 24 }, () => hex[Math.floor(Math.random() * 16)]).join("")
}

function isHexObjectId(id: string): boolean {
  return /^[0-9a-f]{24}$/i.test(id)
}

// ── Section type definitions ──

interface SectionConfig {
  heading?: string
  productSource?: string
  limit?: string
  searchTerms?: string
  subtitle?: string
  buttonText?: string
  buttonUrl?: string
  html?: string
  bgColor?: string
  hidden?: boolean
  bannerMode?: "single" | "slider"
  selectedBannerIds?: string[]
  bannerSearch?: string
  [key: string]: unknown
}

interface HomeSection {
  _id: string
  type: string
  config?: SectionConfig
  order: number
}

const SECTION_TYPES = [
  {
    value: "banner",
    label: "Banner",
    description: "Full-width image slider with navigation links",
    icon: ImageIcon,
    color: "bg-blue-100 text-blue-700",
    defaults: { config: {}, title: "Banner Slider" },
  },
  {
    value: "round-categories",
    label: "Round Categories",
    description: "Circular category image carousel",
    icon: LayoutGrid,
    color: "bg-emerald-100 text-emerald-700",
    defaults: { config: { heading: "Discover Our Collection" }, title: "Round Categories" },
  },
  {
    value: "category-grid",
    label: "Category Grid",
    description: "Men/Women split layout with images",
    icon: LayoutGrid,
    color: "bg-purple-100 text-purple-700",
    defaults: { config: { heading: "Men & Women" }, title: "Category Grid" },
  },
  {
    value: "product-slider",
    label: "Product Slider",
    description: "Product carousel (new arrivals, best sellers, etc.)",
    icon: ShoppingBag,
    color: "bg-amber-100 text-amber-700",
    defaults: { config: { heading: "New Arrivals", productSource: "new-arrivals", limit: "10" }, title: "Product Slider" },
  },
  {
    value: "products-tab",
    label: "Products Tab",
    description: "Tabbed product grid by search terms",
    icon: Tag,
    color: "bg-rose-100 text-rose-700",
    defaults: { config: { heading: "Our Products", searchTerms: "earrings,necklace,bracelet" }, title: "Products Tab" },
  },
  {
    value: "shop-by-price",
    label: "Shop by Price",
    description: "Price range categories grid",
    icon: CircleDollarSign,
    color: "bg-teal-100 text-teal-700",
    defaults: { config: {}, title: "Shop by Price" },
  },
  {
    value: "why-choose-us",
    label: "Why Choose Us",
    description: "Feature cards with icons",
    icon: Sparkles,
    color: "bg-indigo-100 text-indigo-700",
    defaults: { config: { heading: "Why Choose Us" }, title: "Why Choose Us" },
  },
  {
    value: "testimonial",
    label: "Testimonials",
    description: "Customer review carousel",
    icon: MessageSquareQuote,
    color: "bg-orange-100 text-orange-700",
    defaults: { config: { heading: "What Our Customers Say" }, title: "Testimonials" },
  },
  {
    value: "bento-grid",
    label: "Bento Grid",
    description: "Curated image grid with mixed cell sizes",
    icon: Grid3X3,
    color: "bg-pink-100 text-pink-700",
    defaults: {
      config: { heading: "Featured Collection", layout: "featured-large", cells: [] },
      title: "Bento Grid",
    },
  },
  {
    value: "video-banner",
    label: "Video / Promo Banner",
    description: "Full-width promotional banner with CTA",
    icon: Film,
    color: "bg-cyan-100 text-cyan-700",
    defaults: { config: { heading: "New Trending Collection", subtitle: "We Believe that Good Design is Always in Season", buttonText: "Shop Now", buttonUrl: "/category/new-arrivals" }, title: "Promo Banner" },
  },
  {
    value: "custom",
    label: "Custom HTML",
    description: "Custom HTML content",
    icon: Code2,
    color: "bg-slate-100 text-slate-700",
    defaults: { config: { html: "" }, title: "Custom Section" },
  },
] as const

function getTypeMeta(type: string) {
  return SECTION_TYPES.find((t) => t.value === type) ?? SECTION_TYPES[0]
}

function getSectionTitle(section: HomeSection): string {
  const meta = getTypeMeta(section.type)
  return section.config?.heading || meta.defaults.title
}

// ── Unsaved indicator ──

function UnsavedIndicator({ sections }: { sections: HomeSection[] }) {
  const hasUnsaved = sections.some((s) => !isHexObjectId(s._id))
  if (!hasUnsaved) return null
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800">
      ⚠️ You have unsaved sections. Click &ldquo;Save All&rdquo; to persist.
    </div>
  )
}

// ── SortableSection card ──

function SortableSection({
  section,
  index,
  onEdit,
  onToggle,
  onDelete,
}: {
  section: HomeSection
  index: number
  onEdit: (s: HomeSection) => void
  onToggle: (s: HomeSection) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
  }

  const meta = getTypeMeta(section.type)
  const Icon = meta.icon
  const title = getSectionTitle(section)

  return (
    <div ref={setNodeRef} style={style} className="border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 p-4">
        <button
          className="cursor-grab touch-none hover:text-primary transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className={`p-2 rounded-lg ${meta.color} shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{title}</span>
            <Badge variant="outline" className="text-xs shrink-0">
              {meta.label}
            </Badge>
            {!isHexObjectId(section._id) && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                Unsaved
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {meta.description}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onToggle(section)}
            title={section.config?.hidden ? "Show" : "Hide"}
          >
            {section.config?.hidden ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(section)} className="h-8">
            Edit
          </Button>
          {section.type !== "banner" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(section._id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Config form per section type ──

function SectionConfigForm({
  type,
  config,
  onChange,
}: {
  type: string
  config: SectionConfig
  onChange: (cfg: SectionConfig) => void
}) {
  const set = (key: string, value: unknown) => onChange({ ...config, [key]: value })

  switch (type) {
    case "banner":
      return <BannerConfigForm config={config} onChange={onChange} />

    case "round-categories":
    case "category-grid":
    case "why-choose-us":
    case "testimonial":
    case "shop-by-price":
      return (
        <div className="space-y-2">
          <Label>Heading (optional)</Label>
          <Input
            value={config.heading ?? ""}
            onChange={(e) => set("heading", e.target.value)}
            placeholder={`Enter heading for ${getTypeMeta(type).label}`}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use the default heading.
          </p>
        </div>
      )

    case "product-slider":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Heading</Label>
            <Input
              value={config.heading ?? ""}
              onChange={(e) => set("heading", e.target.value)}
              placeholder="e.g. New Arrivals"
            />
          </div>
          <div className="space-y-2">
            <Label>Product Source</Label>
            <Select
              value={config.productSource ?? "new-arrivals"}
              onValueChange={(v) => set("productSource", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new-arrivals">New Arrivals</SelectItem>
                <SelectItem value="best-sellers">Best Sellers</SelectItem>
                <SelectItem value="trending-products">Trending Products</SelectItem>
                <SelectItem value="featured">Featured Products</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Limit</Label>
            <Input
              type="number"
              value={config.limit ?? "10"}
              onChange={(e) => set("limit", e.target.value)}
              min={1}
              max={50}
            />
          </div>
        </div>
      )

    case "products-tab":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Heading (optional)</Label>
            <Input
              value={config.heading ?? ""}
              onChange={(e) => set("heading", e.target.value)}
              placeholder="Our Products Collection"
            />
          </div>
          <div className="space-y-2">
            <Label>Search Terms (comma-separated)</Label>
            <Input
              value={config.searchTerms ?? ""}
              onChange={(e) => set("searchTerms", e.target.value)}
              placeholder="earrings,necklace,bracelet"
            />
            <p className="text-xs text-muted-foreground">
              Each term becomes a tab showing matching products.
            </p>
          </div>
        </div>
      )

    case "video-banner":
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
            <Label>Button URL</Label>
            <Input
              value={config.buttonUrl ?? ""}
              onChange={(e) => set("buttonUrl", e.target.value)}
              placeholder="/category/new-arrivals"
            />
          </div>
        </div>
      )

    case "bento-grid":
      return <BentoGridConfigForm config={config} onChange={onChange} />

    case "custom":
      return (
        <div className="space-y-2">
          <Label>HTML Content</Label>
          <Textarea
            value={config.html ?? ""}
            onChange={(e) => set("html", e.target.value)}
            placeholder="<div>Your custom HTML here...</div>"
            className="min-h-[200px] font-mono text-sm"
          />
        </div>
      )

    default:
      return (
        <p className="text-sm text-muted-foreground">No configuration available for this section type.</p>
      )
  }
}

// ── Banner Config Form ──

function BannerConfigForm({
  config,
  onChange,
}: {
  config: SectionConfig
  onChange: (cfg: SectionConfig) => void
}) {
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
            onClick={() => {
              set("bannerMode", "slider")
              if (selectedIds.length > 1) {
                set("selectedBannerIds", [selectedIds[0]])
              }
            }}
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
            onClick={() => {
              set("bannerMode", "single")
              if (selectedIds.length > 1) {
                set("selectedBannerIds", [selectedIds[0]])
              }
            }}
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search banners..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-8 text-xs"
        />
      </div>

      {/* Banner list */}
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

      <p className="text-[10px] text-muted-foreground">
        {mode === "slider" ? `${selectedIds.length} banner(s) selected for slider` : selectedIds.length > 0 ? "1 banner selected" : "No banner selected"}
      </p>
    </div>
  )
}

// ── Bento Grid layout patterns ──

const BENTO_LAYOUTS = [
  {
    value: "featured-large",
    label: "Featured + Side",
    description: "One large cell left, two small cells stacked right",
    cells: 3,
    preview: (
      <div className="flex gap-1 h-12 w-full">
        <div className="flex-1 bg-pink-300 rounded" />
        <div className="flex flex-col gap-1 w-1/3">
          <div className="flex-1 bg-pink-200 rounded" />
          <div className="flex-1 bg-pink-200 rounded" />
        </div>
      </div>
    ),
  },
  {
    value: "featured-wide",
    label: "Wide Top + Bottom",
    description: "One wide cell on top, two cells below",
    cells: 3,
    preview: (
      <div className="flex flex-col gap-1 h-12 w-full">
        <div className="flex-1 bg-pink-300 rounded" />
        <div className="flex gap-1 flex-1">
          <div className="flex-1 bg-pink-200 rounded" />
          <div className="flex-1 bg-pink-200 rounded" />
        </div>
      </div>
    ),
  },
  {
    value: "two-col",
    label: "Two Columns",
    description: "Two equal columns",
    cells: 2,
    preview: (
      <div className="flex gap-1 h-12 w-full">
        <div className="flex-1 bg-pink-300 rounded" />
        <div className="flex-1 bg-pink-200 rounded" />
      </div>
    ),
  },
  {
    value: "three-col",
    label: "Three Columns",
    description: "Three equal columns",
    cells: 3,
    preview: (
      <div className="flex gap-1 h-12 w-full">
        <div className="flex-1 bg-pink-300 rounded" />
        <div className="flex-1 bg-pink-200 rounded" />
        <div className="flex-1 bg-pink-100 rounded" />
      </div>
    ),
  },
  {
    value: "four-col",
    label: "Four Grid",
    description: "2×2 grid of four cells",
    cells: 4,
    preview: (
      <div className="grid grid-cols-2 gap-1 h-12 w-full">
        <div className="bg-pink-300 rounded" />
        <div className="bg-pink-200 rounded" />
        <div className="bg-pink-200 rounded" />
        <div className="bg-pink-300 rounded" />
      </div>
    ),
  },
]

// ── Bento Grid Config Form ──

function BentoGridConfigForm({
  config,
  onChange,
}: {
  config: SectionConfig
  onChange: (cfg: SectionConfig) => void
}) {
  const set = (k: string, v: unknown) => onChange({ ...config, [k]: v })
  const layout = (config.layout as string) || "featured-large"
  const layoutMeta = BENTO_LAYOUTS.find((l) => l.value === layout) ?? BENTO_LAYOUTS[0]
  const cells = (config.cells as BentoCell[] | undefined) ?? []

  const setCell = (i: number, key: string, value: string) => {
    const updated = [...cells]
    if (!updated[i]) {
      updated[i] = { ...EMPTY_CELL }
    }
    updated[i] = { ...updated[i], [key]: value }
    set("cells", updated)
  }

  const cellCountChanged = (newLayout: string) => {
    const meta = BENTO_LAYOUTS.find((l) => l.value === newLayout)
    if (!meta) return
    const newCells: BentoCell[] = Array.from({ length: meta.cells }, (_, i) =>
      cells[i] || { ...EMPTY_CELL },
    )
    onChange({ ...config, layout: newLayout, cells: newCells })
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

      {/* Cell editors */}
      <div className="space-y-3 border-t pt-3">
        <Label className="text-sm">
          {layoutMeta.label} — {layoutMeta.cells} Cell{layoutMeta.cells > 1 ? "s" : ""}
        </Label>
        {Array.from({ length: layoutMeta.cells }, (_, i) => (
          <BentoCellEditor
            key={i}
            index={i}
            cell={cells[i] ?? { ...EMPTY_CELL }}
            onChange={(key, value) => setCell(i, key, value)}
          />
        ))}
      </div>
    </div>
  )
}

const EMPTY_CELL: BentoCell = { image: "", title: "", subtitle: "", linkType: "none", linkTarget: "", linkExternalUrl: "", productId: "" }

interface BentoCell {
  image: string
  title: string
  subtitle: string
  linkType: string
  linkTarget: string
  linkExternalUrl: string
  productId?: string
}

function BentoCellEditor({
  index,
  cell,
  onChange,
}: {
  index: number
  cell: BentoCell
  onChange: (key: string, value: string) => void
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) {
      setProducts([])
      return
    }
    setLoadingProducts(true)
    try {
      const res = await api.post<Product[]>("/api/admin/product/view", { name: q, limit: 10 })
      setProducts(res ?? [])
    } catch {
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  const selectProduct = (product: Product) => {
    onChange("productId", product._id ?? "")
    onChange("image", product.image || product.images?.[0] || "")
    onChange("title", product.name || "")
    onChange("subtitle", product.discount_price ? `₹${product.discount_price}` : product.price ? `₹${product.price}` : "")
    onChange("linkType", "none")
    onChange("linkTarget", "")
    onChange("linkExternalUrl", "")
    setSearchOpen(false)
    setSearchTerm(product.name || "")
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchProducts(val), 300)
  }

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-muted/20">
      <p className="text-xs font-medium text-muted-foreground">Cell {index + 1}</p>

      {/* Product search */}
      <div ref={searchRef} className="relative">
        <div className="flex gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchTerm.trim() && searchProducts(searchTerm)}
              className="text-xs pl-7"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              setSearchOpen(!searchOpen)
              if (!searchOpen && searchTerm.trim()) searchProducts(searchTerm)
            }}
            title="Toggle product list"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
          </Button>
        </div>

        {searchOpen && (
          <div className="absolute z-20 mt-1 w-full bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                {searchTerm.trim() ? "No products found" : "Type to search products"}
              </p>
            ) : (
              products.map((p: Product) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => selectProduct(p)}
                  className={`w-full flex items-center gap-2 p-2 text-left hover:bg-muted transition-colors text-xs ${
                    cell.productId === p._id ? "bg-primary/5" : ""
                  }`}
                >
                  {p.image || p.images?.[0] ? (
                    <img
                      src={p.image || p.images?.[0]}
                      alt={p.name}
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.discount_price ? `₹${p.discount_price}` : p.price ? `₹${p.price}` : ""}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <Input
        placeholder="Image URL"
        value={cell.image}
        onChange={(e) => onChange("image", e.target.value)}
        className="text-xs"
      />
      <Input
        placeholder="Title"
        value={cell.title}
        onChange={(e) => onChange("title", e.target.value)}
        className="text-xs"
      />
      <Input
        placeholder="Subtitle"
        value={cell.subtitle}
        onChange={(e) => onChange("subtitle", e.target.value)}
        className="text-xs"
      />
      <div className="flex gap-2">
        <Select
          value={cell.linkType}
          onValueChange={(v) => {
            onChange("linkType", v)
            if (v !== "external") onChange("linkExternalUrl", "")
            if (v === "external") onChange("linkTarget", "")
          }}
        >
          <SelectTrigger className="text-xs">
            <SelectValue placeholder="No link" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No link</SelectItem>
            <SelectItem value="category">Category</SelectItem>
            <SelectItem value="external">External</SelectItem>
          </SelectContent>
        </Select>
        {cell.linkType && cell.linkType !== "none" && cell.linkType !== "external" && (
          <Input
            placeholder="Target ID or slug"
            value={cell.linkTarget}
            onChange={(e) => onChange("linkTarget", e.target.value)}
            className="text-xs flex-1"
          />
        )}
        {cell.linkType === "external" && (
          <Input
            placeholder="https://..."
            value={cell.linkExternalUrl}
            onChange={(e) => onChange("linkExternalUrl", e.target.value)}
            className="text-xs flex-1"
          />
        )}
      </div>
    </div>
  )
}

// ── Home Page Preview ──

function PreviewDialog({
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
      {/* Preview toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Home Page Preview</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {visible.length} section{visible.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Device switcher */}
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

      {/* Scrollable preview area */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-8">
        <div
          className={`mx-auto bg-white ${deviceWidths[device]} ${deviceFrames[device]} shadow-xl overflow-hidden transition-all duration-300 min-h-[600px]`}
        >
          {visible.length > 0 ? (
            <div className="divide-y divide-gray-100">
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
      {/* Section index badge */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-50 border-b border-gray-100">
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

      {/* Visual preview */}
      <div className="p-4 bg-white">
        <SectionPreviewContent type={section.type} config={cfg} />
      </div>
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
          <div className="text-center text-white relative z-10">
            {selectedIds.length > 0 ? (
              <>
                <LayoutGrid className="h-5 w-5 mx-auto mb-1" />
                <p className="text-sm font-semibold tracking-tight">
                  {bannerMode === "slider" ? "Banner Slider" : "Single Banner"}
                </p>
                <p className="text-xs text-white/70 mt-1">
                  {selectedIds.length} banner{selectedIds.length > 1 ? "s" : ""} selected
                </p>
              </>
            ) : (
              <>
                <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-80" />
                <p className="text-sm font-semibold tracking-tight">
                  {bannerMode === "slider" ? "Banner Slider" : "Single Banner"}
                </p>
                <p className="text-xs text-white/70 mt-1">No banners selected yet</p>
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
            <p className="text-sm font-medium text-center text-gray-700">{config.heading}</p>
          )}
          <div className="flex justify-center gap-4">
            {["Ring", "Earring", "Necklace", "Bracelet"].map((cat) => (
              <div key={cat} className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 ring-2 ring-emerald-100 flex items-center justify-center">
                  <span className="text-lg">{["💍", "✨", "📿", "💎"][cat === "Ring" ? 0 : cat === "Earring" ? 1 : cat === "Necklace" ? 2 : 3]}</span>
                </div>
                <span className="text-[10px] text-gray-500">{cat}</span>
              </div>
            ))}
          </div>
        </div>
      )

    case "category-grid":
      return (
        <div className="grid grid-cols-2 gap-3 h-32">
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm font-medium">
            {config.heading || "Men"}
          </div>
          <div className="bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg flex items-center justify-center text-white text-sm font-medium">
            {config.heading || "Women"}
          </div>
        </div>
      )

    case "product-slider":
      return (
        <div className="space-y-3">
          {config.heading && (
            <p className="text-sm font-medium text-gray-700">{config.heading}</p>
          )}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-28 space-y-2">
                <div className="h-28 bg-gradient-to-b from-amber-100 to-amber-50 rounded-lg border border-amber-100 flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-amber-300" />
                </div>
                <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto" />
                <div className="h-2 bg-gray-200 rounded w-1/2 mx-auto" />
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
            <p className="text-sm font-medium text-gray-700">{config.heading}</p>
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
          {config.heading && (
            <p className="text-sm font-medium text-center text-gray-700">{config.heading}</p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "🛡️", label: "Quality" },
              { icon: "🚚", label: "Free Shipping" },
              { icon: "💯", label: "100% Original" },
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
          {config.heading && (
            <p className="text-sm font-medium text-center text-gray-700">{config.heading}</p>
          )}
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
      const cells = (config.cells as { image?: string; title?: string }[] | undefined) ?? []
      const layoutMeta = BENTO_LAYOUTS.find((l) => l.value === layout)
      return (
        <div className="space-y-2">
          {config.heading && (
            <p className="text-sm font-medium text-center text-gray-700">{config.heading}</p>
          )}
          <div className="flex gap-1.5">
            {layoutMeta &&
              Array.from({ length: layoutMeta.cells }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-12 rounded-lg bg-gradient-to-b from-pink-200 to-pink-100 flex items-center justify-center ${
                    layout === "featured-large" && i === 0 ? "flex-[2]" : ""
                  } ${layout === "featured-wide" && i === 0 ? "h-12" : ""}`}
                >
                  {cells[i]?.title ? (
                    <span className="text-[8px] text-pink-600 font-medium truncate px-1">
                      {cells[i]?.title}
                    </span>
                  ) : (
                    <ImageIcon className="h-4 w-4 text-pink-300" />
                  )}
                </div>
              ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Layout: {layoutMeta?.label || layout} · {layoutMeta?.cells || 0} cells
          </p>
        </div>
      )
    }

    case "video-banner":
      return (
        <div className="bg-gradient-to-r from-cyan-500 to-sky-500 rounded-lg p-6 flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.2),transparent_60%)]" />
          <Film className="h-6 w-6 mb-2 relative z-10" />
          <p className="text-sm font-semibold relative z-10">
            {config.heading || "Promo Banner"}
          </p>
          {config.subtitle && (
            <p className="text-xs text-white/70 mt-1 relative z-10">{config.subtitle}</p>
          )}
          {config.buttonText && (
            <div className="mt-2 px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium relative z-10">
              {config.buttonText}
            </div>
          )}
        </div>
      )

    case "custom":
      return (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
          <Code2 className="h-6 w-6 mx-auto mb-1 text-gray-300" />
          <p className="text-xs text-muted-foreground">Custom HTML Section</p>
          {config.html && (
            <div className="mt-2 max-h-16 overflow-hidden relative">
              <div className="text-[10px] text-gray-400 font-mono bg-gray-50 rounded p-2 text-left line-clamp-3">
                {config.html.slice(0, 200)}
              </div>
            </div>
          )}
        </div>
      )

    default:
      return (
        <div className="h-16 bg-gray-50 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
          Preview not available
        </div>
      )
  }
}

// ── Main page component ──

export default function HomePagePage() {
  const [sections, setSections] = useState<HomeSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Edit state
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null)
  const [editType, setEditType] = useState<string>("banner")
  const [editConfig, setEditConfig] = useState<SectionConfig>({})

  // Add new section state
  const [addType, setAddType] = useState<string>("round-categories")
  const [addConfig, setAddConfig] = useState<SectionConfig>({})

  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const loadSections = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get<{ sections: HomeSection[] }>("/api/admin/home-page")
      const data = (response?.sections ?? []) as HomeSection[]
      setSections(data.sort((a: HomeSection, b: HomeSection) => a.order - b.order))
    } catch (error) {
      toast({
        title: "Error loading sections",
        description: error instanceof ApiClientError ? error.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSections()
  }, [loadSections])

  // ── Drag reorder ──

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSections((prev) => {
      const oldIdx = prev.findIndex((s) => s._id === active.id)
      const newIdx = prev.findIndex((s) => s._id === over.id)
      if (oldIdx === -1 || newIdx === -1) return prev
      const reordered = arrayMove(prev, oldIdx, newIdx)
      // Enforce banner always first
      const bannerIdx = reordered.findIndex((s) => s.type === "banner")
      if (bannerIdx > 0) {
        const removed = reordered.splice(bannerIdx, 1)
        if (removed.length > 0) reordered.unshift(removed[0])
        toast({ title: "Banner section must stay first — moved back to top." })
      }
      return reordered
    })
  }

  // ── Toggle hidden ──

  const handleToggle = (section: HomeSection) => {
    setSections((prev) =>
      prev.map((s) =>
        s._id === section._id
          ? {
              ...s,
              config: { ...(s.config || ({} as SectionConfig)), hidden: !(s.config?.hidden ?? false) },
            }
          : s,
      ),
    )
  }

  // ── Edit section ──

  const handleEdit = (section: HomeSection) => {
    setEditingSection(section)
    setEditType(section.type)
    setEditConfig({ ...section.config })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    setSections((prev) =>
      prev.map((s) =>
        s._id === editingSection!._id
          ? { ...s, type: editType, config: editConfig }
          : s,
      ),
    )
    setEditDialogOpen(false)
    setEditingSection(null)
    toast({ title: "Section updated locally. Don't forget to save all changes." })
  }

  // ── Add section ──

  const handleAddSection = () => {
    const meta = getTypeMeta(addType)
    const newSection: HomeSection = {
      _id: generateObjectId(),
      type: addType,
      config: addConfig.heading !== undefined ? addConfig : { ...meta.defaults.config },
      order: sections.length,
    }
    setSections((prev) => [...prev, newSection])
    setAddDialogOpen(false)
    setAddType("round-categories")
    setAddConfig({})
    toast({ title: `Added "${meta.label}" section. Don't forget to save all changes.` })
  }

  // ── Delete section ──

  const handleDelete = (id: string) => {
    setSections((prev) => prev.filter((s) => s._id !== id))
    toast({ title: "Section removed locally. Don't forget to save all changes." })
  }

  // ── Save all ──

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      const ordered = sections.map((s, i) => ({
        ...s,
        order: i,
      }))

      await api.put("/api/admin/home-page", { sections: ordered })
      toast({ title: "Home page saved successfully!" })
      await loadSections()
    } catch (error) {
      toast({
        title: "Error saving home page",
        description: error instanceof ApiClientError ? error.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // ── Preview state ──
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop")

  // ── Render ──

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Home Page Sections</h1>
          <p className="text-muted-foreground mt-1">
            Drag to reorder. Banner section is always first. Click Save All to persist changes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddDialogOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
          <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
            <Monitor className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSaveAll} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All
          </Button>
        </div>
      </div>

      {/* Unsaved changes indicator */}
      <UnsavedIndicator sections={sections} />

      {/* Section list */}
      {sections.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={sections.map((s) => s._id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sections.map((section) => (
                <SortableSection
                  key={section._id}
                  section={section}
                  index={sections.findIndex((s) => s._id === section._id)}
                  onEdit={handleEdit}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No sections yet</p>
          <p className="text-sm mt-1">
            Click Add Section to start building your home page. While no sections exist, the store will show the default layout.
          </p>
        </div>
      )}

      {/* ── Edit Dialog ── */}
      {editDialogOpen && editingSection && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Edit Section</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Section Type</Label>
                {editingSection.type === "banner" ? (
                  <p className="text-sm text-muted-foreground italic">Banner (type locked)</p>
                ) : (
                  <Select value={editType} onValueChange={setEditType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTION_TYPES.filter((t) => t.value !== "banner").map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="border-t pt-4">
                <Label className="mb-3 block">Configuration</Label>
                <SectionConfigForm
                  type={editingSection.type === "banner" ? "banner" : editType}
                  config={editConfig}
                  onChange={setEditConfig}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEditDialogOpen(false)
                    setEditingSection(null)
                  }}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview Dialog ── */}
      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        sections={sections}
        device={previewDevice}
        onDeviceChange={setPreviewDevice}
      />

      {/* ── Add Section Dialog ── */}
      {addDialogOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Add Section</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Section Type</Label>
                <Select value={addType} onValueChange={(v) => setAddType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.filter((t) => t.value !== "banner").map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" />
                          {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {getTypeMeta(addType).description}
                </p>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-3 block">Configuration</Label>
                <SectionConfigForm
                  type={addType}
                  config={addConfig}
                  onChange={setAddConfig}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setAddDialogOpen(false)
                    setAddType("round-categories")
                    setAddConfig({})
                  }}
                >
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleAddSection}>
                  Add Section
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
