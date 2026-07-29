"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Testimonial } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Drawer } from "@/components/drawer";
import { ExportButtons } from "@/components/export-buttons";
import { AlertDialogUse } from "@/components/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import { invalidateCache } from "@/lib/invalidate-cache";
import SingleImageUploader from "@/components/SingleImageUploader";
import { ErrorState } from "@/components/ui/error-state";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function fetchTestimonials(isDeletedAt?: string): Promise<Testimonial[]> {
  return api.post<Testimonial[]>("/api/admin/testimonial/view", { isDeletedAt });
}

function createTestimonial(formData: FormData) {
  return api.post("/api/admin/testimonial/create", formData);
}

function updateTestimonial({ id, formData }: { id: string; formData: FormData }) {
  return api.put(`/api/admin/testimonial/update/${id}`, formData);
}

function deleteTestimonial(id: string) {
  return api.put(`/api/admin/testimonial/delete/${id}`, { id });
}

function changeTestimonialStatus(id: string) {
  return api.put(`/api/admin/testimonial/change-status/${id}`, { id });
}

const FORM_INIT = { title: "", description: "", rating: 5, image: "" as string | File, address: "" };

export default function TestimonialsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [deletedFilter, setDeletedFilter] = useState<string>("active");
  const [formData, setFormData] = useState(FORM_INIT);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: testimonials = [], isLoading, isError, error } = useQuery({
    queryKey: ["testimonials", deletedFilter],
    queryFn: () => fetchTestimonials(deletedFilter === "active" ? undefined : deletedFilter),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      invalidateCache(["testimonials", "homepage"]);
      toast({ title: "Testimonial created successfully" });
      closeDrawer();
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: updateTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      invalidateCache(["testimonials", "homepage"]);
      toast({ title: "Testimonial updated successfully" });
      closeDrawer();
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      invalidateCache(["testimonials", "homepage"]);
      toast({ title: "Testimonial deleted successfully" });
      setDeleteDialogOpen(false);
      setTestimonialToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
      setDeleteDialogOpen(false);
      setTestimonialToDelete(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: changeTestimonialStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      invalidateCache(["testimonials", "homepage"]);
      toast({ title: "Testimonial status updated" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || statusMutation.isPending;

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingTestimonial(null);
    setImagePreview(null);
    setFormData(FORM_INIT);
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setImagePreview(testimonial.image ?? null);
    setFormData({
      title: testimonial.title,
      description: testimonial.description,
      rating: testimonial.rating,
      image: testimonial.image ?? "",
      address: testimonial.address ?? "",
    });
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => {
    setTestimonialToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (testimonialToDelete) deleteMutation.mutate(testimonialToDelete);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = new FormData();
    submitData.append("title", formData.title);
    submitData.append("description", formData.description);
    submitData.append("rating", String(formData.rating));
    submitData.append("image", formData.image);
    submitData.append("address", formData.address);

    if (editingTestimonial) {
      if (editingTestimonial._id) updateMutation.mutate({ id: editingTestimonial._id, formData: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load testimonials"
          message={error instanceof Error ? error.message : "Could not fetch testimonials from the server."}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["testimonials"] })}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (<div key={i} className="h-64 bg-muted rounded-lg"></div>))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground">Manage customer testimonials and reviews</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={deletedFilter} onValueChange={setDeletedFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="all">All (incl. deleted)</SelectItem>
              <SelectItem value="deleted">Deleted Only</SelectItem>
            </SelectContent>
          </Select>
          <ExportButtons data={testimonials} filename="testimonials" />
          <Button onClick={() => { setEditingTestimonial(null); setImagePreview(null); setFormData(FORM_INIT); setDrawerOpen(true); }} className="transition-all duration-200 hover:scale-105" disabled={isPending}>
            <Plus className="h-4 w-4 mr-2" />Add Testimonial
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <Card key={testimonial._id} className="p-6 group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/50">
                    <AvatarImage src={testimonial.image || "/placeholder.svg"} alt={testimonial.title || ""} />
                    <AvatarFallback>{testimonial.title?.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{testimonial.title || "Untitled"}</h3>
                    <p className="text-sm text-muted-foreground">{testimonial.description}</p>
                  </div>
                </div>
                <Badge variant={testimonial.status ? "default" : "secondary"}>{testimonial.status ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (<Star key={i} className={`h-4 w-4 ${i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"} transition-all duration-300`} />))}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">{testimonial.description}</p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(testimonial)} className="flex-1 transition-all duration-200 hover:scale-105" disabled={isPending}><Pencil className="h-3 w-3 mr-1" />Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(testimonial._id!)} className="flex-1 transition-all duration-200 hover:scale-105" disabled={isPending}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => testimonial._id && statusMutation.mutate(testimonial._id)} className="w-full transition-all duration-200 hover:scale-105" disabled={isPending}>
                {statusMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : testimonial.status ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                Mark as {testimonial.status ? "Inactive" : "Active"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Drawer isOpen={drawerOpen} onClose={() => { if (!isPending) closeDrawer(); }} title={editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 animate-in slide-in-from-right duration-300">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required disabled={isPending} />
          </div>
          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-75">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required disabled={isPending} />
          </div>
          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-100">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={4} disabled={isPending} />
          </div>
          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-125">
            <Label>Rating</Label>
            <Select value={formData.rating.toString()} onValueChange={(value) => setFormData({ ...formData, rating: Number.parseInt(value) })} disabled={isPending}>
              <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
              <SelectContent>{[1, 2, 3, 4, 5].map((num) => (<SelectItem key={num} value={num.toString()}>{num} Star{num > 1 ? "s" : ""}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <SingleImageUploader label="Image" value={imagePreview} onChange={(file) => {
            if (file) { setFormData({ ...formData, image: file }); const reader = new FileReader(); reader.onloadend = () => setImagePreview(reader.result as string); reader.readAsDataURL(file); }
            else { setFormData({ ...formData, image: "" }); setImagePreview(null); }
          }} required disabled={isPending} className="animate-in slide-in-from-right duration-300 delay-150" />
          <Button type="submit" disabled={isPending} className="w-full animate-in slide-in-from-bottom duration-300 delay-200">
            {createMutation.isPending || updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : editingTestimonial ? "Update Testimonial" : "Create Testimonial"}
          </Button>
        </form>
      </Drawer>

      <AlertDialogUse isOpen={deleteDialogOpen} onClose={() => { if (!deleteMutation.isPending) { setDeleteDialogOpen(false); setTestimonialToDelete(null); } }} onConfirm={confirmDelete} title="Delete Testimonial" description="Are you sure you want to delete this testimonial? This action cannot be undone." />
    </div>
  );
}
