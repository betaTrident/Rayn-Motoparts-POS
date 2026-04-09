import { useMemo, useState } from "react";
import { Undo2 } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import TransactionDetailDialog from "@/components/modules/transactions/parts/TransactionDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useReturnDetail, useReturnsList } from "@/hooks/modules/useReturns";
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

  const clearFilters = () => {
    setQ("");
    setDays("30");
    setStatus("all_returns");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns"
        description="Review refunded and partially refunded transactions"
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Input
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setPage(1);
              }}
              placeholder="Search transaction, customer, cashier"
            />

            <Select
              value={days}
              onValueChange={(value) => {
                setDays(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
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
              <SelectTrigger>
                <SelectValue placeholder="Return status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_returns">All Returns</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <div />
            )}
          </div>
        </CardContent>
      </Card>

      {returnsQuery.isLoading ? (
        <PageLoadingState label="Loading returns..." />
      ) : returnsQuery.isError ? (
        <PageErrorState
          title="Unable to load returns"
          description="Please check your connection and try again."
          onRetry={() => returnsQuery.refetch()}
        />
      ) : results.length === 0 ? (
        <PageEmptyState
          icon={Undo2}
          title="No returns found"
          description="Try adjusting your filters to find refunded transactions."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cashier</TableHead>
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
                        <Button size="sm" variant="ghost" onClick={() => setSelectedTransaction(row)}>
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
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNext}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
