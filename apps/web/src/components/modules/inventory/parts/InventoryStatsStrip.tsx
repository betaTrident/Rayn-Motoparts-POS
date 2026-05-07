import { AlertTriangle, Boxes, CheckCircle2, CircleDollarSign, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsStripSkeleton } from "@/components/ui/skeletons/StatsStripSkeleton";
import type { InventoryStockSummary } from "@/services/modules/inventory.service";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(value);
}

export default function InventoryStatsStrip({
  summary,
  isLoading = false,
}: {
  summary?: InventoryStockSummary;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return <StatsStripSkeleton count={5} />;
  }

  const stats = [
    {
      label: "Tracked SKU Variants",
      value: summary?.total_variants_tracked ?? 0,
      icon: Boxes,
      accent: "primary",
      colors: "bg-primary/10 text-primary border-primary/20",
    },
    {
      label: "In Stock",
      value: summary?.in_stock_count ?? 0,
      icon: CheckCircle2,
      accent: "green",
      colors: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900",
    },
    {
      label: "Low Stock",
      value: summary?.low_stock_count ?? 0,
      icon: AlertTriangle,
      accent: "amber",
      colors: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
    },
    {
      label: "Out of Stock",
      value: summary?.out_of_stock_count ?? 0,
      icon: XCircle,
      accent: "red",
      colors: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900",
    },
    {
      label: "Stock Value",
      value: formatCurrency(summary?.total_stock_value ?? 0),
      icon: CircleDollarSign,
      accent: "blue",
      colors: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((item) => (
        <Card key={item.label} className="overflow-hidden border-none shadow-sm ring-1 ring-border">
          <CardContent className="p-4 flex items-center gap-4">
            <div className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
              item.colors
            )}>
              <item.icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold tracking-tight text-foreground leading-none">
                {item.value}
              </p>
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 truncate">
                {item.label}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
