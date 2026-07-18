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
}

export function ColorCard({ color, index, onEdit, onDelete, onStatusChange }: ColorCardProps) {
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
