"use client";

import { useState, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/drawer";
import { ExportButtons } from "@/components/export-buttons";
import { AlertDialogUse } from "@/components/alert-dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Gem, Award, ShieldCheck, Sparkles, Heart, Star, ThumbsUp, Shield, CheckCircle, Gift, Sparkle } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import { invalidateCache } from "@/lib/invalidate-cache";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ErrorState } from "@/components/ui/error-state";
import type { WhyChooseUsItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

function fetchWhyChooseUs(isDeletedAt?: string): Promise<WhyChooseUsItem[]> {
  return api.post<WhyChooseUsItem[]>("/api/admin/whyChooseUs/view", { isDeletedAt });
}

function createWhyChooseUs(formData: FormData) {
  return api.post("/api/admin/whyChooseUs/create", formData);
}

function updateWhyChooseUs({ id, formData }: { id: string; formData: FormData }) {
  return api.put(`/api/admin/whyChooseUs/update/${id}`, formData);
}

function deleteWhyChooseUs(id: string) {
  return api.put(`/api/admin/whyChooseUs/delete/${id}`, { id });
}

function changeWhyChooseUsStatus(id: string) {
  return api.put(`/api/admin/whyChooseUs/change-status/${id}`, { id });
}

const FORM_INIT = { title: "", description: "", icon: "" };

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

export default function WhyChooseUsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingWhyChooseUs, setEditingWhyChooseUs] = useState<WhyChooseUsItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [whyChooseUsToDelete, setWhyChooseUsToDelete] = useState<string | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<{ name: string; component: any; color: string } | null>(null);
  const [deletedFilter, setDeletedFilter] = useState<string>("active");
  const [formData, setFormData] = useState(FORM_INIT);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: whyChooseUsArray = [], isLoading, isError, error } = useQuery({
    queryKey: ["whyChooseUs", deletedFilter],
    queryFn: () => fetchWhyChooseUs(deletedFilter === "active" ? undefined : deletedFilter),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createWhyChooseUs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whyChooseUs"] });
      invalidateCache(["homepage"]);
      toast({ title: "Why Choose Us created successfully" });
      closeDrawer();
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: updateWhyChooseUs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whyChooseUs"] });
      invalidateCache(["homepage"]);
      toast({ title: "Why Choose Us updated successfully" });
      closeDrawer();
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.put(`/api/admin/whyChooseUs/restore/${id}`, { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whyChooseUs"] });
      invalidateCache(["homepage"]);
      toast({ title: "Why Choose Us restored successfully" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWhyChooseUs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whyChooseUs"] });
      invalidateCache(["homepage"]);
      toast({ title: "Why Choose Us deleted successfully" });
      setDeleteDialogOpen(false);
      setWhyChooseUsToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
      setDeleteDialogOpen(false);
      setWhyChooseUsToDelete(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: changeWhyChooseUsStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whyChooseUs"] });
      invalidateCache(["homepage"]);
      toast({ title: "Why Choose Us status updated" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || statusMutation.isPending;

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingWhyChooseUs(null);
    setFormData(FORM_INIT);
    setSelectedIcon(null);
  };

  const handleEdit = (item: WhyChooseUsItem) => {
    setEditingWhyChooseUs(item);
    setFormData({ title: item.title, description: item.description, icon: item.icon || "" });
    const icon = availableIcons.find((i) => i.name === item.icon);
    setSelectedIcon(icon || null);
    setDrawerOpen(true);
  };

  const handleDelete = (id: string) => { setWhyChooseUsToDelete(id); setDeleteDialogOpen(true); };
  const confirmDelete = () => { if (whyChooseUsToDelete) deleteMutation.mutate(whyChooseUsToDelete); };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedIcon) { toast({ title: "Please select an icon", variant: "destructive" }); return; }
    const submitData = new FormData();
    submitData.append("title", formData.title);
    submitData.append("description", formData.description);
    submitData.append("icon", formData.icon);
    if (editingWhyChooseUs) {
      if (editingWhyChooseUs._id) updateMutation.mutate({ id: editingWhyChooseUs._id, formData: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load why choose us entries"
          message={error instanceof Error ? error.message : "Could not fetch data from the server."}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["whyChooseUs"] })}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3].map((i) => (<div key={i} className="h-64 bg-muted rounded-lg"></div>))}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div><h1 className="text-3xl font-bold tracking-tight">Why Choose Us</h1><p className="text-muted-foreground">Manage Why Choose Us</p></div>
        <div className="flex items-center gap-2">
          <Select value={deletedFilter} onValueChange={setDeletedFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent><SelectItem value="active">Active Only</SelectItem><SelectItem value="all">All (incl. deleted)</SelectItem><SelectItem value="deleted">Deleted Only</SelectItem></SelectContent>
          </Select>
          <ExportButtons data={whyChooseUsArray} filename="whyChooseUs" />
          <Button onClick={() => { setEditingWhyChooseUs(null); setFormData(FORM_INIT); setSelectedIcon(null); setDrawerOpen(true); }} className="transition-all duration-200 hover:scale-105" disabled={isPending}>
            <Plus className="h-4 w-4 mr-2" />Add Why Choose Us
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {whyChooseUsArray.map((item, index) => (
          <Card key={item._id} className="p-6 group hover:shadow-xl transition-all duration-300 hover:scale-[1.05] animate-in fade-in zoom-in" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex flex-col items-center gap-3">
                  <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-primary/20 transition-all duration-300 group-hover:ring-primary/50">
                    {(() => { const Icon = availableIcons.find((icon) => icon.name === item.image)?.component || Gem; return <Icon className="h-12 w-12 text-primary" />; })()}
                  </div>
                  <div><h3 className="font-semibold">{item.title}</h3><p className="text-sm text-muted-foreground">{item.description}</p></div>
                </div>
                <Badge variant={item.status ? "default" : "secondary"}>{item.status ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => handleEdit(item)} className="flex-1" disabled={isPending}><Pencil className="h-3 w-3 mr-1" />Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(item._id!)} className="flex-1" disabled={isPending}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                {deletedFilter === "deleted" && (
                  <Button variant="outline" size="sm" onClick={() => item._id && restoreMutation.mutate(item._id)} className="flex-1" disabled={isPending}>
                    <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    Restore
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => item._id && statusMutation.mutate(item._id)} className="w-full" disabled={isPending}>
                {statusMutation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : item.status ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                Mark as {item.status ? "Inactive" : "Active"}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Drawer isOpen={drawerOpen} onClose={() => { if (!isPending) closeDrawer(); }} title={editingWhyChooseUs ? "Edit Why Choose Us" : "Add Why Choose Us"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 animate-in slide-in-from-right duration-300">
            <Label>Title</Label>
            <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required disabled={isPending} />
          </div>
          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-100">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={4} disabled={isPending} />
          </div>
          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-150">
            <Label>Select an Icon *</Label>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {availableIcons.map((icon) => {
                const Icon = icon.component;
                const isSelected = selectedIcon?.name === icon.name;
                return (
                  <button key={icon.name} type="button" onClick={() => { setSelectedIcon(icon); setFormData({ ...formData, icon: icon.name }); }}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${isSelected ? "border-primary bg-primary/10" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50"}`} disabled={isPending}>
                    <Icon className={`h-6 w-6 mb-1 ${isSelected ? "text-primary" : "text-muted-foreground"}`} style={{ color: isSelected ? icon.color : undefined }} />
                  </button>
                );
              })}
            </div>
          </div>
          <Button disabled={isPending} type="submit" className="w-full">
            {createMutation.isPending || updateMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : editingWhyChooseUs ? "Update" : "Create"}
          </Button>
        </form>
      </Drawer>

      <AlertDialogUse isOpen={deleteDialogOpen} onClose={() => { if (!deleteMutation.isPending) { setDeleteDialogOpen(false); setWhyChooseUsToDelete(null); } }} onConfirm={confirmDelete} title="Delete Why Choose Us" description="Are you sure?" />
    </div>
  );
}
