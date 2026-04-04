import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  AlertTriangle,
  PackageX,
  Flame,
  Turtle,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { useDashboardSnapshot } from "@/hooks/modules/useDashboard";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  Label,
} from "recharts";

import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import PageHeader from "@/components/layout/PageHeader";
import {
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";

// ── Chart configs ──
const weeklySalesConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "var(--color-chart-1)" },
  orders: { label: "Orders", color: "var(--color-chart-3)" },
};

const categoryConfig: ChartConfig = {
  "engine-parts": { label: "Engine Parts", color: "oklch(0.55 0.12 35)" },
  accessories: { label: "Accessories", color: "oklch(0.65 0.19 50)" },
  lubricants: { label: "Lubricants", color: "oklch(0.75 0.15 65)" },
  tires: { label: "Tires", color: "oklch(0.82 0.12 75)" },
  others: { label: "Others", color: "oklch(0.45 0.08 30)" },
};

const hourlyConfig: ChartConfig = {
  orders: { label: "Orders", color: "var(--color-chart-1)" },
};

// ── Helpers ──
function formatCurrency(amount: number) {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;
}

const paymentIcons = {
  Cash: Banknote,
  GCash: Smartphone,
  Card: CreditCard,
};

// ── KPI Card ──
function KpiCard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: number;
  icon: React.ElementType;
}) {
  const isPositive = change >= 0;
  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardDescription className="text-sm font-medium">
            {title}
          </CardDescription>
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Icon className="size-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="mt-1 flex items-center gap-1 text-xs">
          {isPositive ? (
            <ArrowUpRight className="size-3.5 text-green-600" />
          ) : (
            <ArrowDownRight className="size-3.5 text-red-500" />
          )}
          <span className={isPositive ? "text-green-600" : "text-red-500"}>
            {Math.abs(change)}%
          </span>
          <span className="text-muted-foreground">vs yesterday</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ════════════════════════════════════════════════
// DashboardPage
// ════════════════════════════════════════════════
export default function DashboardPage() {
  const { user } = useAuth();
  const [rangeDays, setRangeDays] = useState("1");
  const dashboardQuery = useDashboardSnapshot(Number(rangeDays));

  if (dashboardQuery.isLoading) {
    return <PageLoadingState label="Loading dashboard..." />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <PageErrorState
        title="Unable to load dashboard"
        description="Please check your connection and try again."
        onRetry={() => dashboardQuery.refetch()}
      />
    );
  }

  const {
    summary: stats,
    weeklySales,
    topProducts,
    recentTransactions: transactions,
    categorySales,
    hourlySales,
    inventoryAlerts,
    movementInsights,
    topCashiers,
    paymentMix,
  } = dashboardQuery.data;

  const rangeLabel =
    rangeDays === "1" ? "today" : `the last ${rangeDays} days`;

  const totalCategoryRevenue = categorySales.reduce(
    (sum, c) => sum + c.revenue,
    0
  );
  const maxProductSold = Math.max(1, ...topProducts.map((p) => p.sold));

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title={`${greeting}, ${user?.first_name}!`}
        description={`Here's what's happening at Rayn Motorparts and accessories for ${rangeLabel}.`}
        actions={
          <>
            <Select value={rangeDays} onValueChange={setRangeDays}>
              <SelectTrigger className="w-40 cursor-pointer">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Today</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      {/* ── KPI Summary Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Today's Revenue"
          value={formatCurrency(stats.todayRevenue)}
          change={stats.revenueChange}
          icon={DollarSign}
        />
        <KpiCard
          title="Total Orders"
          value={stats.todayOrders.toString()}
          change={stats.ordersChange}
          icon={ShoppingCart}
        />
        <KpiCard
          title="Avg. Order Value"
          value={formatCurrency(stats.avgOrderValue)}
          change={stats.avgOrderChange}
          icon={TrendingUp}
        />
        <KpiCard
          title="Items Sold"
          value={stats.itemsSold.toString()}
          change={stats.itemsSoldChange}
          icon={Package}
        />
      </div>

      {/* ── Row 2: Weekly Sales Chart + Category Breakdown ── */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Weekly Revenue & Orders Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Weekly Sales Overview</CardTitle>
            <CardDescription>Revenue & orders for the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={weeklySalesConfig}
              className="h-70 w-full"
              role="img"
              aria-label="Weekly sales chart showing revenue and orders"
            >
              <AreaChart data={weeklySales} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickFormatter={(v: number) => `₱${(v / 1000).toFixed(0)}k`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) =>
                        name === "revenue"
                          ? [formatCurrency(value as number), "Revenue"]
                          : [value, "Orders"]
                      }
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                  fill="url(#fillRevenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Sales by Category Donut */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
            <CardDescription>Revenue distribution today</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={categoryConfig}
              className="mx-auto h-50 w-full"
              role="img"
              aria-label="Donut chart showing sales by category"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(value as number)}
                    />
                  }
                />
                <Pie
                  data={categorySales}
                  dataKey="revenue"
                  nameKey="category"
                  innerRadius={55}
                  outerRadius={80}
                  strokeWidth={3}
                  stroke="var(--color-card)"
                >
                  {categorySales.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) - 4}
                              className="fill-foreground text-xl font-bold"
                            >
                              {formatCurrency(totalCategoryRevenue)}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy ?? 0) + 16}
                              className="fill-muted-foreground text-xs"
                            >
                              Total Revenue
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            {/* Legend */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {categorySales.map((cat) => (
                <div key={cat.category} className="flex items-center gap-2 text-xs">
                  <div
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: cat.fill.replace("var(--color-", "").replace(")", "") ? cat.fill : undefined }}
                  />
                  <span className="text-muted-foreground">{cat.category}</span>
                  <span className="ml-auto font-medium">{formatCurrency(cat.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Top Products + Peak Hours ── */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Top Products */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Top-Selling Products</CardTitle>
            <CardDescription>Best performers today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product) => (
                <div key={product.name} className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium">
                        {product.name}
                      </span>
                      <span className="ml-2 text-sm font-semibold whitespace-nowrap">
                        {product.sold} sold
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Progress
                        value={(product.sold / maxProductSold) * 100}
                        className="h-2"
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{product.category}</span>
                      <span>{formatCurrency(product.revenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              Peak Hours
            </CardTitle>
            <CardDescription>Order distribution today</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={hourlyConfig}
              className="h-60 w-full"
              role="img"
              aria-label="Bar chart showing hourly order distribution"
            >
              <BarChart data={hourlySales} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [`${value} orders`, "Orders"]}
                    />
                  }
                />
                <Bar
                  dataKey="orders"
                  fill="var(--color-orders)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Recent Transactions ── */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Inventory Health Alerts</CardTitle>
            <CardDescription>
              Critical stock conditions for the selected filters
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                <AlertTriangle className="size-4" />
                Low Stock
              </div>
              {inventoryAlerts.lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">No low-stock alerts.</p>
              ) : (
                <div className="space-y-2">
                  {inventoryAlerts.lowStock.map((item) => (
                    <div
                      key={`${item.variantSku}-low`}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.variantSku}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-semibold text-amber-700 dark:text-amber-400">
                          {item.qtyAvailable} left
                        </p>
                        <p className="text-muted-foreground">RP {item.reorderPoint}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
                <PackageX className="size-4" />
                Out of Stock
              </div>
              {inventoryAlerts.outOfStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">No out-of-stock alerts.</p>
              ) : (
                <div className="space-y-2">
                  {inventoryAlerts.outOfStock.map((item) => (
                    <div
                      key={`${item.variantSku}-oos`}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.variantSku}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-semibold text-red-700 dark:text-red-400">0 left</p>
                        <p className="text-muted-foreground">RP {item.reorderPoint}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 5: Movement Insights ── */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Movement Insights</CardTitle>
            <CardDescription>
              Fast-moving and slow-moving items for the selected range
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                <Flame className="size-4" />
                Fast Moving
              </div>
              {movementInsights.fastMoving.length === 0 ? (
                <p className="text-sm text-muted-foreground">No movement data yet.</p>
              ) : (
                <div className="space-y-2">
                  {movementInsights.fastMoving.map((item) => (
                    <div
                      key={`${item.variantSku}-fast`}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.variantSku} · {item.category}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {item.sold} sold
                        </p>
                        <p className="text-muted-foreground">{formatCurrency(item.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-sky-400">
                <Turtle className="size-4" />
                Slow Moving
              </div>
              {movementInsights.slowMoving.length === 0 ? (
                <p className="text-sm text-muted-foreground">No movement data yet.</p>
              ) : (
                <div className="space-y-2">
                  {movementInsights.slowMoving.map((item) => (
                    <div
                      key={`${item.variantSku}-slow`}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.variantSku} · {item.category}
                        </p>
                      </div>
                      <div className="text-right text-xs">
                        <p className="font-semibold text-sky-700 dark:text-sky-400">
                          {item.sold} sold
                        </p>
                        <p className="text-muted-foreground">{formatCurrency(item.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Row 6: Team & Payment Insights ── */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Top Cashiers</CardTitle>
            <CardDescription>
              Best cashier performance by revenue in selected range
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topCashiers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cashier activity yet.</p>
            ) : (
              <div className="space-y-2">
                {topCashiers.map((cashier) => (
                  <div
                    key={cashier.cashierId}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <UserRound className="size-4 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{cashier.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cashier.orders} orders · AOV {formatCurrency(cashier.avgOrderValue)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(cashier.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Payment Mix</CardTitle>
            <CardDescription>
              Revenue distribution by payment method
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMix.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payment data yet.</p>
            ) : (
              <div className="space-y-2">
                {paymentMix.map((item) => (
                  <div
                    key={item.method}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <WalletCards className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.method}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(item.amount)}</p>
                      <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 7: Recent Transactions ── */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest orders processed today</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn) => {
                const PaymentIcon = paymentIcons[txn.paymentMethod];
                return (
                  <TableRow key={txn.id}>
                    <TableCell className="font-medium">{txn.id}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {txn.time}
                    </TableCell>
                    <TableCell className="text-center">{txn.items}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PaymentIcon className="size-3.5 text-muted-foreground" />
                        <span>{txn.paymentMethod}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          txn.status === "Completed" ? "default" : "destructive"
                        }
                        className="text-xs"
                      >
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(txn.total)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
