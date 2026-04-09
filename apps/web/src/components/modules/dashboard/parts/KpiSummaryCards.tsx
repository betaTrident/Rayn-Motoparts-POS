import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

import type { DashboardSummary } from "@/components/modules/dashboard/types";
import { formatCurrency } from "@/components/modules/dashboard/formatters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

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
          <CardDescription className="text-sm font-medium">{title}</CardDescription>
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

interface KpiSummaryCardsProps {
  summary: DashboardSummary;
}

export default function KpiSummaryCards({ summary }: KpiSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Today's Revenue"
        value={formatCurrency(summary.todayRevenue)}
        change={summary.revenueChange}
        icon={DollarSign}
      />
      <KpiCard
        title="Total Orders"
        value={summary.todayOrders.toString()}
        change={summary.ordersChange}
        icon={ShoppingCart}
      />
      <KpiCard
        title="Avg. Order Value"
        value={formatCurrency(summary.avgOrderValue)}
        change={summary.avgOrderChange}
        icon={TrendingUp}
      />
      <KpiCard
        title="Items Sold"
        value={summary.itemsSold.toString()}
        change={summary.itemsSoldChange}
        icon={Package}
      />
    </div>
  );
}
