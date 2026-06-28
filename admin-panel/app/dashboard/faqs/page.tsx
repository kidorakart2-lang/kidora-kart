"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Drawer } from "@/components/drawer"
import { ExportButtons } from "@/components/export-buttons"
import { AlertDialogUse } from "@/components/alert-dialog"
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  order: number;
  status: boolean;
}

const AXIOS_CONFIG = { withCredentials: true } as const

function isAxiosError(error: unknown): error is { response?: { data?: { _message?: string } }; message?: string } {
  return typeof error === "object" && error !== null && ("response" in error || "message" in error);
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [faqToDelete, setFaqToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    order: 1,
  })
  const { toast } = useToast()

  useEffect(() => {
    loadFaqs()
  }, [])

  const loadFaqs = async () => {
    setLoading(true)
    try {
      const response = await axios.post(
        `/api/admin/faq/view`,
        {},
        AXIOS_CONFIG
      )
      setFaqs(response.data._data || [])
    } catch (error) {
      toast({
        title: "Error loading FAQs",
        description: isAxiosError(error) ? error.response?.data?._message || "Failed to load FAQs" : "Failed to load FAQs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq)
    setFormData({
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
      await axios.put(
        `/api/admin/faq/destroy`,
        { id: faqToDelete },
        AXIOS_CONFIG
      )
      loadFaqs()
      toast({ title: "FAQ deleted successfully" })
    } catch (error) {
      toast({
        title: "Error deleting FAQ",
        description: isAxiosError(error) ? error.response?.data?._message || "Failed to delete FAQ" : "Failed to delete FAQ",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setFaqToDelete(null)
    }
  }

  const handleChangeStatus = async (faq: FAQ) => {
    try {
      const response = await axios.post(
        `/api/admin/faq/change-status`,
        { id: faq._id },
        AXIOS_CONFIG
      )

      if (response.data._status) {
        loadFaqs()
        toast({ title: "FAQ status updated successfully" })
      } else {
        toast({
          title: response.data._message || "Error updating FAQ status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error updating FAQ status",
        description: isAxiosError(error) ? error.response?.data?._message || "Operation failed" : "Operation failed",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingFaq) {
        const response = await axios.put(
          `/api/admin/faq/update/${editingFaq._id}`,
          formData,
          AXIOS_CONFIG
        )

        if (response.data._status) {
          loadFaqs()
          toast({ title: "FAQ updated successfully" })
        } else {
          toast({
            title: response.data._message || "Error updating FAQ",
            variant: "destructive",
          })
          return
        }
      } else {
        const response = await axios.post(
          `/api/admin/faq/create`,
          formData,
          AXIOS_CONFIG
        )

        if (response.data._status) {
          loadFaqs()
          toast({ title: "FAQ created successfully" })
        } else {
          toast({
            title: response.data._message || "Error creating FAQ",
            variant: "destructive",
          })
          return
        }
      }

      setDrawerOpen(false)
      setEditingFaq(null)
      setFormData({ question: "", answer: "", order: 1 })
    } catch (error) {
      toast({
        title: `Error ${editingFaq ? "updating" : "creating"} FAQ`,
        description: isAxiosError(error) ? error.response?.data?._message || "Operation failed" : "Operation failed",
        variant: "destructive",
      })
    }
  }

  const sortedFaqs = [...faqs].sort((a: FAQ, b: FAQ) => a.order - b.order)

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
          <ExportButtons data={faqs as unknown as Record<string, unknown>[]} filename="faqs" />
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
            <Label htmlFor="answer">Answer</Label>
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
          </div>

          <Button type="submit" className="w-full animate-in slide-in-from-bottom duration-300 delay-175">
            {editingFaq ? "Update FAQ" : "Create FAQ"}
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