"use client"

import { useEffect, useState } from "react"
import { api, ApiClientError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Drawer } from "@/components/drawer"
import { ExportButtons } from "@/components/export-buttons"
import { AlertDialogUse } from "@/components/alert-dialog"
import { Plus, Pencil, Trash2, Eye, EyeOff, CopyPlus, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { ProductFAQ } from "@/lib/types"

interface Product {
  _id: string;
  name?: string;
  productName?: string;
  title?: string;
  slug?: string;
}


export default function ProductFAQsPage() {
  const [faqs, setFaqs] = useState<ProductFAQ[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<ProductFAQ | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState("")
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [formData, setFormData] = useState({
    productId: "",
    question: "",
    answer: "",
    order: 1,
  })
  const [faqEntries, setFaqEntries] = useState<{ question: string; answer: string; order: number }[]>([
    { question: "", answer: "", order: 1 },
  ])
  const { toast } = useToast()

  useEffect(() => {
    loadFaqs()
    loadProducts()
  }, [])

  const loadFaqs = async () => {
    setLoading(true)
    try {
      const data = await api.post<ProductFAQ[]>("/api/admin/product-faq/view", {})
      setFaqs(data ?? [])
    } catch (error) {
      toast({
        title: "Error loading product FAQs",
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

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase()
    const name = (p.name || p.productName || p.title || "").toLowerCase()
    return name.includes(q)
  })

  const handleProductSelect = (id: string) => {
    if (editingFaq) {
      setSelectedProductIds([id])
      setFormData((prev) => ({ ...prev, productId: id }))
    } else {
      setSelectedProductIds((prev) =>
        prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
      )
    }
  }

  const handleEdit = (faq: ProductFAQ) => {
    setEditingFaq(faq)
    setSelectedProductIds([faq.productId])
    setFormData({
      productId: faq.productId,
      question: faq.question,
      answer: faq.answer,
      order: faq.order,
    })
    setDrawerOpen(true)
  }

  const handleDelete = async (id: string) => {
    setFaqToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!faqToDelete) return

    try {
      await api.put("/api/admin/product-faq/destroy", { id: faqToDelete })
      loadFaqs()
      toast({ title: "Product FAQ deleted successfully" })
    } catch (error) {
      toast({
        title: "Error deleting product FAQ",
        description: error instanceof ApiClientError ? error.message : "Failed to delete",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setFaqToDelete(null)
    }
  }

  const handleChangeStatus = async (faq: ProductFAQ) => {
    try {
      await api.post("/api/admin/product-faq/change-status", { id: faq._id })
      loadFaqs()
      toast({ title: "Product FAQ status updated successfully" })
    } catch (error) {
      toast({
        title: "Error updating product FAQ status",
        description: error instanceof ApiClientError ? error.message : "Operation failed",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingFaq) {
        await api.put(`/api/admin/product-faq/update/${editingFaq._id}`, formData)
        loadFaqs()
        toast({ title: "Product FAQ updated successfully" })
      } else {
        if (selectedProductIds.length === 0) {
          toast({
            title: "Please select at least one product",
            variant: "destructive",
          })
          return
        }

        // Collect all non-empty FAQ entries
        const entries = faqEntries.filter((e) => e.question.trim() && e.answer.trim())
        if (entries.length === 0) {
          toast({
            title: "Please add at least one question and answer",
            variant: "destructive",
          })
          return
        }

        if (entries.length === 1) {
          // Single FAQ — use existing bulk-create endpoint
          await api.post("/api/admin/product-faq/bulk-create", {
            productIds: selectedProductIds,
            question: entries[0].question,
            answer: entries[0].answer,
            order: entries[0].order,
          })
          loadFaqs()
          toast({ title: `${selectedProductIds.length} FAQ(s) created successfully` })
        } else {
          // Multiple FAQs — use bulk-create-faqs endpoint
          const result = await api.post<any[]>("/api/admin/product-faq/bulk-create-faqs", {
            productIds: selectedProductIds,
            faqs: entries.map((e) => ({
              question: e.question,
              answer: e.answer,
              order: e.order,
            })),
          })
          loadFaqs()
          toast({ title: `${(result || []).length} FAQs created (${entries.length} entries × ${selectedProductIds.length} products)` })
        }
      }

      setDrawerOpen(false)
      setEditingFaq(null)
      setSelectedProductIds([])
      setProductSearch("")
      setFormData({ productId: "", question: "", answer: "", order: 1 })
    } catch (error) {
      toast({
        title: `Error ${editingFaq ? "updating" : "creating"} product FAQ`,
        description: error instanceof ApiClientError ? error.message : "Operation failed",
        variant: "destructive",
      })
    }
  }

  const getProductName = (faq: ProductFAQ) => {
    return faq.productName || products.find((p) => p._id === faq.productId)?.name || products.find((p) => p._id === faq.productId)?.productName || "Unknown Product"
  }

  const sortedFaqs = [...faqs].sort((a, b) => a.order - b.order)

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
          <h1 className="text-3xl font-bold tracking-tight">Product FAQs</h1>
          <p className="text-muted-foreground">Manage product-specific frequently asked questions</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons data={faqs as unknown as Record<string, unknown>[]} filename="product-faqs" />
          <Button
            onClick={() => {
              setEditingFaq(null)
              setSelectedProductIds([])
      setProductSearch("")
      setFormData({ productId: "", question: "", answer: "", order: 1 })
      setFaqEntries([{ question: "", answer: "", order: 1 }])
              setDrawerOpen(true)
            }}
            className="transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product FAQ
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
                  <div className="flex items-center gap-3">
                    <span className="text-left font-medium">{faq.question}</span>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {getProductName(faq)}
                    </Badge>
                  </div>
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
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingFaq ? "Edit Product FAQ" : "Add Product FAQ"} className="h-screen">
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto h-full pb-20">
          {/* Product selector */}
          <div className="space-y-2 animate-in slide-in-from-right duration-300">
            <Label>
              {editingFaq ? "Product" : `Products (${selectedProductIds.length} selected)`}
            </Label>
            {!editingFaq && (
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="mb-2"
              />
            )}
            <div className="max-h-48 overflow-y-auto border rounded-md p-1 space-y-0.5">
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
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <input
                      type={editingFaq ? "radio" : "checkbox"}
                      name="productId"
                      checked={isSelected}
                      onChange={() => handleProductSelect(product._id)}
                      className="accent-primary"
                      required={editingFaq !== null && formData.productId === ""}
                    />
                    <span className="truncate">{name}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Edit mode: single FAQ form */}
          {editingFaq ? (
            <>
              <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-75">
                <Label htmlFor="question">Question</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-100">
                <Label htmlFor="answer">Answer</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  required
                  rows={4}
                />
              </div>

              <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-125">
                <Label htmlFor="order">Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: Number.parseInt(e.target.value) })}
                  required
                  min="1"
                />
              </div>
            </>
          ) : (
            /* Create mode: multi-entry FAQ list */
            <>
              <div className="flex items-center justify-between">
                <Label>FAQ Entries ({faqEntries.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFaqEntries((prev) => [
                      ...prev,
                      { question: "", answer: "", order: prev.length + 1 },
                    ])
                  }
                >
                  <CopyPlus className="h-4 w-4 mr-1" />
                  Add Another
                </Button>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {faqEntries.map((entry, i) => (
                  <div
                    key={i}
                    className="border rounded-lg p-3 space-y-2 animate-in fade-in slide-in-from-right duration-200"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Entry {i + 1}</span>
                      {faqEntries.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() =>
                            setFaqEntries((prev) => prev.filter((_, j) => j !== i))
                          }
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Input
                      placeholder={`Question ${i + 1}`}
                      value={entry.question}
                      onChange={(ev) => {
                        const val = ev.target.value
                        setFaqEntries((prev) =>
                          prev.map((entry, j) =>
                            j === i ? { ...entry, question: val } : entry,
                          ),
                        )
                      }}
                      required
                    />
                    <Textarea
                      placeholder={`Answer ${i + 1}`}
                      value={entry.answer}
                      onChange={(ev) => {
                        const val = ev.target.value
                        setFaqEntries((prev) =>
                          prev.map((entry, j) =>
                            j === i ? { ...entry, answer: val } : entry,
                          ),
                        )
                      }}
                      required
                      rows={2}
                    />
                    <Input
                      type="number"
                      placeholder="Order"
                      value={entry.order}
                      onChange={(ev) => {
                        const val = Number.parseInt(ev.target.value) || 1
                        setFaqEntries((prev) =>
                          prev.map((entry, j) =>
                            j === i ? { ...entry, order: val } : entry,
                          ),
                        )
                      }}
                      min="1"
                      className="w-24"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <Button type="submit" className="w-full animate-in slide-in-from-bottom duration-300 delay-175">
            {editingFaq
              ? "Update Product FAQ"
              : `Create ${faqEntries.filter((e) => e.question.trim()).length || ""} FAQ${faqEntries.filter((e) => e.question.trim()).length !== 1 ? "s" : ""}`}
          </Button>
        </form>
      </Drawer>

      <AlertDialogUse
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product FAQ"
        description="Are you sure you want to delete this product FAQ? This action cannot be undone."
      />
    </div>
  )
}
