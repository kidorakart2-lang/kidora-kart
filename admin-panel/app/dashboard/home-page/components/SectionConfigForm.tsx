"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SectionConfig } from "../types"
import BannerConfigForm from "./BannerConfigForm"
import CategoryGridConfigForm from "./CategoryGridConfigForm"
import PromoBannerConfigForm from "./PromoBannerConfigForm"
import VideoConfigForm from "./VideoConfigForm"
import BentoGridConfigForm from "./BentoGridConfigForm"

interface Props {
  type: string
  config: SectionConfig
  onChange: (cfg: SectionConfig) => void
}

export default function SectionConfigForm({ type, config, onChange }: Props) {
  const set = (key: string, value: unknown) => onChange({ ...config, [key]: value })

  switch (type) {
    case "banner":
      return <BannerConfigForm config={config} onChange={onChange} />

    case "round-categories":
    case "square-categories":
    case "shop-by-price":
      return (
        <div className="space-y-2">
          <Label>Heading</Label>
          <Input
            value={config.heading ?? ""}
            onChange={(e) => set("heading", e.target.value)}
            placeholder="e.g. Discover Our Collection"
          />
        </div>
      )

    case "category-grid":
      return <CategoryGridConfigForm config={config} onChange={onChange} />

    case "why-choose-us":
    case "testimonial":
      return (
        <p className="text-sm text-muted-foreground">
          This section renders content automatically. No configuration needed.
        </p>
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

    case "promo-banner":
      return <PromoBannerConfigForm config={config} onChange={onChange} />

    case "video":
      return <VideoConfigForm config={config} onChange={onChange} />

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
