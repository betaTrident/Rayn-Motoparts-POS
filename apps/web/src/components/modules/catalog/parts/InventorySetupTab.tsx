import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InventoryStockRow } from "@/services/modules/inventory.service";

export interface StockConfigureFormState {
  reorder_point: string;
  reorder_qty: string;
  max_stock_level: string;
}

export default function InventorySetupTab({
  stockRow,
  form,
  isSaving,
  error,
  onChange,
  onSubmit,
}: {
  stockRow: InventoryStockRow | null;
  form: StockConfigureFormState;
  isSaving: boolean;
  error: string | null;
  onChange: (next: StockConfigureFormState) => void;
  onSubmit: () => void;
}) {
  if (!stockRow) {
    return <p className="px-6 py-10 text-sm text-muted-foreground">Complete prior steps to unlock inventory setup.</p>;
  }

  return (
    <div className="space-y-4 px-6 py-5">
      <div className="grid grid-cols-3 gap-2 rounded-lg border bg-white p-3 text-xs">
        <div><p className="text-muted-foreground">On Hand</p><p className="mt-1 font-semibold">{stockRow.qty_on_hand}</p></div>
        <div><p className="text-muted-foreground">Reserved</p><p className="mt-1 font-semibold">{stockRow.qty_reserved}</p></div>
        <div><p className="text-muted-foreground">Available</p><p className="mt-1 font-semibold">{stockRow.qty_available}</p></div>
      </div>
      <div className="space-y-2"><Label htmlFor="reorder-point">Reorder Point</Label><Input id="reorder-point" type="number" min="0" step="0.0001" value={form.reorder_point} onChange={(e) => onChange({ ...form, reorder_point: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="reorder-qty">Reorder Quantity</Label><Input id="reorder-qty" type="number" min="0" step="0.0001" value={form.reorder_qty} onChange={(e) => onChange({ ...form, reorder_qty: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="max-stock-level">Max Stock Level</Label><Input id="max-stock-level" type="number" min="0" step="0.0001" value={form.max_stock_level} onChange={(e) => onChange({ ...form, max_stock_level: e.target.value })} placeholder="Optional" /></div>
      {error ? <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{error}</div> : null}
      <div className="flex justify-end"><button type="button" onClick={onSubmit} disabled={isSaving} className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium disabled:opacity-50">Save Inventory Settings</button></div>
    </div>
  );
}
