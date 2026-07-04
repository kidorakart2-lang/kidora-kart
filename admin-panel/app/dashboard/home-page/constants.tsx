import React from "react"
import {
  Grid3X3,
  ImageIcon,
  LayoutGrid,
  ShoppingBag,
  Sparkles,
  MessageSquareQuote,
  Film,
  Code2,
  CircleDollarSign,
  Tag,
  Circle,
  Square,
} from "lucide-react"
import type { HomeSection } from "./types"

// ── Section type definitions ──

export const SECTION_TYPES = [
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
    icon: Circle,
    color: "bg-emerald-100 text-emerald-700",
    defaults: { config: { heading: "Discover Our Collection" }, title: "Round Categories" },
  },
  {
    value: "square-categories",
    label: "Square Categories",
    description: "Square category image carousel",
    icon: Square,
    color: "bg-emerald-100 text-emerald-700",
    defaults: { config: { heading: "Discover Our Collection" }, title: "Square Categories" },
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
    defaults: { config: { heading: "Shop by Price" }, title: "Shop by Price" },
  },
  {
    value: "why-choose-us",
    label: "Why Choose Us",
    description: "Feature cards with icons",
    icon: Sparkles,
    color: "bg-indigo-100 text-indigo-700",
    defaults: { config: {}, title: "Why Choose Us" },
  },
  {
    value: "testimonial",
    label: "Testimonials",
    description: "Customer review carousel",
    icon: MessageSquareQuote,
    color: "bg-orange-100 text-orange-700",
    defaults: { config: {}, title: "Testimonials" },
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
    value: "promo-banner",
    label: "Promo Banner",
    description: "Full-width promotional banner with CTA and background image selection",
    icon: ImageIcon,
    color: "bg-cyan-100 text-cyan-700",
    defaults: { config: { heading: "New Trending Collection", buttonText: "View" }, title: "Promo Banner" },
  },
  {
    value: "video",
    label: "Video",
    description: "Full-width video banner with CTA",
    icon: Film,
    color: "bg-violet-100 text-violet-700",
    defaults: { config: { heading: "New Trending Collection", subtitle: "We Believe that Good Design is Always in Season", buttonText: "Shop Now", buttonUrl: "/category/new-arrivals", videoUrl: "" }, title: "Video Section" },
  },
  {
    value: "custom",
    label: "Custom HTML",
    description: "Custom HTML content",
    icon: Code2,
    color: "bg-slate-100 text-slate-700",
    defaults: { config: { html: "" }, title: "Custom Section" },
  },
]

export function getTypeMeta(type: string) {
  return SECTION_TYPES.find((t) => t.value === type) ?? SECTION_TYPES[0]
}

export function getSectionTitle(section: HomeSection): string {
  const meta = getTypeMeta(section.type)
  return section.config?.heading || meta.defaults.title
}

// ── Bento Grid layout patterns ──

export const BENTO_LAYOUTS = [
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

// ── Source types for bento grid cells ──

export const BENTO_SOURCE_TYPES = [
  { value: "product", label: "Product" },
  { value: "category", label: "Category" },
  { value: "subCategory", label: "Sub Category" },
  { value: "subSubCategory", label: "Sub Sub Category" },
  { value: "banner", label: "Banner" },
]

export const EMPTY_CELL = {
  image: "",
  title: "",
  subtitle: "",
  linkType: "none" as const,
  linkTarget: "",
  linkExternalUrl: "",
  sourceId: "",
  sourceType: "product",
}
