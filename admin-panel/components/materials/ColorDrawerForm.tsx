import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ColorDrawerFormProps {
  form: { name: string; code: string; order: number };
  onChange: (form: { name: string; code: string; order: number }) => void;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  isEditing: boolean;
}

export function ColorDrawerForm({ form, onChange, onSubmit, isPending, isEditing }: ColorDrawerFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2 animate-in slide-in-from-right duration-300">
        <Label htmlFor="color-name">Color Name</Label>
        <Input
          id="color-name"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-75">
        <Label htmlFor="color-code">Color Code</Label>
        <div className="flex gap-2">
          <Input
            id="color-code"
            type="color"
            value={form.code}
            onChange={(e) => onChange({ ...form, code: e.target.value })}
            className="w-20 h-10 p-1 cursor-pointer"
          />
          <Input
            value={form.code}
            onChange={(e) => onChange({ ...form, code: e.target.value })}
            required
            className="font-mono flex-1"
            placeholder="#000000"
          />
        </div>
      </div>
      <div className="space-y-2 animate-in slide-in-from-right duration-300 delay-100">
        <Label htmlFor="color-order">Order</Label>
        <Input
          id="color-order"
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
        {isPending ? "Saving..." : isEditing ? "Update Color" : "Create Color"}
      </Button>
    </form>
  );
}
