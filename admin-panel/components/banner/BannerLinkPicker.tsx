"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LinkOption } from "@/lib/types";

interface BannerLinkPickerProps {
  linkType: string;
  linkTarget: string;
  linkExternalUrl: string;
  productSearch: string;
  selectedCategoryId: string;
  selectedSubCategoryId: string;
  linkOptions: { products: LinkOption[]; categories: LinkOption[]; subCategories: LinkOption[]; subSubCategories: LinkOption[] };
  onLinkTypeChange: (value: string) => void;
  onLinkTargetChange: (value: string) => void;
  onExternalUrlChange: (value: string) => void;
  onProductSearchChange: (value: string) => void;
  onCategoryIdChange: (value: string) => void;
  onSubCategoryIdChange: (value: string) => void;
}

function RadioPicker({ items, selected, onChange, labelKey }: {
  items: LinkOption[];
  selected: string;
  onChange: (id: string) => void;
  labelKey: "name" | "slug";
}) {
  return (
    <div className="max-h-36 overflow-y-auto border rounded-md p-1 space-y-0.5">
      {items.map((item) => (
        <label key={item._id} className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${selected === item._id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}>
          <input type="radio" name="linkTarget" checked={selected === item._id} onChange={() => onChange(item._id)} className="accent-primary" />
          <span className="truncate">{item.name}</span>
          {labelKey === "slug" && <span className="text-xs text-muted-foreground ml-auto">/{item.slug}</span>}
        </label>
      ))}
      {items.length === 0 && <p className="text-sm text-muted-foreground p-2">No items found</p>}
    </div>
  );
}

export default function BannerLinkPicker({
  linkType, linkTarget, linkExternalUrl, productSearch,
  selectedCategoryId, selectedSubCategoryId, linkOptions,
  onLinkTypeChange, onLinkTargetChange, onExternalUrlChange,
  onProductSearchChange, onCategoryIdChange, onSubCategoryIdChange,
}: BannerLinkPickerProps) {
  return (
    <div className="space-y-3 animate-in slide-in-from-right duration-300 delay-50 border rounded-lg p-4 bg-muted/30">
      <Label className="text-sm font-semibold">Link Target (optional)</Label>

      <Select value={linkType} onValueChange={onLinkTypeChange}>
        <SelectTrigger><SelectValue placeholder="No link" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="No Link">No link</SelectItem>
          <SelectItem value="product">Product</SelectItem>
          <SelectItem value="category">Category</SelectItem>
          <SelectItem value="subCategory">Sub Category</SelectItem>
          <SelectItem value="subSubCategory">Sub Sub Category</SelectItem>
          <SelectItem value="external">External URL</SelectItem>
        </SelectContent>
      </Select>

      {linkType === "product" && (
        <div className="space-y-2">
          <Label>Select Product</Label>
          <Input placeholder="Search products..." value={productSearch} onChange={(e) => onProductSearchChange(e.target.value)} />
          <RadioPicker
            items={linkOptions.products.filter((p) => {
              const q = productSearch.toLowerCase();
              return !q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
            }).slice(0, 30)}
            selected={linkTarget}
            onChange={onLinkTargetChange}
            labelKey="slug"
          />
        </div>
      )}

      {linkType === "category" && (
        <div className="space-y-2">
          <Label>Select Category</Label>
          <RadioPicker items={linkOptions.categories} selected={linkTarget} onChange={onLinkTargetChange} labelKey="name" />
        </div>
      )}

      {linkType === "subCategory" && (
        <div className="space-y-2">
          <Label>Select Category</Label>
          <Select value={selectedCategoryId} onValueChange={(v) => { onCategoryIdChange(v); onLinkTargetChange(""); }}>
            <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
            <SelectContent>
              {linkOptions.categories.map((c) => (<SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
          {selectedCategoryId && (
            <>
              <Label>Select Sub Category</Label>
              <RadioPicker items={linkOptions.subCategories} selected={linkTarget} onChange={onLinkTargetChange} labelKey="name" />
            </>
          )}
        </div>
      )}

      {linkType === "subSubCategory" && (
        <div className="space-y-2">
          <Label>Select Category</Label>
          <Select value={selectedCategoryId} onValueChange={(v) => { onCategoryIdChange(v); onLinkTargetChange(""); onSubCategoryIdChange(""); }}>
            <SelectTrigger><SelectValue placeholder="Choose a category" /></SelectTrigger>
            <SelectContent>
              {linkOptions.categories.map((c) => (<SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
          {selectedCategoryId && (
            <>
              <Label>Select Sub Category</Label>
              <Select value={selectedSubCategoryId} onValueChange={(v) => { onSubCategoryIdChange(v); onLinkTargetChange(""); }}>
                <SelectTrigger><SelectValue placeholder="Choose a sub category" /></SelectTrigger>
                <SelectContent>
                  {linkOptions.subCategories.map((sc) => (<SelectItem key={sc._id} value={sc._id}>{sc.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </>
          )}
          {selectedSubCategoryId && (
            <>
              <Label>Select Sub Sub Category</Label>
              <RadioPicker items={linkOptions.subSubCategories} selected={linkTarget} onChange={onLinkTargetChange} labelKey="name" />
            </>
          )}
        </div>
      )}

      {linkType === "external" && (
        <div className="space-y-2">
          <Label htmlFor="externalUrl">External URL</Label>
          <Input id="externalUrl" type="url" placeholder="https://example.com" value={linkExternalUrl} onChange={(e) => onExternalUrlChange(e.target.value)} />
        </div>
      )}
    </div>
  );
}
