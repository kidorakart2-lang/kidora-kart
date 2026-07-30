"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Drawer } from "@/components/drawer";
import { ExportButtons } from "@/components/export-buttons";
import { AlertDialogUse } from "@/components/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, ApiClientError } from "@/lib/api";
import { ErrorState } from "@/components/ui/error-state";
import type { Banner, LinkOption } from "@/lib/types";
import { invalidateCache } from "@/lib/invalidate-cache";
import SingleImageUploader from "@/components/SingleImageUploader";
import BannerLinkPicker from "@/components/banner/BannerLinkPicker";

export default function BannersPage() {
  const [btnLoading, setBtnLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [linkOptions, setLinkOptions] = useState<{
    products: LinkOption[];
    categories: LinkOption[];
    subCategories: LinkOption[];
    subSubCategories: LinkOption[];
  }>({ products: [], categories: [], subCategories: [], subSubCategories: [] });
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    description: string;
    image: string | File;
    linkType: string;
    linkTarget: string;
    linkExternalUrl: string;
  }>({
    description: "",
    image: "",
    linkType: "",
    linkTarget: "",
    linkExternalUrl: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [deletedFilter, setDeletedFilter] = useState<string>("active");

  // ── Link options query ──
  const { data: linkOptionsData } = useQuery({
    queryKey: ["banner-link-options"],
    queryFn: async () => {
      const [categories, products] = await Promise.all([
        api.get<LinkOption[]>("/api/admin/banner/link-options/categories"),
        api.get<LinkOption[]>("/api/admin/banner/link-options/products?limit=100"),
      ]);
      return { categories: categories ?? [], products: products ?? [], subCategories: [] as LinkOption[], subSubCategories: [] as LinkOption[] };
    },
    staleTime: 10 * 60 * 1000,
  });

  // Keep linkOptions in sync with query data + dynamic sub categories
  useEffect(() => {
    if (linkOptionsData) {
      setLinkOptions((prev) => ({ ...prev, ...linkOptionsData, subCategories: prev.subCategories, subSubCategories: prev.subSubCategories }));
    }
  }, [linkOptionsData]);

  const loadSubCategories = async (categoryId: string) => {
    try {
      const res = await api.get<LinkOption[]>(`/api/admin/banner/link-options/sub-categories?categoryId=${categoryId}`);
      setLinkOptions((prev) => ({ ...prev, subCategories: res ?? [] }));
    } catch { /* silently fail */ }
  };

  const loadSubSubCategories = async (subCategoryId: string) => {
    try {
      const res = await api.get<LinkOption[]>(`/api/admin/banner/link-options/sub-sub-categories?subCategoryId=${subCategoryId}`);
      setLinkOptions((prev) => ({ ...prev, subSubCategories: res ?? [] }));
    } catch { /* silently fail */ }
  };

  const { data: banners = [], isLoading: loading, isError, error } = useQuery<Banner[]>({
    queryKey: ["banners", deletedFilter],
    queryFn: async () => {
      const data = await api.post<Banner[]>("/api/admin/banner/view", {
        isDeletedAt: deletedFilter === "active" ? undefined : deletedFilter,
      });
      return data ?? [];
    },
  });

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setImagePreview(banner.image);
    setFormData({
      description: banner.description,
      image: banner.image,
      linkType: banner.link?.type || "",
      linkTarget: banner.link?.target || "",
      linkExternalUrl: banner.link?.externalUrl || "",
    });
    setDrawerOpen(true);
  };

  // ── Mutations ──
  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/admin/banner/restore/${id}`, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      invalidateCache(["homepage"]);
      toast({ title: "Banner restored successfully" });
    },
    onError: (error: Error) => {
      toast({ title: error instanceof ApiClientError ? error.message : "Failed to restore banner", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/admin/banner/delete/${id}`, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      invalidateCache(["homepage"]);
      toast({ title: "Banner deleted successfully" });
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: error instanceof ApiClientError ? error.message : "Failed to delete banner", variant: "destructive" });
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    },
  });

  const createBannerMutation = useMutation({
    mutationFn: (formDataToSend: FormData) => api.post("/api/admin/banner/create", formDataToSend),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      queryClient.invalidateQueries({ queryKey: ["banner-link-options"] });
      invalidateCache(["homepage"]);
      toast({ title: "Banner created successfully" });
      resetForm();
    },
    onError: (error: Error) => toast({ title: error instanceof ApiClientError ? error.message : "Failed to create banner", variant: "destructive" }),
  });

  const updateBannerMutation = useMutation({
    mutationFn: (payload: { id: string; formData: FormData }) => api.put(`/api/admin/banner/update/${payload.id}`, payload.formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      queryClient.invalidateQueries({ queryKey: ["banner-link-options"] });
      invalidateCache(["homepage"]);
      toast({ title: "Banner updated successfully" });
      resetForm();
    },
    onError: (error: Error) => toast({ title: error instanceof ApiClientError ? error.message : "Failed to update banner", variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: (id: string) => api.post("/api/admin/banner/change-status", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      invalidateCache(["homepage"]);
    },
    onError: (error: Error) => toast({ title: error instanceof ApiClientError ? error.message : "Failed to change status", variant: "destructive" }),
  });

  const isPending = deleteMutation.isPending || createBannerMutation.isPending || updateBannerMutation.isPending || statusMutation.isPending;

  const resetForm = () => {
    setDrawerOpen(false);
    setEditingBanner(null);
    setProductSearch("");
    setSelectedCategoryId("");
    setSelectedSubCategoryId("");
    setImagePreview(null);
    setFormData({ description: "", image: "", linkType: "", linkTarget: "", linkExternalUrl: "" });
  };

  const handleDelete = (id: string) => {
    setBannerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (bannerToDelete) deleteMutation.mutate(bannerToDelete);
  };

  const buildFormDataToSend = () => {
    const fd = new FormData();
    fd.append("description", formData.description);
    fd.append("image", formData.image);
    if (formData.linkType) {
      const linkData: Record<string, unknown> = { type: formData.linkType };
      if (formData.linkType === "external") {
        linkData.externalUrl = formData.linkExternalUrl;
      } else if (formData.linkTarget) {
        linkData.target = formData.linkTarget;
      }
      fd.append("link", JSON.stringify(linkData));
    } else {
      fd.append("link", "null");
    }
    return fd;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = buildFormDataToSend();
    if (editingBanner) {
      updateBannerMutation.mutate({ id: editingBanner._id, formData: fd });
    } else {
      createBannerMutation.mutate(fd);
    }
  };

  const handleStatusChange = (id: string) => {
    statusMutation.mutate(id);
  };

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load banners"
          message={error instanceof Error ? error.message : "Could not fetch banners from the server."}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["banners"] })}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground">
            Manage your promotional banners
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <ExportButtons data={banners} filename="banners" />
          <Button
            onClick={() => {
              setEditingBanner(null);
              setProductSearch("");
              setSelectedCategoryId("");
              setSelectedSubCategoryId("");
              setImagePreview(null);
              setFormData({
                description: "",
                image: "",
                linkType: "",
                linkTarget: "",
                linkExternalUrl: "",
              });
              setDrawerOpen(true);
            }}
            className="transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Banner
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map((banner, index) => (
          <Card
            key={banner._id}
            className="overflow-hidden group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="relative h-48 bg-muted overflow-hidden">
              <img
                src={
                  banner.image ||
                  "/placeholder.svg?height=200&width=400&query=banner"
                }
                alt={banner.description}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <Badge
                variant={banner.status ? "default" : "secondary"}
                className="absolute top-2 right-2 animate-in zoom-in duration-300"
              >
                {banner.status ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  {banner.description}
                </p>
              </div>
              {banner.link && (
                <div className="flex items-center gap-1.5">
                  {banner.link.url || banner.link.label || banner.link.externalUrl ? (
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {banner.link.label || banner.link.url || banner.link.externalUrl}
                    </span>
                  ) : banner.link.target ? (
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                      ID: {banner.link.target}
                    </span>
                  ) : null}
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {banner.link.type === "external" ? (
                      <>
                        <ExternalLink className="h-3 w-3 mr-0.5" />
                        external
                      </>
                    ) : (
                      banner.link.type
                    )}
                  </Badge>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(banner)}
                  className="flex-1 transition-all duration-200 hover:scale-105"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(banner._id)}
                  className="flex-1 transition-all duration-200 hover:scale-105"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
                {deletedFilter === "deleted" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => restoreMutation.mutate(banner._id)}
                    className="flex-1 transition-all duration-200 hover:scale-105"
                  >
                    <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    Restore
                  </Button>
                )}
              </div>
              <div className="">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(banner._id)}
                  className="flex-1 transition-all duration-200 hover:scale-105 w-full"
                >
                  {banner.status ? (
                    <>
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      Active
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5 mr-1.5" />
                      Inactive
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingBanner ? "Edit Banner" : "Add Banner"}
      >
        <form
          onSubmit={handleSubmit}
          className="space-y-4 overflow-y-auto h-full pb-20"
        >
          <div className="space-y-2 animate-in slide-in-from-right duration-300">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>
          <SingleImageUploader
            label="Banner Image"
            value={imagePreview}
            onChange={(file) => {
              if (file) {
                setFormData({ ...formData, image: file });
                const reader = new FileReader();
                reader.onload = (event) => setImagePreview(event.target?.result as string);
                reader.readAsDataURL(file);
              } else {
                setFormData({ ...formData, image: "" });
                setImagePreview(null);
              }
            }}
            required
            disabled={btnLoading}
            className="animate-in slide-in-from-right duration-300 delay-100"
          />{" "}
          <BannerLinkPicker
            linkType={formData.linkType}
            linkTarget={formData.linkTarget}
            linkExternalUrl={formData.linkExternalUrl}
            productSearch={productSearch}
            selectedCategoryId={selectedCategoryId}
            selectedSubCategoryId={selectedSubCategoryId}
            linkOptions={linkOptions}
            onLinkTypeChange={(value) => {
              setFormData({ ...formData, linkType: value, linkTarget: "", linkExternalUrl: "" });
              setSelectedCategoryId("");
              setSelectedSubCategoryId("");
            }}
            onLinkTargetChange={(value) => setFormData({ ...formData, linkTarget: value })}
            onExternalUrlChange={(value) => setFormData({ ...formData, linkExternalUrl: value })}
            onProductSearchChange={setProductSearch}
            onCategoryIdChange={(value) => {
              setSelectedCategoryId(value);
              setFormData({ ...formData, linkTarget: "" });
              setSelectedSubCategoryId("");
              loadSubCategories(value);
            }}
            onSubCategoryIdChange={(value) => {
              setSelectedSubCategoryId(value);
              setFormData({ ...formData, linkTarget: "" });
              loadSubSubCategories(value);
            }}
          />
          <Button
            type="submit"
            disabled={createBannerMutation.isPending || updateBannerMutation.isPending}
            className="w-full animate-in slide-in-from-bottom duration-300 delay-200"
          >
            {createBannerMutation.isPending || updateBannerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </>
            ) : editingBanner ? (
              "Update Banner"
            ) : (
              "Create Banner"
            )}
          </Button>
        </form>
      </Drawer>

      <AlertDialogUse
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Banner"
        description="Are you sure you want to delete this banner? This action cannot be undone."
      />
    </div>
  );
}
