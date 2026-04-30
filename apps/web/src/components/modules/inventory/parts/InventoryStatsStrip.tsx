import { AlertTriangle, Boxes, CheckCircle2, CircleDollarSign, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
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
}: {
  summary?: InventoryStockSummary;
}) {
  const stats = [
    {
      label: "Tracked SKU Variants",
      value: summary?.total_variants_tracked ?? 0,
      icon: Boxes,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "In Stock",
      value: summary?.in_stock_count ?? 0,
      icon: CheckCircle2,
      color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    },
    {
      label: "Low Stock",
      value: summary?.low_stock_count ?? 0,
      icon: AlertTriangle,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    },
    {
      label: "Out of Stock",
      value: summary?.out_of_stock_count ?? 0,
      icon: XCircle,
      color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
    },
    {
      label: "Stock Value",
      value: formatCurrency(summary?.total_stock_value ?? 0),
      icon: CircleDollarSign,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((item) => (
        <Card key={item.label} className="py-4">
          <CardContent className="flex items-center gap-3 pb-0">
            <div
              className={cn(
                "flex size-9 items-center justify-center rounded-md",
                item.color
              )}
            >
              <item.icon className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-2xl font-bold leading-none">
                {item.value}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
