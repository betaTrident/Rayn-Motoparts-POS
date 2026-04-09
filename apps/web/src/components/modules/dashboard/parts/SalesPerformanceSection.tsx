import { Clock } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/components/modules/dashboard/formatters";
import type {
  CategorySales,
  HourlySales,
  TopProducts,
  WeeklySales,
} from "@/components/modules/dashboard/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Progress } from "@/components/ui/progress";

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

interface SalesPerformanceSectionProps {
  weeklySales: WeeklySales;
  categorySales: CategorySales;
  hourlySales: HourlySales;
  topProducts: TopProducts;
}

export default function SalesPerformanceSection({
  weeklySales,
  categorySales,
  hourlySales,
  topProducts,
}: SalesPerformanceSectionProps) {
  const totalCategoryRevenue = categorySales.reduce((sum, c) => sum + c.revenue, 0);
  const maxProductSold = Math.max(1, ...topProducts.map((p) => p.sold));

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-slate-100 bg-gradient-to-br from-white to-slate-50/30 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-slate-900">Weekly Sales Overview</CardTitle>
            <CardDescription className="text-slate-600">Revenue and orders for the selected range</CardDescription>
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
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} stroke="rgba(0,0,0,0.4)" />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="rgba(0,0,0,0.4)"
                  tickFormatter={(v: number) => `PHP ${(v / 1000).toFixed(0)}k`}
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

        <Card className="lg:col-span-3 border-slate-100 bg-gradient-to-br from-white to-slate-50/30 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-slate-900">Sales by Category</CardTitle>
            <CardDescription className="text-slate-600">Revenue distribution today</CardDescription>
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
                    <ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />
                  }
                />
                <Pie
                  data={categorySales}
                  dataKey="revenue"
                  nameKey="category"
                  innerRadius={55}
                  outerRadius={80}
                  strokeWidth={2}
                  stroke="rgba(255,255,255,0.8)"
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
                      return null;
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {categorySales.map((cat) => (
                <div key={cat.category} className="flex items-center gap-2 text-xs">
                  <div
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: cat.fill }}
                  />
                  <span className="text-muted-foreground">{cat.category}</span>
                  <span className="ml-auto font-medium">{formatCurrency(cat.revenue)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-slate-100 bg-gradient-to-br from-white to-slate-50/30 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-slate-900">Top-Selling Products</CardTitle>
            <CardDescription className="text-slate-600">Best performers today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product) => (
                <div key={product.name} className="flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-slate-900">{product.name}</span>
                      <span className="ml-2 text-sm font-semibold whitespace-nowrap text-slate-700">
                        {product.sold} sold
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Progress value={(product.sold / maxProductSold) * 100} className="h-2" />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <span>{product.category}</span>
                      <span>{formatCurrency(product.revenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-slate-100 bg-gradient-to-br from-white to-slate-50/30 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Clock className="size-4 text-slate-500" />
              Peak Hours
            </CardTitle>
            <CardDescription className="text-slate-600">Order distribution today</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={hourlyConfig}
              className="h-60 w-full"
              role="img"
              aria-label="Bar chart showing hourly order distribution"
            >
              <BarChart data={hourlySales} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} fontSize={12} stroke="rgba(0,0,0,0.4)" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="rgba(0,0,0,0.4)" />
                <ChartTooltip
                  content={
                    <ChartTooltipContent formatter={(value) => [`${value} orders`, "Orders"]} />
                  }
                />
                <Bar
                  dataKey="orders"
                  fill="var(--color-orders)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
