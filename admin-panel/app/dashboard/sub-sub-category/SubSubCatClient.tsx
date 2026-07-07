"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiClientError } from "@/lib/api";
import type { Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Drawer } from "@/components/drawer";
import { ExportButtons } from "@/components/export-buttons";
import { AlertDialogUse } from "@/components/alert-dialog";
import { Plus, Edit, Trash2, FolderTree, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import NewMultiSelect from "../../../components/NewMultiSelect";
import { invalidateCache } from "@/lib/invalidate-cache";
import SingleImageUploader from "@/components/SingleImageUploader";

export interface SubSubCategoryItem {
  _id: string;
  name?: string;
  image?: string;
  status?: boolean;
  subCategory?: any[];
}

// API functions
const fetchSubCategories = async (): Promise<Category[]> => {
  return api.post<Category[]>("/api/admin/subCategory/view", {});
};

const fetchSubSubCategories = async (isDeletedAt?: string) => {
  const data = await api.post("/api/admin/subSubCategory/view", { isDeletedAt });
  return Array.isArray(data) ? data : [];
};

const createSubSubCategory = async (formData: FormData) => {
  return api.post("/api/admin/subSubCategory/create", formData);
};

const updateSubSubCategory = async ({ id, formData }: { id: string; formData: FormData }) => {
  return api.put(`/api/admin/subSubCategory/update/${id}`, formData);
};

const deleteSubSubCategory = async (id: string) => {
  return api.put(`/api/admin/subSubCategory/delete/${id}`, { id });
};

const changeSubSubCategoryStatus = async (id: string) => {
  return api.put(`/api/admin/subSubCategory/change-status/${id}`, { id });
};

export default function SubSubCategoriesClient({
  initialSubSubCategories,
  initialSubCategories,
}: {
  initialSubSubCategories: SubSubCategoryItem[];
  initialSubCategories: any[];
}) {
  const [categoryId, setCategoryId] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SubSubCategoryItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<{ name: string; image: any }>({
    name: "",
    image: null,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletedFilter, setDeletedFilter] = useState<string>("active");

  // React Query hooks
  const { data: subCategories = [] } = useQuery({
    queryKey: ["subCategories"],
    queryFn: fetchSubCategories,
    staleTime: 5 * 60 * 1000,
  });

  const { data: subSubCategories = [], isLoading } =
    useQuery({
      queryKey: ["subSubCategories", deletedFilter],
      queryFn: () => fetchSubSubCategories(deletedFilter === "active" ? undefined : deletedFilter),
      staleTime: 5 * 60 * 1000,
    });

  const createMutation = useMutation({
    mutationFn: createSubSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subSubCategories"] });
      invalidateCache(["categories", "homepage", "navigation"]);
      toast({ title: "Sub sub category created successfully" });
      closeDrawer();
    },
    onError: (error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateSubSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subSubCategories"] });
      invalidateCache(["categories", "homepage", "navigation"]);
      toast({ title: "Sub sub category updated successfully" });
      closeDrawer();
    },
    onError: (error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubSubCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subSubCategories"] });
      invalidateCache(["categories", "homepage", "navigation"]);
      toast({ title: "Sub sub category deleted successfully" });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
    onError: (error) => {
      toast({ title: error.message, variant: "destructive" });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: changeSubSubCategoryStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subSubCategories"] });
      invalidateCache(["categories", "homepage", "navigation"]);
      toast({ title: "Sub sub category status updated successfully" });
    },
    onError: (error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingCategory(null);
    setFormData({ name: "", image: null });
    setImagePreview(null);
    setCategoryId([]);
  };

  const handleEdit = (category: SubSubCategoryItem) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || "",
      image: null,
    });
    setCategoryId(
      Array.isArray(category.subCategory)
        ? category.subCategory.map((cat: any) => cat._id || cat)
        : []
    );
    setImagePreview(category.image || null);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete);
    }
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: "Sub sub category name is required",
        variant: "destructive",
      });
      return;
    }

    if (categoryId.length === 0) {
      toast({
        title: "Please select at least one sub category",
        variant: "destructive",
      });
      return;
    }

    const submitData = new FormData();
    submitData.append("name", formData.name);
    if (formData.image instanceof File) {
      submitData.append("image", formData.image);
    }
    categoryId.forEach((id) => submitData.append("subCategory[]", id));

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory._id, formData: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleChangeStatus = (category: SubSubCategoryItem) => {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Sub Sub Categories
          </h1>
          <p className="text-muted-foreground">
            Organize your products into sub sub categories
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
          <ExportButtons
            data={subSubCategories}
            filename="sub-sub-categories"
          />
          <Button
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: "", image: null });
              setImagePreview(null);
              setCategoryId([]);
              setDrawerOpen(true);
            }}
            className="transition-all duration-200 hover:scale-105"
            disabled={isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Sub Sub Category
          </Button>
        </div>
      </div>

      {subSubCategories.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <FolderTree className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">
                No sub sub categories yet
              </h3>
              <p className="text-muted-foreground">
                Create your first sub sub category to get started
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingCategory(null);
                setFormData({ name: "", image: null });
                setImagePreview(null);
                setCategoryId([]);
                setDrawerOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Sub Sub Category
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subSubCategories.map((category: SubSubCategoryItem, index: number) => (
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
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category._id)}
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
        title={
          editingCategory ? "Edit Sub Sub Category" : "Add Sub Sub Category"
        }
      >
        <div className="space-y-4 flex flex-col ">
          <div className="space-y-2 animate-in slide-in-from-right duration-300">
            <Label htmlFor="name">Sub Sub Category Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={isPending}
              placeholder="Enter sub sub category name"
            />
          </div>

          <SingleImageUploader
            label="Sub Sub Category Image"
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
            disabled={isPending}
            className="animate-in slide-in-from-right duration-300 delay-150"
          />

          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-75 z-[2000] h-full">
            <Label htmlFor="subcategory" className="z-[2000]">
              Parent Sub Category
            </Label>
            <NewMultiSelect
              category={subCategories}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              disabled={isPending}
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="z-[10] w-full animate-in slide-in-from-bottom duration-300 delay-150"
            disabled={isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {editingCategory ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                {editingCategory
                  ? "Update Sub Sub Category"
                  : "Create Sub Sub Category"}
              </>
            )}
          </Button>
        </div>
      </Drawer>

      <AlertDialogUse
        isOpen={deleteDialogOpen}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);
          }
        }}
        onConfirm={confirmDelete}
        title="Delete Sub Sub Category"
        description="Are you sure you want to delete this sub sub category? This action cannot be undone."
        confirmText={deleteMutation.isPending ? "Deleting..." : "Delete"}
        confirmDisabled={deleteMutation.isPending}
      />
    </div>
  );
}
