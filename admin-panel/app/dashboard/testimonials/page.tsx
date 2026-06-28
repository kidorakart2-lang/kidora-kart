"use client";

import { useEffect, useState } from "react";
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
  ImageIcon,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AXIOS_CONFIG = { withCredentials: true } as const;

export default function TestimonialsPage() {
  const [btnLoading, setBtnLoading] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    rating: number;
    image: string | File;
    address: string;
  }>({
    title: "",
    description: "",
    rating: 5,
    image: "",
    address: "",
  });
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setFormData({ ...formData, image: file });
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/api/admin/testimonial/view`,
        {},
        AXIOS_CONFIG
      );
      setTestimonials(response.data._data || []);
    } catch (error: unknown) {
      toast({
        title: "Error loading testimonials",
        description:
          (error as any).response?.data?._message || "Failed to load testimonials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      title: testimonial.title,
      description: testimonial.description,
      rating: testimonial.rating,
      image: testimonial.image ?? "",
      address: testimonial.address ?? "",
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    setTestimonialToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!testimonialToDelete) return;

    try {
      await axios.put(
        `/api/admin/testimonial/delete/${testimonialToDelete}`,
        { id: testimonialToDelete },
        AXIOS_CONFIG
      );
      loadTestimonials();
      toast({ title: "Testimonial deleted successfully" });
    } catch (error: unknown) {
      toast({
        title: "Error deleting testimonial",
        description:
          (error as any).response?.data?._message || "Failed to delete testimonial",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTestimonialToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBtnLoading(true);
    const submitData = new FormData();
    submitData.append("title", formData.title);
    submitData.append("description", formData.description);
    submitData.append("rating", String(formData.rating));
    submitData.append("image", formData.image);
    submitData.append("address", formData.address);

    try {
      if (editingTestimonial) {
        await axios.put(
          `/api/admin/testimonial/update/${editingTestimonial._id}`,
          submitData,
          AXIOS_CONFIG
        );
        loadTestimonials();
        toast({ title: "Testimonial updated successfully" });
      } else {
        await axios.post(
          `/api/admin/testimonial/create`,
          submitData,
          AXIOS_CONFIG
        );
        toast({ title: "Testimonial created successfully" });
        loadTestimonials();
      }

      setDrawerOpen(false);
      setEditingTestimonial(null);
      setFormData({
        title: "",
        description: "",
        rating: 5,
        image: "",
        address: "",
      });
    } catch (error: unknown) {
      toast({
        title: editingTestimonial ? "Error updating testimonial" : "Error creating testimonial",
        description:
          (error as any).response?.data?._message || "Operation failed",
        variant: "destructive",
      });
    } finally {
      setBtnLoading(false);
    }
  };

  const changeStatus = async (testimonial: Testimonial) => {
    try {
      await axios.put(
        `/api/admin/testimonial/change-status/${testimonial._id}`,
        { id: testimonial._id },
        AXIOS_CONFIG
      );
      loadTestimonials();
      toast({
        title: `Testimonial ${
          testimonial.status ? "deactivated" : "activated"
        } successfully`,
      });
    } catch (error: unknown) {
      toast({
        title: "Error updating testimonial status",
        description:
          (error as any).response?.data?._message || "Failed to update status",
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
          <h1 className="text-3xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground">
            Manage customer testimonials and reviews
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons data={testimonials as unknown as Record<string, unknown>[]} filename="testimonials" />
          <Button
            onClick={() => {
              setEditingTestimonial(null);
              setFormData({
                title: "",
                description: "",
                rating: 5,
                image: "",
                address: "",
              });
              setDrawerOpen(true);
            }}
            className="transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial, index) => (
          <Card
            key={testimonial._id}
            className="p-6 group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/50">
                    <AvatarImage
                      src={testimonial.image || "/placeholder.svg"}
                      alt={testimonial.title}
                    />
                    <AvatarFallback>
                      {testimonial.title.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{testimonial.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.description}
                    </p>
                  </div>
                </div>
                <Badge variant={testimonial.status ? "default" : "secondary"}>
                  {testimonial.status ? "Active" : "Inactive"}
                </Badge>
              </div>

              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < testimonial.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted"
                    } transition-all duration-300`}
                  />
                ))}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-3">
                {testimonial.description}
              </p>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(testimonial)}
                  className="flex-1 transition-all duration-200 hover:scale-105"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(testimonial._id!)}
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
                  onClick={() => changeStatus(testimonial)}
                  className="flex-1 transition-all duration-200 hover:scale-105"
                >
                  {testimonial.status ? (
                    <Eye className="h-3 w-3 mr-1" />
                  ) : (
                    <EyeOff className="h-3 w-3 mr-1" />
                  )}
                  Mark as {testimonial.status ? "Inactive" : "Active"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 animate-in slide-in-from-right duration-300">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-75">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-100">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              rows={4}
            />
          </div>

          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-125">
            <Label htmlFor="rating">Rating</Label>
            <Select
              value={formData.rating.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, rating: Number.parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} Star{num > 1 ? "s" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-150">
            <Label>Image *</Label>
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
                      SVG, PNG, or JPG (MAX. 2MB)
                    </p>
                  </div>
                )}
                <input
                  id="logo-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
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
            ) : editingTestimonial ? (
              "Update Testimonial"
            ) : (
              "Create Testimonial"
            )}
          </Button>
        </form>
      </Drawer>

      <AlertDialogUse
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Testimonial"
        description="Are you sure you want to delete this testimonial? This action cannot be undone."
      />
    </div>
  );
}
