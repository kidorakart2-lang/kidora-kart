"use client";

import { useEffect, useState } from "react";
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
  Link as LinkIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, ApiClientError } from "@/lib/api";
import type { Banner, LinkOption } from "@/lib/types";

export default function BannersPage() {
  const [btnLoading, setBtnLoading] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadBanners();
    loadLinkOptions();
  }, []);

  const loadLinkOptions = async () => {
    try {
      const [categories, products] = await Promise.all([
        api.get<LinkOption[]>("/api/admin/banner/link-options/categories"),
        api.get<LinkOption[]>("/api/admin/banner/link-options/products?limit=100"),
      ]);
      setLinkOptions((prev) => ({
        ...prev,
        categories: categories ?? [],
        products: products ?? [],
      }));
    } catch {
      // silently fail
    }
  };

  const loadSubCategories = async (categoryId: string) => {
    try {
      const res = await api.get<LinkOption[]>(`/api/admin/banner/link-options/sub-categories?categoryId=${categoryId}`);
      setLinkOptions((prev) => ({
        ...prev,
        subCategories: res ?? [],
      }));
    } catch {
      // silently fail
    }
  };

  const loadSubSubCategories = async (subCategoryId: string) => {
    try {
      const res = await api.get<LinkOption[]>(`/api/admin/banner/link-options/sub-sub-categories?subCategoryId=${subCategoryId}`);
      setLinkOptions((prev) => ({
        ...prev,
        subSubCategories: res ?? [],
      }));
    } catch {
      // silently fail
    }
  };

  const loadBanners = async () => {
    setLoading(true);
    try {
      const data = await api.post<Banner[]>("/api/admin/banner/view", {});
      setBanners(data ?? []);
    } catch (error) {
      toast({
        title: "Error loading banners",
        description: error instanceof ApiClientError ? error.message : "Failed to load banners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      description: banner.description,
      image: banner.image,
      linkType: banner.link?.type || "",
      linkTarget: banner.link?.target || "",
      linkExternalUrl: banner.link?.externalUrl || "",
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    setBannerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;

    try {
      await api.put(`/api/admin/banner/delete/${bannerToDelete}`, { id: bannerToDelete });
      loadBanners();
      toast({ title: "Banner deleted successfully" });
    } catch (error) {
      toast({
        title: "Error deleting banner",
        description: error instanceof ApiClientError ? error.message : "Failed to delete banner",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append("description", formData.description);
    formDataToSend.append("image", formData.image);

    // Append link data as JSON string, or null to clear the link
    if (formData.linkType) {
      const linkData: Record<string, unknown> = { type: formData.linkType };
      if (formData.linkType === "external") {
        linkData.externalUrl = formData.linkExternalUrl;
      } else if (formData.linkTarget) {
        linkData.target = formData.linkTarget;
      }
      formDataToSend.append("link", JSON.stringify(linkData));
    } else {
      // Explicitly clear link when "No link" is selected
      formDataToSend.append("link", "null");
    }

    if (editingBanner) {
      setBtnLoading(true);
      try {
        await api.put(`/api/admin/banner/update/${editingBanner._id}`, formDataToSend);
        loadBanners();
        toast({ title: "Banner updated successfully" });
      } catch (error) {
        toast({
          title: "Error updating banner",
          description: error instanceof ApiClientError ? error.message : "Failed to update banner",
          variant: "destructive",
        });
      } finally {
        setBtnLoading(false);
      }
    } else {
      setBtnLoading(true);
      try {
        await api.post("/api/admin/banner/create", formDataToSend);
        loadBanners();
        toast({ title: "Banner created successfully" });
      } catch (error) {
        toast({
          title: "Error creating banner",
          description: error instanceof ApiClientError ? error.message : "Failed to create banner",
          variant: "destructive",
        });
      } finally {
        setBtnLoading(false);
      }
    }

    setDrawerOpen(false);
    setEditingBanner(null);
    setProductSearch("");
    setSelectedCategoryId("");
    setSelectedSubCategoryId("");
    setFormData({
      description: "",
      image: "",
      linkType: "",
      linkTarget: "",
      linkExternalUrl: "",
    });
  };

  const handleStatusChange = async (id: string) => {
    try {
      await api.post("/api/admin/banner/change-status", { id });
      loadBanners();
    } catch (error) {
      toast({
        title: "Error changing status",
        description: error instanceof ApiClientError ? error.message : "Failed to change status",
        variant: "destructive",
      });
    }
  };

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
          <ExportButtons
            data={banners as unknown as Record<string, unknown>[]}
            filename="banners"
          />
          <Button
            onClick={() => {
              setEditingBanner(null);
              setProductSearch("");
              setSelectedCategoryId("");
              setSelectedSubCategoryId("");
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
              {banner.link?.url && (
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-xs font-mono truncate max-w-full gap-1"
                  >
                    <LinkIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{banner.link.url}</span>
                  </Badge>
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

          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-100">
            <Label htmlFor="image">Banner Image</Label>
            <div className="flex flex-col items-center justify-center w-full">
              <label
                htmlFor="dropzone-file"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 transition-colors"
              >
                {formData.image ? (
                  <div className="relative w-full h-full">
                    <img
                      src={
                        typeof formData.image === "string"
                          ? formData.image
                          : formData.image instanceof File
                            ? URL.createObjectURL(formData.image)
                            : ""
                      }
                      alt="Preview"
                      className="w-full h-full object-contain rounded"
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="bg-white/80 p-2 rounded-full">
                        <svg
                          className="w-8 h-8 text-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                    <svg
                      className="w-8 h-8 mb-4 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, JPEG (MAX. 5MB)
                    </p>
                  </div>
                )}
                <input
                  id="dropzone-file"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, image: file });
                    }
                  }}
                />
              </label>
            </div>
          </div>            {/* ── Link target section ── */}
          <div className="space-y-3 animate-in slide-in-from-right duration-300 delay-50 border rounded-lg p-4 bg-muted/30">
            <Label className="text-sm font-semibold">
              Link Target (optional)
            </Label>

            <Select
              value={formData.linkType}
              onValueChange={(value) => {
                setFormData({
                  ...formData,
                  linkType: value,
                  linkTarget: "",
                  linkExternalUrl: "",
                });
                setSelectedCategoryId("");
                setSelectedSubCategoryId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="No link" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No link</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="subCategory">Sub Category</SelectItem>
                <SelectItem value="subSubCategory">Sub Sub Category</SelectItem>
                <SelectItem value="external">External URL</SelectItem>
              </SelectContent>
            </Select>

            {/* Product picker */}
            {formData.linkType === "product" && (
              <div className="space-y-2">
                <Label>Select Product</Label>
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
                <div className="max-h-36 overflow-y-auto border rounded-md p-1 space-y-0.5">
                  {linkOptions.products
                    .filter((p) => {
                      const q = productSearch.toLowerCase();
                      return (
                        !q ||
                        p.name.toLowerCase().includes(q) ||
                        p.slug.toLowerCase().includes(q)
                      );
                    })
                    .slice(0, 30)
                    .map((p) => (
                      <label
                        key={p._id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
                          formData.linkTarget === p._id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        <input
                          type="radio"
                          name="linkTarget"
                          checked={formData.linkTarget === p._id}
                          onChange={() =>
                            setFormData({ ...formData, linkTarget: p._id })
                          }
                          className="accent-primary"
                        />
                        <span className="truncate">{p.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          /{p.slug}
                        </span>
                      </label>
                    ))}
                  {linkOptions.products.filter((p) => {
                    const q = productSearch.toLowerCase();
                    return (
                      !q ||
                      p.name.toLowerCase().includes(q) ||
                      p.slug.toLowerCase().includes(q)
                    );
                  }).length === 0 && (
                    <p className="text-sm text-muted-foreground p-2">
                      No products found
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Category picker */}
            {formData.linkType === "category" && (
              <div className="space-y-2">
                <Label>Select Category</Label>
                <div className="max-h-36 overflow-y-auto border rounded-md p-1 space-y-0.5">
                  {linkOptions.categories.map((c) => (
                    <label
                      key={c._id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
                        formData.linkTarget === c._id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <input
                        type="radio"
                        name="linkTarget"
                        checked={formData.linkTarget === c._id}
                        onChange={() =>
                          setFormData({ ...formData, linkTarget: c._id })
                        }
                        className="accent-primary"
                      />
                      <span className="truncate">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Sub Category picker (cascading: pick category first) */}
            {formData.linkType === "subCategory" && (
              <div className="space-y-2">
                <Label>Select Category</Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={(value) => {
                    setSelectedCategoryId(value);
                    setFormData({ ...formData, linkTarget: "" });
                    setSelectedSubCategoryId("");
                    loadSubCategories(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {linkOptions.categories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedCategoryId && (
                  <>
                    <Label>Select Sub Category</Label>
                    <div className="max-h-36 overflow-y-auto border rounded-md p-1 space-y-0.5">
                      {linkOptions.subCategories.map((sc) => (
                        <label
                          key={sc._id}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
                            formData.linkTarget === sc._id
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          }`}
                        >
                          <input
                            type="radio"
                            name="linkTarget"
                            checked={formData.linkTarget === sc._id}
                            onChange={() =>
                              setFormData({ ...formData, linkTarget: sc._id })
                            }
                            className="accent-primary"
                          />
                          <span className="truncate">{sc.name}</span>
                        </label>
                      ))}
                      {linkOptions.subCategories.length === 0 && (
                        <p className="text-sm text-muted-foreground p-2">
                          No sub categories
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Sub Sub Category picker (cascading: category → sub → sub-sub) */}
            {formData.linkType === "subSubCategory" && (
              <div className="space-y-2">
                <Label>Select Category</Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={(value) => {
                    setSelectedCategoryId(value);
                    setFormData({ ...formData, linkTarget: "" });
                    setSelectedSubCategoryId("");
                    loadSubCategories(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {linkOptions.categories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedCategoryId && (
                  <>
                    <Label>Select Sub Category</Label>
                    <Select
                      value={selectedSubCategoryId}
                      onValueChange={(value) => {
                        setSelectedSubCategoryId(value);
                        setFormData({ ...formData, linkTarget: "" });
                        loadSubSubCategories(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a sub category" />
                      </SelectTrigger>
                      <SelectContent>
                        {linkOptions.subCategories.map((sc) => (
                          <SelectItem key={sc._id} value={sc._id}>
                            {sc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}

                {selectedSubCategoryId && (
                  <>
                    <Label>Select Sub Sub Category</Label>
                    <div className="max-h-36 overflow-y-auto border rounded-md p-1 space-y-0.5">
                      {linkOptions.subSubCategories.map((ssc) => (
                        <label
                          key={ssc._id}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
                            formData.linkTarget === ssc._id
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          }`}
                        >
                          <input
                            type="radio"
                            name="linkTarget"
                            checked={formData.linkTarget === ssc._id}
                            onChange={() =>
                              setFormData({ ...formData, linkTarget: ssc._id })
                            }
                            className="accent-primary"
                          />
                          <span className="truncate">{ssc.name}</span>
                        </label>
                      ))}
                      {linkOptions.subSubCategories.length === 0 && (
                        <p className="text-sm text-muted-foreground p-2">
                          No sub sub categories
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* External URL */}
            {formData.linkType === "external" && (
              <div className="space-y-2">
                <Label htmlFor="externalUrl">External URL</Label>
                <Input
                  id="externalUrl"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.linkExternalUrl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      linkExternalUrl: e.target.value,
                    })
                  }
                />
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={btnLoading}
            className="w-full animate-in slide-in-from-bottom duration-300 delay-200"
          >
            {btnLoading ? (
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
