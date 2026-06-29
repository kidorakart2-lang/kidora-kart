"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/drawer";
import { ExportButtons } from "@/components/export-buttons";
import { AlertDialogUse } from "@/components/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Gem,
  Award,
  ShieldCheck,
  Sparkles,
  Heart,
  Star,
  ThumbsUp,
  Shield,
  CheckCircle,
  Gift,
  Sparkle,
} from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import type { WhyChooseUsItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";



export default function WhyChooseUsPage() {
  const [btnLoading, setBtnLoading] = useState(false);
  const [whyChooseUsArray, setWhyChooseUsArray] = useState<WhyChooseUsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingWhyChooseUs, setEditingWhyChooseUs] = useState<WhyChooseUsItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [whyChooseUsToDelete, setWhyChooseUsToDelete] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<{ name: string; component: any; color: string } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "",
  });

  const availableIcons = [
    { name: "Gem", component: Gem, color: "#8b5cf6" },
    { name: "Award", component: Award, color: "#f59e0b" },
    { name: "ShieldCheck", component: ShieldCheck, color: "#10b981" },
    { name: "Sparkles", component: Sparkles, color: "#ec4899" },
    { name: "Heart", component: Heart, color: "#ef4444" },
    { name: "Star", component: Star, color: "#f59e0b" },
    { name: "ThumbsUp", component: ThumbsUp, color: "#3b82f6" },
    { name: "Shield", component: Shield, color: "#8b5cf6" },
    { name: "CheckCircle", component: CheckCircle, color: "#10b981" },
    { name: "Gift", component: Gift, color: "#ec4899" },
    { name: "Sparkle", component: Sparkle, color: "#f59e0b" },
  ];
  const { toast } = useToast();

  const handleIconSelect = (icon: { name: string; component: any; color: string }) => {
    setSelectedIcon(icon);
    setFormData({ ...formData, icon: icon.name });
  };

  useEffect(() => {
    loadWhyChooseUs();
  }, []);

  const loadWhyChooseUs = async () => {
    setLoading(true);
    try {
      const data = await api.post<WhyChooseUsItem[]>("/api/admin/whyChooseUs/view", {});
      setWhyChooseUsArray(data ?? []);
    } catch (error) {
      toast({
        title: "Error loading Why Choose Us",
        description: error instanceof ApiClientError ? error.message : "Failed to load Why Choose Us",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (whyChooseUs: WhyChooseUsItem) => {
    setEditingWhyChooseUs(whyChooseUs);
    setFormData({
      title: whyChooseUs.title,
      description: whyChooseUs.description,
      icon: whyChooseUs.icon || "",
    });

    // Find and set the selected icon if it exists
    if (whyChooseUs.icon) {
      const icon = availableIcons.find((i) => i.name === whyChooseUs.icon);
      if (icon) {
        setSelectedIcon(icon);
      }
    } else {
      setSelectedIcon(null);
    }

    setDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    setWhyChooseUsToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!whyChooseUsToDelete) return;

    try {
      await api.put(`/api/admin/whyChooseUs/delete/${whyChooseUsToDelete}`, { id: whyChooseUsToDelete });
      loadWhyChooseUs();
      toast({ title: "Why Choose Us deleted successfully" });
    } catch (error) {
      toast({
        title: "Error deleting Why Choose Us",
        description: error instanceof ApiClientError ? error.message : "Failed to delete Why Choose Us",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setWhyChooseUsToDelete(null);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedIcon) {
      toast({
        title: "Please select an icon",
        variant: "destructive",
      });
      return;
    }

    const submitData = new FormData();
    submitData.append("title", formData.title);
    submitData.append("description", formData.description);
    submitData.append("icon", formData.icon);
    submitData.append("image", formData.icon);

    if (editingWhyChooseUs) {
      setBtnLoading(true);
      try {
        await api.put(`/api/admin/whyChooseUs/update/${editingWhyChooseUs._id}`, submitData);
        loadWhyChooseUs();
        toast({ title: "Why Choose Us updated successfully" });
      } catch (error) {
        toast({
          title: "Error updating Why Choose Us",
          description: error instanceof ApiClientError ? error.message : "Failed to update Why Choose Us",
          variant: "destructive",
        });
      } finally {
        setBtnLoading(false);
      }
    } else {
      setBtnLoading(true);
      try {
        await api.post("/api/admin/whyChooseUs/create", submitData);
        toast({ title: "Why Choose Us created successfully" });
        loadWhyChooseUs();
      } catch (error) {
        toast({
          title: "Error creating Why Choose Us",
          description: error instanceof ApiClientError ? error.message : "Failed to create Why Choose Us",
          variant: "destructive",
        });
      } finally {
        setBtnLoading(false);
      }
    }

    setDrawerOpen(false);
    setEditingWhyChooseUs(null);
  };

  const changeStatus = async (whyChooseUs: WhyChooseUsItem) => {
    try {
      await api.put(`/api/admin/whyChooseUs/change-status/${whyChooseUs._id}`, { id: whyChooseUs._id });
      loadWhyChooseUs();
      toast({
        title: `why Choose Us ${
          whyChooseUs.status ? "deactivated" : "activated"
        } successfully`,
      });
    } catch (error) {
      toast({
        title: "Error updating Why Choose Us status",
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
          <h1 className="text-3xl font-bold tracking-tight">Why Choose Us</h1>
          <p className="text-muted-foreground">Manage Why Choose Us</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons data={whyChooseUsArray as unknown as Record<string, unknown>[]} filename="whyChooseUs" />
          <Button
            onClick={() => {
              setEditingWhyChooseUs(null);
              setFormData({
                title: "",
                description: "",
                icon: "",
              });
              setSelectedIcon(null);
              setDrawerOpen(true);
            }}
            className="transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Why Choose Us
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {whyChooseUsArray.map((whyChooseUs, index) => (
          <Card
            key={whyChooseUs._id}
            className="p-6 group hover:shadow-xl transition-all duration-300 hover:scale-[1.05] animate-in fade-in zoom-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col items-center gap-3">
                  <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/50">
                    {(() => {
                      const Icon =
                        availableIcons.find(
                          (icon) => icon.name === whyChooseUs.image
                        )?.component || Gem;
                      return <Icon className="h-12 w-12 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{whyChooseUs.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {whyChooseUs.description}
                    </p>
                  </div>
                </div>
                <Badge variant={whyChooseUs.status ? "default" : "secondary"}>
                  {whyChooseUs.status ? "Active" : "Inactive"}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-3">
                {whyChooseUs.description}
              </p>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(whyChooseUs)}
                  className="flex-1 transition-all duration-200 hover:scale-105"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(whyChooseUs._id!)}
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
                  onClick={() => changeStatus(whyChooseUs)}
                  className="flex-1 transition-all duration-200 hover:scale-105"
                >
                  {whyChooseUs.status ? (
                    <Eye className="h-3 w-3 mr-1" />
                  ) : (
                    <EyeOff className="h-3 w-3 mr-1" />
                  )}
                  Mark as {whyChooseUs.status ? "Inactive" : "Active"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingWhyChooseUs ? "Edit Why Choose Us" : "Add Why Choose Us"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 animate-in slide-in-from-right duration-300">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-100">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              rows={4}
            />
          </div>

          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-150">
            <Label>Select an Icon *</Label>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {availableIcons.map((icon) => {
                const Icon = icon.component;
                const isSelected = selectedIcon?.name === icon.name;
                return (
                  <button
                    key={icon.name}
                    type="button"
                    onClick={() => handleIconSelect(icon)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <Icon
                      className={`h-6 w-6 mb-1 ${
                        isSelected ? "text-primary" : "text-muted-foreground"
                      }`}
                      style={{ color: isSelected ? icon.color : undefined }}
                    />
                    {/* <span className="text-xs text-muted-foreground">
                      {icon.name}
                    </span> */}
                  </button>
                );
              })}
            </div>
            {selectedIcon && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/20 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Selected Icon:
                  </p>
                  <div className="flex items-center justify-center">
                    <div className="p-4 rounded-full bg-primary/10">
                      {(() => {
                        const Icon = selectedIcon.component;
                        return (
                          <Icon
                            className="h-8 w-8 text-primary"
                            style={{ color: selectedIcon.color }}
                          />
                        );
                      })()}
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-medium">
                    {selectedIcon.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button
            disabled={btnLoading}
            type="submit"
            className="w-full animate-in slide-in-from-bottom duration-300 delay-200"
          >
            {btnLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
              </>
            ) : editingWhyChooseUs ? (
              "Update Why Choose Us"
            ) : (
              "Create Why Choose Us"
            )}
          </Button>
        </form>
      </Drawer>

      <AlertDialogUse
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Why Choose Us"
        description="Are you sure you want to delete this Why Choose Us? This action cannot be undone."
      />
    </div>
  );
}
