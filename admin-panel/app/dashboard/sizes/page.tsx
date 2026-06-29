"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/drawer";
import { ExportButtons } from "@/components/export-buttons";
import { AlertDialogUse } from "@/components/alert-dialog";
import { Plus, Pencil, Trash2, Ruler } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, ApiClientError } from "@/lib/api";
import type { SizeItem } from "@/lib/types";

// API functions
const fetchSizes = async (): Promise<SizeItem[]> => {
  const data = await api.post<SizeItem[]>("/api/admin/size/view", {});
  return data ?? [];
};

const createSize = async (data: { name: string; order: number }) => {
  return api.post("/api/admin/size/create", data);
};

const updateSize = async ({ id, data }: { id: string; data: { name: string; order: number } }) => {
  return api.put(`/api/admin/size/update/${id}`, data);
};

const deleteSize = async (id: string) => {
  return api.put("/api/admin/size/destroy", { id });
};

const changeSizeStatus = async (id: string) => {
  return api.post("/api/admin/size/change-status", { id });
};

export default function SizesPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SizeItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [sizeForm, setSizeForm] = useState({
    name: "",
    order: 0,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // React Query hooks
  const {
    data: sizes = [],
    isLoading,
    isError,
  } = useQuery<SizeItem[]>({
    queryKey: ["sizes"],
    queryFn: fetchSizes,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createSize,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
      toast({ title: "Size created successfully" });
      setDrawerOpen(false);
      setSizeForm({ name: "", order: 0 });
    },
    onError: (error) => {
      toast({
        title: error.message || "Error creating size",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateSize,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
      toast({ title: "Size updated successfully" });
      setDrawerOpen(false);
      setEditingItem(null);
      setSizeForm({ name: "", order: 0 });
    },
    onError: (error) => {
      toast({
        title: error.message || "Error updating size",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSize,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
      toast({ title: "Size deleted successfully" });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (err: Error) => {
      toast({
        title: "Error deleting size",
        description: err instanceof ApiClientError ? err.message : "Failed to delete",
        variant: "destructive",
      });
    },
  });

  const statusMutation = useMutation({
    mutationFn: changeSizeStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sizes"] });
      toast({ title: "Size status updated successfully" });
    },
    onError: (error) => {
      toast({
        title: error.message || "Error updating size status",
        variant: "destructive",
      });
    },
  });

  const handleEditSize = (size: SizeItem) => {
    setEditingItem(size);
    setSizeForm({
      name: size.name,
      order: size.order,
    });
    setDrawerOpen(true);
  };

  const handleDeleteSize = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
    }
  };

  const handleSubmitSize = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem._id, data: sizeForm });
    } else {
      createMutation.mutate(sizeForm);
    }
  };

  const handleEditSizeStatus = (size: SizeItem) => {
    statusMutation.mutate(size._id);
  };

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
        Something went wrong while fetching sizes 😬
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sizes</h1>
          <p className="text-muted-foreground">Manage product size options</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {sizes.length} sizes available
          </p>
          <div className="flex items-center gap-2">
            <ExportButtons data={sizes as unknown as Record<string, unknown>[]} filename="sizes" />
            <Button
              onClick={() => {
                setEditingItem(null);
                setSizeForm({ name: "", order: 0 });
                setDrawerOpen(true);
              }}
              className="transition-all duration-200 hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Size
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sizes.map((size: SizeItem, index: number) => (
            <Card
              key={size._id}
              className="p-4 group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Ruler className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{size.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">
                        Order: {size.order}
                      </p>
                    </div>
                  </div>
                  <Badge variant={size.status ? "default" : "secondary"}>
                    {size.status ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSize(size)}
                    className="flex-1 transition-all duration-200 hover:scale-105"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSize(size._id)}
                    className="flex-1 transition-all duration-200 hover:scale-105"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditSizeStatus(size)}
                  className="flex-1 transition-all duration-200 hover:scale-105"
                >
                  Change Status
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingItem ? "Edit Size" : "Add Size"}
        className="h-screen"
      >
        <form onSubmit={handleSubmitSize} className="space-y-4">
          <div className="space-y-2 animate-in slide-in-from-right duration-300">
            <Label htmlFor="name">Size Name</Label>
            <Input
              id="name"
              value={sizeForm.name}
              onChange={(e) =>
                setSizeForm({ ...sizeForm, name: e.target.value })
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
              value={sizeForm.order}
              onChange={(e) =>
                setSizeForm({
                  ...sizeForm,
                  order: parseInt(e.target.value) || 0,
                })
              }
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full animate-in slide-in-from-bottom duration-300 delay-100"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Saving..."
              : editingItem
              ? "Update Size"
              : "Create Size"}
          </Button>
        </form>
      </Drawer>

      <AlertDialogUse
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Size"
        description="Are you sure you want to delete this size? This action cannot be undone."
      />
    </div>
  );
}
