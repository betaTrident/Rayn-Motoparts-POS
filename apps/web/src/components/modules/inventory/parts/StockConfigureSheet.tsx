import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  InventoryStockRow,
  StockConfigurePayload,
} from "@/services/modules/inventory.service";

export default function StockConfigureSheet({
  open,
  onOpenChange,
  stock,
  isSaving,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: InventoryStockRow | null;
  isSaving: boolean;
  error: string | null;
  onSubmit: (id: number, payload: StockConfigurePayload) => void;
}) {
  const [reorderPoint, setReorderPoint] = useState("0");
  const [reorderQty, setReorderQty] = useState("0");
  const [maxStockLevel, setMaxStockLevel] = useState("");

  useEffect(() => {
    if (open && stock) {
      setReorderPoint(String(stock.reorder_point));
      setReorderQty(String(stock.reorder_qty));
      setMaxStockLevel(stock.max_stock_level == null ? "" : String(stock.max_stock_level));
    }
  }, [open, stock]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stock) return;
    onSubmit(stock.id, {
      reorder_point: Number(reorderPoint),
      reorder_qty: Number(reorderQty),
      max_stock_level: maxStockLevel === "" ? null : Number(maxStockLevel),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Reorder Settings</DialogTitle>
          <DialogDescription>
            Configure stock thresholds for this variant.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex max-h-[calc(90vh-140px)] flex-col">
          <div className="space-y-4 overflow-y-auto px-6 py-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {stock ? (
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-sm font-semibold">{stock.product_name}</p>
              <p className="font-mono text-xs text-muted-foreground">{stock.variant_sku}</p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="reorder-point">Reorder Point</Label>
            <Input
              id="reorder-point"
              type="number"
              min="0"
              step="0.0001"
              value={reorderPoint}
              onChange={(event) => setReorderPoint(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reorder-qty">Reorder Quantity</Label>
            <Input
              id="reorder-qty"
              type="number"
              min="0"
              step="0.0001"
              value={reorderQty}
              onChange={(event) => setReorderQty(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-stock-level">Max Stock Level</Label>
            <Input
              id="max-stock-level"
              type="number"
              min="0"
              step="0.0001"
              value={maxStockLevel}
              onChange={(event) => setMaxStockLevel(event.target.value)}
              placeholder="Optional"
            />
          </div>

          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSaving ||
                !stock ||
                Number(reorderPoint) < 0 ||
                Number(reorderQty) < 0 ||
                (maxStockLevel !== "" && Number(maxStockLevel) < 0)
              }
            >
              {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save Settings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
