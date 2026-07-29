"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { ErrorState } from "@/components/ui/error-state";
import { Plus, Palette, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApiClientError } from "@/lib/api";
import { invalidateCache } from "@/lib/invalidate-cache";
import {
  fetchMaterials,
  fetchColors,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  changeMaterialStatus,
  createColor,
  updateColor,
  deleteColor,
  changeColorStatus,
} from "@/lib/materials-api";
import { MaterialCard } from "@/components/materials/MaterialCard";
import { ColorCard } from "@/components/materials/ColorCard";
import { MaterialDrawerForm } from "@/components/materials/MaterialDrawerForm";
import { ColorDrawerForm } from "@/components/materials/ColorDrawerForm";
import type { MaterialItem, ColorItem } from "@/lib/types";

export default function MaterialsColorsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"material" | "color">("material");
  const [editingItem, setEditingItem] = useState<MaterialItem | ColorItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"material" | "color">("material");
  const [materialForm, setMaterialForm] = useState({ name: "", order: 0 });
  const [colorForm, setColorForm] = useState({ name: "", code: "#000000", order: 0 });
  const [deletedFilter, setDeletedFilter] = useState<string>("active");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: materials = [], isLoading: materialsLoading, isError: materialsError } = useQuery<MaterialItem[]>({
    queryKey: ["materials", deletedFilter],
    queryFn: () => fetchMaterials(deletedFilter === "active" ? undefined : deletedFilter),
    staleTime: 5 * 60 * 1000,
  });

  const { data: colors = [], isLoading: colorsLoading, isError: colorsError } = useQuery<ColorItem[]>({
    queryKey: ["colors", deletedFilter],
    queryFn: () => fetchColors(deletedFilter === "active" ? undefined : deletedFilter),
    staleTime: 5 * 60 * 1000,
  });

  const createMaterialMutation = useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      invalidateCache(["filters"]);
      toast({ title: "Material created successfully" });
      setDrawerOpen(false);
      setMaterialForm({ name: "", order: 0 });
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" }),
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
    onError: (error) => toast({ title: error.message, variant: "destructive" }),
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
      toast({ title: "Error deleting material", description: error instanceof ApiClientError ? error.message : "Failed to delete", variant: "destructive" });
    },
  });

  const materialStatusMutation = useMutation({
    mutationFn: changeMaterialStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      invalidateCache(["filters"]);
      toast({ title: "Material status updated" });
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" }),
  });

  const createColorMutation = useMutation({
    mutationFn: createColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      invalidateCache(["filters"]);
      toast({ title: "Color created successfully" });
      setDrawerOpen(false);
      setColorForm({ name: "", code: "#000000", order: 0 });
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" }),
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
    onError: (error) => toast({ title: error.message, variant: "destructive" }),
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
      toast({ title: "Error deleting color", description: error instanceof ApiClientError ? error.message : "Failed to delete", variant: "destructive" });
    },
  });

  const colorStatusMutation = useMutation({
    mutationFn: changeColorStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colors"] });
      invalidateCache(["filters"]);
      toast({ title: "Color status updated" });
    },
    onError: (error) => toast({ title: error.message, variant: "destructive" }),
  });

  const confirmDelete = () => {
    if (!itemToDelete) return;
    if (deleteType === "material") {
      deleteMaterialMutation.mutate(itemToDelete);
    } else {
      deleteColorMutation.mutate(itemToDelete);
    }
  };

  const loading = materialsLoading || colorsLoading;

  if (materialsError || colorsError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load materials & colors"
          message="Could not fetch data from the server. Check your connection and try again."
          onRetry={() => {
            queryClient.invalidateQueries({ queryKey: ["materials"] });
            queryClient.invalidateQueries({ queryKey: ["colors"] });
          }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-96 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Materials & Colors</h1>
          <p className="text-muted-foreground">Manage product materials and color options</p>
        </div>
        <Select value={deletedFilter} onValueChange={setDeletedFilter}>
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
            <Package className="h-4 w-4" />Materials
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />Colors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{materials.length} materials available</p>
            <div className="flex items-center gap-2">
              <ExportButtons data={materials} filename="materials" />
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setMaterialForm({ name: "", order: 0 });
                  setDrawerType("material");
                  setDrawerOpen(true);
                }}
                className="transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />Add Material
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {materials.map((material, index) => (
              <MaterialCard
                key={material._id}
                material={material}
                index={index}
                onEdit={(m) => {
                  setEditingItem(m);
                  setMaterialForm({ name: m.name, order: m.order });
                  setDrawerType("material");
                  setDrawerOpen(true);
                }}
                onDelete={(id) => { setItemToDelete(id); setDeleteType("material"); setDeleteDialogOpen(true); }}
                onStatusChange={(m) => materialStatusMutation.mutate(m._id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="colors" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{colors.length} colors available</p>
            <div className="flex items-center gap-2">
              <ExportButtons data={colors} filename="colors" />
              <Button
                onClick={() => {
                  setEditingItem(null);
                  setColorForm({ name: "", code: "#000000", order: 0 });
                  setDrawerType("color");
                  setDrawerOpen(true);
                }}
                className="transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />Add Color
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {colors.map((color, index) => (
              <ColorCard
                key={color._id}
                color={color}
                index={index}
                onEdit={(c) => {
                  setEditingItem(c);
                  setColorForm({ name: c.name || "", code: c.code || "", order: c.order || 0 });
                  setDrawerType("color");
                  setDrawerOpen(true);
                }}
                onDelete={(id) => { setItemToDelete(id); setDeleteType("color"); setDeleteDialogOpen(true); }}
                onStatusChange={(c) => colorStatusMutation.mutate(c._id)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={
          drawerType === "material"
            ? editingItem ? "Edit Material" : "Add Material"
            : editingItem ? "Edit Color" : "Add Color"
        }
        className="h-screen"
      >
        {drawerType === "material" ? (
          <MaterialDrawerForm
            form={materialForm}
            onChange={setMaterialForm}
            onSubmit={(e) => {
              e.preventDefault();
              if (editingItem) {
                updateMaterialMutation.mutate({ id: editingItem._id, data: materialForm });
              } else {
                createMaterialMutation.mutate(materialForm);
              }
            }}
            isPending={createMaterialMutation.isPending || updateMaterialMutation.isPending}
            isEditing={!!editingItem}
          />
        ) : (
          <ColorDrawerForm
            form={colorForm}
            onChange={setColorForm}
            onSubmit={(e) => {
              e.preventDefault();
              const data = { name: colorForm.name, code: colorForm.code, order: colorForm.order };
              if (editingItem) {
                updateColorMutation.mutate({ id: editingItem._id, data });
              } else {
                createColorMutation.mutate(data);
              }
            }}
            isPending={createColorMutation.isPending || updateColorMutation.isPending}
            isEditing={!!editingItem}
          />
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
