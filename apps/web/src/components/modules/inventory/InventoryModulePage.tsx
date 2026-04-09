import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { AlertTriangle, PackageSearch, TrendingDown, TrendingUp } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
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
import { useDashboardSnapshot } from "@/hooks/modules/useDashboard";

type InventoryRange = "1" | "7" | "30";

function toValidRange(value: string | null): InventoryRange {
  if (value === "1" || value === "7" || value === "30") {
    return value;
  }
  return "7";
}

function formatCurrency(value: number): string {
  return `PHP ${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function InventoryModulePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const range = toValidRange(searchParams.get("range"));
  const days = useMemo(() => Number(range), [range]);

  const dashboardQuery = useDashboardSnapshot(days);

  const setRange = (value: InventoryRange) => {
    const next = new URLSearchParams(searchParams);
    next.set("range", value);
    setSearchParams(next, { replace: true });
  };

  if (dashboardQuery.isLoading) {
    return <PageLoadingState label="Loading inventory snapshot..." />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <PageErrorState
        title="Unable to load inventory"
        description="Please check your connection and try again."
        onRetry={() => dashboardQuery.refetch()}
      />
    );
  }

  const { inventoryAlerts, movementInsights } = dashboardQuery.data;
  const lowStockCount = inventoryAlerts.lowStock.length;
  const outOfStockCount = inventoryAlerts.outOfStock.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="Monitor stock health and movement trends"
        actions={
          <Select value={range} onValueChange={(value) => setRange(value as InventoryRange)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Today</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Low Stock Variants</CardDescription>
            <CardTitle className="text-2xl">{lowStockCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Items at or below reorder point
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Out of Stock Variants</CardDescription>
            <CardTitle className="text-2xl">{outOfStockCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Variants with no available quantity
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fast Moving (Top)</CardDescription>
            <CardTitle className="text-2xl">{movementInsights.fastMoving.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Highest-selling variants in range
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Slow Moving (Bottom)</CardDescription>
            <CardTitle className="text-2xl">{movementInsights.slowMoving.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Lowest-selling active variants in range
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              Low Stock
            </CardTitle>
            <CardDescription>Restock these variants soon</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryAlerts.lowStock.length === 0 ? (
              <PageEmptyState
                icon={PackageSearch}
                title="No low stock items"
                description="All tracked variants are above reorder point."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Reorder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryAlerts.lowStock.map((item) => (
                      <TableRow key={item.variantSku}>
                        <TableCell className="font-mono text-xs">{item.variantSku}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">{item.qtyAvailable}</TableCell>
                        <TableCell className="text-right">{item.reorderPoint}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-500" />
              Out of Stock
            </CardTitle>
            <CardDescription>Variants unavailable for sale</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryAlerts.outOfStock.length === 0 ? (
              <PageEmptyState
                icon={PackageSearch}
                title="No out-of-stock items"
                description="All tracked variants currently have available quantity."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                      <TableHead className="text-right">Reorder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryAlerts.outOfStock.map((item) => (
                      <TableRow key={item.variantSku}>
                        <TableCell className="font-mono text-xs">{item.variantSku}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">{item.qtyAvailable}</TableCell>
                        <TableCell className="text-right">{item.reorderPoint}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-green-600" />
              Fast Moving
            </CardTitle>
            <CardDescription>Top selling variants in selected range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {movementInsights.fastMoving.length === 0 ? (
              <PageEmptyState
                icon={TrendingUp}
                title="No movement data"
                description="No sales activity found for this date range."
              />
            ) : (
              movementInsights.fastMoving.map((item) => (
                <div key={`fast-${item.variantSku}`} className="rounded-md border p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.productName}</p>
                    <Badge variant="secondary">{item.category}</Badge>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{item.variantSku}</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span>{item.sold} units sold</span>
                    <span className="font-medium">{formatCurrency(item.revenue)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="size-4 text-orange-600" />
              Slow Moving
            </CardTitle>
            <CardDescription>Low-selling variants in selected range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {movementInsights.slowMoving.length === 0 ? (
              <PageEmptyState
                icon={TrendingDown}
                title="No movement data"
                description="No sales activity found for this date range."
              />
            ) : (
              movementInsights.slowMoving.map((item) => (
                <div key={`slow-${item.variantSku}`} className="rounded-md border p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{item.productName}</p>
                    <Badge variant="secondary">{item.category}</Badge>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{item.variantSku}</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span>{item.sold} units sold</span>
                    <span className="font-medium">{formatCurrency(item.revenue)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
