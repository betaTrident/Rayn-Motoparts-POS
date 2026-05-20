import { useMemo, useState, type ElementType } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  Eye,
  Receipt,
  Search,
  TrendingUp,
  Undo2,
  X,
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import TransactionDetailDialog from "@/components/modules/transactions/parts/TransactionDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  PageEmptyState,
  PageErrorState,
} from "@/components/ui/page-state";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/ui/skeletons/DataTableSkeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReturnDetail, useReturnsList } from "@/hooks/modules/useReturns";
import { cn } from "@/lib/utils";
import type { ReturnStatusFilter } from "@/services/modules/returns.service";
import type { TransactionRow } from "@/services/transactionService.service";

function formatCurrency(value: number): string {
  return `PHP ${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReturnsModulePage() {
  const [q, setQ] = useState("");
  const [days, setDays] = useState("30");
  const [status, setStatus] = useState<ReturnStatusFilter>("all_returns");
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRow | null>(null);

  const returnsQuery = useReturnsList({
    q,
    days: Number(days),
    status,
    page,
    pageSize: 20,
  });

  const detailQuery = useReturnDetail(selectedTransaction?.id ?? null);

  const results = returnsQuery.data?.results ?? [];
  const pagination = returnsQuery.data?.pagination;

  const hasFilters = useMemo(() => {
    return Boolean(q) || days !== "30" || status !== "all_returns";
  }, [q, days, status]);

  const pageRefundedTotal = results.reduce((sum, row) => sum + row.totalAmount, 0);
  const refundedCount = results.filter((row) => row.status === "refunded").length;
  const partialCount = results.filter((row) => row.status === "partially_refunded").length;

  const clearFilters = () => {
    setQ("");
    setDays("30");
    setStatus("all_returns");
    setPage(1);
  };

  const columns: ColumnDef<TransactionRow>[] = [
    {
      accessorKey: "transactionNumber",
      header: "Transaction #",
      cell: ({ row }) => (
        <div className="min-w-44">
          <p className="text-[13px] font-semibold">{row.original.transactionNumber}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDateTime(row.original.transactionDate)}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "refunded" ? "destructive" : "secondary"}>
          {row.original.status.replaceAll("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "cashierName",
      header: "Cashier",
      cell: ({ row }) => row.original.cashierName,
    },
    {
      accessorKey: "paymentMethods",
      header: "Payments",
      cell: ({ row }) => row.original.paymentMethods.join(", "),
    },
    {
      accessorKey: "itemsQty",
      header: () => <span className="text-right">Items</span>,
      cell: ({ row }) => row.original.itemsQty,
      meta: { headerClassName: "text-right", cellClassName: "text-right tabular-nums" },
    },
    {
      accessorKey: "totalAmount",
      header: () => <span className="text-right">Total</span>,
      cell: ({ row }) => (
        <span className="font-semibold">{formatCurrency(row.original.totalAmount)}</span>
      ),
      meta: { headerClassName: "text-right", cellClassName: "text-right tabular-nums" },
    },
    {
      id: "actions",
      header: () => <span className="text-right">Action</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => setSelectedTransaction(row.original)}>
            <Eye className="mr-1 size-4" />
            View
          </Button>
        </div>
      ),
      enableSorting: false,
      meta: { headerClassName: "text-right", cellClassName: "text-right" },
    },
  ];

  const toolbar = (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="text-muted-foreground absolute left-3.5 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
          placeholder="Search transaction, customer, or cashier..."
          className="h-9 rounded-md border-border/70 bg-card pl-10 pr-10 text-xs shadow-xs"
        />
        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setPage(1);
            }}
            aria-label="Clear return search"
            className="text-muted-foreground hover:text-foreground absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={days}
          onValueChange={(value) => {
            setDays(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-10 w-40 rounded-lg border-border/70 bg-card text-sm shadow-xs">
            <SelectValue placeholder="Range" />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as ReturnStatusFilter);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-10 w-44 rounded-lg border-border/70 bg-card text-sm shadow-xs">
            <SelectValue placeholder="Return status" />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all_returns">All Returns</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters ? (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="h-10 rounded-lg border-border/70 bg-card px-3 text-sm"
          >
            <X className="mr-1.5 size-3.5" />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns"
        description="Review refunded and partially refunded transactions"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Matched Returns"
          value={pagination?.totalCount ?? 0}
          icon={Receipt}
          accent="primary"
          isLoading={returnsQuery.isLoading}
        />
        <StatCard
          label="Current Page Total"
          value={formatCurrency(pageRefundedTotal)}
          icon={Banknote}
          accent="green"
          isLoading={returnsQuery.isLoading}
        />
        <StatCard
          label="Refunded on Page"
          value={refundedCount}
          icon={Undo2}
          accent="amber"
          isLoading={returnsQuery.isLoading}
        />
        <StatCard
          label="Partial Returns"
          value={partialCount}
          icon={TrendingUp}
          accent="blue"
          isLoading={returnsQuery.isLoading}
        />
      </div>

      {returnsQuery.isError ? (
        <PageErrorState
          title="Unable to load returns"
          description="Please check your connection and try again."
          onRetry={() => returnsQuery.refetch()}
        />
      ) : returnsQuery.isLoading ? (
        <DataTableSkeleton columnCount={7} rowCount={10} />
      ) : (
        <DataTable
          columns={columns}
          data={results}
          isLoading={returnsQuery.isLoading}
          enablePagination={false}
          toolbar={toolbar}
          emptyState={
            <PageEmptyState
              icon={Undo2}
              title={hasFilters ? "No matching returns" : "No returns found"}
              description={
                hasFilters
                  ? "Try adjusting search, range, or return status filters."
                  : "Refunded and partially refunded transactions will appear here."
              }
            />
          }
          mobileCardRenderer={(row) => (
            <div className="rounded-md border border-border/70 bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="bg-primary/8 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Undo2 className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{row.transactionNumber}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(row.transactionDate)}
                    </p>
                  </div>
                </div>
                <Badge variant={row.status === "refunded" ? "destructive" : "secondary"}>
                  {row.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Metric label="Cashier" value={row.cashierName} />
                <Metric label="Payments" value={row.paymentMethods.join(", ")} />
                <Metric label="Items" value={row.itemsQty} />
                <Metric label="Total" value={formatCurrency(row.totalAmount)} strong />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedTransaction(row)}
                className="mt-4 w-full"
              >
                <Eye className="mr-2 size-4" />
                View Return
              </Button>
            </div>
          )}
          footer={
            pagination ? (
              <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="text-muted-foreground text-[12px]">
                  Showing page <span className="font-medium text-foreground">{pagination.page}</span> of{" "}
                  <span className="font-medium text-foreground">{pagination.totalPages}</span> (
                  <span className="font-medium text-foreground">{pagination.totalCount}</span> total)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrevious}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="h-8 gap-1 px-2 text-[12px]"
                  >
                    <ChevronLeft className="size-3.5" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNext}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="h-8 gap-1 px-2 text-[12px]"
                  >
                    Next
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            ) : null
          }
        />
      )}

      <TransactionDetailDialog
        selectedTransaction={selectedTransaction}
        detailData={detailQuery.data}
        isLoading={detailQuery.isLoading}
        isError={detailQuery.isError}
        onClose={() => setSelectedTransaction(null)}
        onRetry={() => detailQuery.refetch()}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  isLoading = false,
}: {
  label: string;
  value: number | string;
  icon: ElementType;
  accent: "primary" | "green" | "amber" | "blue";
  isLoading?: boolean;
}) {
  const colors = {
    primary: "bg-primary/10 text-primary border-primary/20",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900",
    amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-none shadow-sm ring-1 ring-border">
        <CardContent className="p-4 flex items-center gap-4">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-border">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
          colors[accent]
        )}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-foreground leading-none">
            {value}
          </p>
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 truncate">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  strong,
}: {
  label: string;
  value: number | string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className={strong ? "mt-1 font-semibold text-foreground" : "mt-1"}>{value}</p>
    </div>
  );
}
