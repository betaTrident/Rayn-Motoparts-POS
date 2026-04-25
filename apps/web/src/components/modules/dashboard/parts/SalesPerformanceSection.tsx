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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

// ── Chart configs ──
const weeklySalesConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "#ff5722" },
};

const hourlyConfig: ChartConfig = {
  orders: { label: "Orders", color: "#ff5722" },
};

// ── Section card shell ──
function SectionCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-[rgba(84,96,103,0.2)] rounded-lg shadow-sm overflow-hidden ${className ?? ""}`}>
      {/* Header well */}
      <div className="bg-[#e8e8e8] px-6 py-4 border-b border-[rgba(84,96,103,0.15)]">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#1a1c1c]">
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

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
      {/* ── Revenue Trend + Category Donut ── */}
      <div className="grid gap-5 lg:grid-cols-7">
        {/* Revenue trend chart */}
        <SectionCard title="Revenue Velocity — Selected Range" className="lg:col-span-4">
          <ChartContainer
            config={weeklySalesConfig}
            className="h-64 w-full"
            role="img"
            aria-label="Revenue trend area chart"
          >
            <AreaChart data={weeklySales} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ff5722" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ff5722" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(84,96,103,0.3)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#546067", fontWeight: 700 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#546067", fontWeight: 700 }}
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
                stroke="#ff5722"
                strokeWidth={2}
                fill="url(#revenueGrad)"
              />
            </AreaChart>
          </ChartContainer>
        </SectionCard>

        {/* Category donut */}
        <SectionCard title="Sales by Category" className="lg:col-span-3">
          <ChartContainer
            config={{}}
            className="mx-auto h-48 w-full"
            role="img"
            aria-label="Category revenue donut chart"
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
                innerRadius={50}
                outerRadius={75}
                strokeWidth={3}
                stroke="#f9f9f9"
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
                            style={{ fontSize: "14px", fontWeight: 800, fill: "#1a1c1c" }}
                          >
                            {formatCurrency(totalCategoryRevenue)}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 14}
                            style={{ fontSize: "9px", fill: "#546067", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}
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
          {/* Legend */}
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {categorySales.map((cat) => (
              <div key={cat.category} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: cat.fill }}
                />
                <span className="text-[#546067] text-[10px] font-medium truncate">{cat.category}</span>
                <span className="ml-auto font-bold text-[10px] text-[#1a1c1c] shrink-0">
                  {formatCurrency(cat.revenue)}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Top Products + Peak Hours ── */}
      <div className="grid gap-5 lg:grid-cols-7">
        {/* Top selling products */}
        <SectionCard title="High-Demand Components" className="lg:col-span-4">
          <div className="space-y-5">
            {topProducts.map((product) => (
              <div key={product.name} className="flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-[#1a1c1c] truncate">{product.name}</p>
                    <span className="text-xs font-bold text-[#ff5722] shrink-0 ml-2">
                      {product.sold} sold
                    </span>
                  </div>
                  <div className="text-[10px] text-[#546067] font-medium mt-0.5">
                    {product.category} · {formatCurrency(product.revenue)}
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 w-full h-1 bg-[#e8e8e8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#ff5722] rounded-full transition-all duration-500"
                      style={{ width: `${(product.sold / maxProductSold) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Peak hours bar chart */}
        <SectionCard title="Peak Hours — Order Distribution" className="lg:col-span-3">
          <ChartContainer
            config={hourlyConfig}
            className="h-56 w-full"
            role="img"
            aria-label="Hourly order distribution bar chart"
          >
            <BarChart data={hourlySales} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(84,96,103,0.3)" />
              <XAxis
                dataKey="hour"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#546067", fontWeight: 700 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#546067", fontWeight: 700 }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [`${value} orders`, "Orders"]}
                  />
                }
              />
              <Bar
                dataKey="orders"
                fill="#ff5722"
                radius={[2, 2, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ChartContainer>
        </SectionCard>
      </div>
    </>
  );
}
