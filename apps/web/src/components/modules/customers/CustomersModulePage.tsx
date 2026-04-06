import { useState } from "react";
import { Users } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomers } from "@/hooks/modules/useCustomers";

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

export default function CustomersModulePage() {
  const [q, setQ] = useState("");
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);

  const customersQuery = useCustomers({
    q,
    days,
    page,
    pageSize: 20,
  });

  const results = customersQuery.data?.results ?? [];
  const pagination = customersQuery.data?.pagination;
  const meta = customersQuery.data?.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Customer directory based on recent transaction activity"
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <Input
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setPage(1);
              }}
              placeholder="Search customer name"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant={days === 7 ? "default" : "outline"}
                onClick={() => {
                  setDays(7);
                  setPage(1);
                }}
              >
                7d
              </Button>
              <Button
                type="button"
                variant={days === 30 ? "default" : "outline"}
                onClick={() => {
                  setDays(30);
                  setPage(1);
                }}
              >
                30d
              </Button>
            </div>
          </div>

          {meta && (
            <p className="text-xs text-muted-foreground">
              Based on {meta.sampledTransactions} recent transactions across the last {meta.sampledDays} days.
            </p>
          )}
        </CardContent>
      </Card>

      {customersQuery.isLoading ? (
        <PageLoadingState label="Loading customers..." />
      ) : customersQuery.isError ? (
        <PageErrorState
          title="Unable to load customers"
          description="Please check your connection and try again."
          onRetry={() => customersQuery.refetch()}
        />
      ) : results.length === 0 ? (
        <PageEmptyState
          icon={Users}
          title="No customers found"
          description="Try adjusting search or date filters."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                    <TableHead className="text-right">Lifetime Value</TableHead>
                    <TableHead className="text-right">Avg. Order</TableHead>
                    <TableHead>Last Purchase</TableHead>
                    <TableHead>Last Cashier</TableHead>
                    <TableHead>Last Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{row.name}</span>
                          {row.name === "Walk-in" ? (
                            <Badge variant="outline">Guest</Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{row.visits}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.totalSpent)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.averageOrderValue)}</TableCell>
                      <TableCell>{formatDateTime(row.lastPurchaseAt)}</TableCell>
                      <TableCell>{row.lastCashier}</TableCell>
                      <TableCell>{row.lastTransactionNumber}</TableCell>
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
    </div>
  );
}
