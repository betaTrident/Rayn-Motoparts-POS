import { AlertTriangle, Flame, PackageX, Turtle, UserRound, WalletCards } from "lucide-react";

import { formatCurrency } from "@/components/modules/dashboard/formatters";
import type {
  InventoryAlerts,
  MovementInsights,
  PaymentMix,
  TopCashiers,
} from "@/components/modules/dashboard/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface OperationalInsightsSectionProps {
  inventoryAlerts: InventoryAlerts;
  movementInsights: MovementInsights;
  topCashiers: TopCashiers;
  paymentMix: PaymentMix;
  showManagementInsights: boolean;
}

export default function OperationalInsightsSection({
  inventoryAlerts,
  movementInsights,
  topCashiers,
  paymentMix,
  showManagementInsights,
}: OperationalInsightsSectionProps) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Inventory Health Alerts</CardTitle>
            <CardDescription>Critical stock conditions for the selected filters</CardDescription>
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
                        <p className="text-xs text-muted-foreground">{item.variantSku}</p>
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
                        <p className="text-xs text-muted-foreground">{item.variantSku}</p>
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

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Movement Insights</CardTitle>
            <CardDescription>Fast-moving and slow-moving items for the selected range</CardDescription>
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

      {showManagementInsights && (
        <div className="grid gap-4 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Top Cashiers</CardTitle>
              <CardDescription>Best cashier performance by revenue in selected range</CardDescription>
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
              <CardDescription>Revenue distribution by payment method</CardDescription>
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
      )}
    </>
  );
}
