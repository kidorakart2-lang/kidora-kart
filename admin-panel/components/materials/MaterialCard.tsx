import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pencil, Trash2, Package } from "lucide-react";
import type { MaterialItem } from "@/lib/types";

interface MaterialCardProps {
  material: MaterialItem;
  index: number;
  onEdit: (material: MaterialItem) => void;
  onDelete: (id: string) => void;
  onStatusChange: (material: MaterialItem) => void;
  onRestore?: (id: string) => void;
}

export function MaterialCard({ material, index, onEdit, onDelete, onStatusChange, onRestore }: MaterialCardProps) {
  return (
    <Card
      className="p-4 group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{material.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">
                Order: {material.order}
              </p>
            </div>
          </div>
          <Badge variant={material.status ? "default" : "secondary"}>
            {material.status ? "Active" : "Inactive"}
          </Badge>
        </div>
        {material.description && (
          <p className="text-sm text-muted-foreground">
            {material.description}
          </p>
        )}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(material)}
            className="flex-1 transition-all duration-200 hover:scale-105"
          >
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(material._id)}
            className="flex-1 transition-all duration-200 hover:scale-105"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
          {onRestore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRestore(material._id)}
              className="flex-1 transition-all duration-200 hover:scale-105"
            >
              <svg className="h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Restore
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStatusChange(material)}
          className="w-full transition-all duration-200 hover:scale-105"
        >
          Change Status
        </Button>
      </div>
    </Card>
  );
}
