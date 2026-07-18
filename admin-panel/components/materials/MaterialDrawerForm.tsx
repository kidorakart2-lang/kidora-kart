import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MaterialDrawerFormProps {
  form: { name: string; order: number };
  onChange: (form: { name: string; order: number }) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  isEditing: boolean;
}

export function MaterialDrawerForm({ form, onChange, onSubmit, isPending, isEditing }: MaterialDrawerFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2 animate-in slide-in-from-right duration-300">
        <Label htmlFor="mat-name">Material Name</Label>
        <Input
          id="mat-name"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-75">
        <Label htmlFor="mat-order">Order</Label>
        <Input
          id="mat-order"
          type="number"
          min={0}
          max={1000}
          value={form.order}
          onChange={(e) =>
            onChange({ ...form, order: parseInt(e.target.value) || 0 })
          }
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : isEditing ? "Update Material" : "Create Material"}
      </Button>
    </form>
  );
}
