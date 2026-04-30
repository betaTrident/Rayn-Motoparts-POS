import { ArrowDown, ArrowUp, RotateCcw, Search, Settings, X } from "lucide-react";
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
import { PageEmptyState } from "@/components/ui/page-state";
import type { StockMovementRow } from "@/services/modules/inventory.service";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function titleCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function movementBadge(type: string) {
  const isIncrease =
    type.includes("add") || type.includes("receipt") || type.includes("return") || type.includes("in");
  const isDecrease =
    type.includes("sub") || type.includes("sale") || type.includes("write") || type.includes("out");
  const Icon = type.includes("correction") || type.includes("opening")
    ? Settings
    : isIncrease
      ? ArrowUp
      : isDecrease
        ? ArrowDown
        : RotateCcw;
  const className = type.includes("correction") || type.includes("opening")
    ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400"
    : isIncrease
      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
      : isDecrease
        ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
        : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400";

  return (
    <Badge variant="outline" className={cn("rounded-full px-2.5 py-1 text-xs font-medium", className)}>
      <Icon className="mr-1.5 size-3" />
      {titleCase(type)}
    </Badge>
  );
}

const columns: ColumnDef<StockMovementRow>[] = [
  {
    accessorKey: "created_at",
    header: "Timestamp",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {formatDateTime(row.original.created_at)}
      </span>
    ),
  },
  {
    accessorKey: "variant_sku",
    header: "SKU",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold">{row.original.variant_sku}</span>
    ),
  },
  {
    accessorKey: "product_name",
    header: "Product",
    cell: ({ row }) => (
      <span className="block min-w-[14rem] truncate text-[13px] font-medium">
        {row.original.product_name}
      </span>
    ),
  },
  {
    accessorKey: "movement_type",
    header: "Movement",
    cell: ({ row }) => movementBadge(row.original.movement_type),
  },
  {
    accessorKey: "reference_type",
    header: "Reference",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {titleCase(row.original.reference_type)} #{row.original.reference_id}
      </span>
    ),
  },
  {
    accessorKey: "qty_before",
    header: () => <span className="text-right">Before</span>,
    cell: ({ row }) => <span>{row.original.qty_before}</span>,
    meta: { headerClassName: "text-right", cellClassName: "text-right tabular-nums text-muted-foreground" },
  },
  {
    accessorKey: "qty_change",
    header: () => <span className="text-right">Change</span>,
    cell: ({ row }) => (
      <span
        className={cn(
          "font-semibold",
          row.original.qty_change >= 0 ? "text-green-700" : "text-red-700"
        )}
      >
        {row.original.qty_change >= 0 ? "+" : ""}
        {row.original.qty_change}
      </span>
    ),
    meta: { headerClassName: "text-right", cellClassName: "text-right tabular-nums" },
  },
  {
    accessorKey: "qty_after",
    header: () => <span className="text-right">After</span>,
    cell: ({ row }) => <span>{row.original.qty_after}</span>,
    meta: { headerClassName: "text-right", cellClassName: "text-right tabular-nums" },
  },
  {
    accessorKey: "performed_by",
    header: "Performed By",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {row.original.performed_by}
      </span>
    ),
  },
];

export default function StockMovementTable({
  data,
  movementTypes,
  variantSku,
  movementType,
  isLoading,
  onVariantSkuChange,
  onMovementTypeChange,
  onClearFilters,
}: {
  data: StockMovementRow[];
  movementTypes: string[];
  variantSku: string;
  movementType: string;
  isLoading: boolean;
  onVariantSkuChange: (value: string) => void;
  onMovementTypeChange: (value: string) => void;
  onClearFilters: () => void;
}) {
  const hasActiveFilters = Boolean(variantSku || movementType !== "all");
  const toolbar = (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="text-muted-foreground absolute left-3.5 top-1/2 size-4 -translate-y-1/2" />
        <Input
          placeholder="Filter by variant SKU..."
          value={variantSku}
          onChange={(event) => onVariantSkuChange(event.target.value)}
          className="h-9 rounded-md border-border/70 bg-card pl-10 pr-10 text-xs shadow-xs"
        />
        {variantSku ? (
          <button
            type="button"
            onClick={() => onVariantSkuChange("")}
            aria-label="Clear movement SKU filter"
            className="text-muted-foreground hover:text-foreground absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>
      <Select value={movementType} onValueChange={onMovementTypeChange}>
        <SelectTrigger className="h-10 w-56 rounded-lg border-border/70 bg-card text-sm shadow-xs">
          <SelectValue placeholder="Movement Type" />
        </SelectTrigger>
        <SelectContent className="rounded-lg">
          <SelectItem value="all">All Movements</SelectItem>
          {movementTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {titleCase(type)}
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
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      toolbar={toolbar}
      pageSize={50}
      pageSizeOptions={[50, 100, 200]}
      loadingState={<span className="text-muted-foreground text-sm">Loading movement log...</span>}
      emptyState={
        <PageEmptyState
          title={hasActiveFilters ? "No matching movements" : "No stock movements yet"}
          description={
            hasActiveFilters
              ? "Try adjusting the movement filters."
              : "Stock changes will appear after transactions or adjustments are recorded."
          }
        />
      }
      mobileCardRenderer={(row) => (
        <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{row.product_name}</p>
              <p className="font-mono text-xs text-muted-foreground">{row.variant_sku}</p>
            </div>
            {movementBadge(row.movement_type)}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <Metric label="Before" value={row.qty_before} />
            <Metric label="Change" value={`${row.qty_change >= 0 ? "+" : ""}${row.qty_change}`} strong />
            <Metric label="After" value={row.qty_after} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {formatDateTime(row.created_at)} by {row.performed_by}
          </p>
        </div>
      )}
    />
  );
}

function Metric({ label, value, strong }: { label: string; value: number | string; strong?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className={cn("mt-1 tabular-nums", strong && "font-semibold text-foreground")}>{value}</p>
    </div>
  );
}
