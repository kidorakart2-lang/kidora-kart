"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api, ApiClientError } from "@/lib/api"
import { invalidateCache } from "@/lib/invalidate-cache"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Drawer } from "@/components/drawer"
import { ExportButtons } from "@/components/export-buttons"
import { AlertDialogUse } from "@/components/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ErrorState } from "@/components/ui/error-state"
// AI-assisted writing is disabled for Jewellery Walla — re-enable by uncommenting.
// import AiAssistButton from "@/components/ai-assist-button"
import type { FAQ } from "@/lib/types";


export default function FAQsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null)
  const [deletedFilter, setDeletedFilter] = useState<string>("active")
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    order: 1,
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: faqs = [], isLoading: loading, isError, error } = useQuery<FAQ[]>({
    queryKey: ["faqs", deletedFilter],
    queryFn: async () => {
      const filter = deletedFilter === "active" ? undefined : deletedFilter
      const data = await api.post<FAQ[]>("/api/admin/faq/view", { isDeletedAt: filter })
      return data ?? []
    },
  })

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      order: faq.order,
    })
    setDrawerOpen(true)
  }

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.put("/api/admin/faq/restore", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      invalidateCache(["faq"]);
      toast({ title: "FAQ restored successfully" });
    },
    onError: (error: Error) => {
      toast({ title: error instanceof ApiClientError ? error.message : "Failed to restore FAQ", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.put("/api/admin/faq/destroy", { id: faqToDelete }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      invalidateCache(["faq"]);
      toast({ title: "FAQ deleted successfully" });
      setDeleteDialogOpen(false);
      setFaqToDelete(null);
    },
    onError: (error: Error) => {
      toast({ title: error instanceof ApiClientError ? error.message : "Failed to delete FAQ", variant: "destructive" });
      setDeleteDialogOpen(false);
      setFaqToDelete(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (id: string) => api.post("/api/admin/faq/change-status", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      invalidateCache(["faq"]);
      toast({ title: "FAQ status updated successfully" });
    },
    onError: (error: Error) => toast({ title: error instanceof ApiClientError ? error.message : "Operation failed", variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post("/api/admin/faq/create", formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      invalidateCache(["faq"]);
      toast({ title: "FAQ created successfully" });
      setDrawerOpen(false);
      setEditingFaq(null);
      setFormData({ question: "", answer: "", order: 1 });
    },
    onError: (error: Error) => toast({ title: error instanceof ApiClientError ? error.message : "Operation failed", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: () => api.put(`/api/admin/faq/update/${editingFaq!._id}`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      invalidateCache(["faq"]);
      toast({ title: "FAQ updated successfully" });
      setDrawerOpen(false);
      setEditingFaq(null);
      setFormData({ question: "", answer: "", order: 1 });
    },
    onError: (error: Error) => toast({ title: error instanceof ApiClientError ? error.message : "Operation failed", variant: "destructive" }),
  });

  const handleDelete = (id: string) => {
    setFaqToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (faqToDelete) deleteMutation.mutate();
  };

  const handleChangeStatus = (faq: FAQ) => {
    statusMutation.mutate(faq._id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFaq) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const sortedFaqs = [...faqs].sort((a: FAQ, b: FAQ) => a.order - b.order)

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load FAQs"
          message={error instanceof Error ? error.message : "Could not fetch FAQs from the server."}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["faqs"] })}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FAQs</h1>
          <p className="text-muted-foreground">Manage frequently asked questions</p>
        </div>
        <div className="flex items-center gap-2">
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
          <ExportButtons data={faqs} filename="faqs" />
          <Button
            onClick={() => {
              setEditingFaq(null)
              setFormData({ question: "", answer: "", order: 1 })
              setDrawerOpen(true)
            }}
            className="transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom duration-300">
        <Accordion type="single" collapsible className="space-y-2">
          {sortedFaqs.map((faq, index) => (
            <AccordionItem
              key={faq._id}
              value={`faq-${faq._id}`}
              className="border rounded-lg px-4 bg-card hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-left"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <span className="text-left font-medium">{faq.question}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={faq.status ? "default" : "secondary"} className="text-xs">
                      {faq.status ? "active" : "inactive"}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p className="text-muted-foreground">{faq.answer}</p>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(faq)}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChangeStatus(faq)}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    {faq.status ? (
                      <>
                        <Eye className="h-3 w-3 mr-1" />
                        Hide
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3 mr-1" />
                        Show
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(faq._id)}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                  {deletedFilter === "deleted" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreMutation.mutate(faq._id)}
                      className="transition-all duration-200 hover:scale-105"
                    >
                      <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                      Restore
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingFaq ? "Edit FAQ" : "Add FAQ"} className="h-screen">
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto h-full pb-20">
          <div className="space-y-2 animate-in slide-in-from-right duration-300">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-75">
            <div className="flex items-center justify-between">
              <Label htmlFor="answer">Answer</Label>
              {/* AI generate-with-AI button disabled for Jewellery Walla */}
            </div>
            <Textarea
              id="answer"
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-100">
            <Label htmlFor="order">Order</Label>
            <Input
              id="order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: Number.parseInt(e.target.value) })}
              required
              min="1"
            />
          </div>          <Button
            type="submit"
            className="w-full animate-in slide-in-from-bottom duration-300 delay-175"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingFaq ? "Update FAQ" : "Create FAQ"}
          </Button>
        </form>
      </Drawer>

      <AlertDialogUse
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete FAQ"
        description="Are you sure you want to delete this FAQ? This action cannot be undone."
      />
    </div>
  )
}