import { api } from "./api";
import type { Product, PaginatedResponse, ProductFormData } from "@/lib/types";

const YOUTUBE_RE = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
const VIMEO_RE = /^(https?:\/\/)?(www\.)?(vimeo\.com|player\.vimeo\.com)\/.+$/;
const DIRECT_VIDEO_RE = /^(https?:\/\/).+\.(mp4|webm|ogg|mov)(\?.*)?$/i;

export function isValidVideoUrl(url: string): boolean {
  return YOUTUBE_RE.test(url) || VIMEO_RE.test(url) || DIRECT_VIDEO_RE.test(url);
}

export const INITIAL_FORM_STATE: ProductFormData = {
  name: "", description: "", shortDescription: "", weight: "", length: "",
  height: "", breadth: "", purity: "", sizes: [],
  type: "", sku: "", tags: [], videoUrl: "", code: "", price: "",
  discount_price: "", stock: "", estimated_delivery_time: "", status: "draft",
  isFeatured: false, isNewArrival: false, isBestSeller: false, isTopRated: false,
  isUpsell: false, isOnSale: false, isPersonalized: false, isGift: false,
  order: 0, variants: [], mainImage: null, additionalImages: [null, null, null, null, null],
  mainImagePreview: "", additionalImagePreviews: ["", "", "", "", ""],
  giftImages: [null, null, null, null, null], giftImagePreviews: ["", "", "", "", ""],
};

export async function fetchColors(): Promise<{ _id: string; name: string; code: string }[]> {
  try { return (await api.post("/api/admin/color/view", {})) || []; } catch { return []; }
}

export async function fetchMaterials(): Promise<{ _id: string; name: string }[]> {
  try { return (await api.post("/api/admin/material/view", {})) || []; } catch { return []; }
}

export async function fetchSizes(): Promise<{ _id: string; name: string }[]> {
  try { return (await api.post("/api/admin/size/view", {})) || []; } catch { return []; }
}

export async function fetchCategories(): Promise<{ _id: string; name: string }[]> {
  try { return (await api.post("/api/admin/category/view", {})) || []; } catch { return []; }
}

export async function fetchSubCategories(): Promise<{ _id: string; name: string }[]> {
  try { return (await api.post("/api/admin/subCategory/view", {})) || []; } catch { return []; }
}

export async function fetchSubSubCategories(): Promise<{ _id: string; name: string }[]> {
  try { const d = await api.post("/api/admin/subSubCategory/view", {}); return Array.isArray(d) ? d : []; } catch { return []; }
}

export async function fetchProducts(isDeletedAt?: string, page = 1, limit = 50) {
  const response = await api.postRaw<PaginatedResponse<Product>>(
    "/api/admin/product/view", { isDeletedAt, page, limit },
  );
  return { products: response._data || [], pagination: response._pagination };
}

export async function deleteProduct(id: string) {
  return api.put("/api/admin/product/delete/" + id, { id });
}

export async function changeProductStatus(id: string) {
  return api.put("/api/admin/product/change-status/" + id);
}

export async function restoreProduct(id: string) {
  return api.put("/api/admin/product/restore/" + id);
}

export async function saveProduct({ formData, editingProduct }: { formData: FormData; editingProduct: Product | null }) {
  const url = editingProduct
    ? `/api/admin/product/update/${editingProduct._id}`
    : "/api/admin/product/create";
  return editingProduct ? api.put(url, formData) : api.post(url, formData);
}

export function buildProductFormData(
  formData: ProductFormData,
  selectedCategory: string[],
  selectedSubCategory: string[],
  selectedSubSubCategory: string[],
  selectedColors: string[],
  selectedMaterials: string[],
  removeImagesUrl: string[],
  removeGiftImagesUrl: string[] = [],
): FormData {
  const fd = new FormData();
  fd.append("name", formData.name);
  fd.append("description", formData.description);
  if (formData.shortDescription) fd.append("shortDescription", formData.shortDescription);
  fd.append("weight", formData.weight);
  if (formData.length) fd.append("length", formData.length);
  if (formData.height) fd.append("height", formData.height);
  if (formData.breadth) fd.append("breadth", formData.breadth);
  if (formData.purity) fd.append("purity", formData.purity);
  if (formData.type) fd.append("type", formData.type);
  if (formData.sku) fd.append("sku", formData.sku);
  if (formData.tags.length > 0) formData.tags.forEach((tag) => fd.append("tags[]", tag));
  if (formData.videoUrl) fd.append("videoUrl", formData.videoUrl);
  fd.append("code", formData.code);
  fd.append("price", formData.price);
  fd.append("discount_price", formData.discount_price);
  fd.append("stock", formData.stock);
  fd.append("estimated_delivery_time", formData.estimated_delivery_time);
  fd.append("order", String(formData.order));
  fd.append("status", formData.status);
  fd.append("isFeatured", String(formData.isFeatured));
  fd.append("isNewArrival", String(formData.isNewArrival));
  fd.append("isPersonalized", String(formData.isPersonalized));
  fd.append("isGift", String(formData.isGift));
  fd.append("isBestSeller", String(formData.isBestSeller));
  fd.append("isTopRated", String(formData.isTopRated));
  fd.append("isUpsell", String(formData.isUpsell));
  fd.append("isOnSale", String(formData.isOnSale));
  selectedCategory.forEach((cat) => fd.append("category[]", cat));
  selectedSubCategory.forEach((sub) => fd.append("subCategory[]", sub));
  selectedSubSubCategory.forEach((ssc) => fd.append("subSubCategory[]", ssc));
  selectedColors.forEach((c) => fd.append("colors[]", c));
  selectedMaterials.forEach((m) => fd.append("material[]", m));
  formData.sizes.forEach((s) => fd.append("sizes[]", s));
  if (formData.mainImage) fd.append("image", formData.mainImage);
  formData.additionalImages?.forEach((file) => { if (file) fd.append("images", file); });
  formData.giftImages?.forEach((file) => { if (file) fd.append("giftImages", file); });
  removeImagesUrl.forEach((url) => fd.append("removeImagesUrl[]", url));
  removeGiftImagesUrl.forEach((url) => fd.append("removeGiftImagesUrl[]", url));
  // Variants are sent as a single JSON string (FormData has no nested arrays)
  fd.append("variants", JSON.stringify(formData.variants));
  return fd;
}

/**
 * Fields that should always be included in the update FormData,
 * regardless of whether they changed (files, removal requests).
 */
const ALWAYS_INCLUDE_FIELDS = new Set([
  "mainImage",
  "additionalImages",
  "giftImages",
]);

/**
 * Build a FormData containing ONLY the fields that differ from the initial
 * snapshot. Used for updates so we don't send 20+ fields when only 1 changed.
 *
 * @param formData       Current form values
 * @param initialData    Snapshot of form values when the drawer opened
 * @param selections     Current multi-select arrays
 * @param initialSelections Initial multi-select snapshots
 * @param removeUrls     Current removal URL arrays
 */
export function buildUpdateFormData(
  formData: ProductFormData,
  initialData: ProductFormData,
  selections: {
    category: string[];
    subCategory: string[];
    subSubCategory: string[];
    colors: string[];
    materials: string[];
  },
  initialSelections: {
    category: string[];
    subCategory: string[];
    subSubCategory: string[];
    colors: string[];
    materials: string[];
  },
  removeImagesUrl: string[],
  removeGiftImagesUrl: string[] = [],
): FormData {
  const fd = new FormData();

  // Compare scalar fields (string, number, boolean) and include if changed
  const scalarFields: (keyof ProductFormData)[] = [
    "name", "description", "shortDescription", "weight", "length", "height",
    "breadth", "purity", "type", "sku",
    "videoUrl", "code", "price", "discount_price", "stock",
    "estimated_delivery_time", "status", "order",
    "isFeatured", "isNewArrival", "isBestSeller", "isTopRated",
    "isUpsell", "isOnSale", "isPersonalized", "isGift",
  ];

  for (const field of scalarFields) {
    const curr = formData[field];
    const init = initialData[field];
    if (String(curr) !== String(init)) {
      fd.append(field, String(curr));
    }
  }

  // Tags array
  if (JSON.stringify(formData.tags) !== JSON.stringify(initialData.tags)) {
    formData.tags.forEach((tag) => fd.append("tags[]", tag));
  }

  // Sizes array — compare JSON and include only when changed
  if (JSON.stringify(formData.sizes) !== JSON.stringify(initialData.sizes)) {
    formData.sizes.forEach((s) => fd.append("sizes[]", s));
  }

  // Multi-select arrays
  const selectionKeys: (keyof typeof selections)[] = ["category", "subCategory", "subSubCategory", "colors", "materials"];
  for (const key of selectionKeys) {
    const curr = selections[key];
    const init = initialSelections[key];
    if (JSON.stringify([...curr].sort()) !== JSON.stringify([...init].sort())) {
      curr.forEach((id) => fd.append(`${key}[]`, id));
    }
  }

  // Files — always include if present
  if (formData.mainImage) fd.append("image", formData.mainImage);
  formData.additionalImages?.forEach((file) => { if (file) fd.append("images", file); });
  formData.giftImages?.forEach((file) => { if (file) fd.append("giftImages", file); });

  // Removal URLs — always include if non-empty
  removeImagesUrl.forEach((url) => fd.append("removeImagesUrl[]", url));
  removeGiftImagesUrl.forEach((url) => fd.append("removeGiftImagesUrl[]", url));

  // Variants — compare JSON and include only when changed
  if (JSON.stringify(formData.variants) !== JSON.stringify(initialData.variants)) {
    fd.append("variants", JSON.stringify(formData.variants));
  }

  return fd;
}
