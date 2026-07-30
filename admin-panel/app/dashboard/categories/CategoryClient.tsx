"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Drawer } from "@/components/drawer";
import { ExportButtons } from "@/components/export-buttons";
import { AlertDialogUse } from "@/components/alert-dialog";
import CascadeDeleteDialog from "@/components/CascadeDeleteDialog";
import { Plus, Edit, Trash2, FolderTree, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { invalidateCache } from "@/lib/invalidate-cache";
import SingleImageUploader from "@/components/SingleImageUploader";
import BannersSelect from "@/components/BannersSelect";


interface Category {
  _id: string;
  name: string;
  image?: string;
  status: boolean;
}

interface FormState {
  name: string;
  image: File | null;
  bannerId: string;
}



const fetchCategories = async (isDeletedAt?: string): Promise<Category[]> => {
  return api.post<Category[]>("/api/admin/category/view", { isDeletedAt });
};

const createCategory = async (formData: FormData) => {
  return api.post("/api/admin/category/create", formData);
};

const updateCategory = async ({ id, formData }: { id: string; formData: FormData }) => {
  return api.put("/api/admin/category/update/" + id, formData);
};

const deleteCategory = async (id: string) => {
  return api.put("/api/admin/category/delete/" + id, { id });
};

const changeCategoryStatus = async (id: string) => {
  return api.put("/api/admin/category/change-status/" + id, { id });
};

export default function CategoriesClient({ initialCategories = [] }: { initialCategories?: Category[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [cascadeDialogOpen, setCascadeDialogOpen] = useState(false);
  const [cascadeModel, setCascadeModel] = useState("Categories");
  const [cascadeId, setCascadeId] = useState("");
  const [cascadeName, setCascadeName] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deletedFilter, setDeletedFilter] = useState<string>("active");
  const [formData, setFormData] = useState<FormState>({
    name: "",
    image: null,
    bannerId: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ["categories", deletedFilter],
    queryFn: () => fetchCategories(deletedFilter === "active" ? undefined : deletedFilter),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      invalidateCache(["categories", "homepage", "navigation", "banners"]);
      toast({ title: "Category created successfully" });
      closeDrawer();
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      invalidateCache(["categories", "homepage", "navigation", "banners"]);
      toast({ title: "Category updated successfully" });
      closeDrawer();
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      invalidateCache(["categories", "homepage", "navigation", "banners"]);
      toast({ title: "Category deleted successfully" });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: changeCategoryStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      invalidateCache(["categories", "homepage", "navigation", "banners"]);
      toast({ title: "Category status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", image: null, bannerId: "" });
    setImagePreview(null);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      image: null,
      bannerId: (category as any).bannerId || "",
    });
    setImagePreview(category.image || null);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    setCascadeId(id);
    setCascadeName(name);
    setCascadeModel("Categories");
    setCascadeDialogOpen(true);
  };

  const handleCascadeComplete = (id: string) => {
    setCascadeDialogOpen(false);
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete);
    }
  };



  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({ title: "Category name is required", variant: "destructive" });
      return;
    }

    const submitData = new FormData();
    submitData.append("name", formData.name);
    if (formData.bannerId) submitData.append("bannerId", formData.bannerId);
    if (formData.image instanceof File) {
      submitData.append("image", formData.image);
    }

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, formData: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleChangeStatus = (category: Category) => {
    statusMutation.mutate(category._id);
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    statusMutation.isPending;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load categories"
        message={error instanceof Error ? error.message : "An unexpected error occurred. Please try refreshing the page."}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ["categories"] })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Organize your products into categories
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
          <ExportButtons data={categories} filename="categories" />
          <Button
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: "", image: null, bannerId: "" });
              setImagePreview(null);
              setDrawerOpen(true);
            }}
            className="transition-all duration-200 hover:scale-105"
            disabled={isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {categories.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderTree />
            </EmptyMedia>
            <EmptyTitle>No categories yet</EmptyTitle>
            <EmptyDescription>
              Create your first category to get started
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              onClick={() => {
                setEditingCategory(null);
                setFormData({ name: "", image: null, bannerId: "" });
                setImagePreview(null);
                setDrawerOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category: Category, index: number) => (
            <Card
              key={category._id}
              className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-0">
                <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
                  <img
                    src={category.image || "/placeholder.svg"}
                    alt={category.name}
                    className="w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-card/80 backdrop-blur-sm flex items-center justify-center">
                        <FolderTree className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-card-foreground">
                          {category.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={category.status ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {category.status ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="flex-1 transition-all duration-200 hover:scale-105"
                        disabled={isPending}
                      >
                        <Edit className="h-3 w-3 mr-2" />
                        Edit
                      </Button>                      <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(category._id, category.name)}
                            className="flex-1 transition-all duration-200 hover:scale-105 text-destructive hover:text-destructive"
                            disabled={isPending}
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete
                          </Button>
                    </div>
                    <Button
                      variant={category.status ? "default" : "secondary"}
                      size="sm"
                      onClick={() => handleChangeStatus(category)}
                      className="w-full transition-all duration-200"
                      disabled={isPending}
                    >
                      {statusMutation.isPending ? (
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      ) : null}
                      {category.status ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Drawer
        isOpen={drawerOpen}
        onClose={() => {
          if (!isPending) closeDrawer();
        }}
        title={editingCategory ? "Edit Category" : "Add Category"}
      >
        <div className="space-y-4">
          <div className="space-y-2 animate-in slide-in-from-right duration-300">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={isPending}
              placeholder="Enter category name"
            />
          </div>

          <SingleImageUploader
            label="Category Image"
            value={imagePreview}
            onChange={(file) => {
              if (file) {
                setFormData({ ...formData, image: file });
                const reader = new FileReader();
                reader.onload = (event) => setImagePreview(event.target?.result as string);
                reader.readAsDataURL(file);
              } else {
                setFormData({ ...formData, image: null });
                setImagePreview(null);
              }
            }}
            required
            disabled={isPending}
            className="animate-in slide-in-from-right duration-300 delay-75"
          />

          <BannersSelect
            value={formData.bannerId}
            onChange={(bannerId) => setFormData({ ...formData, bannerId })}
            disabled={isPending}
          />

          <Button
            onClick={handleSubmit}
            className="w-full animate-in slide-in-from-bottom duration-300 delay-150"
            disabled={isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {editingCategory ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{editingCategory ? "Update Category" : "Create Category"}</>
            )}
          </Button>
        </div>
      </Drawer>

      {/* Cascade delete dialog — shows reference usage before deleting */}
      <CascadeDeleteDialog
        open={cascadeDialogOpen}
        onClose={() => setCascadeDialogOpen(false)}
        model={cascadeModel}
        id={cascadeId}
        entityName={cascadeName}
        onProceedToDelete={handleCascadeComplete}
        isDeleting={deleteMutation.isPending}
      />

      <AlertDialogUse
        isOpen={deleteDialogOpen}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
          }
        }}
        onConfirm={confirmDelete}
        title="Delete Category"
        description="Are you sure you want to soft-delete this category?"
      />
    </div>
  );
}
