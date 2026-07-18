"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Drawer } from "@/components/drawer";
import { AlertDialogUse } from "@/components/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { api, ApiClientError } from "@/lib/api";
import { invalidateCache } from "@/lib/invalidate-cache";
import type { Logo } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


export default function LogosPage() {
  const [btnLoading, setBtnLoading] = useState(false);
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLogo, setEditingLogo] = useState<Logo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logoToDelete, setLogoToDelete] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deletedFilter, setDeletedFilter] = useState<string>("active");
  const [formData, setFormData] = useState<{ image: File | string | null }>({
    image: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadLogos();
  }, [deletedFilter]);

  const loadLogos = async () => {
    setLoading(true);
    try {
      const filter = deletedFilter === "active" ? undefined : deletedFilter;
      const data = await api.post<Logo[]>("/api/admin/logo/view", { isDeletedAt: filter });
      setLogos(data ?? []);
    } catch (error) {
      toast({
        title: "Error loading logos",
        description: error instanceof ApiClientError ? error.message : "Failed to load logos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      image: null,
    });
    setImagePreview(null);
    setEditingLogo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = new FormData();

    if (formData.image) submitData.append("logo", formData.image);

    try {
      setBtnLoading(true);
      if (editingLogo) {
        await api.put(`/api/admin/logo/update/${editingLogo._id}`, submitData);
        toast({ title: "Logo updated successfully" });
      } else {
        await api.post("/api/admin/logo/create", submitData);
        toast({ title: "Logo added successfully" });
      }
      setDrawerOpen(false);
      resetForm();
      loadLogos();
      invalidateCache(["homepage"]);
    } catch (error) {
      toast({
        title: `Error ${editingLogo ? "updating" : "adding"} logo`,
        description: error instanceof ApiClientError ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setBtnLoading(false);
    }
  };

  const handleEdit = (logo: Logo) => {
    setEditingLogo(logo);
    setFormData({
      image: logo.logo,
    });
    setImagePreview(logo.logo);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    setLogoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!logoToDelete) return;

    try {
      await api.put(`/api/admin/logo/destroy/${logoToDelete}`, { id: logoToDelete });
      loadLogos();
      invalidateCache(["homepage"]);
      toast({ title: "Logo deleted successfully" });
    } catch (error) {
      toast({
        title: "Error deleting logo",
        description: error instanceof ApiClientError ? error.message : "Failed to delete logo",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setLogoToDelete(null);
    }
  };

  const toggleStatus = async (logo: Logo) => {
    try {
      await api.post("/api/admin/logo/change-status", { id: logo._id });
      loadLogos();
      invalidateCache(["homepage"]);
      toast({
        title: `Logo ${
          logo.status ? "deactivated" : "activated"
        } successfully`,
      });
    } catch (error) {
      toast({
        title: "Error updating logo status",
        description: error instanceof ApiClientError ? error.message : "Failed to update status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logos</h1>
          <p className="text-muted-foreground">Manage your brand logos</p>
        </div>
        <div className="flex items-center gap-3">
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
          <Button
            onClick={() => {
              setEditingLogo(null);
              resetForm();
              setDrawerOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Logo
          </Button>
        </div>
      </div>

      {logos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No logos added yet</p>
          <Button className="mt-4" onClick={() => setDrawerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Logo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {logos.map((logo, index) => (
            <Card
              key={logo._id}
              style={{ animationDelay: `${index * 100}ms` }}
              className="overflow-hidden animate-in slide-in-from-bottom duration-300 delay-200"
            >
              <div className="relative group">
                <div className="aspect-square bg-muted/50 flex items-center justify-center p-4">
                  <img
                    src={logo.logo}
                    alt={logo.logo}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => handleEdit(logo)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => toggleStatus(logo)}
                  >
                    {logo.status ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:bg-white/20"
                    onClick={() => handleDelete(logo._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Badge variant={logo.status ? "default" : "secondary"}>
                    {logo.status ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Drawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          resetForm();
        }}
        title={editingLogo ? "Edit Logo" : "Add New Logo"}
        className="w-full max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Logo Image *</Label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground text-center px-4">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        SVG, PNG, or JPG (MAX. 5MB)
                      </p>
                    </div>
                  )}
                  <input
                    id="logo-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    required={!editingLogo}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDrawerOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button disabled={btnLoading} type="submit">
              {btnLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
                </>
              ) : editingLogo ? (
                "Update Logo"
              ) : (
                "Add Logo"
              )}
            </Button>
          </div>
        </form>
      </Drawer>

      <AlertDialogUse
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Logo"
        description="Are you sure you want to delete this logo? This action cannot be undone."
      />
    </div>
  );
}
