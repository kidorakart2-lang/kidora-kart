"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Pencil, Trash2, Palette, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, ApiClientError } from "@/lib/api";
import type { MaterialItem, ColorItem } from "@/lib/types";
import { invalidateCache } from "@/lib/invalidate-cache";

// API functions
const fetchMaterials = async (isDeletedAt?: string): Promise<MaterialItem[]> => {
  const data = await api.post<MaterialItem[]>("/api/admin/material/view", { isDeletedAt });
  return data ?? [];
};

const fetchColors = async (isDeletedAt?: string): Promise<ColorItem[]> => {
  const data = await api.post<ColorItem[]>("/api/admin/color/view", { isDeletedAt });
  return data ?? [];
};

const createMaterial = async (data: Record<string, unknown>) => {
  return api.post("/api/admin/material/create", data);
};

const updateMaterial = async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
  return api.put(`/api/admin/material/update/${id}`, data);
};

const deleteMaterial = async (id: string) => {
  return api.put("/api/admin/material/destroy", { id });
};

const changeMaterialStatus = async (id: string) => {
  return api.post("/api/admin/material/change-status", { id });
};

const createColor = async (data: Record<string, unknown>) => {
  return api.post("/api/admin/color/create", data);
};

const updateColor = async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
  return api.put(`/api/admin/color/update/${id}`, data);
};

const deleteColor = async (id: string) => {
  return api.put("/api/admin/color/destroy", { id });
};

const changeColorStatus = async (id: string) => {
  return api.post("/api/admin/color/change-status", { id });
};

export default function MaterialsColorsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState("material");
  const [editingItem, setEditingItem] = useState<MaterialItem | ColorItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState("material");
  const [materialForm, setMaterialForm] = useState({
    name: "",
    order: 0,
  });
  const [colorForm, setColorForm] = useState({
    name: "",
    code: "#000000",
    order: 0,
  });
  const [deletedFilter, setDeletedFilter] = useState<string>("active");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // React Query hooks for fetching
  const { data: materials = [], isLoading: materialsLoading } = useQuery<MaterialItem[]>({
    queryKey: ["materials", deletedFilter],
    queryFn: () => fetchMaterials(deletedFilter === "active" ? undefined : deletedFilter),
    staleTime: 5 * 60 * 1000,
  });

  const { data: colors = [], isLoading: colorsLoading } = useQuery<ColorItem[]>({
    queryKey: ["colors", deletedFilter],
    queryFn: () => fetchColors(deletedFilter === "active" ? undefined : deletedFilter),
    staleTime: 5 * 60 * 1000,
  });

  // Material mutations
  const createMaterialMutation = useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      invalidateCache(["filters"]);
      toast({ title: "Material created successfully" });
      setDrawerOpen(false);
      setMaterialForm({ name: "", order: 0 });
    },
    onError: (error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const updateMaterialMutation = useMutation({
    mutationFn: updateMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      invalidateCache(["filters"]);
      toast({ title: "Material updated successfully" });
      setDrawerOpen(false);
      setEditingItem(null);
      setMaterialForm({ name: "", order: 0 });
    },
    onError: (error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      invalidateCache(["filters"]);
      toast({ title: "Material deleted successfully" });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting material",
        description: error instanceof ApiClientError ? error.message : "Failed to delete",
        variant: "destructive",
      });
    },
  });

  const materialStatusMutation = useMutation({
    mutationFn: changeMaterialStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      invalidateCache(["filters"]);
      toast({ title: "Material status updated successfully" });
    },
    onError: (error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  // Color mutations
  const createColorMutation = useMutation({
    mutationFn: createColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      invalidateCache(["filters"]);
      toast({ title: "Color created successfully" });
      setDrawerOpen(false);
      setColorForm({ name: "", code: "#000000", order: 0 });
    },
    onError: (error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const updateColorMutation = useMutation({
    mutationFn: updateColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      invalidateCache(["filters"]);
      toast({ title: "Color updated successfully" });
      setDrawerOpen(false);
      setEditingItem(null);
      setColorForm({ name: "", code: "#000000", order: 0 });
    },
    onError: (error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const deleteColorMutation = useMutation({
    mutationFn: deleteColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      invalidateCache(["filters"]);
      toast({ title: "Color deleted successfully" });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting color",
        description: error instanceof ApiClientError ? error.message : "Failed to delete",
        variant: "destructive",
      });
    },
  });

  const colorStatusMutation = useMutation({
    mutationFn: changeColorStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      invalidateCache(["filters"]);
      toast({ title: "Color status updated successfully" });
    },
    onError: (error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const handleEditMaterial = (material: MaterialItem) => {
    setEditingItem(material);
    setMaterialForm({
      name: material.name,
      order: material.order,
    });
    setDrawerType("material");
    setDrawerOpen(true);
  };

  const handleEditColor = (color: ColorItem) => {
    setEditingItem(color);
    setColorForm({
      name: color.name || "",
      code: color.code || "",
      order: color.order || 0,
    });
    setDrawerType("color");
    setDrawerOpen(true);
  };

  const handleDeleteMaterial = (id: string) => {
    setItemToDelete(id);
    setDeleteType("material");
    setDeleteDialogOpen(true);
  };

  const handleDeleteColor = (id: string) => {
    setItemToDelete(id);
    setDeleteType("color");
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (deleteType === "material") {
      deleteMaterialMutation.mutate(itemToDelete);
    } else {
      deleteColorMutation.mutate(itemToDelete);
    }
  };

  const handleSubmitMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMaterialMutation.mutate({
        id: editingItem._id,
        data: materialForm,
      });
    } else {
      createMaterialMutation.mutate(materialForm);
    }
  };

  const handleSubmitColor = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: colorForm.name,
      code: colorForm.code,
      order: colorForm.order,
    };
    if (editingItem) {
      updateColorMutation.mutate({ id: editingItem._id, data });
    } else {
      createColorMutation.mutate(data);
    }
  };

  const handleEditMaterialStatus = (material: MaterialItem) => {
    materialStatusMutation.mutate(material._id);
  };

  const handleEditColorStatus = (color: ColorItem) => {
    colorStatusMutation.mutate(color._id);
  };

  const loading = materialsLoading || colorsLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Materials & Colors
          </h1>
          <p className="text-muted-foreground">
            Manage product materials and color options
          </p>
        </div>
        <Select
          value={deletedFilter}
          onValueChange={setDeletedFilter}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="all">All (incl. deleted)</SelectItem>
            <SelectItem value="deleted">Deleted Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="materials" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Materials
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Colors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {materials.length} materials available
            </p>
            <div className="flex items-center gap-2">
              <ExportButtons data={materials as unknown as Record<string, unknown>[]} filename="materials" />
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setMaterialForm({ name: "", order: 0 });
                  setDrawerType("material");
                  setDrawerOpen(true);
                }}
                className="transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((material, index) => (
              <Card
                key={material._id}
                className="p-4 group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{material.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          Order: {material.order}
                        </p>
                      </div>
                    </div>
                    <Badge variant={material.status ? "default" : "secondary"}>
                      {material.status ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {material.description && (
                    <p className="text-sm text-muted-foreground">
                      {material.description}
                    </p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditMaterial(material)}
                      className="flex-1 transition-all duration-200 hover:scale-105"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteMaterial(material._id)}
                      className="flex-1 transition-all duration-200 hover:scale-105"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditMaterialStatus(material)}
                    className="flex-1 transition-all duration-200 hover:scale-105"
                  >
                    Change Status
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {colors.length} colors available
            </p>
            <div className="flex items-center gap-2">
              <ExportButtons data={colors as unknown as Record<string, unknown>[]} filename="colors" />
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setColorForm({ name: "", code: "#000000", order: 0 });
                  setDrawerType("color");
                  setDrawerOpen(true);
                }}
                className="transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Color
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {colors.map((color, index) => (
              <Card
                key={color._id}
                className="p-4 group hover:shadow-lg transition-all duration-300 hover:scale-[1.05] animate-in fade-in zoom-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="space-y-3">
                  <div
                    className="w-full h-24 rounded-lg border-2 border-border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: color.code }}
                  />
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm">{color.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {color.code}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Order: {color.order}
                    </p>
                    {color.status && (
                      <Badge
                        variant={color.status ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {color.status ? "Active" : "Inactive"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditColor(color)}
                      className="flex-1 transition-all duration-200 hover:scale-105"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteColor(color._id)}
                      className="flex-1 transition-all duration-200 hover:scale-105"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditColorStatus(color)}
                    className="flex-1 transition-all duration-200 hover:scale-105"
                  >
                    Change Status
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          drawerType === "material"
            ? editingItem
              ? "Edit Material"
              : "Add Material"
            : editingItem
            ? "Edit Color"
            : "Add Color"
        }
        className="h-screen"
      >
        {drawerType === "material" ? (
          <form onSubmit={handleSubmitMaterial} className="space-y-4">
            <div className="space-y-2 animate-in slide-in-from-right duration-300">
              <Label htmlFor="name">Material Name</Label>
              <Input
                id="name"
                value={materialForm.name}
                onChange={(e) =>
                  setMaterialForm({ ...materialForm, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-75">
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                min={0}
                max={1000}
                value={materialForm.order}
                onChange={(e) =>
                  setMaterialForm({
                    ...materialForm,
                    order: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full animate-in slide-in-from-bottom duration-300 delay-100"
              disabled={
                createMaterialMutation.isPending ||
                updateMaterialMutation.isPending
              }
            >
              {createMaterialMutation.isPending ||
              updateMaterialMutation.isPending
                ? "Saving..."
                : editingItem
                ? "Update Material"
                : "Create Material"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmitColor} className="space-y-4">
            <div className="space-y-2 animate-in slide-in-from-right duration-300">
              <Label htmlFor="colorName">Color Name</Label>
              <Input
                id="colorName"
                value={colorForm.name}
                onChange={(e) =>
                  setColorForm({ ...colorForm, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-75">
              <Label htmlFor="colorCode">Color Code</Label>
              <div className="flex gap-2">
                <Input
                  id="colorCode"
                  type="color"
                  value={colorForm.code}
                  onChange={(e) =>
                    setColorForm({ ...colorForm, code: e.target.value })
                  }
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={colorForm.code}
                  onChange={(e) =>
                    setColorForm({ ...colorForm, code: e.target.value })
                  }
                  required
                  className="font-mono flex-1"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-100">
              <Label htmlFor="order">Order</Label>
              <Input
                id="order"
                type="number"
                min={0}
                max={1000}
                value={colorForm.order}
                onChange={(e) =>
                  setColorForm({
                    ...colorForm,
                    order: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full animate-in slide-in-from-bottom duration-300 delay-125"
              disabled={
                createColorMutation.isPending || updateColorMutation.isPending
              }
            >
              {createColorMutation.isPending || updateColorMutation.isPending
                ? "Saving..."
                : editingItem
                ? "Update Color"
                : "Create Color"}
            </Button>
          </form>
        )}
      </Drawer>

      <AlertDialogUse
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title={`Delete ${deleteType === "material" ? "Material" : "Color"}`}
        description={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
      />
    </div>
  );
}
