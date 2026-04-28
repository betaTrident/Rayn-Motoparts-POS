import type { ColumnDef } from "@tanstack/react-table";
import {
  Archive,
  ArchiveRestore,
  MoreHorizontal,
  Pencil,
  Trash2,
  Wrench,
} from "lucide-react";

import type { Product } from "@/types/product.types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductColumnHandlers {
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

export function createCatalogProductColumns(
  handlers: ProductColumnHandlers
): ColumnDef<Product>[] {
  return [
    {
      accessorKey: "name",
      header: "Product",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex min-w-[18rem] items-center gap-3">
            <div className="bg-primary/8 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
              <Wrench className="size-4" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
                {product.name}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono font-semibold text-foreground/80">
                  {product.sku}
                </span>
                <span className="max-w-[12.5rem] truncate">
                  Part #{product.part_number || "-"}
                </span>
                {product.description ? (
                  <span className="max-w-[16rem] truncate">
                    {product.description}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "category_name",
      header: "Category",
      cell: ({ row }) => (
        <Badge
          variant="secondary"
          className="max-w-[9.5rem] truncate rounded-full px-2.5 py-1 text-xs font-medium"
        >
          {row.original.category_name}
        </Badge>
      ),
    },
    {
      accessorKey: "size_display",
      header: "Size",
      cell: ({ row }) => (
        <span className="text-[13px] text-muted-foreground">
          {row.original.size_display}
        </span>
      ),
    },
    {
      accessorKey: "selling_price",
      header: () => <span className="text-right">Sell Price</span>,
      cell: ({ row }) => (
        <div className="text-right">
          <span className="text-[13px] font-semibold tabular-nums text-foreground">
            {formatCurrency(row.original.selling_price)}
          </span>
        </div>
      ),
      sortingFn: (rowA, rowB) => {
        const priceA = parseFloat(rowA.original.selling_price || "0");
        const priceB = parseFloat(rowB.original.selling_price || "0");
        return priceA - priceB;
      },
      meta: {
        headerClassName: "text-right",
        cellClassName: "text-right",
      },
    },
    {
      accessorKey: "is_active",
      header: () => <span className="text-center">Status</span>,
      cell: ({ row }) => (
        <div className="text-center">
          <Badge
            variant="outline"
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              row.original.is_active
                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
            )}
          >
            <span
              className={cn(
                "mr-1.5 inline-block size-1.5 rounded-full",
                row.original.is_active ? "bg-green-500" : "bg-amber-500"
              )}
            />
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      ),
      meta: {
        headerClassName: "text-center",
        cellClassName: "text-center",
      },
    },
    {
      id: "actions",
      header: () => <span className="text-right">Actions</span>,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlers.onEdit(product)}
              className="h-8 rounded-md border-border/70 px-2.5 text-xs"
              aria-label={`Edit ${product.name}`}
            >
              <Pencil className="mr-1 size-3.5" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Open actions for ${product.name}`}
                  className="size-8 rounded-md"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => handlers.onToggleAvailability(product)}
                  className="cursor-pointer"
                >
                  {product.is_active ? (
                    <>
                      <Archive className="mr-2 size-4" />
                      Mark inactive
                    </>
                  ) : (
                    <>
                      <ArchiveRestore className="mr-2 size-4" />
                      Mark active
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handlers.onDelete(product)}
                  variant="destructive"
                  className="cursor-pointer"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      meta: {
        headerClassName: "text-right",
        cellClassName: "text-right",
      },
    },
  ];
}
