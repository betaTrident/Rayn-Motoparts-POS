import { formatCurrency } from "@/components/modules/dashboard/formatters";
import type {
  InventoryAlerts,
  MovementInsights,
  PaymentMix,
  TopCashiers,
} from "@/components/modules/dashboard/types";
import { cn } from "@/lib/utils";

// ── Section card shell ──
function SectionCard({
  title,
  badge,
  children,
  className,
}: {
  title: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-[rgba(84,96,103,0.2)] rounded-lg shadow-sm overflow-hidden ${className ?? ""}`}>
      <div className="bg-[#e8e8e8] px-6 py-4 border-b border-[rgba(84,96,103,0.15)] flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#1a1c1c]">
          {title}
        </h3>
        {badge}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Alert item row ──
function AlertRow({
  name,
  sku,
  count,
  label,
  borderColor,
}: {
  name: string;
  sku: string;
  count: string;
  label: string;
  borderColor: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2.5 rounded-md",
        "border-l-4 bg-white border border-[rgba(84,96,103,0.15)]",
      )}
      style={{ borderLeftColor: borderColor }}
    >
      <div className="min-w-0">
        <p className="text-xs font-bold text-[#1a1c1c] truncate">{name}</p>
        <p className="text-[10px] text-[#546067] font-medium">{sku}</p>
      </div>
      <div className="text-right text-xs shrink-0 ml-3">
        <p className="font-bold" style={{ color: borderColor }}>{count}</p>
        <p className="text-[10px] text-[#546067]">{label}</p>
      </div>
    </div>
  );
}

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
  const lowCount = inventoryAlerts.lowStock.length;
  const oosCount = inventoryAlerts.outOfStock.length;

  return (
    <>
      {/* ── Inventory Health Alerts ── */}
      <SectionCard
        title="Inventory Health Alerts"
        badge={
          (lowCount + oosCount) > 0 ? (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold uppercase rounded-sm tracking-wide">
              {lowCount + oosCount} alerts
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold uppercase rounded-sm tracking-wide">
              All clear
            </span>
          )
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          {/* Low stock */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="material-symbols-outlined text-amber-600"
                style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
              >
                warning
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                Low Stock — {lowCount} items
              </span>
            </div>
            {inventoryAlerts.lowStock.length === 0 ? (
              <p className="text-sm text-[#546067]">No low-stock alerts.</p>
            ) : (
              inventoryAlerts.lowStock.map((item) => (
                <AlertRow
                  key={`${item.variantSku}-low`}
                  name={item.productName}
                  sku={item.variantSku}
                  count={`${item.qtyAvailable} left`}
                  label={`RP: ${item.reorderPoint}`}
                  borderColor="#d97706"
                />
              ))
            )}
          </div>

          {/* Out of stock */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="material-symbols-outlined text-[#ba1a1a]"
                style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
              >
                inventory
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#ba1a1a]">
                Out of Stock — {oosCount} items
              </span>
            </div>
            {inventoryAlerts.outOfStock.length === 0 ? (
              <p className="text-sm text-[#546067]">No out-of-stock alerts.</p>
            ) : (
              inventoryAlerts.outOfStock.map((item) => (
                <AlertRow
                  key={`${item.variantSku}-oos`}
                  name={item.productName}
                  sku={item.variantSku}
                  count="0 left"
                  label={`RP: ${item.reorderPoint}`}
                  borderColor="#ba1a1a"
                />
              ))
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Movement Insights ── */}
      <SectionCard title="Movement Insights — Fast &amp; Slow Movers">
        <div className="grid gap-5 md:grid-cols-2">
          {/* Fast moving */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="material-symbols-outlined text-emerald-600"
                style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
              >
                local_fire_department
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                Fast Moving
              </span>
            </div>
            {movementInsights.fastMoving.length === 0 ? (
              <p className="text-sm text-[#546067]">No movement data yet.</p>
            ) : (
              movementInsights.fastMoving.map((item) => (
                <AlertRow
                  key={`${item.variantSku}-fast`}
                  name={item.productName}
                  sku={`${item.variantSku} · ${item.category}`}
                  count={`${item.sold} sold`}
                  label={formatCurrency(item.revenue)}
                  borderColor="#059669"
                />
              ))
            )}
          </div>

          {/* Slow moving */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="material-symbols-outlined text-sky-600"
                style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}
              >
                hourglass_empty
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700">
                Slow Moving
              </span>
            </div>
            {movementInsights.slowMoving.length === 0 ? (
              <p className="text-sm text-[#546067]">No movement data yet.</p>
            ) : (
              movementInsights.slowMoving.map((item) => (
                <AlertRow
                  key={`${item.variantSku}-slow`}
                  name={item.productName}
                  sku={`${item.variantSku} · ${item.category}`}
                  count={`${item.sold} sold`}
                  label={formatCurrency(item.revenue)}
                  borderColor="#0284c7"
                />
              ))
            )}
          </div>
        </div>
      </SectionCard>

      {/* ── Management Insights (admin only) ── */}
      {showManagementInsights && (
        <div className="grid gap-5 lg:grid-cols-7">
          {/* Top Cashiers */}
          <SectionCard title="Top Cashier Performance" className="lg:col-span-4">
            {topCashiers.length === 0 ? (
              <p className="text-sm text-[#546067]">No cashier activity yet.</p>
            ) : (
              <div className="space-y-2">
                {topCashiers.map((cashier, i) => (
                  <div
                    key={cashier.cashierId}
                    className="flex items-center justify-between px-3 py-2.5 border border-[rgba(84,96,103,0.18)] hover:bg-[#f9f9f9] transition-colors rounded-md"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Rank badge */}
                      <div className={cn(
                        "w-6 h-6 flex items-center justify-center rounded-sm text-[10px] font-bold shrink-0",
                        i === 0 ? "bg-[#ff5722] text-white" : "bg-[#f3f3f3] text-[#546067]"
                      )}>
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1a1c1c] truncate">{cashier.name}</p>
                        <p className="text-[10px] text-[#546067] font-medium">
                          {cashier.orders} orders · AOV {formatCurrency(cashier.avgOrderValue)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-extrabold text-[#1a1c1c] shrink-0 ml-3">
                      {formatCurrency(cashier.revenue)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Payment Mix */}
          <SectionCard title="Payment Method Distribution" className="lg:col-span-3">
            {paymentMix.length === 0 ? (
              <p className="text-sm text-[#546067]">No payment data yet.</p>
            ) : (
              <div className="space-y-3">
                {paymentMix.map((item) => (
                  <div key={item.method} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span
                          className="material-symbols-outlined text-[#546067]"
                          style={{ fontSize: "16px" }}
                        >
                          {item.method === "Cash" ? "payments"
                            : item.method === "GCash" ? "smartphone"
                            : "credit_card"}
                        </span>
                        <span className="text-xs font-bold text-[#1a1c1c]">{item.method}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#1a1c1c]">{formatCurrency(item.amount)}</span>
                        <span className="text-[10px] text-[#546067] ml-2">{item.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1 bg-[#e8e8e8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ff5722] rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </>
  );
}
