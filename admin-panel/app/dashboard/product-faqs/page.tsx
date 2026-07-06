"use client"

import { useEffect, useState } from "react"
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
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, X, CopyPlus } from "lucide-react"
import AiAssistButton from "@/components/ai-assist-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import type { ProductFAQSet } from "@/lib/types"

interface Product {
  _id: string;
  name?: string;
  productName?: string;
  title?: string;
  slug?: string;
}

interface FaqEntry {
  question: string;
  answer: string;
  order: number;
}

function getProductNames(set: ProductFAQSet, products: Product[]): string {
  const productArr = Array.isArray(set.products) ? set.products : []
  return productArr
    .map((p) => {
      if (typeof p === "object" && p?.name) return p.name
      const id = typeof p === "string" ? p : p?._id
      if (!id) return ""
      const found = products.find((prod) => prod._id === id)
      return found?.name || found?.productName || found?.title || id.slice(-6)
    })
    .filter(Boolean)
    .join(", ")
}

function getProductIds(set: ProductFAQSet): string[] {
  return (Array.isArray(set.products) ? set.products : []).map((p) =>
    typeof p === "string" ? p : p._id,
  ).filter(Boolean)
}

export default function ProductFAQsPage() {
  const [faqSets, setFaqSets] = useState<ProductFAQSet[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingSet, setEditingSet] = useState<ProductFAQSet | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [setToDelete, setSetToDelete] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState("")
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [entries, setEntries] = useState<FaqEntry[]>([
    { question: "", answer: "", order: 1 },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [deletedFilter, setDeletedFilter] = useState<string>("active")
  const { toast } = useToast()

  useEffect(() => {
    loadFaqSets()
    loadProducts()
  }, [deletedFilter])

  // ── API helpers ──

  const loadFaqSets = async () => {
    setLoading(true)
    try {
      const filter = deletedFilter === "active" ? undefined : deletedFilter
      const data = await api.post<ProductFAQSet[]>("/api/admin/product-faq/view", { isDeletedAt: filter })
      setFaqSets(data ?? [])
    } catch (error) {
      toast({
        title: "Error loading FAQ sets",
        description: error instanceof ApiClientError ? error.message : "Failed to load",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const data = await api.post<Product[]>("/api/admin/product/view", {})
      setProducts(data ?? [])
    } catch {
      // silently fail
    }
  }

  // ── Filtered lists ──

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase()
    const name = (p.name || p.productName || p.title || "").toLowerCase()
    return name.includes(q)
  })

  const filteredSets = faqSets.filter((set) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    const matchesEntry = set.entries.some(
      (e) =>
        e.question.toLowerCase().includes(q) ||
        e.answer.toLowerCase().includes(q),
    )
    return matchesEntry || getProductNames(set, products).toLowerCase().includes(q)
  })

  // ── Actions ──

  const openCreateDrawer = () => {
    setEditingSet(null)
    setSelectedProductIds([])
    setProductSearch("")
    setEntries([{ question: "", answer: "", order: 1 }])
    setDrawerOpen(true)
  }

  const handleEdit = (set: ProductFAQSet) => {
    setEditingSet(set)
    setSelectedProductIds(getProductIds(set))
    setEntries([...set.entries].sort((a, b) => a.order - b.order))
    setDrawerOpen(true)
  }

  const handleDelete = (id: string) => {
    setSetToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!setToDelete) return

    try {
      await api.put("/api/admin/product-faq/delete/" + setToDelete)
      loadFaqSets()
      invalidateCache(["product-faq", "faq", "products"])
      toast({ title: "FAQ set deleted successfully" })
    } catch (error) {
      toast({
        title: "Error deleting FAQ set",
        description: error instanceof ApiClientError ? error.message : "Failed to delete",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setSetToDelete(null)
    }
  }

  const handleChangeStatus = async (set: ProductFAQSet) => {
    try {
      await api.post("/api/admin/product-faq/change-status", { id: set._id })
      loadFaqSets()
      invalidateCache(["product-faq", "faq", "products"])
      toast({ title: "FAQ set status updated successfully" })
    } catch (error) {
      toast({
        title: "Error updating FAQ set status",
        description: error instanceof ApiClientError ? error.message : "Operation failed",
        variant: "destructive",
      })
    }
  }

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    )
  }

  const updateEntry = (i: number, field: keyof FaqEntry, value: string | number) => {
    setEntries((prev) =>
      prev.map((entry, j) => (j === i ? { ...entry, [field]: value } : entry)),
    )
  }

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { question: "", answer: "", order: prev.length + 1 },
    ])
  }

  const removeEntry = (i: number) => {
    setEntries((prev) => prev.filter((_, j) => j !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedProductIds.length === 0) {
      toast({ title: "Please select at least one product", variant: "destructive" })
      return
    }

    const validEntries = entries.filter((e) => e.question.trim() && e.answer.trim())
    if (validEntries.length === 0) {
      toast({ title: "Please add at least one question and answer", variant: "destructive" })
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        products: selectedProductIds,
        entries: validEntries.map((e) => ({
          question: e.question.trim(),
          answer: e.answer.trim(),
          order: e.order,
        })),
      }

      if (editingSet) {
        await api.put("/api/admin/product-faq/update/" + editingSet._id, payload)
        toast({ title: "FAQ set updated successfully" })
      } else {
        await api.post("/api/admin/product-faq/create", payload)
        toast({ title: "FAQ set created successfully" })
      }

      loadFaqSets()
      invalidateCache(["product-faq", "faq", "products"])
      setDrawerOpen(false)
      setEditingSet(null)
      setSelectedProductIds([])
      setProductSearch("")
      setEntries([{ question: "", answer: "", order: 1 }])
    } catch (error) {
      toast({
        title: `Error ${editingSet ? "updating" : "creating"} FAQ set`,
        description: error instanceof ApiClientError ? error.message : "Operation failed",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // ── Derived data ──

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product FAQ Sets</h1>
          <p className="text-muted-foreground">
            Each set can be linked to multiple products and contain multiple Q&amp;A entries
          </p>
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
          <ExportButtons data={faqSets as unknown as Record<string, unknown>[]} filename="product-faq-sets" />
          <Button onClick={openCreateDrawer} className="transition-all duration-200 hover:scale-105">
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ Set
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by question, answer, or product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* FAQ set list */}
      {filteredSets.length > 0 ? (
        <div className="animate-in fade-in slide-in-from-bottom duration-300">
          <Accordion type="single" collapsible className="space-y-2">
            {filteredSets.map((set, index) => {
              const entryCount = set.entries?.length ?? 0
              const productCount = Array.isArray(set.products) ? set.products.length : 0
              return (
                <AccordionItem
                  key={set._id}
                  value={`set-${set._id}`}
                  className="border rounded-lg px-4 bg-card hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-left"
                  style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-left font-medium truncate">
                          {entryCount} FAQ{entryCount !== 1 ? "s" : ""}
                        </span>
                        <Badge variant="secondary" className="text-xs font-mono shrink-0">
                          {productCount} product{productCount !== 1 ? "s" : ""}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate hidden md:inline">
                          {getProductNames(set, products)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={set.status ? "default" : "secondary"} className="text-xs">
                          {set.status ? "active" : "inactive"}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    {/* Entry list */}
                    <div className="space-y-2">
                      {set.entries
                        ?.sort((a, b) => a.order - b.order)
                        .map((entry, i) => (
                          <div key={i} className="border rounded-md p-3 bg-muted/20">
                            <p className="text-sm font-medium">
                              <span className="text-muted-foreground mr-2">Q{i + 1}:</span>
                              {entry.question}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              <span className="text-muted-foreground mr-2">A:</span>
                              {entry.answer}
                            </p>
                          </div>
                        ))}
                    </div>

                    {/* Products */}
                    <p className="text-xs text-muted-foreground">
                      Products: {getProductNames(set, products)}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(set)}
                        className="transition-all duration-200 hover:scale-105"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleChangeStatus(set)}
                        className="transition-all duration-200 hover:scale-105"
                      >
                        {set.status ? (
                          <><EyeOff className="h-3 w-3 mr-1" /> Hide</>
                        ) : (
                          <><Eye className="h-3 w-3 mr-1" /> Show</>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(set._id)}
                        className="transition-all duration-200 hover:scale-105"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          {searchQuery ? (
            <p className="text-lg">No FAQ sets match your search.</p>
          ) : (
            <>
              <p className="text-lg font-medium">No FAQ sets yet</p>
              <p className="text-sm mt-1">Click &ldquo;Add FAQ Set&rdquo; to create one.</p>
            </>
          )}
        </div>
      )}

      {/* ── Drawer ── */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingSet ? "Edit FAQ Set" : "Add FAQ Set"}
        className="h-screen"
      >
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto h-full pb-20">
          {/* Product multi-selector */}
          <div className="space-y-2 animate-in slide-in-from-right duration-300">
            <Label>Products ({selectedProductIds.length} selected)</Label>
            <Input
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="mb-2"
            />
            <div className="max-h-36 overflow-y-auto border rounded-md p-1 space-y-0.5">
              {filteredProducts.length === 0 && (
                <p className="text-sm text-muted-foreground p-2">No products found</p>
              )}
              {filteredProducts.map((product) => {
                const name = product.name || product.productName || product.title || product.slug || product._id
                const isSelected = selectedProductIds.includes(product._id)
                return (
                  <label
                    key={product._id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
                      isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleProduct(product._id)}
                      className="accent-primary"
                    />
                    <span className="truncate">{name}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Separator */}
          <div className="border-t" />

          {/* FAQ Entries */}
          <div className="flex items-center justify-between animate-in slide-in-from-right duration-300 delay-75">
            <Label>FAQ Entries ({entries.length})</Label>
            <Button type="button" variant="outline" size="sm" onClick={addEntry}>
              <CopyPlus className="h-4 w-4 mr-1" />
              Add Entry
            </Button>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {entries.map((entry, i) => (
              <div
                key={i}
                className="border rounded-lg p-3 space-y-2 animate-in fade-in slide-in-from-right duration-200"
                style={{ animationDelay: `${i * 50}ms` } as React.CSSProperties}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Entry {i + 1}</span>
                  {entries.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => removeEntry(i)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Input
                  placeholder={`Question ${i + 1}`}
                  value={entry.question}
                  onChange={(e) => updateEntry(i, "question", e.target.value)}
                  required
                />
                <div className="flex items-start gap-2">
                  <Textarea
                    placeholder={`Answer ${i + 1}`}
                    value={entry.answer}
                    onChange={(e) => updateEntry(i, "answer", e.target.value)}
                    required
                    rows={2}
                    className="flex-1"
                  />
                  {entry.question.trim() && (
                    <AiAssistButton
                      context={{
                        name:
                          products
                            .filter((p) => selectedProductIds.includes(p._id))
                            .map((p) => p.name || p.productName || p.title || "")
                            .filter(Boolean)
                            .join(", ") || "Product",
                        question: entry.question,
                      }}
                      onResult={(text) => updateEntry(i, "answer", text)}
                      label="Generate Answer"
                      page="faq-answer"
                    />
                  )}
                </div>
                <Input
                  type="number"
                  placeholder="Order"
                  value={entry.order}
                  onChange={(e) => updateEntry(i, "order", Number.parseInt(e.target.value) || 1)}
                  min="1"
                  className="w-24"
                />
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full animate-in slide-in-from-bottom duration-300 delay-175" disabled={submitting}>
            {submitting ? "Saving..." : editingSet ? "Update FAQ Set" : "Create FAQ Set"}
          </Button>
        </form>
      </Drawer>

      {/* Delete confirmation */}
      <AlertDialogUse
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete FAQ Set"
        description="Are you sure you want to delete this FAQ set? It will be removed from all linked products."
      />
    </div>
  )
}
