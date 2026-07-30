import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import type { ColorItem } from "@/lib/types";

interface ColorCardProps {
  color: ColorItem;
  index: number;
  onEdit: (color: ColorItem) => void;
  onDelete: (id: string) => void;
  onStatusChange: (color: ColorItem) => void;
  onRestore?: (id: string) => void;
}

export function ColorCard({ color, index, onEdit, onDelete, onStatusChange, onRestore }: ColorCardProps) {
  return (
    <Card
      className="p-4 group hover:shadow-lg transition-all duration-300 hover:scale-[1.05] animate-in fade-in zoom-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="space-y-3">
        <div
          className="w-full h-24 rounded-lg border-2 border-border transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{ backgroundColor: color.code }}
        />
        <div className="space-y-1">
          <h3 className="font-semibold text-sm">{color.name}</h3>
          <p className="text-xs text-muted-foreground font-mono">
            {color.code}
          </p>
          <p className="text-xs text-muted-foreground">
            Order: {color.order}
          </p>
          <Badge
            variant={color.status ? "default" : "secondary"}
            className="text-xs"
          >
            {color.status ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(color)}
            className="flex-1 transition-all duration-200 hover:scale-105"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(color._id)}
            className="flex-1 transition-all duration-200 hover:scale-105"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {onRestore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRestore(color._id)}
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
          onClick={() => onStatusChange(color)}
          className="w-full transition-all duration-200 hover:scale-105"
        >
          Change Status
        </Button>
      </div>
    </Card>
  );
}
