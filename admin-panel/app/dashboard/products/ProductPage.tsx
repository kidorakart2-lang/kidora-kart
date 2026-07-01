"use client";

import { api, ApiClientError } from "@/lib/api";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import { Drawer } from "@/components/drawer";
import { ExportButtons } from "@/components/export-buttons";
import { AlertDialogUse } from "@/components/alert-dialog";
import { Cloud, IndianRupee, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import NewMultiSelect from "../../../components/NewMultiSelect";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { invalidateCache } from "@/lib/invalidate-cache";

interface ProductFormData {
  name: string;
  description: string;
  purity: string;
  code: string;
  price: string;
  discount_price: string;
  stock: string;
  estimated_delivery_time: string;
  status: boolean;
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
  purity: string;
  code: string;
  description: string;
  estimated_delivery_time: string;
  status: boolean;
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

const INITIAL_FORM_STATE: ProductFormData = {
  name: "",
  description: "",
  purity: "",
  code: "",
  price: "",
  discount_price: "",
  stock: "",
  estimated_delivery_time: "",
  status: true,
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

const fetchProducts = async () => {
  const data = await api.post<Product[]>("/api/admin/product/view?showDeleted=true", {});
  return data || [];
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

  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 2 * 60 * 1000,
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      invalidateCache(["products", `product:${id}`, "homepage"]);
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      invalidateCache(["products", "homepage"]);
      toast({ title: "Status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error updating product status", variant: "destructive" });
    },
  });

  const saveMutation = useMutation({
    mutationFn: saveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      const tags = ["products", "homepage"];
      if (editingProduct) {
        tags.push(`product:${editingProduct._id}`);
      }
      invalidateCache(tags);
      toast({
        title: `Product ${editingProduct ? "updated" : "created"} successfully`,
      });
      closeDrawer();
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
      purity: defaultProduct.purity,
      code: defaultProduct.code,
      discount_price: String(defaultProduct.discount_price),
      description: defaultProduct.description,
      estimated_delivery_time: defaultProduct.estimated_delivery_time,
      status: defaultProduct.status,
      isFeatured: defaultProduct.isFeatured,
      isNewArrival: defaultProduct.isNewArrival,
      isBestSeller: defaultProduct.isBestSeller,
      isTopRated: defaultProduct.isTopRated,
      isUpsell: defaultProduct.isUpsell,
      isOnSale: defaultProduct.isOnSale,
      isPersonalized: defaultProduct.isPersonalized,
      isGift: defaultProduct.isGift,
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

    const formDataToSend = new FormData();

    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("purity", formData.purity);
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
    formDataToSend.append("status", String(formData.status));
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

  const closeDrawer = () => {
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
  };

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

  const handleStatusChange = (item: Product) => {
    statusMutation.mutate(item._id);
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
      key: "status",
      label: "Status",
      render: (item: Product) => (
        <Button
          disabled={statusMutation.isPending}
          variant={item.status ? "default" : "destructive"}
          className="font-mono cursor-pointer"
          onClick={() => handleStatusChange(item)}
        >
          {statusMutation.isPending
            ? "Changing.."
            : item.status
            ? "Active"
            : "Inactive"}
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500">
        Something went wrong while fetching products
      </div>
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
          <ExportButtons data={products as unknown as Record<string, unknown>[]} filename="products" />
          <Button
            onClick={() => {
              closeDrawer();
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
      />

      <Drawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        title={editingProduct ? "Edit Product" : "Add New Product"}
        className="!w-[60vw] !max-w-[1800px]"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Descriptions */}
          <div className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Full Description *</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter full description"
                  required
                />
              </div>
            </div>
          </div>

          {/* Categories & Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Categories & Tags</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Additional Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purity">Purity *</Label>
                <Input
                  id="purity"
                  value={formData.purity}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, purity: e.target.value })
                  }
                  placeholder="e.g. 80%"
                  required
                />
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
          </div>

          {/* Product Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Product Status</h3>
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
                  <input
                    type="checkbox"
                    id={toggle.id}
                    checked={formData[toggle.id]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({
                        ...formData,
                        [toggle.id]: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <Label htmlFor={toggle.id} className="cursor-pointer">
                    {toggle.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Product Images</h3>

            {/* Main Image */}
            <div className="space-y-2">
              <Label>Main Image *</Label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Cloud />
                    <p className="mb-2 text-sm text-gray-500">
                      Click to upload
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, JPEG</p>
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
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                      <div className="flex flex-col items-center justify-center">
                        <Cloud />
                        <p className="text-xs text-gray-500 mt-1">
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
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Images Url To Remove</h3>
            <div className="flex flex-col space-y-2">
              {formData.additionalImagePreviews?.map(
                (url: string, index: number) =>
                  url &&
                  url.startsWith("https://cdn.jewellerywalla.com/") && (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={url}
                        readOnly
                        className="flex-1 border border-gray-300 rounded px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => toggleRemoveImagesUrl(url)}
                        className="bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600"
                      >
                        {removeImagesUrl.includes(url) ? "Undo" : "Remove"}
                      </button>
                    </div>
                  )
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
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
    </div>
  );
}
