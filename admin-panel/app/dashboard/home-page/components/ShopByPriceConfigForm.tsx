"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import type { SectionConfig } from "../types"

interface PriceRange {
  label: string
  min: number
  max: number
}

interface Props {
  config: SectionConfig
  onChange: (cfg: SectionConfig) => void
}

const DEFAULT_RANGES: PriceRange[] = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 - ₹1K", min: 500, max: 1000 },
  { label: "₹1K - ₹5K", min: 1000, max: 5000 },
  { label: "₹5K+", min: 5000, max: 999999 },
]

function generateLabel(min: number, max: number): string {
  if (min === 0) return `Under ₹${max.toLocaleString("en-IN")}`
  if (max >= 999999) return `₹${min.toLocaleString("en-IN")}+`
  return `₹${min.toLocaleString("en-IN")} - ₹${max.toLocaleString("en-IN")}`
}

export default function ShopByPriceConfigForm({ config, onChange }: Props) {
  const set = (key: string, value: unknown) => onChange({ ...config, [key]: value })
  const heading = config.heading ?? ""
  const ranges: PriceRange[] = Array.isArray(config.ranges) ? (config.ranges as PriceRange[]) : []

  const updateRange = (index: number, field: keyof PriceRange, value: string) => {
    const updated = [...ranges]
    if (field === "label") {
      updated[index] = { ...updated[index], label: value }
    } else {
      const num = Number(value)
      if (isNaN(num)) return
      updated[index] = { ...updated[index], [field]: num }
      // Auto-generate label when min or max changes
      const label = generateLabel(
        field === "min" ? num : updated[index].min,
        field === "max" ? num : updated[index].max,
      )
      updated[index] = { ...updated[index], label }
    }
    set("ranges", updated)
  }

  const addRange = () => {
    const last = ranges[ranges.length - 1]
    const nextMin = last ? last.max : 0
    const nextMax = nextMin + 1000
    const updated = [...ranges, { label: generateLabel(nextMin, nextMax), min: nextMin, max: nextMax }]
    set("ranges", updated)
  }

  const removeRange = (index: number) => {
    const updated = ranges.filter((_, i) => i !== index)
    set("ranges", updated)
  }

  const setDefaults = () => {
    set("ranges", DEFAULT_RANGES)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Heading</Label>
        <Input
          value={heading}
          onChange={(e) => set("heading", e.target.value)}
          placeholder="e.g. Shop by Price"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Price Ranges</Label>
          {ranges.length === 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground hover:text-foreground"
              onClick={setDefaults}
            >
              Use defaults
            </Button>
          )}
        </div>

        {ranges.length === 0 ? (
          <div className="border rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-2">
              No price ranges defined. Add ranges or use defaults.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={addRange}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Range
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {ranges.map((range, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Label</Label>
                      <Input
                        value={range.label}
                        onChange={(e) => updateRange(index, "label", e.target.value)}
                        className="h-7 text-xs"
                        placeholder="e.g. Under ₹500"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Min (₹)</Label>
                      <Input
                        type="number"
                        value={range.min}
                        onChange={(e) => updateRange(index, "min", e.target.value)}
                        className="h-7 text-xs"
                        min={0}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Max (₹)</Label>
                      <Input
                        type="number"
                        value={range.max}
                        onChange={(e) => updateRange(index, "max", e.target.value)}
                        className="h-7 text-xs"
                        min={0}
                      />
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive mt-5"
                  onClick={() => removeRange(index)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={addRange}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Range
            </Button>
          </div>
        )}
      </div>

      {ranges.length > 0 && (
        <p className="text-[10px] text-muted-foreground">
          {ranges.length} price range(s) configured.
          {ranges.some((r) => !r.label?.trim()) && (
            <span className="text-destructive ml-1">Some ranges are missing a label.</span>
          )}
        </p>
      )}
    </div>
  )
}
