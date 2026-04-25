import type { DashboardSummary } from "@/components/modules/dashboard/types";
import { formatCurrency } from "@/components/modules/dashboard/formatters";

// ── Single KPI card ──
function KpiCard({
  label,
  value,
  change,
  changePositive,
  icon,
  progressPct,
}: {
  label: string;
  value: string;
  change: string;
  changePositive: boolean;
  icon: string;
  progressPct: number;
}) {
  return (
    <div className="bg-white border border-[rgba(84,96,103,0.2)] p-5 rounded-lg shadow-sm">
      {/* Header row */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#546067]">
          {label}
        </span>
        <span
          className="material-symbols-outlined text-[#ff5722]"
          style={{
            fontSize: "20px",
            fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
          }}
        >
          {icon}
        </span>
      </div>

      {/* Value + trend */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold tracking-tight text-[#1a1c1c]">
          {value}
        </span>
        <span
          className={`text-[10px] font-bold ${changePositive ? "text-green-600" : "text-[#ba1a1a]"}`}
        >
          {change}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4 w-full h-1 bg-[#e8e8e8] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#ff5722] rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
        />
      </div>
    </div>
  );
}

interface KpiSummaryCardsProps {
  summary: DashboardSummary;
}

export default function KpiSummaryCards({ summary }: KpiSummaryCardsProps) {
  const revenueChange = summary.revenueChange;
  const ordersChange  = summary.ordersChange;
  const avgChange     = summary.avgOrderChange;
  const itemsChange   = summary.itemsSoldChange;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <KpiCard
        label="Today's Revenue"
        value={formatCurrency(summary.todayRevenue)}
        change={`${revenueChange >= 0 ? "+" : ""}${revenueChange}%`}
        changePositive={revenueChange >= 0}
        icon="monetization_on"
        progressPct={Math.min(100, (summary.todayRevenue / 50000) * 100)}
      />
      <KpiCard
        label="Orders Processed"
        value={summary.todayOrders.toString()}
        change={`${ordersChange >= 0 ? "+" : ""}${ordersChange}%`}
        changePositive={ordersChange >= 0}
        icon="shopping_cart"
        progressPct={Math.min(100, (summary.todayOrders / 100) * 100)}
      />
      <KpiCard
        label="Avg. Order Value"
        value={formatCurrency(summary.avgOrderValue)}
        change={`${avgChange >= 0 ? "+" : ""}${avgChange}%`}
        changePositive={avgChange >= 0}
        icon="trending_up"
        progressPct={Math.min(100, (summary.avgOrderValue / 2000) * 100)}
      />
      <KpiCard
        label="Items Sold"
        value={summary.itemsSold.toString()}
        change={`${itemsChange >= 0 ? "+" : ""}${itemsChange}%`}
        changePositive={itemsChange >= 0}
        icon="inventory_2"
        progressPct={Math.min(100, (summary.itemsSold / 200) * 100)}
      />
    </div>
  );
}
