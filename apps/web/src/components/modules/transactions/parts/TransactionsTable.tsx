import { Eye, Receipt } from "lucide-react";

import { formatCurrency, formatDateTime } from "@/components/modules/transactions/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  if (isLoading) {
    return <PageLoadingState label="Loading transactions..." />;
  }

  if (isError) {
    return (
      <PageErrorState
        title="Unable to load transactions"
        description="Please check your connection and try again."
        onRetry={onRetry}
      />
    );
  }

  if (results.length === 0) {
    return (
      <PageEmptyState
        icon={Receipt}
        title="No transactions found"
        description="Try adjusting your filters to see transaction history."
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="space-y-3 p-3 md:hidden">
          {results.map((row) => (
            <div key={row.id} className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{row.transactionNumber}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(row.transactionDate)}
                  </p>
                </div>
                <Badge variant={row.status === "refunded" ? "destructive" : "secondary"}>
                  {row.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p>Staff: {row.cashierName}</p>
                <p>Payments: {row.paymentMethods.join(", ")}</p>
                <p>Items: {row.itemsQty}</p>
                <p className="font-semibold text-foreground">
                  Total: {formatCurrency(row.totalAmount)}
                </p>
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
          ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Staff</TableHead>
                <TableHead>Payments</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.transactionNumber}</TableCell>
                  <TableCell>{formatDateTime(row.transactionDate)}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "refunded" ? "destructive" : "secondary"}>
                      {row.status.replaceAll("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.cashierName}</TableCell>
                  <TableCell>{row.paymentMethods.join(", ")}</TableCell>
                  <TableCell className="text-right">{row.itemsQty}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(row.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => onViewDetail(row)}>
                      <Eye className="mr-1 size-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {pagination && (
          <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevious}
                onClick={onPreviousPage}
                className="flex-1 sm:flex-none"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNext}
                onClick={onNextPage}
                className="flex-1 sm:flex-none"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
