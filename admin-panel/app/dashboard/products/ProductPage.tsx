"use client";

import { api, ApiClientError } from "@/lib/api";
import { useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import { ErrorState } from "@/components/ui/error-state";
import { Drawer } from "@/components/drawer";
import { ExportButtons } from "@/components/export-buttons";
import { AlertDialogUse } from "@/components/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { invalidateCache } from "@/lib/invalidate-cache";
import ProductForm from "@/components/product/ProductForm";
import { fetchColors, fetchMaterials, fetchCategories, fetchSubCategories, fetchSubSubCategories, fetchProducts, deleteProduct, changeProductStatus, saveProduct, restoreProduct, buildProductFormData, buildUpdateFormData, INITIAL_FORM_STATE, isValidVideoUrl } from "@/lib/products-api";
import type { Product, ProductFormData } from "@/lib/types";
import { Plus, IndianRupee, Video } from "lucide-react";

export default function ProductsPage() {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string[]>([]);
  const [selectedSubSubCategory, setSelectedSubSubCategory] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [removeImagesUrl, setRemoveImagesUrl] = useState<string[]>([]);
  const [removeGiftImagesUrl, setRemoveGiftImagesUrl] = useState<string[]>([]);
  // Snapshots for partial-update tracking
  const [initialFormData, setInitialFormData] = useState<ProductFormData | null>(null);
  const [initialSelections, setInitialSelections] = useState<{
    category: string[]; subCategory: string[]; subSubCategory: string[];
    colors: string[]; materials: string[];
  } | null>(null);
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

  const { data: colors = [] } = useQuery({ queryKey: ["colors"], queryFn: fetchColors, staleTime: 5 * 60 * 1000 });
  const { data: materials = [] } = useQuery({ queryKey: ["materials"], queryFn: fetchMaterials, staleTime: 5 * 60 * 1000 });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories, staleTime: 5 * 60 * 1000 });
  const { data: subCategories = [] } = useQuery({ queryKey: ["subCategories"], queryFn: fetchSubCategories, staleTime: 5 * 60 * 1000 });
  const { data: subSubCategories = [] } = useQuery({ queryKey: ["subSubCategories"], queryFn: fetchSubSubCategories, staleTime: 5 * 60 * 1000 });

  const [deletedFilter, setDeletedFilter] = useState<string>("active");
  const [videoFilter, setVideoFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const { data: fetchResult, isLoading, isError, error } = useQuery({
    queryKey: ["products", deletedFilter, currentPage],
    queryFn: () => fetchProducts(deletedFilter === "active" ? undefined : deletedFilter, currentPage, pageSize),
    staleTime: 2 * 60 * 1000,
  });

  const allProducts = fetchResult?.products ?? [];
  const products = videoFilter === "all" ? allProducts
    : videoFilter === "hasVideo" ? allProducts.filter((p) => !!p.videoUrl)
    : allProducts.filter((p) => !p.videoUrl);
  const totalItems = videoFilter !== "all" ? products.length : (fetchResult?.pagination?.total ?? products.length);

  const restoreMutation = useMutation({
    mutationFn: restoreProduct,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      invalidateCache(["products", "homepage", "best-sellers", "flash-sale"]);
      toast({ title: "Product restored successfully" });
    },
    onError: (error: Error) => { toast({ title: "Error restoring product", description: error.message, variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      invalidateCache(["products", `product:${id}`, "homepage", "best-sellers", "flash-sale"]);
      toast({ title: "Product deleted successfully" });
      setAlertOpen(false); setDeleteId(null);
    },
    onError: (error: Error) => { toast({ title: "Error deleting product", description: error.message, variant: "destructive" }); setAlertOpen(false); setDeleteId(null); },
  });

  const statusMutation = useMutation({
    mutationFn: changeProductStatus,
    onMutate: (id) => setTogglingIds((prev) => new Set(prev).add(id)),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["products"] }); invalidateCache(["products", "homepage", "best-sellers", "flash-sale"]); toast({ title: "Status updated successfully" }); },
    onError: () => toast({ title: "Error updating product status", variant: "destructive" }),
    onSettled: (_data, _error, id) => setTogglingIds((prev) => { const n = new Set(prev); n.delete(id); return n; }),
  });

  const saveMutation = useMutation({
    mutationFn: saveProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      const tags = ["products", "homepage", "best-sellers", "flash-sale"];
      if (editingProduct) tags.push(`product:${editingProduct._id}`);
      invalidateCache(tags);
      toast({ title: `Product ${editingProduct ? "updated" : "created"} successfully` });
      setDrawerOpen(false); setEditingProduct(null);
      setSelectedCategory([]); setSelectedSubCategory([]); setSelectedSubSubCategory([]);
      setSelectedColors([]); setSelectedMaterials([]);
      setFormData(INITIAL_FORM_STATE); setRemoveImagesUrl([]); setRemoveGiftImagesUrl([]);
      setInitialFormData(null); setInitialSelections(null);
    },
    onError: (error: Error) => toast({ title: "Error saving product", description: error.message, variant: "destructive" }),
  });

  const handleEdit = (product: Product) => {
    const dp = { ...product };
    setEditingProduct(dp);
    setFormData({
      name: dp.name, price: String(dp.price), stock: String(dp.stock), weight: dp.weight,
      length: dp.length != null ? String(dp.length) : "", height: dp.height != null ? String(dp.height) : "",
      breadth: dp.breadth != null ? String(dp.breadth) : "",
      minimumAge: dp.minimumAge != null ? String(dp.minimumAge) : "",
      idealAge: dp.idealAge != null ? String(dp.idealAge) : "",
      maximumAge: dp.maximumAge != null ? String(dp.maximumAge) : "",
      type: dp.type || "", sku: dp.sku || "", tags: dp.tags || [], videoUrl: dp.videoUrl || "",
      code: dp.code, discount_price: String(dp.discount_price), description: dp.description,
      shortDescription: dp.shortDescription || "",
      estimated_delivery_time: dp.estimated_delivery_time,
      status: typeof dp.status === "boolean" ? (dp.status ? "active" : "inactive") : (dp.status || "draft"),
      isFeatured: dp.isFeatured ?? false, isNewArrival: dp.isNewArrival ?? false,
      isBestSeller: dp.isBestSeller ?? false, isTopRated: dp.isTopRated ?? false,
      isUpsell: dp.isUpsell ?? false, isOnSale: dp.isOnSale ?? false,
      isPersonalized: dp.isPersonalized ?? false, isGift: dp.isGift ?? false,
      order: dp.order, mainImage: null,
      mainImagePreview: dp.image || "",
      additionalImagePreviews: Array.isArray(dp.images) ? [...dp.images, ...Array(5 - dp.images.length).fill("")] : ["", "", "", "", ""],
      additionalImages: Array(5).fill(null),
      giftImagePreviews: Array.isArray(dp.giftImages) ? [...dp.giftImages, ...Array(5 - dp.giftImages.length).fill("")] : ["", "", "", "", ""],
      giftImages: Array(5).fill(null),
    });
    const mapIds = (items: Array<{ _id: string } | string> | undefined) =>
      Array.isArray(items) ? items.map((i) => typeof i === "string" ? i : i._id).filter(Boolean) : [];
    const cats = mapIds(dp.category);
    const subs = mapIds(dp.subCategory);
    const subsubs = mapIds(dp.subSubCategory);
    const cols = mapIds(dp.colors);
    const mats = mapIds(dp.material);
    setSelectedCategory(cats);
    setSelectedSubCategory(subs);
    setSelectedSubSubCategory(subsubs);
    setSelectedColors(cols);
    setSelectedMaterials(mats);
    // Snapshot for partial-update tracking (built inline, not from stale formData state)
    setInitialFormData({
      name: dp.name, price: String(dp.price), stock: String(dp.stock), weight: dp.weight,
      length: dp.length != null ? String(dp.length) : "", height: dp.height != null ? String(dp.height) : "",
      breadth: dp.breadth != null ? String(dp.breadth) : "",
      minimumAge: dp.minimumAge != null ? String(dp.minimumAge) : "",
      idealAge: dp.idealAge != null ? String(dp.idealAge) : "",
      maximumAge: dp.maximumAge != null ? String(dp.maximumAge) : "",
      type: dp.type || "", sku: dp.sku || "", tags: [...(dp.tags || [])], videoUrl: dp.videoUrl || "",
      code: dp.code, discount_price: String(dp.discount_price), description: dp.description,
      shortDescription: dp.shortDescription || "",
      estimated_delivery_time: dp.estimated_delivery_time,
      status: typeof dp.status === "boolean" ? (dp.status ? "active" : "inactive") : (dp.status || "draft"),
      isFeatured: dp.isFeatured ?? false, isNewArrival: dp.isNewArrival ?? false,
      isBestSeller: dp.isBestSeller ?? false, isTopRated: dp.isTopRated ?? false,
      isUpsell: dp.isUpsell ?? false, isOnSale: dp.isOnSale ?? false,
      isPersonalized: dp.isPersonalized ?? false, isGift: dp.isGift ?? false,
      order: dp.order,
      mainImage: null, mainImagePreview: "",
      additionalImages: Array(5).fill(null), additionalImagePreviews: ["", "", "", "", ""],
      giftImages: Array(5).fill(null), giftImagePreviews: ["", "", "", "", ""],
    });
    setInitialSelections({ category: [...cats], subCategory: [...subs], subSubCategory: [...subsubs], colors: [...cols], materials: [...mats] });
    setDrawerOpen(true);
  };

  const handleDelete = (id: number) => { setDeleteId(String(id)); setAlertOpen(true); };
  const confirmDelete = () => { if (deleteId) deleteMutation.mutate(deleteId); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseInt(formData.weight, 10);
    if (isNaN(weightNum) || weightNum < 10) { toast({ title: "Validation Error", description: "Weight must be at least 10 grams", variant: "destructive" }); return; }
    const priceHasVal = formData.price.trim() !== "";
    const discountHasVal = formData.discount_price.trim() !== "";
    if (priceHasVal !== discountHasVal) { toast({ title: "Validation Error", description: "Both price and discount price must be filled together", variant: "destructive" }); return; }
    const priceNum = parseFloat(formData.price);
    if (!isNaN(priceNum) && priceNum <= 0) { toast({ title: "Validation Error", description: "Price must be greater than 0", variant: "destructive" }); return; }
    const discountNum = parseFloat(formData.discount_price);
    if (!isNaN(priceNum) && !isNaN(discountNum) && discountNum > priceNum) { toast({ title: "Validation Error", description: "Discount price must be less than or equal to the original price", variant: "destructive" }); return; }
    if (formData.minimumAge && formData.maximumAge) {
      const mn = parseInt(formData.minimumAge, 10), mx = parseInt(formData.maximumAge, 10);
      if (!isNaN(mn) && !isNaN(mx) && mn >= mx) { toast({ title: "Validation Error", description: "Minimum age must be less than maximum age", variant: "destructive" }); return; }
    }
    if (formData.idealAge && formData.minimumAge && formData.maximumAge) {
      const ia = parseInt(formData.idealAge, 10), mn = parseInt(formData.minimumAge, 10), mx = parseInt(formData.maximumAge, 10);
      if (!isNaN(ia) && !isNaN(mn) && !isNaN(mx) && (ia < mn || ia > mx)) { toast({ title: "Validation Error", description: "Ideal age must be between minimum age and maximum age", variant: "destructive" }); return; }
    }
    if (formData.videoUrl && !isValidVideoUrl(formData.videoUrl)) { toast({ title: "Validation Error", description: "Video URL must be a valid YouTube, Vimeo, or direct video link (.mp4, .webm, etc.)", variant: "destructive" }); return; }
    const stockNum = parseInt(formData.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) { toast({ title: "Validation Error", description: "Stock cannot be negative", variant: "destructive" }); return; }
    const hasL = formData.length.trim() !== "", hasH = formData.height.trim() !== "", hasB = formData.breadth.trim() !== "";
    const dimCount = [hasL, hasH, hasB].filter(Boolean).length;
    if (dimCount > 0 && dimCount < 3) { toast({ title: "Validation Error", description: "Length, height, and breadth must all be filled together", variant: "destructive" }); return; }
    if (selectedCategory.length === 0) { toast({ title: "Validation Error", description: "Please select at least one category", variant: "destructive" }); return; }
    if (selectedColors.length === 0) { toast({ title: "Validation Error", description: "Please select at least one color", variant: "destructive" }); return; }
    if (!editingProduct && !formData.mainImage) { toast({ title: "Validation Error", description: "Please select a main image", variant: "destructive" }); return; }

    const fd = editingProduct && initialFormData && initialSelections
      ? buildUpdateFormData(
          formData,
          initialFormData,
          { category: selectedCategory, subCategory: selectedSubCategory, subSubCategory: selectedSubSubCategory, colors: selectedColors, materials: selectedMaterials },
          initialSelections,
          removeImagesUrl,
          removeGiftImagesUrl,
        )
      : buildProductFormData(formData, selectedCategory, selectedSubCategory, selectedSubSubCategory, selectedColors, selectedMaterials, removeImagesUrl, removeGiftImagesUrl);
    saveMutation.mutate({ formData: fd, editingProduct });
  };

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false); setEditingProduct(null);
    setSelectedCategory([]); setSelectedSubCategory([]); setSelectedSubSubCategory([]);
    setSelectedColors([]); setSelectedMaterials([]);
    setFormData(INITIAL_FORM_STATE); setRemoveImagesUrl([]); setRemoveGiftImagesUrl([]);
    setInitialFormData(null); setInitialSelections(null);
  }, []);

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setFormData({ ...formData, mainImage: file, mainImagePreview: URL.createObjectURL(file) });
  };

  const handleAdditionalImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]; if (!file) return;
    const newImages = [...formData.additionalImages]; const newPreviews = [...formData.additionalImagePreviews];
    newImages[index] = file; newPreviews[index] = URL.createObjectURL(file);
    setFormData({ ...formData, additionalImages: newImages, additionalImagePreviews: newPreviews });
  };

  const handleGiftImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]; if (!file) return;
    const newImages = [...formData.giftImages]; const newPreviews = [...formData.giftImagePreviews];
    newImages[index] = file; newPreviews[index] = URL.createObjectURL(file);
    setFormData({ ...formData, giftImages: newImages, giftImagePreviews: newPreviews });
  };

  const removeMainImage = () => {
    if (formData.mainImagePreview?.startsWith("blob:")) URL.revokeObjectURL(formData.mainImagePreview);
    setFormData({ ...formData, mainImage: null, mainImagePreview: "" });
  };

  const removeAdditionalImage = (index: number) => {
    const newImages = [...formData.additionalImages]; const newPreviews = [...formData.additionalImagePreviews];
    if (newPreviews[index].startsWith("blob:")) URL.revokeObjectURL(newPreviews[index]);
    newImages[index] = null; newPreviews[index] = "";
    setFormData({ ...formData, additionalImages: newImages, additionalImagePreviews: newPreviews });
  };

  const removeGiftImage = (index: number) => {
    const newImages = [...formData.giftImages]; const newPreviews = [...formData.giftImagePreviews];
    if (newPreviews[index].startsWith("blob:")) URL.revokeObjectURL(newPreviews[index]);
    newImages[index] = null; newPreviews[index] = "";
    setFormData({ ...formData, giftImages: newImages, giftImagePreviews: newPreviews });
  };

  const showDetails = (item: Product) => router.push(`/dashboard/products/${item._id}`);

  const handleAutoTag = async () => {
    setTagLoading(true);
    try {
      const data = await api.post<{ text: string }>("/api/admin/ai/generate-tags", { name: formData.name, description: formData.description });
      if (data?.text) {
        const newTags = data.text.split(",").map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0);
        const existing = new Set(formData.tags.map((t) => t.toLowerCase()));
        const merged = [...formData.tags];
        for (const tag of newTags) { if (!existing.has(tag.toLowerCase())) { merged.push(tag); existing.add(tag.toLowerCase()); } }
        setFormData({ ...formData, tags: merged });
        toast({ title: "AI: Tags generated" });
      }
    } catch (err) {
      toast({ title: `AI: ${err instanceof ApiClientError ? err.message : "Failed to generate tags. Please try again."}`, variant: "destructive" });
    } finally { setTagLoading(false); }
  };

  const handleStatusChange = (item: Product) => { setPendingStatusProduct(item); setStatusConfirmOpen(true); };
  const confirmStatusChange = () => { if (pendingStatusProduct) { statusMutation.mutate(pendingStatusProduct._id); } setPendingStatusProduct(null); setStatusConfirmOpen(false); };

  const toggleRemoveImagesUrl = (url: string) => {
    setRemoveImagesUrl((prev) => prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]);
  };

  const toggleRemoveGiftImagesUrl = (url: string) => {
    setRemoveGiftImagesUrl((prev) => prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]);
  };

  const columns: Column<Product>[] = [
    {
      key: "name", label: "Name",
      render: (item: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            <Image onClick={() => showDetails(item)} width={64} height={64} src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-full object-cover cursor-pointer" />
          </div>
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    { key: "price", label: "Price", render: (item: Product) => (<span className="font-semibold flex items-center"><IndianRupee size={16} />{item.price}</span>) },
    { key: "stock", label: "Stock", render: (item: Product) => (<Badge variant={item.stock > 0 ? "default" : "destructive"} className="font-mono">{item.stock}</Badge>) },
    { key: "discount_price", label: "Discount Price", render: (item: Product) => (<span className="flex items-center"><IndianRupee size={16} />{item.discount_price}</span>) },
    {
      key: "videoUrl", label: "Has Video",
      render: (item: Product) => item.videoUrl ? (<span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20"><Video className="h-3.5 w-3.5" />Yes</span>) : (<span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Video className="h-3.5 w-3.5" />No</span>),
    },
    // Restore column — only shows in "Deleted Only" view
    ...(deletedFilter === "deleted" ? [{
      key: "restore" as any, label: "Restore",
      render: (item: Product) => (
        <Button variant="outline" size="sm" onClick={() => restoreMutation.mutate(item._id)} className="transition-all duration-200 hover:scale-105">
          <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          Restore
        </Button>
      ),
    }] : []),
    {
      key: "status", label: "Status",
      render: (item: Product) => {
        const styles: Record<string, string> = { active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", inactive: "bg-destructive/10 text-destructive border-destructive/20", draft: "bg-secondary text-secondary-foreground border-secondary" };
        const labels: Record<string, string> = { active: "Active", inactive: "Inactive", draft: "Draft" };
        return (<Button disabled={togglingIds.has(item._id)} variant="outline" className={`font-mono cursor-pointer border ${styles[item.status] ?? "bg-muted text-foreground"}`} onClick={() => handleStatusChange(item)}>{togglingIds.has(item._id) ? "Changing.." : labels[item.status] ?? item.status}</Button>);
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-pulse">
          <div className="space-y-2"><Skeleton className="h-9 w-32" /><Skeleton className="h-5 w-48" /></div>
          <div className="flex gap-2"><Skeleton className="h-9 w-24" /><Skeleton className="h-9 w-32" /></div>
        </div>
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="rounded-lg border border-border overflow-hidden">
          <Table><TableHeader><TableRow className="bg-muted/50">{["Product", "Category", "Price", "Stock", "Status"].map((h) => (<TableHead key={h}>{h}</TableHead>))}<TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>{Array.from({ length: 5 }).map((_, i) => (<TableRow key={i}>{["Product", "Category", "Price", "Stock", "Status"].map((h) => (<TableCell key={h}><Skeleton className="h-5 w-full" /></TableCell>))}<TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8 rounded" /><Skeleton className="h-8 w-8 rounded" /></div></TableCell></TableRow>))}</TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (isError) {
    return (<ErrorState title="Failed to load products" message={error instanceof Error ? error.message : "An unexpected error occurred. Please try refreshing the page."} onRetry={() => queryClient.invalidateQueries({ queryKey: ["products"] })} />);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div><h1 className="text-3xl font-bold tracking-tight">Products</h1><p className="text-muted-foreground">Manage your product inventory</p></div>
        <div className="flex items-center gap-2">
          <Select value={videoFilter} onValueChange={(val) => { setVideoFilter(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Filter by video" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Products</SelectItem><SelectItem value="hasVideo">Has Video</SelectItem><SelectItem value="noVideo">No Video</SelectItem></SelectContent>
          </Select>
          <Select value={deletedFilter} onValueChange={setDeletedFilter}>
            <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent><SelectItem value="active">Active Only</SelectItem><SelectItem value="all">All (incl. deleted)</SelectItem><SelectItem value="deleted">Deleted Only</SelectItem></SelectContent>
          </Select>
          <ExportButtons data={products} filename="products" />
          <Button onClick={() => setDrawerOpen(true)} className="transition-all duration-200 hover:scale-105"><Plus className="h-4 w-4 mr-2" />Add Product</Button>
        </div>
      </div>

      <DataTable data={products} columns={columns} onEdit={handleEdit} onDelete={handleDelete} searchPlaceholder="Search products..." externalPagination={{ totalItems, currentPage, onPageChange: (page) => setCurrentPage(page) }} />

      <Drawer isOpen={drawerOpen} onClose={closeDrawer} title={editingProduct ? "Edit Product" : "Add New Product"} className={isMobile ? "!w-full" : "!w-[60vw] !max-w-[1800px]"}>
        <ProductForm
          formData={formData} setFormData={setFormData}
          selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
          selectedSubCategory={selectedSubCategory} setSelectedSubCategory={setSelectedSubCategory}
          selectedSubSubCategory={selectedSubSubCategory} setSelectedSubSubCategory={setSelectedSubSubCategory}
          selectedColors={selectedColors} setSelectedColors={setSelectedColors}
          selectedMaterials={selectedMaterials} setSelectedMaterials={setSelectedMaterials}
          removeImagesUrl={removeImagesUrl} toggleRemoveImagesUrl={toggleRemoveImagesUrl}
          removeGiftImagesUrl={removeGiftImagesUrl} toggleRemoveGiftImagesUrl={toggleRemoveGiftImagesUrl}
          categories={categories} subCategories={subCategories} subSubCategories={subSubCategories}
          colors={colors} materials={materials}
          tagLoading={tagLoading} handleAutoTag={handleAutoTag}
          handleMainImageChange={handleMainImageChange} handleAdditionalImageChange={handleAdditionalImageChange}
          handleGiftImageChange={handleGiftImageChange}
          removeMainImage={removeMainImage} removeAdditionalImage={removeAdditionalImage}
          removeGiftImage={removeGiftImage}
          isMobile={isMobile} isSaving={saveMutation.isPending} editingProduct={!!editingProduct}
          closeDrawer={closeDrawer} handleSubmit={handleSubmit}
        />
      </Drawer>

      <AlertDialogUse isOpen={alertOpen} onClose={() => setAlertOpen(false)} onConfirm={confirmDelete} title="Delete Product" description="Are you sure you want to delete this product? This action cannot be undone." />
      <AlertDialogUse isOpen={statusConfirmOpen} onClose={() => { setStatusConfirmOpen(false); setPendingStatusProduct(null); }} onConfirm={confirmStatusChange} title="Change Product Status" description={`Are you sure you want to change the status of "${pendingStatusProduct?.name ?? ""}" to ${pendingStatusProduct?.status === "active" ? "inactive" : "active"}?`} confirmText="Change Status" />
    </div>
  );
}
