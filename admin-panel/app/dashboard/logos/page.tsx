"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Eye, EyeOff, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Drawer } from "@/components/drawer";
import { AlertDialogUse } from "@/components/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { invalidateCache } from "@/lib/invalidate-cache";
import type { Logo } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorState } from "@/components/ui/error-state";

function fetchLogos(isDeletedAt?: string): Promise<Logo[]> {
  return api.post<Logo[]>("/api/admin/logo/view", { isDeletedAt });
}

function createLogo(formData: FormData) {
  return api.post("/api/admin/logo/create", formData);
}

function updateLogo({ id, formData }: { id: string; formData: FormData }) {
  return api.put(`/api/admin/logo/update/${id}`, formData);
}

function deleteLogo(id: string) {
  return api.put(`/api/admin/logo/destroy/${id}`, { id });
}

function changeLogoStatus(id: string) {
  return api.post("/api/admin/logo/change-status", { id });
}

export default function LogosPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLogo, setEditingLogo] = useState<Logo | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logoToDelete, setLogoToDelete] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deletedFilter, setDeletedFilter] = useState<string>("active");
  const [formData, setFormData] = useState<{ image: File | string | null }>({ image: null });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: logos = [], isLoading, isError, error } = useQuery({
    queryKey: ["logos", deletedFilter],
    queryFn: () => fetchLogos(deletedFilter === "active" ? undefined : deletedFilter),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logos"] });
      invalidateCache(["homepage"]);
      toast({ title: "Logo added successfully" });
      closeDrawer();
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: updateLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logos"] });
      invalidateCache(["homepage"]);
      toast({ title: "Logo updated successfully" });
      closeDrawer();
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logos"] });
      invalidateCache(["homepage"]);
      toast({ title: "Logo deleted successfully" });
      setDeleteDialogOpen(false);
      setLogoToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
      setDeleteDialogOpen(false);
      setLogoToDelete(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: changeLogoStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logos"] });
      invalidateCache(["homepage"]);
      toast({ title: "Logo status updated" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || statusMutation.isPending;

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingLogo(null);
    setFormData({ image: null });
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = new FormData();
    if (formData.image instanceof File) submitData.append("logo", formData.image);
    if (editingLogo) {
      updateMutation.mutate({ id: editingLogo._id, formData: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (logo: Logo) => {
    setEditingLogo(logo);
    setFormData({ image: logo.logo });
    setImagePreview(logo.logo);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    setLogoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (logoToDelete) deleteMutation.mutate(logoToDelete);
  };

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load logos"
          message={error instanceof Error ? error.message : "Could not fetch logos from the server."}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["logos"] })}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((i) => (<div key={i} className="h-48 bg-muted rounded-lg"></div>))}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Logos</h1><p className="text-muted-foreground">Manage your brand logos</p></div>
        <div className="flex items-center gap-3">
          <Select value={deletedFilter} onValueChange={setDeletedFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="all">All (incl. deleted)</SelectItem>
              <SelectItem value="deleted">Deleted Only</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => { setEditingLogo(null); setFormData({ image: null }); setImagePreview(null); setDrawerOpen(true); }} disabled={isPending}>
            <Plus className="h-4 w-4 mr-2" />Add Logo
          </Button>
        </div>
      </div>

      {logos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No logos added yet</p>
          <Button className="mt-4" onClick={() => setDrawerOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Your First Logo</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {logos.map((logo) => (
            <Card key={logo._id} className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
              <CardContent className="p-0">
                <div className="relative h-48 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-6">
                  <img src={logo.logo || "/placeholder.svg"} alt="Logo" className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-110" />
                  <Badge variant={logo.status ? "default" : "secondary"} className="absolute top-2 right-2">{logo.status ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(logo)} className="flex-1" disabled={isPending}><Edit className="h-3 w-3 mr-2" />Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(logo._id!)} className="flex-1 text-destructive hover:text-destructive" disabled={isPending}><Trash2 className="h-3 w-3 mr-2" />Delete</Button>
                  </div>
                  <Button variant={logo.status ? "default" : "secondary"} size="sm" onClick={() => statusMutation.mutate(logo._id)} className="w-full transition-all duration-200" disabled={isPending}>
                    {statusMutation.isPending ? <Loader2 className="h-3 w-3 mr-2 animate-spin" /> : null}
                    {logo.status ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Drawer isOpen={drawerOpen} onClose={() => { if (!isPending) closeDrawer(); }} title={editingLogo ? "Edit Logo" : "Add Logo"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Logo Image</Label>
            {imagePreview && (
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
              </div>
            )}
            <Input type="file" accept="image/*" onChange={handleImageChange} disabled={isPending} required={!editingLogo} />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {createMutation.isPending || updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : editingLogo ? "Update Logo" : "Add Logo"}
          </Button>
        </form>
      </Drawer>

      <AlertDialogUse isOpen={deleteDialogOpen} onClose={() => { if (!deleteMutation.isPending) { setDeleteDialogOpen(false); setLogoToDelete(null); } }} onConfirm={confirmDelete} title="Delete Logo" description="Are you sure you want to delete this logo?" />
    </div>
  );
}
