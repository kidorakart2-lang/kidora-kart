"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GripVertical, Trash2, Eye, EyeOff } from "lucide-react"
import type { HomeSection } from "../types"
import { getTypeMeta, getSectionTitle } from "../constants"

// ── Unsaved indicator ──

export function UnsavedIndicator({ hasUnsaved }: { hasUnsaved: boolean }) {
  if (!hasUnsaved) return null
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800 flex items-center gap-2">
      <span>⚠️</span>
      <span>You have unsaved changes. Click <strong>Save All</strong> to persist.</span>
    </div>
  )
}

// ── SortableSection card ──

export default function SortableSection({
  section,
  index,
  onEdit,
  onToggle,
  onDelete,
}: {
  section: HomeSection
  index: number
  onEdit: (s: HomeSection) => void
  onToggle: (s: HomeSection) => void
  onDelete: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section._id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
  }

  const meta = getTypeMeta(section.type)
  const Icon = meta.icon
  const title = getSectionTitle(section)
  const isLocalId = section._id.startsWith("local_")

  return (
    <div ref={setNodeRef} style={style} className="border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 p-4">
        <button
          className="cursor-grab touch-none hover:text-primary transition-colors"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>

        <div className={`p-2 rounded-lg ${meta.color} shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium truncate">{title}</span>
            <Badge variant="outline" className="text-xs shrink-0">
              {meta.label}
            </Badge>
            {isLocalId && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                Unsaved
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {meta.description}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onToggle(section)}
            title={section.config?.hidden ? "Show" : "Hide"}
          >
            {section.config?.hidden ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onEdit(section)} className="h-8">
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(section._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
