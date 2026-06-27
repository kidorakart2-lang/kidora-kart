"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type Column } from "@/components/data-table"
import { Drawer } from "@/components/drawer"
import { ExportButtons } from "@/components/export-buttons"
import { AlertDialogUse } from "@/components/alert-dialog"
import { Plus } from "lucide-react"
import { fetchData, createItem, updateItem, deleteItem } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface PageItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  updatedAt: string;
}

export default function PagesPage() {
  const [pages, setPages] = useState<PageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<PageItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pageToDelete, setPageToDelete] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    status: "draft",
  })
  const { toast } = useToast()

  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = async () => {
    setLoading(true)
    const data = await fetchData("pages")
    setPages(data as PageItem[])
    setLoading(false)
  }

  const handleEdit = (page: PageItem) => {
    setEditingPage(page)
    setFormData({
      title: page.title,
      slug: page.slug,
      content: page.content,
      status: page.status,
    })
    setDrawerOpen(true)
  }

  const handleDelete = async (id: number) => {
    setPageToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (pageToDelete === null) return

    await deleteItem("pages", pageToDelete)
    setPages(pages.filter((p: PageItem) => p.id !== String(pageToDelete)))
    toast({ title: "Page deleted successfully" })
    setDeleteDialogOpen(false)
    setPageToDelete(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingPage) {
      await updateItem("pages", Number(editingPage.id), formData)
      setPages(pages.map((p: PageItem) => (p.id === editingPage!.id ? { ...p, ...formData } : p)))
      toast({ title: "Page updated successfully" })
    } else {
      const created = await createItem("pages", formData)
      setPages([...pages, { ...formData, id: created.id, updatedAt: "Just now" }] as PageItem[])
      toast({ title: "Page created successfully" })
    }

    setDrawerOpen(false)
    setEditingPage(null)
    setFormData({ title: "", slug: "", content: "", status: "draft" })
  }

  const columns = [
    {
      key: "title",
      label: "Title",
      render: (item: PageItem) => <span className="font-medium">{item.title}</span>,
    },
    {
      key: "slug",
      label: "Slug",
      render: (item: PageItem) => <span className="font-mono text-sm text-muted-foreground">/{item.slug}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (item: PageItem) => (
        <Badge variant={item.status === "published" ? "default" : "secondary"} className="capitalize">
          {item.status}
        </Badge>
      ),
    },
    {
      key: "updatedAt",
      label: "Last Updated",
      render: (item: PageItem) => <span className="text-sm text-muted-foreground">{item.updatedAt}</span>,
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground">Manage your website pages and content</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons data={pages as unknown as Record<string, unknown>[]} filename="pages" />
          <Button
            onClick={() => {
              setEditingPage(null)
              setFormData({ title: "", slug: "", content: "", status: "draft" })
              setDrawerOpen(true)
            }}
            className="transition-all duration-200 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Page
          </Button>
        </div>
      </div>

      <DataTable
        data={pages}
        columns={columns as unknown as Column<PageItem>[]}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search pages..."
      />

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editingPage ? "Edit Page" : "Add Page"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 animate-in slide-in-from-right duration-300">
            <Label htmlFor="title">Page Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-75">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              className="font-mono"
            />
          </div>

          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-100">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={8}
              className="resize-none"
            />
          </div>

          <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-125">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full animate-in slide-in-from-bottom duration-300 delay-150">
            {editingPage ? "Update Page" : "Create Page"}
          </Button>
        </form>
      </Drawer>

      <AlertDialogUse
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Page"
        description="Are you sure you want to delete this page? This action cannot be undone."
      />
    </div>
  )
}
