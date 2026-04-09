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
        <div className="overflow-x-auto">
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
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevious}
                onClick={onPreviousPage}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNext}
                onClick={onNextPage}
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
