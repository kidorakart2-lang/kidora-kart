"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import NewMultiSelect from "../NewMultiSelect";
import TagsInput from "../TagsInput";
import AiAssistButton from "@/components/ai-assist-button";
import { Cloud, ChevronDown, X, Sparkles, Loader2 } from "lucide-react";
import type { ProductFormData, BooleanKeys } from "@/lib/types";
import { AGE_OPTIONS } from "@/lib/products-api";

interface ProductFormProps {
  formData: ProductFormData;
  setFormData: (d: ProductFormData | ((prev: ProductFormData) => ProductFormData)) => void;
  selectedCategory: string[];
  setSelectedCategory: (v: string[]) => void;
  selectedSubCategory: string[];
  setSelectedSubCategory: (v: string[]) => void;
  selectedSubSubCategory: string[];
  setSelectedSubSubCategory: (v: string[]) => void;
  selectedColors: string[];
  setSelectedColors: (v: string[]) => void;
  selectedMaterials: string[];
  setSelectedMaterials: (v: string[]) => void;
  removeImagesUrl: string[];
  toggleRemoveImagesUrl: (url: string) => void;
  categories: { _id: string; name: string }[];
  subCategories: { _id: string; name: string }[];
  subSubCategories: { _id: string; name: string }[];
  colors: { _id: string; name: string; code: string }[];
  materials: { _id: string; name: string }[];
  tagLoading: boolean;
  handleAutoTag: () => void;
  handleMainImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAdditionalImageChange: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  removeMainImage: () => void;
  removeAdditionalImage: (index: number) => void;
  isMobile: boolean;
  isSaving: boolean;
  editingProduct: boolean;
  closeDrawer: () => void;
  handleSubmit: (e: React.FormEvent) => void;
}

const TOGGLES: { id: BooleanKeys; label: string }[] = [
  { id: "isFeatured", label: "Featured" },
  { id: "isNewArrival", label: "New Arrival" },
  { id: "isBestSeller", label: "Best Seller" },
  { id: "isTopRated", label: "Top Rated" },
  { id: "isUpsell", label: "Upsell" },
  { id: "isOnSale", label: "On Sale" },
  { id: "isPersonalized", label: "Personalized" },
  { id: "isGift", label: "Gift" },
];

function FormSection({ title, defaultOpen, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <>
      <Collapsible defaultOpen={defaultOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left group">
          <h3 className="text-lg font-medium">{title}</h3>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </Collapsible>
      <Separator />
    </>
  );
}

export default function ProductForm({
  formData, setFormData,
  selectedCategory, setSelectedCategory,
  selectedSubCategory, setSelectedSubCategory,
  selectedSubSubCategory, setSelectedSubSubCategory,
  selectedColors, setSelectedColors,
  selectedMaterials, setSelectedMaterials,
  removeImagesUrl, toggleRemoveImagesUrl,
  categories, subCategories, subSubCategories, colors, materials,
  tagLoading, handleAutoTag,
  handleMainImageChange, handleAdditionalImageChange,
  removeMainImage, removeAdditionalImage,
  isMobile, isSaving, editingProduct, closeDrawer, handleSubmit,
}: ProductFormProps) {
  const u = (val: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [val]: e.target.value });

  return (
    <form onSubmit={handleSubmit} className="space-y-0">
      {/* Section 1: Basic Information */}
      <FormSection title="Basic Information" defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" value={formData.name} onChange={u("name")} placeholder="Enter product name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
            <Input type="number" id="price" value={formData.price} onChange={u("price")} placeholder="Enter price" min="0" step="0.01" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount_price">Discount Price *</Label>
            <Input type="number" id="discount_price" value={formData.discount_price} onChange={u("discount_price")} placeholder="Enter discount price" min="0" step="0.01" required />
          </div>
        </div>
      </FormSection>

      {/* Section 2: Description */}
      <FormSection title="Description" defaultOpen={!isMobile}>
        <div className="space-y-2 pb-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="description">Full Description *</Label>
            <AiAssistButton
              context={{
                name: formData.name,
                category: selectedCategory.length ? categories.filter((c) => selectedCategory.includes(c._id)).map((c) => c.name).join(", ") : "",
                material: selectedMaterials.length ? materials.filter((m) => selectedMaterials.includes(m._id)).map((m) => m.name).join(", ") : "",
                type: formData.type, weight: formData.weight, price: formData.price,
              }}
              onResult={(text) => setFormData({ ...formData, description: text })}
            />
          </div>
          <Textarea id="description" value={formData.description} onChange={u("description")} placeholder="Enter full description" className="min-h-[120px]" required />
        </div>
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="shortDescription">Short Description</Label>
            <AiAssistButton
              context={{ name: formData.name, category: selectedCategory.length ? categories.filter((c) => selectedCategory.includes(c._id)).map((c) => c.name).join(", ") : "", material: selectedMaterials.length ? materials.filter((m) => selectedMaterials.includes(m._id)).map((m) => m.name).join(", ") : "", type: formData.type, price: formData.price }}
              onResult={(text) => setFormData({ ...formData, shortDescription: text })}
              label="Generate Short Desc"
              endpoint="/api/admin/ai/generate-short-description"
            />
          </div>
          <p className="text-xs text-muted-foreground">A concise 1-2 sentence summary shown on product cards and search results.</p>
          <Input id="shortDescription" value={formData.shortDescription} onChange={u("shortDescription")} placeholder="e.g. A fun and educational building set for curious young minds" />
        </div>
      </FormSection>

      {/* Section 3: Categories & Tags */}
      <FormSection title="Categories & Tags" defaultOpen={!isMobile}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          <div className="space-y-2">
            <Label>Category *</Label>
            <NewMultiSelect category={categories} categoryId={selectedCategory} setCategoryId={setSelectedCategory} placeholder="Select categories..." />
          </div>
          <div className="space-y-2">
            <Label>Subcategory</Label>
            <NewMultiSelect category={subCategories} categoryId={selectedSubCategory} setCategoryId={setSelectedSubCategory} placeholder="Select subcategories..." disabled={selectedCategory.length === 0} />
          </div>
          <div className="space-y-2">
            <Label>Sub-subcategory</Label>
            <NewMultiSelect category={subSubCategories} categoryId={selectedSubSubCategory} setCategoryId={setSelectedSubSubCategory} placeholder="Select sub-subcategories..." disabled={selectedSubCategory.length === 0} />
          </div>
          <div className="space-y-2">
            <Label>Colors</Label>
            <NewMultiSelect category={colors} categoryId={selectedColors} setCategoryId={setSelectedColors} placeholder="Select colors..." />
          </div>
          <div className="space-y-2">
            <Label>Materials</Label>
            <NewMultiSelect category={materials} categoryId={selectedMaterials} setCategoryId={setSelectedMaterials} placeholder="Select materials..." />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tags</Label>
              <Button type="button" variant="outline" size="sm" disabled={!formData.name || tagLoading} onClick={handleAutoTag} className="gap-2">
                {tagLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {tagLoading ? "Generating..." : "Auto-tag with AI"}
              </Button>
            </div>
            <div className="max-w-md">
              <TagsInput value={formData.tags} onChange={(tags) => setFormData({ ...formData, tags })} placeholder="Type a tag and press Enter" label="Product Tags" />
            </div>
          </div>
        </div>
      </FormSection>

      {/* Section 4: Dimensions */}
      <FormSection title="Dimensions" defaultOpen={!isMobile}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (g) *</Label>
            <Input id="weight" value={formData.weight} onChange={u("weight")} placeholder="e.g. 15" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="length">Length (cm)</Label>
            <Input type="number" id="length" value={formData.length} onChange={u("length")} placeholder="e.g. 25" min="0" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height (cm)</Label>
            <Input type="number" id="height" value={formData.height} onChange={u("height")} placeholder="e.g. 15" min="0" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="breadth">Breadth (cm)</Label>
            <Input type="number" id="breadth" value={formData.breadth} onChange={u("breadth")} placeholder="e.g. 10" min="0" step="0.1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" value={formData.sku} onChange={u("sku")} placeholder="e.g. TOY-001" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Input id="type" value={formData.type} onChange={u("type")} placeholder="e.g. Educational, Puzzle, Outdoor" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input id="videoUrl" value={formData.videoUrl} onChange={u("videoUrl")} placeholder="e.g. https://youtube.com/watch?v=..." />
            <p className="text-xs text-muted-foreground">YouTube, Vimeo, or direct .mp4 / .webm link</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Stock *</Label>
            <Input type="number" id="stock" value={formData.stock} onChange={u("stock")} placeholder="Enter available stock" min="0" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimated_delivery_time">Estimated Delivery Time *</Label>
            <Input id="estimated_delivery_time" value={formData.estimated_delivery_time} onChange={u("estimated_delivery_time")} placeholder="e.g., 3-5 business days" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order">Display Order</Label>
            <Input type="number" id="order" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} placeholder="Enter display order" min="0" />
          </div>
        </div>
      </FormSection>

      {/* Section 5: Age */}
      <FormSection title="Age" defaultOpen={!isMobile}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
          {(["minimumAge", "idealAge", "maximumAge"] as const).map((field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field}>{field === "minimumAge" ? "Minimum" : field === "idealAge" ? "Ideal" : "Maximum"} Age</Label>
              <Select value={formData[field]} onValueChange={(val) => setFormData({ ...formData, [field]: val })}>
                <SelectTrigger id={field}><SelectValue placeholder={`Select ${field.replace("Age", "")} age`} /></SelectTrigger>
                <SelectContent>
                  {AGE_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </FormSection>

      {/* Section 6: Status Toggles */}
      <FormSection title="Status Toggles" defaultOpen={!isMobile}>
        <div className="space-y-4 pb-4">
          <div className="max-w-xs">
            <Label htmlFor="product-status">Listing Status</Label>
            <Select value={formData.status} onValueChange={(val: "active" | "inactive" | "draft") => setFormData({ ...formData, status: val })}>
              <SelectTrigger id="product-status" className="mt-1"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active — Visible on website</SelectItem>
                <SelectItem value="inactive">Inactive — Hidden from website</SelectItem>
                <SelectItem value="draft">Draft — Not published yet</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOGGLES.map((toggle) => (
              <div key={toggle.id} className="flex items-center space-x-2">
                <Checkbox id={toggle.id} checked={formData[toggle.id] ?? false}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, [toggle.id]: checked })} />
                <Label htmlFor={toggle.id} className="cursor-pointer">{toggle.label}</Label>
              </div>
            ))}
          </div>
        </div>
      </FormSection>

      {/* Section 7: Product Images */}
      <FormSection title="Product Images" defaultOpen={!isMobile}>
        <div className="space-y-6 pb-4">
          <div className="space-y-2">
            <Label>Main Image *</Label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-accent transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Cloud />
                  <p className="mb-2 text-sm text-muted-foreground">Click to upload</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, JPEG</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleMainImageChange} />
              </label>
            </div>
            {formData.mainImagePreview && (
              <div className="relative w-20 h-20">
                <img src={formData.mainImagePreview} alt="Main" className="w-full h-full object-cover rounded" />
                <button type="button" onClick={removeMainImage} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"><X className="w-4 h-4" /></button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Additional Images</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
              {formData.additionalImages?.map((_, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-accent transition">
                    <div className="flex flex-col items-center justify-center"><Cloud /><p className="text-xs text-muted-foreground mt-1">Image {index + 1}</p></div>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAdditionalImageChange(e, index)} />
                  </label>
                  {formData.additionalImagePreviews[index] && (
                    <div className="relative w-16 h-16">
                      <img src={formData.additionalImagePreviews[index]} alt={`Additional ${index + 1}`} className="w-full h-full object-cover rounded" />
                      <button type="button" onClick={() => removeAdditionalImage(index)} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {formData.additionalImagePreviews?.some((url) => url?.startsWith(`https://${process.env.NEXT_PUBLIC_CDN_HOST || "cdn.kidorakart.com"}/`)) && (
            <div className="space-y-2">
              <Label>Images to Remove</Label>
              <div className="flex flex-col space-y-2">
                {formData.additionalImagePreviews?.map((url, index) =>
                  url?.startsWith(`https://${process.env.NEXT_PUBLIC_CDN_HOST || "cdn.kidorakart.com"}/`) && (
                    <div key={index} className="flex items-center space-x-2">
                      <input type="text" value={url} readOnly className="flex-1 border border-input rounded px-2 py-1 bg-background text-sm" />
                      <button type="button" onClick={() => toggleRemoveImagesUrl(url)} className="bg-destructive text-white rounded px-2 py-1 text-sm hover:bg-destructive/90">
                        {removeImagesUrl.includes(url) ? "Undo" : "Remove"}
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </FormSection>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 py-4">
        <Button type="button" variant="outline" onClick={closeDrawer}>Cancel</Button>
        <Button disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
        </Button>
      </div>
    </form>
  );
}
