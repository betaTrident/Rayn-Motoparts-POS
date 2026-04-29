import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Archive, ArchiveRestore, Loader2, Pencil, Trash2, Wrench } from "lucide-react";

import type { Product } from "@/types/product.types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";

interface CatalogProductsTableProps {
  columns: ColumnDef<Product, unknown>[];
  data: Product[];
  isLoading: boolean;
  emptyState: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  onEdit: (product: Product) => void;
  onToggleAvailability: (product: Product) => void;
  onDelete: (product: Product) => void;
}

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(num);
}

export default function CatalogProductsTable({
  columns,
  data,
  isLoading,
  emptyState,
  toolbar,
  footer,
  onEdit,
  onToggleAvailability,
  onDelete,
}: CatalogProductsTableProps) {
  const loadingState = (
    <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
      <Loader2 className="size-4 animate-spin" />
      Loading products...
    </div>
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyState={emptyState}
      loadingState={loadingState}
      toolbar={toolbar}
      footer={footer}
      pageSize={10}
      pageSizeOptions={[10, 20, 30, 40]}
      mobileCardRenderer={(product) => (
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="bg-primary/8 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                <Wrench className="size-4" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {product.name}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {product.sku || "No SKU"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  Part #{product.part_number || "-"}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                product.is_active
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
              )}
            >
              {product.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-muted/40 p-2">
              <p className="text-muted-foreground">Category</p>
              <p className="mt-1 truncate font-medium text-foreground">
                {product.category_name}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-2">
              <p className="text-muted-foreground">Size</p>
              <p className="mt-1 font-medium text-foreground">{product.size_display}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-2">
              <p className="text-muted-foreground">Sell Price</p>
              <p className="mt-1 font-semibold text-foreground">
                {formatCurrency(product.selling_price)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/40 p-2">
              <p className="text-muted-foreground">Variant</p>
              <p className="mt-1 truncate font-medium text-foreground">
                {product.variant_name || product.variant_sku || "-"}
              </p>
            </div>
          </div>

          {product.description ? (
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          ) : null}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => onEdit(product)}
              className="w-full sm:flex-1"
            >
              <Pencil className="mr-2 size-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={() => onToggleAvailability(product)}
              className="w-full sm:flex-1"
            >
              {product.is_active ? (
                <Archive className="mr-2 size-4" />
              ) : (
                <ArchiveRestore className="mr-2 size-4" />
              )}
              {product.is_active ? "Mark Inactive" : "Mark Active"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onDelete(product)}
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          </div>
        </div>
      )}
    />
  );
}
