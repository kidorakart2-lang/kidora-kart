import { api } from "./api";
import type { Product, PaginatedResponse, ProductFormData } from "@/lib/types";

const YOUTUBE_RE = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
const VIMEO_RE = /^(https?:\/\/)?(www\.)?(vimeo\.com|player\.vimeo\.com)\/.+$/;
const DIRECT_VIDEO_RE = /^(https?:\/\/).+\.(mp4|webm|ogg|mov)(\?.*)?$/i;

export function isValidVideoUrl(url: string): boolean {
  return YOUTUBE_RE.test(url) || VIMEO_RE.test(url) || DIRECT_VIDEO_RE.test(url);
}

export const AGE_OPTIONS = Array.from({ length: 19 }, (_, i) => ({
  value: String(i),
  label: i === 0 ? "0 (Newborn)" : `${i} Years`,
}));

export const INITIAL_FORM_STATE: ProductFormData = {
  name: "", description: "", shortDescription: "", weight: "", length: "",
  height: "", breadth: "", minimumAge: "", idealAge: "", maximumAge: "",
  type: "", sku: "", tags: [], videoUrl: "", code: "", price: "",
  discount_price: "", stock: "", estimated_delivery_time: "", status: "draft",
  isFeatured: false, isNewArrival: false, isBestSeller: false, isTopRated: false,
  isUpsell: false, isOnSale: false, isPersonalized: false, isGift: false,
  order: 0, mainImage: null, additionalImages: [null, null, null, null, null],
  mainImagePreview: "", additionalImagePreviews: ["", "", "", "", ""],
};

export async function fetchColors(): Promise<{ _id: string; name: string; code: string }[]> {
  try { return (await api.post("/api/admin/color/view", {})) || []; } catch { return []; }
}

export async function fetchMaterials(): Promise<{ _id: string; name: string }[]> {
  try { return (await api.post("/api/admin/material/view", {})) || []; } catch { return []; }
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

export async function saveProduct({ formData, editingProduct }: { formData: FormData; editingProduct: Product | null }) {
  const url = editingProduct
    ? `/api/admin/product/update/${editingProduct._id}`
    : "/api/admin/product/create";
  return editingProduct ? api.put(url, formData) : api.post(url, formData);
}

export function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export function buildProductFormData(
  formData: ProductFormData,
  selectedCategory: string[],
  selectedSubCategory: string[],
  selectedSubSubCategory: string[],
  selectedColors: string[],
  selectedMaterials: string[],
  removeImagesUrl: string[],
): FormData {
  const fd = new FormData();
  fd.append("name", formData.name);
  fd.append("description", formData.description);
  if (formData.shortDescription) fd.append("shortDescription", formData.shortDescription);
  fd.append("weight", formData.weight);
  if (formData.length) fd.append("length", formData.length);
  if (formData.height) fd.append("height", formData.height);
  if (formData.breadth) fd.append("breadth", formData.breadth);
  if (formData.minimumAge) fd.append("minimumAge", formData.minimumAge);
  if (formData.idealAge) fd.append("idealAge", formData.idealAge);
  if (formData.maximumAge) fd.append("maximumAge", formData.maximumAge);
  if (formData.type) fd.append("type", formData.type);
  if (formData.sku) fd.append("sku", formData.sku);
  if (formData.tags.length > 0) formData.tags.forEach((tag) => fd.append("tags[]", tag));
  if (formData.videoUrl) fd.append("videoUrl", formData.videoUrl);
  fd.append("code", formData.code || generateCode());
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
  if (formData.mainImage) fd.append("image", formData.mainImage);
  formData.additionalImages?.forEach((file) => { if (file) fd.append("images", file); });
  removeImagesUrl.forEach((url) => fd.append("removeImagesUrl[]", url));
  return fd;
}
