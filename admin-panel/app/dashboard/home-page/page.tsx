"use client"

import { useEffect, useState, useCallback } from "react"
import { api, ApiClientError } from "@/lib/api"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Plus, Save, Loader2, Monitor, LayoutGrid } from "lucide-react"

import type { HomeSection, SectionConfig } from "./types"
import { SECTION_TYPES, getTypeMeta } from "./constants"
import { UnsavedIndicator } from "./components/SortableSection"
import SortableSection from "./components/SortableSection"
import SectionConfigForm from "./components/SectionConfigForm"
import { PreviewDialog } from "./components/Preview"
import { invalidateCache } from "@/lib/invalidate-cache"

// ── Helpers ──

function generateObjectId(): string {
  const hex = "0123456789abcdef"
  return Array.from({ length: 24 }, () => hex[Math.floor(Math.random() * 16)]).join("")
}

// ── Main page component ──

export default function HomePagePage() {
  const [sections, setSections] = useState<HomeSection[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Edit state
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null)
  const [editType, setEditType] = useState<string>("banner")
  const [editConfig, setEditConfig] = useState<SectionConfig>({})

  // Add new section state
  const [addType, setAddType] = useState<string>("round-categories")
  const [addConfig, setAddConfig] = useState<SectionConfig>({})

  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const loadSections = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get<{ sections: HomeSection[] }>("/api/admin/home-page")
      const data = (response?.sections ?? []) as HomeSection[]
      setSections(data.sort((a: HomeSection, b: HomeSection) => a.order - b.order))
    } catch (error) {
      toast({
        title: "Error loading sections",
        description: error instanceof ApiClientError ? error.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadSections()
  }, [loadSections])

  // ── Drag reorder ──

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setSections((prev) => {
      const oldIdx = prev.findIndex((s) => s._id === active.id)
      const newIdx = prev.findIndex((s) => s._id === over.id)
      if (oldIdx === -1 || newIdx === -1) return prev
      return arrayMove(prev, oldIdx, newIdx)
    })
  }

  // ── Toggle hidden ──

  const handleToggle = (section: HomeSection) => {
    setSections((prev) =>
      prev.map((s) =>
        s._id === section._id
          ? {
              ...s,
              config: { ...(s.config || ({} as SectionConfig)), hidden: !(s.config?.hidden ?? false) },
            }
          : s,
      ),
    )
  }

  // ── Edit section ──

  const handleEdit = (section: HomeSection) => {
    setEditingSection(section)
    setEditType(section.type)
    setEditConfig({ ...section.config })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    setSections((prev) =>
      prev.map((s) =>
        s._id === editingSection!._id
          ? { ...s, type: editType, config: editConfig }
          : s,
      ),
    )
    setEditDialogOpen(false)
    setEditingSection(null)
    toast({ title: "Section updated locally. Don't forget to save all changes." })
  }

  // ── Add section ──

  const handleAddSection = () => {
    const meta = getTypeMeta(addType)
    const newSection: HomeSection = {
      _id: generateObjectId(),
      type: addType,
      config: { ...meta.defaults.config, ...addConfig },
      order: sections.length,
    }
    setSections((prev) => [...prev, newSection])
    setAddDialogOpen(false)
    setAddType("round-categories")
    setAddConfig({})
    toast({ title: `Added "${meta.label}" section. Don't forget to save all changes.` })
  }

  // ── Delete section ──

  const handleDelete = (id: string) => {
    setSections((prev) => prev.filter((s) => s._id !== id))
    toast({ title: "Section removed locally. Don't forget to save all changes." })
  }

  // ── Save all ──

  const handleSaveAll = async () => {
    // Validate: category-grid sections must have at least one item selected
    const emptyCategoryGrids = sections.filter(
      (s) =>
        s.type === "category-grid" &&
        !(s.config as SectionConfig)?.categorySelectedIds?.length,
    )

    if (emptyCategoryGrids.length > 0) {
      toast({
        title: "Cannot save — incomplete sections",
        description: `${emptyCategoryGrids.length} category-grid section(s) have no items selected. Open each and select at least one item.`,
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const ordered = sections.map((s, i) => ({
        ...s,
        order: i,
      }))

      await api.put("/api/admin/home-page", { sections: ordered })
      toast({ title: "Home page saved successfully!" })
      invalidateCache(["homepage"])
      await loadSections()
    } catch (error) {
      toast({
        title: "Error saving home page",
        description: error instanceof ApiClientError ? error.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // ── Preview state ──
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop")

  // ── Render ──

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Home Page Sections</h1>
          <p className="text-muted-foreground mt-1">
            Drag to reorder sections. Click Save All to persist changes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddDialogOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
          <Button variant="secondary" onClick={() => setPreviewOpen(true)}>
            <Monitor className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSaveAll} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All
          </Button>
        </div>
      </div>

      {/* Unsaved changes indicator */}
      <UnsavedIndicator sections={sections} />

      {/* Section list */}
      {sections.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={sections.map((s) => s._id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sections.map((section) => (
                <SortableSection
                  key={section._id}
                  section={section}
                  index={sections.findIndex((s) => s._id === section._id)}
                  onEdit={handleEdit}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No sections yet</p>
          <p className="text-sm mt-1">
            Click Add Section to start building your home page. While no sections exist, the store will show the default layout.
          </p>
        </div>
      )}

      {/* ── Edit Sheet ── */}
      <Sheet open={editDialogOpen && !!editingSection} onOpenChange={(open) => { if (!open) { setEditDialogOpen(false); setEditingSection(null) } }}>
        <SheetContent side="right" className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Edit Section</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Section Type</Label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-3 block">Configuration</Label>
                <SectionConfigForm
                  type={editingSection?.type === "banner" ? "banner" : editType}
                  config={editConfig}
                  onChange={setEditConfig}
                />
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Preview Dialog ── */}
      <PreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        sections={sections}
        device={previewDevice}
        onDeviceChange={setPreviewDevice}
      />

      {/* ── Add Section Sheet ── */}
      <Sheet open={addDialogOpen} onOpenChange={(open) => { if (!open) { setAddDialogOpen(false); setAddType("round-categories"); setAddConfig({}) } }}>
        <SheetContent side="right" className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Add Section</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Section Type</Label>
                <Select value={addType} onValueChange={(v) => setAddType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span className="flex items-center gap-2">
                          <t.icon className="h-4 w-4" />
                          {t.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {getTypeMeta(addType).description}
                </p>
              </div>

              <div className="border-t pt-4">
                <Label className="mb-3 block">Configuration</Label>
                <SectionConfigForm
                  type={addType}
                  config={addConfig}
                  onChange={setAddConfig}
                />
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button onClick={handleAddSection}>
              Add Section
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
