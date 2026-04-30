import { useState, type ElementType } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { BarChart3, RefreshCw, Wallet, Wrench, Users } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
import { useReportsSnapshot } from "@/hooks/modules/useReports";
import type { ReportsSnapshot } from "@/services/modules/reports.service";

function formatCurrency(value: number): string {
  return `PHP ${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const productColumns: ColumnDef<ReportsSnapshot["dashboard"]["topProducts"][number]>[] = [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => (
      <div className="min-w-[14rem]">
        <p className="text-[13px] font-semibold">{row.original.name}</p>
        <p className="mt-1 text-xs text-muted-foreground">{row.original.category}</p>
      </div>
    ),
  },
  {
    accessorKey: "sold",
    header: () => <span className="text-right">Sold</span>,
    cell: ({ row }) => row.original.sold,
    meta: { headerClassName: "text-right", cellClassName: "text-right tabular-nums" },
  },
  {
    accessorKey: "revenue",
    header: () => <span className="text-right">Revenue</span>,
    cell: ({ row }) => formatCurrency(row.original.revenue),
    meta: { headerClassName: "text-right", cellClassName: "text-right tabular-nums" },
  },
];

const cashierColumns: ColumnDef<ReportsSnapshot["dashboard"]["topCashiers"][number]>[] = [
  {
    accessorKey: "name",
    header: "Cashier",
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: "orders",
    header: () => <span className="text-right">Orders</span>,
    cell: ({ row }) => row.original.orders,
    meta: { headerClassName: "text-right", cellClassName: "text-right tabular-nums" },
  },
  {
    accessorKey: "revenue",
    header: () => <span className="text-right">Revenue</span>,
    cell: ({ row }) => formatCurrency(row.original.revenue),
    meta: { headerClassName: "text-right", cellClassName: "text-right tabular-nums" },
  },
  {
    accessorKey: "avgOrderValue",
    header: () => <span className="text-right">Avg Order</span>,
    cell: ({ row }) => formatCurrency(row.original.avgOrderValue),
    meta: { headerClassName: "text-right", cellClassName: "text-right tabular-nums" },
  },
];

const paymentColumns: ColumnDef<ReportsSnapshot["dashboard"]["paymentMix"][number]>[] = [
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => row.original.method,
  },
  {
    accessorKey: "amount",
    header: () => <span className="text-right">Amount</span>,
    cell: ({ row }) => formatCurrency(row.original.amount),
    meta: { headerClassName: "text-right", cellClassName: "text-right tabular-nums" },
  },
  {
    accessorKey: "percentage",
    header: () => <span className="text-right">Share</span>,
    cell: ({ row }) => `${row.original.percentage.toFixed(1)}%`,
    meta: { headerClassName: "text-right", cellClassName: "text-right tabular-nums" },
  },
];

export default function ReportsModulePage() {
  const [days, setDays] = useState<7 | 30>(30);
  const [activeTab, setActiveTab] = useState<"products" | "cashiers" | "payments">("products");
  const reportsQuery = useReportsSnapshot(days);

  const snapshot = reportsQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Consolidated analytics for revenue, operations, and sales performance"
        actions={
          <div className="flex flex-wrap items-center gap-2">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Revenue"
              value={formatCurrency(snapshot.dashboard.summary.todayRevenue)}
              note={`Change ${snapshot.dashboard.summary.revenueChange.toFixed(1)}%`}
              icon={Wallet}
            />
            <StatCard
              label="Transactions"
              value={snapshot.totals.transactions}
              note={`Orders today ${snapshot.dashboard.summary.todayOrders}`}
              icon={BarChart3}
            />
            <StatCard
              label="Returns"
              value={snapshot.totals.returns}
              note="Refunded and partially refunded"
              icon={Wrench}
            />
            <StatCard
              label="Customers"
              value={snapshot.totals.customers}
              note="Tracked customer records"
              icon={Users}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="py-4">
              <CardContent className="space-y-3 pb-0">
                <div>
                  <p className="text-sm font-semibold">Period</p>
                  <p className="text-sm text-muted-foreground">
                    {snapshot.dashboard.meta.startDate} to {snapshot.dashboard.meta.endDate}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Metric
                    label="Avg Order Value"
                    value={formatCurrency(snapshot.dashboard.summary.avgOrderValue)}
                  />
                  <Metric
                    label="Items Sold"
                    value={snapshot.dashboard.summary.itemsSold}
                  />
                  <Metric
                    label="Orders Change"
                    value={`${snapshot.dashboard.summary.ordersChange.toFixed(1)}%`}
                  />
                  <Metric
                    label="Items Change"
                    value={`${snapshot.dashboard.summary.itemsSoldChange.toFixed(1)}%`}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="py-4">
              <CardContent className="space-y-3 pb-0">
                <p className="text-sm font-semibold">Category Revenue Signals</p>
                {snapshot.dashboard.categorySales.slice(0, 4).map((item) => (
                  <div key={item.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{item.category}</span>
                      <span>{formatCurrency(item.revenue)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.max(
                            8,
                            (item.revenue /
                              Math.max(
                                1,
                                ...snapshot.dashboard.categorySales.map((row) => row.revenue)
                              )) *
                              100
                          )}%`,
                          backgroundColor: item.fill,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="pt-0 pb-0">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "products" | "cashiers" | "payments")
              }
              className="gap-0"
            >
              <div className="border-b px-4 pt-3">
                <TabsList variant="line" className="flex w-fit flex-wrap gap-5">
                  <TabsTrigger value="products">Top Products</TabsTrigger>
                  <TabsTrigger value="cashiers">Top Cashiers</TabsTrigger>
                  <TabsTrigger value="payments">Payment Mix</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="products" className="p-4 pt-3">
                <DataTable
                  columns={productColumns}
                  data={snapshot.dashboard.topProducts}
                  pageSize={5}
                  pageSizeOptions={[5, 10]}
                  emptyState={
                    <PageEmptyState
                      icon={BarChart3}
                      title="No product performance data"
                      description="No sales activity is available for the selected range."
                    />
                  }
                />
              </TabsContent>

              <TabsContent value="cashiers" className="p-4 pt-3">
                <DataTable
                  columns={cashierColumns}
                  data={snapshot.dashboard.topCashiers}
                  pageSize={5}
                  pageSizeOptions={[5, 10]}
                  emptyState={
                    <PageEmptyState
                      icon={Users}
                      title="No cashier performance data"
                      description="No cashier activity is available for the selected range."
                    />
                  }
                />
              </TabsContent>

              <TabsContent value="payments" className="p-4 pt-3">
                <DataTable
                  columns={paymentColumns}
                  data={snapshot.dashboard.paymentMix}
                  pageSize={5}
                  pageSizeOptions={[5, 10]}
                  emptyState={
                    <PageEmptyState
                      icon={Wallet}
                      title="No payment mix data"
                      description="No payment activity is available for the selected range."
                    />
                  }
                  mobileCardRenderer={(row) => (
                    <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{row.method}</p>
                        <p className="text-sm font-semibold">{row.percentage.toFixed(1)}%</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatCurrency(row.amount)}
                      </p>
                      <div className="mt-3 h-2 w-full rounded-full bg-muted">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${Math.max(0, Math.min(100, row.percentage))}%` }}
                        />
                      </div>
                    </div>
                  )}
                />
              </TabsContent>
            </Tabs>
          </Card>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  note: string;
  icon: ElementType;
}) {
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-3 pb-0">
        <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="mt-1 text-xs font-medium">{label}</p>
          <p className="text-muted-foreground mt-1 text-[11px]">{note}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
