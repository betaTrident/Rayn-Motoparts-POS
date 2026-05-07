import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Receipt, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { formatCurrency, formatDateTime } from "@/components/modules/transactions/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  PageEmptyState,
  PageErrorState,
} from "@/components/ui/page-state";
import { DataTableSkeleton } from "@/components/ui/skeletons/DataTableSkeleton";
import type {
  TransactionPagination,
  TransactionRow,
} from "@/services/transactionService.service";

interface TransactionsTableProps {
  isLoading: boolean;
  isError: boolean;
  results: TransactionRow[];
  pagination?: TransactionPagination;
  onRetry: () => void;
  onViewDetail: (row: TransactionRow) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export default function TransactionsTable({
  isLoading,
  isError,
  results,
  pagination,
  onRetry,
  onViewDetail,
  onPreviousPage,
  onNextPage,
}: TransactionsTableProps) {
  if (isError) {
    return (
      <PageErrorState
        title="Unable to load transactions"
        description="Please check your connection and try again."
        onRetry={onRetry}
      />
    );
  }

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} rowCount={10} />;
  }

  const columns: ColumnDef<TransactionRow>[] = [
    {
      accessorKey: "transactionNumber",
      header: "Transaction #",
      cell: ({ row }) => (
        <div className="min-w-[11rem]">
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
          <Button size="sm" variant="ghost" onClick={() => onViewDetail(row.original)}>
            <Eye className="mr-1 size-4" />
            View
          </Button>
        </div>
      ),
      enableSorting: false,
      meta: { headerClassName: "text-right", cellClassName: "text-right" },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={results}
      isLoading={isLoading}
      enablePagination={false}
      emptyState={
        <PageEmptyState
          icon={Receipt}
          title="No transactions found"
          description="Try adjusting your filters to see transaction history."
        />
      }
      mobileCardRenderer={(row) => (
        <div className="rounded-md border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <div className="bg-primary/8 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                <Receipt className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{row.transactionNumber}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(row.transactionDate)}</p>
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
            onClick={() => onViewDetail(row)}
            className="mt-4 w-full"
          >
            <Eye className="mr-2 size-4" />
            View Transaction
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
                onClick={onPreviousPage}
                className="h-8 gap-1 px-2 text-[12px]"
              >
                <ChevronLeft className="size-3.5" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNext}
                onClick={onNextPage}
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
