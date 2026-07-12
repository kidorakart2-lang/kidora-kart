"use client";

import { api, ApiClientError } from "@/lib/api";
import { useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { Drawer } from "@/components/drawer";
import { ExportButtons } from "@/components/export-buttons";
import { AlertDialogUse } from "@/components/alert-dialog";
import { Cloud, IndianRupee, Plus, X, Sparkles, Loader2, Video, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import NewMultiSelect from "../../../components/NewMultiSelect";
import TagsInput from "../../../components/TagsInput";
import Image from "next/image";
import AiAssistButton from "@/components/ai-assist-button";
import { useRouter } from "next/navigation";
import { invalidateCache } from "@/lib/invalidate-cache";

interface ProductFormData {
  name: string;
  description: string;
  shortDescription: string;
  weight: string;
  length: string;
  height: string;
  breadth: string;
  minimumAge: string;
  idealAge: string;
  maximumAge: string;
  type: string;
  sku: string;
  tags: string[];
  videoUrl: string;
  code: string;
  price: string;
  discount_price: string;
  stock: string;
  estimated_delivery_time: string;
  status: "active" | "inactive" | "draft";
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTopRated: boolean;
  isUpsell: boolean;
  isOnSale: boolean;
  isPersonalized: boolean;
  isGift: boolean;
  order: number;
  mainImage: File | null;
  additionalImages: (File | null)[];
  mainImagePreview: string;
  additionalImagePreviews: string[];
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  discount_price: number;
  weight: string;
  length?: number;
  height?: number;
  breadth?: number;
  minimumAge?: number;
  idealAge?: number;
  maximumAge?: number;
  type?: string;
  sku?: string;
  tags?: string[];
  videoUrl?: string;
  code: string;
  description: string;
  shortDescription?: string;
  estimated_delivery_time: string;
  status: "active" | "inactive" | "draft";
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTopRated: boolean;
  isUpsell: boolean;
  isOnSale: boolean;
  isPersonalized: boolean;
  isGift: boolean;
  order: number;
  image: string;
  images: string[];
  category: Array<{ _id: string } | string>;
  subCategory: Array<{ _id: string } | string>;
  subSubCategory: Array<{ _id: string } | string>;
  colors: Array<{ _id: string } | string>;
  material: Array<{ _id: string } | string>;
  sizes: Array<{ _id: string } | string>;
}

type BooleanKeys = "isFeatured" | "isNewArrival" | "isBestSeller" | "isTopRated" | "isUpsell" | "isOnSale" | "isPersonalized" | "isGift";

const AGE_OPTIONS = Array.from({ length: 19 }, (_, i) => ({ value: String(i), label: i === 0 ? "0 (Newborn)" : `${i} Years` }));

const YOUTUBE_RE = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
const VIMEO_RE = /^(https?:\/\/)?(www\.)?(vimeo\.com|player\.vimeo\.com)\/.+$/;
const DIRECT_VIDEO_RE = /^(https?:\/\/).+\.(mp4|webm|ogg|mov)(\?.*)?$/i;

function isValidVideoUrl(url: string): boolean {
  return YOUTUBE_RE.test(url) || VIMEO_RE.test(url) || DIRECT_VIDEO_RE.test(url);
}

const INITIAL_FORM_STATE: ProductFormData = {
  name: "",
  description: "",
  shortDescription: "",
  weight: "",
  length: "",
  height: "",
  breadth: "",
  minimumAge: "",
  idealAge: "",
  maximumAge: "",
  type: "",
  sku: "",
  tags: [],
  videoUrl: "",
  code: "",
  price: "",
  discount_price: "",
  stock: "",
  estimated_delivery_time: "",
  status: "draft",
  isFeatured: false,
  isNewArrival: false,
  isBestSeller: false,
  isTopRated: false,
  isUpsell: false,
  isOnSale: false,
  isPersonalized: false,
  isGift: false,
  order: 0,
  mainImage: null,
  additionalImages: [null, null, null, null, null],
  mainImagePreview: "",
  additionalImagePreviews: ["", "", "", "", ""],
};

// API functions
const fetchColors = async () => {
  try {
    return (await api.post<{ _id: string; name: string; code: string }[]>("/api/admin/color/view", {})) || [];
  } catch {
    return [];
  }
};

const fetchMaterials = async () => {
  try {
    return (await api.post<{ _id: string; name: string }[]>("/api/admin/material/view", {})) || [];
  } catch {
    return [];
  }
};

const fetchSizes = async () => {
  try {
    return (await api.post<{ _id: string; name: string }[]>("/api/admin/size/view", {})) || [];
  } catch {
    return [];
  }
};

const fetchCategories = async () => {
  try {
    return (await api.post<{ _id: string; name: string }[]>("/api/admin/category/view", {})) || [];
  } catch {
    return [];
  }
};

const fetchSubCategories = async () => {
  try {
    return (await api.post<{ _id: string; name: string }[]>("/api/admin/subCategory/view", {})) || [];
  } catch {
    return [];
  }
};

const fetchSubSubCategories = async () => {
  try {
    const data = await api.post<{ _id: string; name: string }[]>("/api/admin/subSubCategory/view", {});
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

interface PaginatedResponse<T> {
  _data: T[];
  _pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const fetchProducts = async (isDeletedAt?: string, page: number = 1, limit: number = 50) => {
  const response = await api.postRaw<PaginatedResponse<Product>>("/api/admin/product/view", { isDeletedAt, page, limit });
  return {
    products: response._data || [],
    pagination: response._pagination,
  };
};

const deleteProduct = async (id: string) => {
  return api.put("/api/admin/product/delete/" + id, { id });
};

const changeProductStatus = async (id: string) => {
  return api.put("/api/admin/product/change-status/" + id);
};

const saveProduct = async ({ formData, editingProduct }: { formData: FormData; editingProduct: Product | null }) => {
  const url = editingProduct
    ? `/api/admin/product/update/${editingProduct._id}`
    : `/api/admin/product/create`;

  return editingProduct ? api.put(url, formData) : api.post(url, formData);
};

export default function ProductsPage() {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string[]>([]);
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [removeImagesUrl, setRemoveImagesUrl] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_STATE);
  const [tagLoading, setTagLoading] = useState(false);
  const [statusConfirmOpen, setStatusConfirmOpen] = useState(false);
  const [pendingStatusProduct, setPendingStatusProduct] = useState<Product | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  // React Query hooks for fetching data
  const { data: colors = [] } = useQuery({
    queryKey: ["colors"],
    queryFn: fetchColors,
    staleTime: 5 * 60 * 1000,
  });

  const { data: materials = [] } = useQuery({
    queryKey: ["materials"],
    queryFn: fetchMaterials,
    staleTime: 5 * 60 * 1000,
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ["sizes"],
    queryFn: fetchSizes,
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data: subCategories = [] } = useQuery({
    queryKey: ["subCategories"],
    queryFn: fetchSubCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data: subSubCategories = [] } = useQuery({
    queryKey: ["subSubCategories"],
    queryFn: fetchSubSubCategories,
    staleTime: 5 * 60 * 1000,
  });

  const [deletedFilter, setDeletedFilter] = useState<string>("active");
  const [videoFilter, setVideoFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const {
    data: fetchResult,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["products", deletedFilter, currentPage],
    queryFn: () => fetchProducts(deletedFilter === "active" ? undefined : deletedFilter, currentPage, pageSize),
    staleTime: 2 * 60 * 1000,
  });

  const allProducts = fetchResult?.products ?? [];
  const products = videoFilter === "all"
    ? allProducts
    : videoFilter === "hasVideo"
      ? allProducts.filter((p) => !!p.videoUrl)
      : allProducts.filter((p) => !p.videoUrl);
  const totalItems = videoFilter !== "all"
    ? products.length
    : (fetchResult?.pagination?.total ?? products.length);

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      invalidateCache(["products", `product:${id}`, "homepage", "best-sellers", "flash-sale"]);
      toast({ title: "Product deleted successfully" });
      setAlertOpen(false);
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting product",
        description: error.message,
        variant: "destructive",
      });
      setAlertOpen(false);
      setDeleteId(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: changeProductStatus,
    onMutate: (id) => {
      setTogglingIds((prev) => new Set(prev).add(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      invalidateCache(["products", "homepage", "best-sellers", "flash-sale"]);
      toast({ title: "Status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating product status", variant: "destructive" });
    },
    onSettled: (_data, _error, id) => {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: saveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      const tags = ["products", "homepage", "best-sellers", "flash-sale"];
      if (editingProduct) {
        tags.push(`product:${editingProduct._id}`);
      }
      invalidateCache(tags);
      toast({
        title: `Product ${editingProduct ? "updated" : "created"} successfully`,
      });
      setDrawerOpen(false);
      setEditingProduct(null);
      setSelectedCategory([]);
      setSelectedSubCategory([]);
      setSelectedSubSubCategory([]);
      setSelectedColors([]);
      setSelectedMaterials([]);
      setSelectedSizes([]);
      setFormData(INITIAL_FORM_STATE);
      setRemoveImagesUrl([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (product: Product) => {
    const defaultProduct = { ...product };

    setEditingProduct(defaultProduct);

    setFormData({
      name: defaultProduct.name,
      price: String(defaultProduct.price),
      stock: String(defaultProduct.stock),
      weight: defaultProduct.weight,
      length: defaultProduct.length != null ? String(defaultProduct.length) : "",
      height: defaultProduct.height != null ? String(defaultProduct.height) : "",
      breadth: defaultProduct.breadth != null ? String(defaultProduct.breadth) : "",
      minimumAge: defaultProduct.minimumAge != null ? String(defaultProduct.minimumAge) : "",
      idealAge: defaultProduct.idealAge != null ? String(defaultProduct.idealAge) : "",
      maximumAge: defaultProduct.maximumAge != null ? String(defaultProduct.maximumAge) : "",
      type: defaultProduct.type || "",
      sku: defaultProduct.sku || "",
      tags: defaultProduct.tags || [],
      videoUrl: defaultProduct.videoUrl || "",
      code: defaultProduct.code,
      discount_price: String(defaultProduct.discount_price),
      description: defaultProduct.description,
      shortDescription: defaultProduct.shortDescription || "",
      estimated_delivery_time: defaultProduct.estimated_delivery_time,
      // Handle backward-compat: old boolean true→active, false→inactive
      status: typeof defaultProduct.status === "boolean"
        ? (defaultProduct.status ? "active" : "inactive")
        : (defaultProduct.status || "draft"),
      isFeatured: defaultProduct.isFeatured ?? false,
      isNewArrival: defaultProduct.isNewArrival ?? false,
      isBestSeller: defaultProduct.isBestSeller ?? false,
      isTopRated: defaultProduct.isTopRated ?? false,
      isUpsell: defaultProduct.isUpsell ?? false,
      isOnSale: defaultProduct.isOnSale ?? false,
      isPersonalized: defaultProduct.isPersonalized ?? false,
      isGift: defaultProduct.isGift ?? false,
      order: defaultProduct.order,
      mainImage: null,
      mainImagePreview: defaultProduct.image || "",
      additionalImagePreviews: Array.isArray(defaultProduct.images)
        ? [
            ...defaultProduct.images,
            ...Array(5 - defaultProduct.images.length).fill(""),
          ]
        : ["", "", "", "", ""],
      additionalImages: Array(5).fill(null),
    });

    setSelectedCategory(
      Array.isArray(defaultProduct.category)
        ? defaultProduct.category
            .map((item: { _id: string } | string) => typeof item === "string" ? item : item._id)
            .filter(Boolean)
        : []
    );
    setSelectedSubCategory(
      Array.isArray(defaultProduct.subCategory)
        ? defaultProduct.subCategory
            .map((item: { _id: string } | string) => typeof item === "string" ? item : item._id)
            .filter(Boolean)
        : []
    );
    setSelectedSubSubCategory(
      Array.isArray(defaultProduct.subSubCategory)
        ? defaultProduct.subSubCategory
            .map((item: { _id: string } | string) => typeof item === "string" ? item : item._id)
            .filter(Boolean)
        : []
    );
    setSelectedColors(
      Array.isArray(defaultProduct.colors)
        ? defaultProduct.colors.map((item: { _id: string } | string) => typeof item === "string" ? item : item._id).filter(Boolean)
        : []
    );
    setSelectedMaterials(
      Array.isArray(defaultProduct.material)
        ? defaultProduct.material
            .map((item: { _id: string } | string) => typeof item === "string" ? item : item._id)
            .filter(Boolean)
        : []
    );
    setSelectedSizes(
      Array.isArray(defaultProduct.sizes)
        ? defaultProduct.sizes.map((item: { _id: string } | string) => typeof item === "string" ? item : item._id).filter(Boolean)
        : []
    );

    setDrawerOpen(true);
  };

  const handleDelete = (id: number) => {
    setDeleteId(String(id));
    setAlertOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  function generateCode() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const weightNum = parseInt(formData.weight, 10);
    if (isNaN(weightNum) || weightNum < 10) {
      toast({ title: "Validation Error", description: "Weight must be at least 10 grams", variant: "destructive" });
      return;
    }

    // ── Price & discount price mutual validation ──
    const priceHasVal = formData.price.trim() !== '';
    const discountHasVal = formData.discount_price.trim() !== '';
    if (priceHasVal !== discountHasVal) {
      toast({ title: "Validation Error", description: "Both price and discount price must be filled together", variant: "destructive" });
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (!isNaN(priceNum) && priceNum <= 0) {
      toast({ title: "Validation Error", description: "Price must be greater than 0", variant: "destructive" });
      return;
    }

    const discountNum = parseFloat(formData.discount_price);
    if (!isNaN(priceNum) && !isNaN(discountNum) && discountNum > priceNum) {
      toast({ title: "Validation Error", description: "Discount price must be less than or equal to the original price", variant: "destructive" });
      return;
    }

    if (formData.minimumAge && formData.maximumAge) {
      const minAge = parseInt(formData.minimumAge, 10);
      const maxAge = parseInt(formData.maximumAge, 10);
      if (!isNaN(minAge) && !isNaN(maxAge) && minAge >= maxAge) {
        toast({ title: "Validation Error", description: "Minimum age must be less than maximum age", variant: "destructive" });
        return;
      }
    }

    if (formData.idealAge && formData.minimumAge && formData.maximumAge) {
      const idealAge = parseInt(formData.idealAge, 10);
      const minAge = parseInt(formData.minimumAge, 10);
      const maxAge = parseInt(formData.maximumAge, 10);
      if (!isNaN(idealAge) && !isNaN(minAge) && !isNaN(maxAge) && (idealAge < minAge || idealAge > maxAge)) {
        toast({ title: "Validation Error", description: "Ideal age must be between minimum age and maximum age", variant: "destructive" });
        return;
      }
    }

    if (formData.videoUrl && !isValidVideoUrl(formData.videoUrl)) {
      toast({ title: "Validation Error", description: "Video URL must be a valid YouTube, Vimeo, or direct video link (.mp4, .webm, etc.)", variant: "destructive" });
      return;
    }

    const stockNum = parseInt(formData.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      toast({ title: "Validation Error", description: "Stock cannot be negative", variant: "destructive" });
      return;
    }

    // ── Dimensions mutual validation ──
    const hasLength = formData.length.trim() !== '';
    const hasHeight = formData.height.trim() !== '';
    const hasBreadth = formData.breadth.trim() !== '';
    const dimensionCount = [hasLength, hasHeight, hasBreadth].filter(Boolean).length;
    if (dimensionCount > 0 && dimensionCount < 3) {
      toast({ title: "Validation Error", description: "Length, height, and breadth must all be filled together", variant: "destructive" });
      return;
    }

    if (selectedCategory.length === 0) {
      toast({ title: "Validation Error", description: "Please select at least one category", variant: "destructive" });
      return;
    }

    if (selectedColors.length === 0) {
      toast({ title: "Validation Error", description: "Please select at least one color", variant: "destructive" });
      return;
    }

    if (selectedSizes.length === 0) {
      toast({ title: "Validation Error", description: "Please select at least one size", variant: "destructive" });
      return;
    }

    if (!editingProduct && !formData.mainImage) {
      toast({ title: "Validation Error", description: "Please select a main image", variant: "destructive" });
      return;
    }

    const formDataToSend = new FormData();

    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    if (formData.shortDescription) formDataToSend.append("shortDescription", formData.shortDescription);
    formDataToSend.append("weight", formData.weight);
    if (formData.length) formDataToSend.append("length", formData.length);
    if (formData.height) formDataToSend.append("height", formData.height);
    if (formData.breadth) formDataToSend.append("breadth", formData.breadth);
    if (formData.minimumAge) formDataToSend.append("minimumAge", formData.minimumAge);
    if (formData.idealAge) formDataToSend.append("idealAge", formData.idealAge);
    if (formData.maximumAge) formDataToSend.append("maximumAge", formData.maximumAge);
    if (formData.type) formDataToSend.append("type", formData.type);
    if (formData.sku) formDataToSend.append("sku", formData.sku);
    if (formData.tags.length > 0) {
      formData.tags.forEach((tag: string) => formDataToSend.append("tags[]", tag));
    }
    if (formData.videoUrl) formDataToSend.append("videoUrl", formData.videoUrl);
    formDataToSend.append(
      "code",
      formData.code ? formData.code : generateCode()
    );
    formDataToSend.append("price", formData.price);
    formDataToSend.append("discount_price", formData.discount_price);
    formDataToSend.append("stock", formData.stock);
    formDataToSend.append(
      "estimated_delivery_time",
      formData.estimated_delivery_time
    );
    formDataToSend.append("order", String(formData.order));
    formDataToSend.append("status", formData.status);
    formDataToSend.append("isFeatured", String(formData.isFeatured));
    formDataToSend.append("isNewArrival", String(formData.isNewArrival));
    formDataToSend.append("isPersonalized", String(formData.isPersonalized));
    formDataToSend.append("isGift", String(formData.isGift));
    formDataToSend.append("isBestSeller", String(formData.isBestSeller));
    formDataToSend.append("isTopRated", String(formData.isTopRated));
    formDataToSend.append("isUpsell", String(formData.isUpsell));
    formDataToSend.append("isOnSale", String(formData.isOnSale));

    if (selectedCategory.length > 0) {
      selectedCategory.forEach((cat: string) =>
        formDataToSend.append("category[]", cat)
      );
    }
    if (selectedSubCategory.length > 0) {
      selectedSubCategory.forEach((subCat: string) =>
        formDataToSend.append("subCategory[]", subCat)
      );
    }
    if (selectedSubSubCategory.length > 0) {
      selectedSubSubCategory.forEach((subSubCat: string) =>
        formDataToSend.append("subSubCategory[]", subSubCat)
      );
    }
    if (selectedColors.length > 0) {
      selectedColors.forEach((color: string) =>
        formDataToSend.append("colors[]", color)
      );
    }
    if (selectedMaterials.length > 0) {
      selectedMaterials.forEach((material: string) =>
        formDataToSend.append("material[]", material)
      );
    }
    if (selectedSizes.length > 0) {
      selectedSizes.forEach((size: string) => formDataToSend.append("sizes[]", size));
    }

    if (formData.mainImage) {
      formDataToSend.append("image", formData.mainImage);
    }

    formData.additionalImages?.forEach((file: File | null) => {
      if (file) {
        formDataToSend.append("images", file);
      }
    });

    if (removeImagesUrl.length > 0) {
      removeImagesUrl.forEach((url: string) => {
        formDataToSend.append("removeImagesUrl[]", url);
      });
    }

    saveMutation.mutate({ formData: formDataToSend, editingProduct });
  };

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingProduct(null);
    setSelectedCategory([]);
    setSelectedSubCategory([]);
    setSelectedSubSubCategory([]);
    setSelectedColors([]);
    setSelectedMaterials([]);
    setSelectedSizes([]);
    setFormData(INITIAL_FORM_STATE);
    setRemoveImagesUrl([]);
  }, []);

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData({
      ...formData,
      mainImage: file,
      mainImagePreview: URL.createObjectURL(file),
    });
  };

  const handleAdditionalImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newImages = [...formData.additionalImages];
    const newPreviews = [...formData.additionalImagePreviews];

    newImages[index] = file;
    newPreviews[index] = URL.createObjectURL(file);

    setFormData({
      ...formData,
      additionalImages: newImages,
      additionalImagePreviews: newPreviews,
    });
  };

  const removeMainImage = () => {
    if (
      formData.mainImagePreview &&
      formData.mainImagePreview.startsWith("blob:")
    ) {
      URL.revokeObjectURL(formData.mainImagePreview);
    }
    setFormData({
      ...formData,
      mainImage: null,
      mainImagePreview: "",
    });
  };

  const removeAdditionalImage = (index: number) => {
    const newImages = [...formData.additionalImages];
    const newPreviews = [...formData.additionalImagePreviews];

    if (newPreviews[index].startsWith("blob:")) {
      URL.revokeObjectURL(newPreviews[index]);
    }

    newImages[index] = null;
    newPreviews[index] = "";

    setFormData({
      ...formData,
      additionalImages: newImages,
      additionalImagePreviews: newPreviews,
    });
  };

  const showDetails = (item: Product) => {
    router.push(`/dashboard/products/${item._id}`);
  };

  const handleAutoTag = async () => {
    setTagLoading(true);
    try {
      const data = await api.post<{ text: string }>("/api/admin/ai/generate-tags", {
        name: formData.name,
        description: formData.description,
      });
      if (data?.text) {
        const newTags = data.text
          .split(",")
          .map((t: string) => t.trim().toLowerCase())
          .filter((t: string) => t.length > 0);
        // Merge with existing tags, avoiding duplicates
        const existing = new Set(formData.tags.map((t) => t.toLowerCase()));
        const merged = [...formData.tags];
        for (const tag of newTags) {
          if (!existing.has(tag.toLowerCase())) {
            merged.push(tag);
            existing.add(tag.toLowerCase());
          }
        }
        setFormData({ ...formData, tags: merged });
        toast({ title: "AI: Tags generated" });
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to generate tags. Please try again.";
      toast({ title: `AI: ${message}`, variant: "destructive" });
    } finally {
      setTagLoading(false);
    }
  };

  const handleStatusChange = (item: Product) => {
    setPendingStatusProduct(item);
    setStatusConfirmOpen(true);
  };

  const confirmStatusChange = () => {
    if (pendingStatusProduct) {
      statusMutation.mutate(pendingStatusProduct._id);
    }
    setPendingStatusProduct(null);
    setStatusConfirmOpen(false);
  };

  const toggleRemoveImagesUrl = (url: string) => {
    if (removeImagesUrl.includes(url)) {
      setRemoveImagesUrl(removeImagesUrl.filter((u: string) => u !== url));
    } else {
      setRemoveImagesUrl([...removeImagesUrl, url]);
    }
  };

  const columns: Column<Product>[] = [
    {
      key: "name",
      label: "Name",
      render: (item: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            <Image
              onClick={() => showDetails(item)}
              width={64}
              height={64}
              src={item.image || "/placeholder.svg"}
              alt={item.name}
              className="w-full h-full object-cover cursor-pointer"
            />
          </div>
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    {
      key: "price",
      label: "Price",
      render: (item: Product) => (
        <span className="font-semibold flex items-center ">
          <IndianRupee size={16} />
          {item.price}
        </span>
      ),
    },
    {
      key: "stock",
      label: "Stock",
      render: (item: Product) => (
        <Badge
          variant={item.stock > 0 ? "default" : "destructive"}
          className="font-mono"
        >
          {item.stock}
        </Badge>
      ),
    },
    {
      key: "discount_price",
      label: "Discount Price",
      render: (item: Product) => (
        <span className=" flex items-center">
          <IndianRupee size={16} />
          {item.discount_price}
        </span>
      ),
    },
    {
      key: "videoUrl",
      label: "Has Video",
      render: (item: Product) => (
        item.videoUrl ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
            <Video className="h-3.5 w-3.5" />
            Yes
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Video className="h-3.5 w-3.5" />
            No
          </span>
        )
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (item: Product) => {
        const statusStyles: Record<string, string> = {
          active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
          inactive: "bg-destructive/10 text-destructive border-destructive/20",
          draft: "bg-secondary text-secondary-foreground border-secondary",
        };
        const statusLabels: Record<string, string> = {
          active: "Active",
          inactive: "Inactive",
          draft: "Draft",
        };
        return (
          <Button
            disabled={togglingIds.has(item._id)}
            variant="outline"
            className={`font-mono cursor-pointer border ${statusStyles[item.status] ?? "bg-muted text-foreground"}`}
            onClick={() => handleStatusChange(item)}
          >
            {togglingIds.has(item._id)
              ? "Changing.."
              : statusLabels[item.status] ?? item.status}
          </Button>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-pulse">
          <div className="space-y-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {["Product", "Category", "Price", "Stock", "Status"].map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {["Product", "Category", "Price", "Stock", "Status"].map((h) => (
                    <TableCell key={h}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to load products"
        message={error instanceof Error ? error.message : "An unexpected error occurred. Please try refreshing the page."}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ["products"] })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your product inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={videoFilter}
            onValueChange={(val) => {
              setVideoFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Filter by video" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="hasVideo">Has Video</SelectItem>
              <SelectItem value="noVideo">No Video</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={deletedFilter}
            onValueChange={setDeletedFilter}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="all">All (incl. deleted)</SelectItem>
              <SelectItem value="deleted">Deleted Only</SelectItem>
            </SelectContent>
          </Select>
          <ExportButtons data={products as unknown as Record<string, unknown>[]} filename="products" />
          <Button
            onClick={() => {
              setDrawerOpen(true);
            }}
            className="transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      <DataTable
        data={products}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search products..."
        externalPagination={{
          totalItems,
          currentPage,
          onPageChange: (page) => setCurrentPage(page),
        }}
      />

      <Drawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={editingProduct ? "Edit Product" : "Add New Product"}
        className={isMobile ? "!w-full" : "!w-[60vw] !max-w-[1800px]"}
      >
        <form onSubmit={handleSubmit} className="space-y-0">
          {/* Section 1: Basic Information */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left group">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    type="number"
                    id="price"
                    value={formData.price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="Enter price"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_price">Discount Price *</Label>
                  <Input
                    type="number"
                    id="discount_price"
                    value={formData.discount_price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, discount_price: e.target.value })
                    }
                    placeholder="Enter discount price"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Section 2: Description */}
          <Collapsible defaultOpen={!isMobile}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left group">
              <h3 className="text-lg font-medium">Description</h3>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 pb-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Full Description *</Label>
                  <AiAssistButton
                    context={{
                      name: formData.name,
                      category: selectedCategory.length
                        ? categories
                            .filter((c) => selectedCategory.includes(c._id))
                            .map((c) => c.name)
                            .join(", ")
                        : "",
                      material: selectedMaterials.length
                        ? materials
                            .filter((m) => selectedMaterials.includes(m._id))
                            .map((m) => m.name)
                            .join(", ")
                        : "",
                      type: formData.type,
                      weight: formData.weight,
                      price: formData.price,
                    }}
                    onResult={(text) =>
                      setFormData({ ...formData, description: text })
                    }
                  />
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter full description"
                  className="min-h-[120px]"
                  required
                />
              </div>

              {/* Short Description */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <AiAssistButton
                    context={{
                      name: formData.name,
                      category: selectedCategory.length
                        ? categories
                            .filter((c) => selectedCategory.includes(c._id))
                            .map((c) => c.name)
                            .join(", ")
                        : "",
                      material: selectedMaterials.length
                        ? materials
                            .filter((m) => selectedMaterials.includes(m._id))
                            .map((m) => m.name)
                            .join(", ")
                        : "",
                      type: formData.type,
                      price: formData.price,
                    }}
                    onResult={(text) =>
                      setFormData({ ...formData, shortDescription: text })
                    }
                    label="Generate Short Desc"
                    endpoint="/api/admin/ai/generate-short-description"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  A concise 1-2 sentence summary shown on product cards and search results.
                </p>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, shortDescription: e.target.value })
                  }
                  placeholder="e.g. A fun and educational building set for curious young minds"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Section 3: Categories & Tags */}
          <Collapsible defaultOpen={!isMobile}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left group">
              <h3 className="text-lg font-medium">Categories & Tags</h3>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <NewMultiSelect
                    category={categories}
                    categoryId={selectedCategory}
                    setCategoryId={setSelectedCategory}
                    placeholder="Select categories..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <NewMultiSelect
                    category={subCategories}
                    categoryId={selectedSubCategory}
                    setCategoryId={setSelectedSubCategory}
                    placeholder="Select subcategories..."
                    disabled={selectedCategory.length === 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sub-subcategory</Label>
                  <NewMultiSelect
                    category={subSubCategories}
                    categoryId={selectedSubSubCategory}
                    setCategoryId={setSelectedSubSubCategory}
                    placeholder="Select sub-subcategories..."
                    disabled={selectedSubCategory.length === 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Colors</Label>
                  <NewMultiSelect
                    category={colors}
                    categoryId={selectedColors}
                    setCategoryId={setSelectedColors}
                    placeholder="Select colors..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Materials</Label>
                  <NewMultiSelect
                    category={materials}
                    categoryId={selectedMaterials}
                    setCategoryId={setSelectedMaterials}
                    placeholder="Select materials..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sizes</Label>
                  <NewMultiSelect
                    category={sizes}
                    categoryId={selectedSizes}
                    setCategoryId={setSelectedSizes}
                    placeholder="Select sizes..."
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Tags</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!formData.name || tagLoading}
                      onClick={handleAutoTag}
                      className="gap-2 transition-all duration-200 hover:scale-105"
                    >
                      {tagLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {tagLoading ? "Generating..." : "Auto-tag with AI"}
                    </Button>
                  </div>
                  <div className="max-w-md">
                    <TagsInput
                      value={formData.tags}
                      onChange={(tags: string[]) =>
                        setFormData({ ...formData, tags })
                      }
                      placeholder="Type a tag and press Enter"
                      label="Product Tags"
                    />
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Section 4: Dimensions */}
          <Collapsible defaultOpen={!isMobile}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left group">
              <h3 className="text-lg font-medium">Dimensions</h3>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (g) *</Label>
                  <Input
                    id="weight"
                    value={formData.weight}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    placeholder="e.g. 15"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length">Length (cm)</Label>
                  <Input
                    type="number"
                    id="length"
                    value={formData.length}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, length: e.target.value })
                    }
                    placeholder="e.g. 25"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    type="number"
                    id="height"
                    value={formData.height}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, height: e.target.value })
                    }
                    placeholder="e.g. 15"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breadth">Breadth (cm)</Label>
                  <Input
                    type="number"
                    id="breadth"
                    value={formData.breadth}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, breadth: e.target.value })
                    }
                    placeholder="e.g. 10"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    placeholder="e.g. TOY-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    value={formData.type}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    placeholder="e.g. Educational, Puzzle, Outdoor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, videoUrl: e.target.value })
                    }
                    placeholder="e.g. https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-muted-foreground">
                    YouTube, Vimeo, or direct .mp4 / .webm link
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    type="number"
                    id="stock"
                    value={formData.stock}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    placeholder="Enter available stock"
                    min="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated_delivery_time">
                    Estimated Delivery Time *
                  </Label>
                  <Input
                    id="estimated_delivery_time"
                    value={formData.estimated_delivery_time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({
                        ...formData,
                        estimated_delivery_time: e.target.value,
                      })
                    }
                    placeholder="e.g., 3-5 business days"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    type="number"
                    id="order"
                    value={formData.order}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                    }
                    placeholder="Enter display order"
                    min="0"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Section 5: Age */}
          <Collapsible defaultOpen={!isMobile}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left group">
              <h3 className="text-lg font-medium">Age</h3>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="minimumAge">Minimum Age</Label>
                  <Select
                    value={formData.minimumAge}
                    onValueChange={(val: string) =>
                      setFormData({ ...formData, minimumAge: val })
                    }
                  >
                    <SelectTrigger id="minimumAge">
                      <SelectValue placeholder="Select minimum age" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idealAge">Ideal Age</Label>
                  <Select
                    value={formData.idealAge}
                    onValueChange={(val: string) =>
                      setFormData({ ...formData, idealAge: val })
                    }
                  >
                    <SelectTrigger id="idealAge">
                      <SelectValue placeholder="Select ideal age" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maximumAge">Maximum Age</Label>
                  <Select
                    value={formData.maximumAge}
                    onValueChange={(val: string) =>
                      setFormData({ ...formData, maximumAge: val })
                    }
                  >
                    <SelectTrigger id="maximumAge">
                      <SelectValue placeholder="Select maximum age" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Section 6: Status Toggles */}
          <Collapsible defaultOpen={!isMobile}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left group">
              <h3 className="text-lg font-medium">Status Toggles</h3>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-4 pb-4">
                <div className="max-w-xs">
                  <Label htmlFor="product-status">Listing Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val: "active" | "inactive" | "draft") =>
                      setFormData({ ...formData, status: val })
                    }
                  >
                    <SelectTrigger id="product-status" className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active — Visible on website</SelectItem>
                      <SelectItem value="inactive">Inactive — Hidden from website</SelectItem>
                      <SelectItem value="draft">Draft — Not published yet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {([
                    { id: "isFeatured" as const, label: "Featured" },
                    { id: "isNewArrival" as const, label: "New Arrival" },
                    { id: "isBestSeller" as const, label: "Best Seller" },
                    { id: "isTopRated" as const, label: "Top Rated" },
                    { id: "isUpsell" as const, label: "Upsell" },
                    { id: "isOnSale" as const, label: "On Sale" },
                    { id: "isPersonalized" as const, label: "Personalized" },
                    { id: "isGift" as const, label: "Gift" },
                  ] as const).map((toggle: { id: BooleanKeys; label: string }) => (
                    <div key={toggle.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={toggle.id}
                        checked={formData[toggle.id] ?? false}
                        onCheckedChange={(checked: boolean) =>
                          setFormData({
                            ...formData,
                            [toggle.id]: checked,
                          })
                        }
                      />
                      <Label htmlFor={toggle.id} className="cursor-pointer">
                        {toggle.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Section 7: Product Images */}
          <Collapsible defaultOpen={!isMobile}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left group">
              <h3 className="text-lg font-medium">Product Images</h3>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-6 pb-4">
                {/* Main Image */}
                <div className="space-y-2">
                  <Label>Main Image *</Label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-accent transition">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Cloud />
                        <p className="mb-2 text-sm text-muted-foreground">
                          Click to upload
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, JPEG</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleMainImageChange}
                      />
                    </label>
                  </div>
                  {formData.mainImagePreview && (
                    <div className="relative w-20 h-20">
                      <img
                        src={formData.mainImagePreview}
                        alt="Main"
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={removeMainImage}
                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Additional Images */}
                <div className="space-y-2">
                  <Label>Additional Images</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                    {formData.additionalImages?.map((src: File | null, index: number) => (
                      <div key={index} className="flex flex-col items-center gap-2">
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-accent transition">
                          <div className="flex flex-col items-center justify-center">
                            <Cloud />
                            <p className="text-xs text-muted-foreground mt-1">
                              Image {index + 1}
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleAdditionalImageChange(e, index)}
                          />
                        </label>
                        {formData.additionalImagePreviews[index] && (
                          <div className="relative w-16 h-16">
                            <img
                              src={formData.additionalImagePreviews[index]}
                              alt={`Additional ${index + 1}`}
                              className="w-full h-full object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => removeAdditionalImage(index)}
                              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Images Url To Remove */}
                {formData.additionalImagePreviews?.some(
                  (url: string) => url && url.startsWith(`https://${process.env.NEXT_PUBLIC_CDN_HOST || "cdn.kidorakart.com"}/`)
                ) && (
                  <div className="space-y-2">
                    <Label>Images to Remove</Label>
                    <div className="flex flex-col space-y-2">
                      {formData.additionalImagePreviews?.map(
                        (url: string, index: number) =>
                          url &&
                          url.startsWith(`https://${process.env.NEXT_PUBLIC_CDN_HOST || "cdn.kidorakart.com"}/`) && (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={url}
                                readOnly
                                className="flex-1 border border-input rounded px-2 py-1 bg-background text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => toggleRemoveImagesUrl(url)}
                                className="bg-destructive text-white rounded px-2 py-1 text-sm hover:bg-destructive/90"
                              >
                                {removeImagesUrl.includes(url) ? "Undo" : "Remove"}
                              </button>
                            </div>
                          )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 py-4">
            <Button type="button" variant="outline" onClick={closeDrawer}>
              Cancel
            </Button>
            <Button disabled={saveMutation.isPending} type="submit">
              {saveMutation.isPending
                ? "Saving..."
                : editingProduct
                ? "Update Product"
                : "Create Product"}
            </Button>
          </div>
        </form>
      </Drawer>

      <AlertDialogUse
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
      />

      <AlertDialogUse
        isOpen={statusConfirmOpen}
        onClose={() => { setStatusConfirmOpen(false); setPendingStatusProduct(null); }}
        onConfirm={confirmStatusChange}
        title="Change Product Status"
        description={`Are you sure you want to change the status of "${pendingStatusProduct?.name ?? ""}" to ${pendingStatusProduct?.status === "active" ? "inactive" : "active"}?`}
        confirmText="Change Status"
      />
    </div>
  );
}
