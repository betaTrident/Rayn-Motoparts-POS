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
  onViewVariants: (product: Product) => void;
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
                <span>
                  {product.variant_count ?? product.variants?.length ?? 0} variant
                  {(product.variant_count ?? product.variants?.length ?? 0) === 1 ? "" : "s"}
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
      cell: ({ row }) => {
        const name = row.original.category_name || "Uncategorized";
        const getCategoryStyles = (cat: string) => {
          const lower = cat.toLowerCase();
          if (lower.includes("tire")) return "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800";
          if (lower.includes("oil") || lower.includes("fluid") || lower.includes("lube")) return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
          if (lower.includes("brake")) return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50";
          if (lower.includes("engine")) return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50";
          if (lower.includes("electrical") || lower.includes("battery")) return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50";
          if (lower.includes("suspension")) return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50";
          if (lower.includes("accessory") || lower.includes("helmet")) return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50";
          if (lower.includes("maintenance") || lower.includes("tool")) return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50";
          return "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-900/50";
        };

        return (
          <Badge
            variant="outline"
            className={cn(
              "max-w-[9.5rem] truncate rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
              getCategoryStyles(name)
            )}
          >
            {name}
          </Badge>
        );
      },
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
      header: "Sell Price",
      cell: ({ row }) => (
        <div>
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
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <div>
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
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center justify-start gap-1">
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
                  onClick={() => handlers.onViewVariants(product)}
                  className="cursor-pointer"
                >
                  <Wrench className="mr-2 size-4" />
                  View variants
                </DropdownMenuItem>
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
