"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
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
import { Plus, Save, Loader2, Monitor, LayoutGrid, TriangleAlert } from "lucide-react"

import type { HomeSection, SectionConfig } from "./types"
import { SECTION_TYPES, getTypeMeta } from "./constants"
import { UnsavedIndicator } from "./components/SortableSection"
import SortableSection from "./components/SortableSection"
import SectionConfigForm from "./components/SectionConfigForm"
import { PreviewDialog } from "./components/Preview"
import { ErrorState } from "@/components/ui/error-state"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { invalidateCache } from "@/lib/invalidate-cache"

const STORAGE_KEY = "home-page-draft"

function saveDraft(sections: HomeSection[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections))
  } catch { /* quota exceeded — silently ignore */ }
}

function loadDraft(): HomeSection[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as HomeSection[]) : null
  } catch {
    return null
  }
}

function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

function generateObjectId(): string {
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function fetchSections(): Promise<{ sections: HomeSection[] }> {
  return api.get<{ sections: HomeSection[] }>("/api/admin/home-page");
}

function saveSections(sections: HomeSection[]) {
  return api.put("/api/admin/home-page", { sections });
}

export default function HomePagePage() {
  const [sections, setSections] = useState<HomeSection[]>([])
  const [saving, setSaving] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null)
  const [editType, setEditType] = useState<string>("banner")
  const [editConfig, setEditConfig] = useState<SectionConfig>({})
  const [addType, setAddType] = useState<string>("round-categories")
  const [addConfig, setAddConfig] = useState<SectionConfig>({})
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [hasUnsaved, setHasUnsaved] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showAutoSaved, setShowAutoSaved] = useState(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isInitialEditTypeRef = useRef(true)

  // ── React Query ──
  const { isLoading, isError, error, refetch } = useQuery({
    queryKey: ["home-page-sections"],
    queryFn: async () => {
      const response = await fetchSections();
      const serverSections = (response?.sections ?? []) as HomeSection[];
      const sorted = serverSections.sort((a: HomeSection, b: HomeSection) => a.order - b.order);

      // Restore draft from localStorage if it exists
      const draft = loadDraft()
      if (draft && draft.length > 0) {
        setSections(draft)
        setHasUnsaved(true)
        return draft
      }

      setSections(sorted)
      return sorted;
    },
    staleTime: 5 * 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: saveSections,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-page-sections"] });
      invalidateCache(["homepage"]);
      clearDraft()
      setHasUnsaved(false)
      toast({ title: "Home page saved successfully!" });
    },
    onError: (error: Error) => {
      toast({ title: error instanceof ApiClientError ? error.message : "Request failed", variant: "destructive" });
    },
    onSettled: () => setSaving(false),
  });

  // ── Edit type tracking: reset config when section type changes ──
  useEffect(() => {
    if (!editDialogOpen || !editingSection) return;
    if (isInitialEditTypeRef.current) { isInitialEditTypeRef.current = false; return; }
    const meta = getTypeMeta(editType);
    setEditConfig({ ...meta.defaults.config });
  }, [editType, editDialogOpen, editingSection]);

  // ── Add type tracking: reset config when section type changes ──
  useEffect(() => {
    if (!addDialogOpen) return;
    const meta = getTypeMeta(addType);
    setAddConfig({ ...meta.defaults.config });
  }, [addType, addDialogOpen]);

  // ── Debounced auto-save to localStorage (500ms after last change) with flash indicator ──
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!hasUnsaved) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveDraft(sections)
      // Flash auto-saved indicator
      setShowAutoSaved(true)
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
      autoSaveTimerRef.current = setTimeout(() => setShowAutoSaved(false), 1500)
    }, 500)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [sections, hasUnsaved])

  // ── Warn on page leave when there are unsaved changes ──
  useEffect(() => {
    if (!hasUnsaved) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [hasUnsaved])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const withDraft = (fn: (prev: HomeSection[]) => HomeSection[]) => {
    setSections(fn)
    setHasUnsaved(true)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    withDraft((prev) => {
      const oldIdx = prev.findIndex((s) => s._id === active.id);
      const newIdx = prev.findIndex((s) => s._id === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      return arrayMove(prev, oldIdx, newIdx);
    })
  };

  const handleToggle = (section: HomeSection) => {
    withDraft((prev) => prev.map((s) =>
      s._id === section._id ? { ...s, config: { ...(s.config || ({} as SectionConfig)), hidden: !(s.config?.hidden ?? false) } } : s
    ))
  };

  const handleEdit = (section: HomeSection) => {
    setEditingSection(section);
    setEditType(section.type);
    setEditConfig({ ...section.config });
    setEditDialogOpen(true);
    isInitialEditTypeRef.current = true;
  };

  const handleSaveEdit = () => {
    withDraft((prev) => prev.map((s) =>
      s._id === editingSection!._id ? { ...s, type: editType, config: editConfig } : s
    ))
    setEditDialogOpen(false);
    setEditingSection(null);
    toast({ title: "Section updated locally. Don't forget to save all changes." });
  };

  const handleAddSection = () => {
    const meta = getTypeMeta(addType);
    const maxOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.order)) : -1
    const newSection: HomeSection = { _id: generateObjectId(), type: addType, config: { ...meta.defaults.config, ...addConfig }, order: maxOrder + 1 };
    withDraft((prev) => [...prev, newSection])
    setAddDialogOpen(false);
    setAddType("round-categories");
    setAddConfig({});
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(null)
    withDraft((prev) => prev.filter((s) => s._id !== id))
  };

  const handleSaveAll = async () => {
    const cfg = (s: HomeSection) => (s.config ?? {}) as SectionConfig

    const emptyBanners = sections.filter((s) => s.type === "banner" && !cfg(s).selectedBannerIds?.length)
    const emptyCategoryGrids = sections.filter((s) => s.type === "category-grid" && !cfg(s).categorySelectedIds?.length)
    const emptyPromoBanners = sections.filter((s) => s.type === "promo-banner" && !cfg(s).selectedBannerId && !cfg(s).bannerImage)
    const emptyVideos = sections.filter((s) => s.type === "video" && !cfg(s).videoUrl)
    const emptyBentoGrids = sections.filter(
      (s) => s.type === "bento-grid" && (!cfg(s).cells?.length || (cfg(s).cells ?? []).some((c) => !c.image)),
    )
    const emptyShopByPrice = sections.filter(
      (s) => s.type === "shop-by-price" && (!Array.isArray(cfg(s).ranges) || (cfg(s).ranges as unknown[]).length === 0),
    )

    const issues: { type: string; count: number; label: string }[] = []
    if (emptyBanners.length) issues.push({ type: "banner", count: emptyBanners.length, label: "banner" })
    if (emptyCategoryGrids.length) issues.push({ type: "category-grid", count: emptyCategoryGrids.length, label: "category grid" })
    if (emptyPromoBanners.length) issues.push({ type: "promo-banner", count: emptyPromoBanners.length, label: "promo banner" })
    if (emptyVideos.length) issues.push({ type: "video", count: emptyVideos.length, label: "video" })
    if (emptyBentoGrids.length) issues.push({ type: "bento-grid", count: emptyBentoGrids.length, label: "bento grid" })
    if (emptyShopByPrice.length) issues.push({ type: "shop-by-price", count: emptyShopByPrice.length, label: "shop by price" })

    if (issues.length > 0) {
      const details = issues.map((i) => `${i.count} ${i.label}(s)`).join(", ")
      toast({
        title: "Cannot save — incomplete sections",
        description: `${issues.length} section type(s) missing required fields: ${details}. Edit them to fill in the missing data.`,
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    const ordered = sections.map((s, i) => ({ ...s, order: i }))
    saveMutation.mutate(ordered)
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="space-y-2">{[1, 2, 3].map((i) => (<div key={i} className="h-16 bg-muted rounded-lg" />))}</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 space-y-6">
        <ErrorState
          title="Failed to load home page sections"
          message={error instanceof Error ? error.message : "Could not fetch sections from the server. Check your connection and try again."}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Home Page Sections</h1>
          <p className="text-muted-foreground mt-1">Drag to reorder sections. Click Save All to persist changes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAddDialogOpen(true)} variant="outline"><Plus className="h-4 w-4 mr-2" />Add Section</Button>
          <Button variant="secondary" onClick={() => setPreviewOpen(true)}><Monitor className="h-4 w-4 mr-2" />Preview</Button>
          <Button onClick={handleSaveAll} disabled={saving || saveMutation.isPending}>
            {saving || saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save All
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <UnsavedIndicator hasUnsaved={hasUnsaved} />
        {showAutoSaved && (
          <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 inline-flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-300 shadow-sm">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Auto-saved
          </div>
        )}
      </div>

      {sections.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s._id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {sections.map((section) => (
                <SortableSection key={section._id} section={section} index={sections.findIndex((s) => s._id === section._id)} onEdit={handleEdit} onToggle={handleToggle} onDelete={(id) => setDeleteConfirmId(id)} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No sections yet</p>
          <p className="text-sm mt-1">Click Add Section to start building your home page.</p>
        </div>
      )}

      {/* Edit Sheet */}
      <Sheet open={editDialogOpen && !!editingSection} onOpenChange={(open) => { if (!open) { setEditDialogOpen(false); setEditingSection(null); } }} modal={false}>
        <SheetContent side="right" className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          <SheetHeader><SheetTitle>Edit Section</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Section Type</Label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SECTION_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="border-t pt-4">
                <Label className="mb-3 block">Configuration</Label>
                <SectionConfigForm type={editType} config={editConfig} onChange={setEditConfig} />
              </div>
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2">
            <SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <PreviewDialog open={previewOpen} onClose={() => setPreviewOpen(false)} sections={sections} device={previewDevice} onDeviceChange={setPreviewDevice} />

      {/* Add Section Sheet */}
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete section?</AlertDialogTitle>
            <AlertDialogDescription>
              This section will be removed from the home page. You can undo this by closing without saving,
              but once you click <strong>Save All</strong> the deletion is permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteConfirmId!)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={addDialogOpen} onOpenChange={(open) => { if (!open) { setAddDialogOpen(false); setAddType("round-categories"); setAddConfig({}); } }} modal={false}>
        <SheetContent side="right" className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          <SheetHeader><SheetTitle>Add Section</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Section Type</Label>
                <Select value={addType} onValueChange={(v) => setAddType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SECTION_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}><span className="flex items-center gap-2"><t.icon className="h-4 w-4" />{t.label}</span></SelectItem>))}</SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">{getTypeMeta(addType).description}</p>
              </div>
              <div className="border-t pt-4">
                <Label className="mb-3 block">Configuration</Label>
                <SectionConfigForm type={addType} config={addConfig} onChange={setAddConfig} />
              </div>
            </div>
          </div>
          <SheetFooter className="flex-row justify-end gap-2">
            <SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose>
            <Button onClick={handleAddSection}>Add Section</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
