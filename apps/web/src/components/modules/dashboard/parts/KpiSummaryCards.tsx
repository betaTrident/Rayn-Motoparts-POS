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
    <Card className="border-slate-100 bg-gradient-to-br from-white to-slate-50/30 shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardDescription className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {title}
            </CardDescription>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 p-2.5 text-primary">
            <Icon className="size-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</div>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium">
          {isPositive ? (
            <>
              <ArrowUpRight className="size-4 text-emerald-600" />
              <span className="text-emerald-600">{Math.abs(change)}%</span>
            </>
          ) : (
            <>
              <ArrowDownRight className="size-4 text-red-500" />
              <span className="text-red-500">{Math.abs(change)}%</span>
            </>
          )}
          <span className="text-slate-500">vs yesterday</span>
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
