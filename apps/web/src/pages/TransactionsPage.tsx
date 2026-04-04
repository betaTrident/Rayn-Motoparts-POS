import { useMemo, useState } from "react";
import { Download, Eye, Receipt, Search } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";

import {
  type TransactionRow,
} from "@/services/transactionService.service";
import {
  useTransactionDetail,
  useTransactionsList,
} from "@/hooks/modules/useTransactions";

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

export default function TransactionsPage() {
  const [q, setQ] = useState("");
  const [days, setDays] = useState("7");
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRow | null>(null);
  const pageSize = 20;

  const transactionsQuery = useTransactionsList({
    q,
    days: Number(days),
    status,
    paymentMethod,
    page,
    pageSize,
  });

  const results = transactionsQuery.data?.results ?? [];
  const statusOptions = transactionsQuery.data?.statusOptions ?? [];
  const paymentOptions = transactionsQuery.data?.paymentMethodOptions ?? [];
  const pagination = transactionsQuery.data?.pagination;

  const activeFilters = useMemo(() => {
    return Boolean(q) || days !== "7" || status !== "all" || paymentMethod !== "all";
  }, [q, days, status, paymentMethod]);

  const clearFilters = () => {
    setQ("");
    setDays("7");
    setStatus("all");
    setPaymentMethod("all");
    setPage(1);
  };

  const detailQuery = useTransactionDetail(selectedTransaction?.id ?? null);

  const exportCsv = () => {
    if (!results.length) return;

    const header = [
      "TransactionNumber",
      "TransactionDate",
      "Status",
      "Staff",
      "PaymentMethods",
      "ItemsQty",
      "TotalAmount",
    ];

    const escape = (value: string | number) => {
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
        return `\"${stringValue.replaceAll("\"", "\"\"")}\"`;
      }
      return stringValue;
    };

    const rows = results.map((row) => [
      row.transactionNumber,
      formatDateTime(row.transactionDate),
      row.status,
      row.cashierName,
      row.paymentMethods.join("|") || "-",
      row.itemsQty,
      row.totalAmount,
    ]);

    const csv = [header, ...rows]
      .map((line) => line.map((cell) => escape(cell)).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const datePart = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute("download", `transactions-${datePart}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Review completed and refunded sales transactions"
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={!results.length}>
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search transaction no, customer, staff"
                className="pl-9"
              />
            </div>

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
                <SelectItem value="1">Today</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={paymentMethod}
              onValueChange={(value) => {
                setPaymentMethod(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                {paymentOptions.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {activeFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {transactionsQuery.isLoading ? (
        <PageLoadingState label="Loading transactions..." />
      ) : transactionsQuery.isError ? (
        <PageErrorState
          title="Unable to load transactions"
          description="Please check your connection and try again."
          onRetry={() => transactionsQuery.refetch()}
        />
      ) : results.length === 0 ? (
        <PageEmptyState
          icon={Receipt}
          title="No transactions found"
          description="Try adjusting your filters to see transaction history."
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedTransaction(row)}
                        >
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

      <Dialog
        open={Boolean(selectedTransaction)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTransaction(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Transaction Details {selectedTransaction ? `- ${selectedTransaction.transactionNumber}` : ""}
            </DialogTitle>
            <DialogDescription>
              Inspect line items and payment breakdown.
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading ? (
            <PageLoadingState label="Loading transaction detail..." className="min-h-24 py-6" />
          ) : detailQuery.isError || !detailQuery.data ? (
            <PageErrorState
              title="Unable to load transaction details"
              description="Please try again."
              onRetry={() => detailQuery.refetch()}
              className="py-6"
            />
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">{formatDateTime(detailQuery.data.transactionDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Staff</p>
                  <p className="text-sm font-medium">{detailQuery.data.cashierName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-medium">{detailQuery.data.customerName || "Walk-in"}</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold">Items</p>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Line Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailQuery.data.items.map((item) => (
                        <TableRow key={`${item.variantSku}-${item.productName}`}>
                          <TableCell>{item.variantSku}</TableCell>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell className="text-right">{item.qty}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.lineTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border p-3">
                  <p className="mb-2 text-sm font-semibold">Payments</p>
                  <div className="space-y-2">
                    {detailQuery.data.payments.map((payment, idx) => (
                      <div key={`${payment.method}-${idx}`} className="flex items-center justify-between text-sm">
                        <span>{payment.method}</span>
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(detailQuery.data.subtotal)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(detailQuery.data.taxAmount)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(detailQuery.data.totalAmount)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-muted-foreground">Amount Tendered</span>
                    <span>{formatCurrency(detailQuery.data.amountTendered)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-muted-foreground">Change</span>
                    <span>{formatCurrency(detailQuery.data.changeGiven)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
