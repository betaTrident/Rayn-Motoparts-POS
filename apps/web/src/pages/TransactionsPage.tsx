import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Receipt, Search } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
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
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";

import { getDashboardWarehouses } from "@/services/dashboardService";
import { getTransactions } from "@/services/transactionService";

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
  const { warehouseId } = useAuth();

  const [q, setQ] = useState("");
  const [days, setDays] = useState("7");
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(
    warehouseId ? String(warehouseId) : "all"
  );

  const warehousesQuery = useQuery({
    queryKey: ["transactions", "warehouses"],
    queryFn: getDashboardWarehouses,
  });

  const transactionsQuery = useQuery({
    queryKey: [
      "transactions",
      "list",
      q,
      days,
      status,
      paymentMethod,
      selectedWarehouseId,
    ],
    queryFn: () =>
      getTransactions({
        q,
        days: Number(days),
        status,
        paymentMethod,
        warehouseId: selectedWarehouseId === "all" ? undefined : Number(selectedWarehouseId),
      }),
  });

  const results = transactionsQuery.data?.results ?? [];
  const statusOptions = transactionsQuery.data?.statusOptions ?? [];
  const paymentOptions = transactionsQuery.data?.paymentMethodOptions ?? [];

  const activeFilters = useMemo(() => {
    return Boolean(q) || days !== "7" || status !== "all" || paymentMethod !== "all";
  }, [q, days, status, paymentMethod]);

  const clearFilters = () => {
    setQ("");
    setDays("7");
    setStatus("all");
    setPaymentMethod("all");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Review completed and refunded sales transactions"
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search transaction no, customer, cashier"
                className="pl-9"
              />
            </div>

            <Select value={days} onValueChange={setDays}>
              <SelectTrigger>
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Today</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={setStatus}>
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

            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
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
            <Select
              value={selectedWarehouseId}
              onValueChange={setSelectedWarehouseId}
              disabled={warehousesQuery.isLoading || Boolean(warehouseId)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Warehouse" />
              </SelectTrigger>
              <SelectContent>
                {!warehouseId && <SelectItem value="all">All Warehouses</SelectItem>}
                {(warehousesQuery.data ?? []).map((warehouse) => (
                  <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                    {warehouse.code} - {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
                    <TableHead>Cashier</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Payments</TableHead>
                    <TableHead className="text-right">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
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
                      <TableCell>{row.warehouseCode}</TableCell>
                      <TableCell>{row.paymentMethods.join(", ")}</TableCell>
                      <TableCell className="text-right">{row.itemsQty}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(row.totalAmount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
