import { Search, Settings, SlidersHorizontal, X} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PageEmptyState } from "@/components/ui/page-state";
import { DataTableSkeleton } from "@/components/ui/skeletons/DataTableSkeleton";
import type {
  InventoryCategoryOption,
  InventoryStockRow,
  StockStatus,
} from "@/services/modules/inventory.service";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

function statusBadge(status: StockStatus) {
  const config = {
    IN_STOCK: {
      label: "In Stock",
      className:
        "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
    },
    LOW_STOCK: {
      label: "Low Stock",
      className:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
    },
    OUT_OF_STOCK: {
      label: "No Stocks",
      className:
        "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
    },
  }[status];

  return (
    <Badge
      variant="outline"
      className={cn("rounded-full px-2.5 py-1 text-xs font-medium", config.className)}
    >
      {config.label}
    </Badge>
  );
}

export function createInventoryStockColumns({
  onConfigure,
  onAdjust,
}: {
  onConfigure: (row: InventoryStockRow) => void;
  onAdjust: (row: InventoryStockRow) => void;
}): ColumnDef<InventoryStockRow>[] {
  return [
    {
      accessorKey: "variant_sku",
      header: "SKU",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-semibold text-foreground/80">
          {row.original.variant_sku}
        </span>
      ),
    },
    {
      accessorKey: "product_name",
      header: "Product",
      cell: ({ row }) => (
        <div className="min-w-[16rem] space-y-1">
          <p className="truncate text-[13px] font-semibold leading-tight">
            {row.original.product_name}
          </p>
          <Badge
            variant="secondary"
            className="max-w-40 truncate rounded-full px-2 py-0.5 text-[11px]"
          >
            {row.original.category}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "qty_on_hand",
      header: "On Hand",
      cell: ({ row }) => <span>{row.original.qty_on_hand}</span>,
    },
    {
      accessorKey: "qty_reserved",
      header: "Reserved",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.qty_reserved}</span>
      ),
    },
    {
      accessorKey: "qty_available",
      header: "Available",
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">{row.original.qty_available}</span>
      ),
    },
    {
      accessorKey: "reorder_point",
      header: "Reorder At",
      cell: ({ row }) => <span>{row.original.reorder_point}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <div>{statusBadge(row.original.status)}</div>,
    },
    {
      accessorKey: "total_cost",
      header: "Total Cost",
      cell: ({ row }) => (
        <span>{formatCurrency(row.original.qty_on_hand * row.original.avg_cost)}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <TooltipProvider>
          <div className="flex items-center justify-start gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-md"
                  onClick={() => onConfigure(row.original)}
                  aria-label={`Configure ${row.original.variant_sku}`}
                >
                  <Settings className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Configure reorder settings</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-md"
                  onClick={() => onAdjust(row.original)}
                  aria-label={`Adjust ${row.original.variant_sku}`}
                >
                  <SlidersHorizontal className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adjust stock</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      ),
      enableSorting: false,
    },
  ];
}

export default function InventoryStockTable({
  data,
  categories,
  search,
  status,
  category,
  isLoading,
  onSearchChange,
  onStatusChange,
  onCategoryChange,
  onClearFilters,
  onConfigure,
  onAdjust,
}: {
  data: InventoryStockRow[];
  categories: InventoryCategoryOption[];
  search: string;
  status: string;
  category: string;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onClearFilters: () => void;
  onConfigure: (row: InventoryStockRow) => void;
  onAdjust: (row: InventoryStockRow) => void;
}) {
  const hasActiveFilters = Boolean(search || status !== "all" || category !== "all");
  const columns = createInventoryStockColumns({ onConfigure, onAdjust });

  const toolbar = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="text-muted-foreground absolute left-3.5 top-1/2 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search by SKU, product, or part number..."
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-9 rounded-md border-border/70 bg-card pl-10 pr-10 text-xs shadow-xs"
        />
        {search ? (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear inventory search"
            className="text-muted-foreground hover:text-foreground absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="h-10 w-40 rounded-lg border-border/70 bg-card text-sm shadow-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="IN_STOCK">In Stock</SelectItem>
            <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
            <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-10 w-44 rounded-lg border-border/70 bg-card text-sm shadow-xs">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters ? (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="h-10 rounded-lg border-border/70 bg-card px-3 text-sm"
          >
            <X className="mr-1.5 size-3.5" />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );

  if (isLoading) {
    return <DataTableSkeleton columnCount={9} rowCount={10} />;
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      toolbar={toolbar}
      pageSize={25}
      pageSizeOptions={[25, 50, 100]}
      emptyState={
        <PageEmptyState
          title={hasActiveFilters ? "No matching stock rows" : "No stock rows yet"}
          description={
            hasActiveFilters
              ? "Try adjusting the search or filters."
              : "Tracked inventory will appear after stock records are created."
          }
        />
      }
      mobileCardRenderer={(row) => (
        <div className="rounded-md border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{row.product_name}</p>
              <p className="font-mono text-xs text-muted-foreground">{row.variant_sku}</p>
            </div>
            {statusBadge(row.status)}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <Metric label="On Hand" value={row.qty_on_hand} />
            <Metric label="Reserved" value={row.qty_reserved} />
            <Metric label="Available" value={row.qty_available} strong />
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onConfigure(row)}>
              <Settings className="mr-2 size-4" />
              Configure
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => onAdjust(row)}>
              <SlidersHorizontal className="mr-2 size-4" />
              Adjust
            </Button>
          </div>
        </div>
      )}
    />
  );
}

function Metric({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className={cn("mt-1 tabular-nums", strong && "font-semibold text-foreground")}>{value}</p>
    </div>
  );
}
