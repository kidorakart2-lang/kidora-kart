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
// AI-assisted writing is disabled for Jewellery Walla — re-enable by uncommenting.
// import AiAssistButton from "@/components/ai-assist-button";
import { Cloud, ChevronDown, X, Plus } from "lucide-react";
import type { ProductFormData, BooleanKeys, ProductVariant } from "@/lib/types";

type VariantField = keyof Pick<ProductVariant, "name" | "quantity" | "price" | "mrp">;

/** Update one field of a variant row (name as string, numbers as numbers). */
const updateVariant = (
  formData: ProductFormData,
  setFormData: (d: ProductFormData | ((prev: ProductFormData) => ProductFormData)) => void,
  index: number,
  field: VariantField,
  value: string,
) => {
  const variants = formData.variants.map((v, i) => {
    if (i !== index) return v;
    if (field === "name") return { ...v, name: value };
    const num = value === "" ? null : Number(value);
    return { ...v, [field]: num } as ProductVariant;
  });
  setFormData({ ...formData, variants });
};

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
  selectedSizes: string[];
  setSelectedSizes: (v: string[]) => void;
  removeImagesUrl: string[];
  toggleRemoveImagesUrl: (url: string) => void;
  removeGiftImagesUrl: string[];
  toggleRemoveGiftImagesUrl: (url: string) => void;
  categories: { _id: string; name: string }[];
  subCategories: { _id: string; name: string }[];
  subSubCategories: { _id: string; name: string }[];
  colors: { _id: string; name: string; code: string }[];
  materials: { _id: string; name: string }[];
  sizes: { _id: string; name: string }[];
  tagLoading: boolean;
  handleAutoTag: () => void;
  handleMainImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAdditionalImageChange: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  handleGiftImageChange: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
  removeMainImage: () => void;
  removeAdditionalImage: (index: number) => void;
  removeGiftImage: (index: number) => void;
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
  selectedSizes, setSelectedSizes,
  removeImagesUrl, toggleRemoveImagesUrl,
  removeGiftImagesUrl, toggleRemoveGiftImagesUrl,
  categories, subCategories, subSubCategories, colors, materials, sizes,
  tagLoading, handleAutoTag,
  handleMainImageChange, handleAdditionalImageChange,
  handleGiftImageChange,
  removeMainImage, removeAdditionalImage,
  removeGiftImage,
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
            {/* AI generate-with-AI button disabled for Jewellery Walla */}
            {/* <AiAssistButton ... description ... /> */}
          </div>
          <Textarea id="description" value={formData.description} onChange={u("description")} placeholder="Enter full description" className="min-h-[120px]" required />
        </div>
        <div className="space-y-2 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="shortDescription">Short Description</Label>
            {/* AI generate-with-AI button disabled for Jewellery Walla */}
            {/* <AiAssistButton ... short description ... /> */}
          </div>
          <p className="text-xs text-muted-foreground">A concise 1-2 sentence summary shown on product cards and search results.</p>            <Input id="shortDescription" value={formData.shortDescription} onChange={u("shortDescription")} placeholder="e.g. An elegant handcrafted gold necklace for festive occasions" />
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
              {/* AI auto-tag button disabled for Jewellery Walla */}
              {/* <Button ... Auto-tag with AI ... /> */}
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
            <Input
              id="sku"
              value={formData.sku}
              onChange={u("sku")}
              placeholder={editingProduct ? "Edit SKU" : "Auto-generated on save"}
              readOnly={!editingProduct}
              className={!editingProduct ? "bg-muted/50 cursor-not-allowed" : ""}
            />
            {!editingProduct && (
              <p className="text-xs text-muted-foreground">SKU is auto-generated server-side (format: <span className="font-mono">JW-YYMMDD-XXXX</span>). You can edit it after creating the product.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Input id="type" value={formData.type} onChange={u("type")} placeholder="e.g. Necklace, Ring, Bangles, Earrings" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <div className="flex gap-2">
              <Input
                id="videoUrl"
                value={formData.videoUrl}
                onChange={u("videoUrl")}
                placeholder="e.g. https://youtube.com/watch?v=..."
                className="flex-1"
              />
              {formData.videoUrl && editingProduct && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setFormData({ ...formData, videoUrl: "" })}
                  title="Clear video URL"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
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

      {/* Section 5: Purity & Sizes */}
      <FormSection title="Purity & Sizes" defaultOpen={!isMobile}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          <div className="space-y-2">
            <Label htmlFor="purity">Purity</Label>
            <Select value={formData.purity} onValueChange={(val) => setFormData({ ...formData, purity: val })}>
              <SelectTrigger id="purity"><SelectValue placeholder="Select purity (e.g. 22K, 18K, 916 Hallmark)" /></SelectTrigger>
              <SelectContent>
                {["24K (999)", "22K (916)", "21K (875)", "18K (750)", "14K (585)", "Silver 925", "Silver 999"].map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sizes</Label>
            <NewMultiSelect category={sizes} categoryId={selectedSizes} setCategoryId={setSelectedSizes} placeholder="Select sizes..." />
          </div>
        </div>
      </FormSection>

      {/* Section 6: Buy Now Variants (quantity tiers & add-ons) */}
      <FormSection title="Buy Now Variants (Offers)" defaultOpen={false}>
        <div className="space-y-4 pb-4">
          <p className="text-sm text-muted-foreground">
            Optional pack offers shown on the product page (Buy Now only — not
            available in cart). A pack like &ldquo;Pack of 5 @ ₹100&rdquo; lets
            customers buy more for a better per-unit price.
          </p>

          {formData.variants.map((variant, index) => (
            <div
              key={index}
              className="border border-border rounded-lg p-4 space-y-3 bg-muted/20"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Variant {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      variants: formData.variants.filter((_, i) => i !== index),
                    })
                  }
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Name *</Label>
                  <Input
                    value={variant.name}
                    onChange={(e) =>
                      updateVariant(formData, setFormData, index, "name", e.target.value)
                    }
                    placeholder="e.g. Pack of 5"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Quantity (pcs) *</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={variant.quantity}
                    onChange={(e) =>
                      updateVariant(formData, setFormData, index, "quantity", e.target.value)
                    }
                    placeholder="e.g. 5"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Pack Price (₹) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.price}
                    onChange={(e) =>
                      updateVariant(formData, setFormData, index, "price", e.target.value)
                    }
                    placeholder="e.g. 100"
                  />
                </div>
                <div className="col-span-2 lg:col-span-4 space-y-1.5">
                  <Label>MRP (₹) — optional strikethrough</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.mrp ?? ""}
                    onChange={(e) =>
                      updateVariant(formData, setFormData, index, "mrp", e.target.value)
                    }
                    placeholder="e.g. 125 (original pack price)"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setFormData({
                ...formData,
                variants: [
                  ...formData.variants,
                  { name: "", quantity: 1, price: 0, mrp: null },
                ],
              })
            }
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Variant
          </Button>
        </div>
      </FormSection>

      {/* Section 7: Status Toggles */}
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

      {/* Section 8: Product Images */}
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
          {formData.additionalImagePreviews?.some((url) => url?.startsWith(`https://${process.env.NEXT_PUBLIC_CDN_HOST || "cdn.jewellerywalla.com"}/`)) && (
            <div className="space-y-2">
              <Label>Images to Remove</Label>
              <div className="flex flex-col space-y-2">
                {formData.additionalImagePreviews?.map((url, index) =>
                  url?.startsWith(`https://${process.env.NEXT_PUBLIC_CDN_HOST || "cdn.jewellerywalla.com"}/`) && (
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

      {/* Section 9: Gift Images */}
      <FormSection title="Gift Images" defaultOpen={!isMobile}>
        <div className="space-y-4 pb-4">
          <p className="text-sm text-muted-foreground">Upload images related to gift packaging / presentation. Displayed below the product description.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {formData.giftImages?.map((_, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-accent transition border-amber-200">
                  <div className="flex flex-col items-center justify-center"><Cloud /><p className="text-xs text-muted-foreground mt-1">Gift Image {index + 1}</p></div>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleGiftImageChange(e, index)} />
                </label>
                {formData.giftImagePreviews[index] && (
                  <div className="relative w-16 h-16">
                    <img src={formData.giftImagePreviews[index]} alt={`Gift ${index + 1}`} className="w-full h-full object-cover rounded" />
                    <button type="button" onClick={() => removeGiftImage(index)} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"><X className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {formData.giftImagePreviews?.some((url) => url?.startsWith(`https://${process.env.NEXT_PUBLIC_CDN_HOST || "cdn.jewellerywalla.com"}/`)) && (
            <div className="space-y-2">
              <Label>Gift Images to Remove</Label>
              <div className="flex flex-col space-y-2">
                {formData.giftImagePreviews?.map((url, index) =>
                  url?.startsWith(`https://${process.env.NEXT_PUBLIC_CDN_HOST || "cdn.jewellerywalla.com"}/`) && (
                    <div key={index} className="flex items-center space-x-2">
                      <input type="text" value={url} readOnly className="flex-1 border border-input rounded px-2 py-1 bg-background text-sm" />
                      <button type="button" onClick={() => toggleRemoveGiftImagesUrl(url)} className="bg-destructive text-white rounded px-2 py-1 text-sm hover:bg-destructive/90">
                        {removeGiftImagesUrl.includes(url) ? "Undo" : "Remove"}
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
