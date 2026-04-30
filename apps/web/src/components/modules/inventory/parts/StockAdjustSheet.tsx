import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type {
  InventoryStockRow,
  StockAdjustPayload,
} from "@/services/modules/inventory.service";

const REASONS = [
  "Cycle count correction",
  "Supplier receipt",
  "Damaged stock",
  "Found stock",
  "Manual correction",
];

export default function StockAdjustSheet({
  open,
  onOpenChange,
  stockRows,
  selectedStock,
  isSaving,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockRows: InventoryStockRow[];
  selectedStock: InventoryStockRow | null;
  isSaving: boolean;
  error: string | null;
  onSubmit: (payload: StockAdjustPayload) => void;
}) {
  const [variantId, setVariantId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState(REASONS[0]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setVariantId(selectedStock ? String(selectedStock.variant_id) : "");
      setAdjustmentType("add");
      setQuantity("1");
      setReason(REASONS[0]);
      setNotes("");
    }
  }, [open, selectedStock]);

  const activeStock = useMemo(
    () => stockRows.find((row) => String(row.variant_id) === variantId) ?? selectedStock,
    [stockRows, variantId, selectedStock]
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!variantId) return;
    onSubmit({
      variant_id: Number(variantId),
      adjustment_type: adjustmentType,
      quantity: Number(quantity),
      reason,
      notes,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            Add or subtract inventory with an auditable reason.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex max-h-[calc(90vh-140px)] flex-col">
          <div className="space-y-4 overflow-y-auto px-6 py-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label>Product Variant</Label>
            <Select value={variantId} onValueChange={setVariantId}>
              <SelectTrigger>
                <SelectValue placeholder="Select variant" />
              </SelectTrigger>
              <SelectContent>
                {stockRows.map((row) => (
                  <SelectItem key={row.variant_id} value={String(row.variant_id)}>
                    {row.variant_sku} - {row.product_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeStock ? (
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3 text-xs">
              <div>
                <p className="text-muted-foreground">On Hand</p>
                <p className="mt-1 font-semibold">{activeStock.qty_on_hand}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reserved</p>
                <p className="mt-1 font-semibold">{activeStock.qty_reserved}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Available</p>
                <p className="mt-1 font-semibold">{activeStock.qty_available}</p>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <ToggleGroup
              type="single"
              value={adjustmentType}
              onValueChange={(value) => {
                if (value === "add" || value === "subtract") setAdjustmentType(value);
              }}
              className="grid grid-cols-2"
            >
              <ToggleGroupItem value="add" className="h-10">
                Add
              </ToggleGroupItem>
              <ToggleGroupItem value="subtract" className="h-10">
                Subtract
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjust-quantity">Quantity</Label>
            <Input
              id="adjust-quantity"
              type="number"
              min="0.0001"
              step="0.0001"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adjust-notes">Notes</Label>
            <Textarea
              id="adjust-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional adjustment details"
            />
          </div>

          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !variantId || Number(quantity) <= 0}>
              {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save Adjustment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
