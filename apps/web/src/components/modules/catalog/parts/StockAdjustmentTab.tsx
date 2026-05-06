import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { InventoryStockRow } from "@/services/modules/inventory.service";

const REASONS = ["Cycle count correction", "Supplier receipt", "Damaged stock", "Found stock", "Manual correction"];

export interface StockAdjustFormState {
  adjustment_type: "add" | "subtract";
  quantity: string;
  reason: string;
  notes: string;
}

export const DEFAULT_STOCK_ADJUST_FORM: StockAdjustFormState = {
  adjustment_type: "add",
  quantity: "1",
  reason: REASONS[0],
  notes: "",
};

export default function StockAdjustmentTab({
  stockRow,
  form,
  isSaving,
  error,
  helperText,
  submitLabel,
  onChange,
  onSubmit,
}: {
  stockRow: InventoryStockRow | null;
  form: StockAdjustFormState;
  isSaving: boolean;
  error: string | null;
  helperText?: string;
  submitLabel?: string;
  onChange: (next: StockAdjustFormState) => void;
  onSubmit: () => void;
}) {
  if (!stockRow) {
    return <p className="px-6 py-10 text-sm text-muted-foreground">Create the product first to adjust stock.</p>;
  }

  return (
    <div className="space-y-4 px-6 py-5">
      <div className="grid grid-cols-3 gap-2 rounded-lg border bg-white p-3 text-xs">
        <div><p className="text-muted-foreground">On Hand</p><p className="mt-1 font-semibold">{stockRow.qty_on_hand}</p></div>
        <div><p className="text-muted-foreground">Reserved</p><p className="mt-1 font-semibold">{stockRow.qty_reserved}</p></div>
        <div><p className="text-muted-foreground">Available</p><p className="mt-1 font-semibold">{stockRow.qty_available}</p></div>
      </div>
      {helperText ? <p className="text-sm text-muted-foreground">{helperText}</p> : null}
      <div className="space-y-2"><Label>Adjustment Type</Label><ToggleGroup type="single" value={form.adjustment_type} onValueChange={(value) => { if (value === "add" || value === "subtract") onChange({ ...form, adjustment_type: value }); }} className="grid grid-cols-2"><ToggleGroupItem value="add" className="h-10">Add</ToggleGroupItem><ToggleGroupItem value="subtract" className="h-10">Subtract</ToggleGroupItem></ToggleGroup></div>
      <div className="space-y-2"><Label htmlFor="adjust-quantity">Quantity</Label><Input id="adjust-quantity" type="number" min="0.0001" step="0.0001" value={form.quantity} onChange={(e) => onChange({ ...form, quantity: e.target.value })} /></div>
      <div className="space-y-2"><Label>Reason</Label><Select value={form.reason} onValueChange={(value) => onChange({ ...form, reason: value })}><SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger><SelectContent>{REASONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="adjust-notes">Notes</Label><Textarea id="adjust-notes" value={form.notes} onChange={(e) => onChange({ ...form, notes: e.target.value })} placeholder="Optional adjustment details" /></div>
      {error ? <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div> : null}
      <div className="flex justify-end"><button type="button" onClick={onSubmit} disabled={isSaving || Number(form.quantity) <= 0} className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium disabled:opacity-50">{submitLabel ?? "Confirm Stock Adjustment"}</button></div>
    </div>
  );
}
