import { useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useReportsSnapshot } from "@/hooks/modules/useReports";

function formatCurrency(value: number): string {
  return `PHP ${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface ReportsModulePageProps {
  embedded?: boolean;
}

export default function ReportsModulePage({ embedded = false }: ReportsModulePageProps) {
  const [days, setDays] = useState<7 | 30>(30);
  const reportsQuery = useReportsSnapshot(days);

  const snapshot = reportsQuery.data;

  return (
    <div className="space-y-6">
      {embedded && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Reports</h2>
            <p className="text-sm text-muted-foreground">
              Consolidated analytics for revenue, operations, and sales performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={days === 7 ? "default" : "outline"}
              onClick={() => setDays(7)}
            >
              Last 7 days
            </Button>
            <Button
              type="button"
              variant={days === 30 ? "default" : "outline"}
              onClick={() => setDays(30)}
            >
              Last 30 days
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reportsQuery.refetch()}
              disabled={reportsQuery.isFetching}
            >
              <RefreshCw className="mr-2 size-4" />
              Refresh
            </Button>
          </div>
        </div>
      )}

      {!embedded && (
        <PageHeader
          title="Reports"
          description="Consolidated analytics for revenue, operations, and sales performance"
          actions={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={days === 7 ? "default" : "outline"}
                onClick={() => setDays(7)}
              >
                Last 7 days
              </Button>
              <Button
                type="button"
                variant={days === 30 ? "default" : "outline"}
                onClick={() => setDays(30)}
              >
                Last 30 days
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => reportsQuery.refetch()}
                disabled={reportsQuery.isFetching}
              >
                <RefreshCw className="mr-2 size-4" />
                Refresh
              </Button>
            </div>
          }
        />
      )}

      {reportsQuery.isLoading ? (
        <PageLoadingState label="Loading reports..." />
      ) : reportsQuery.isError ? (
        <PageErrorState
          title="Unable to load reports"
          description="Please check your connection and try again."
          onRetry={() => reportsQuery.refetch()}
        />
      ) : !snapshot ? (
        <PageEmptyState
          icon={BarChart3}
          title="No report data"
          description="No analytics are available for the selected period."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(snapshot.dashboard.summary.todayRevenue)}</p>
                <p className="text-xs text-muted-foreground">
                  Change: {snapshot.dashboard.summary.revenueChange.toFixed(1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{snapshot.totals.transactions}</p>
                <p className="text-xs text-muted-foreground">
                  Orders today: {snapshot.dashboard.summary.todayOrders}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{snapshot.totals.returns}</p>
                <p className="text-xs text-muted-foreground">Refunded and partially refunded transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{snapshot.totals.customers}</p>
                <p className="text-xs text-muted-foreground">Total customer records</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshot.dashboard.topProducts.map((item) => (
                      <TableRow key={`${item.name}-${item.category}`}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className="text-right">{item.sold}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Cashiers</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Avg Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshot.dashboard.topCashiers.map((item) => (
                      <TableRow key={item.cashierId}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{item.orders}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.avgOrderValue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Mix</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.dashboard.paymentMix.map((item) => (
                <div key={item.method} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{item.method}</span>
                    <span>
                      {formatCurrency(item.amount)} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.max(0, Math.min(100, item.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
