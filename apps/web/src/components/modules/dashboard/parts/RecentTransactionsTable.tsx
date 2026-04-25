import type { RecentTransactions } from "@/components/modules/dashboard/types";
import { formatCurrency } from "@/components/modules/dashboard/formatters";
import { cn } from "@/lib/utils";

// ── Status chip ──
function StatusChip({ status }: { status: string }) {
  const chipClass = cn(
    "px-2 py-0.5 text-[9px] font-bold uppercase rounded-sm tracking-wide",
    status === "Completed"  && "bg-green-100 text-green-700",
    status === "Voided"     && "bg-red-100 text-red-700",
    status === "Refunded"   && "bg-red-100 text-red-700",
    status !== "Completed" && status !== "Voided" && status !== "Refunded"
      && "bg-orange-100 text-orange-700"
  );
  return <span className={chipClass}>{status}</span>;
}

// ── Payment method icon ──
function PaymentIcon({ method }: { method: string }) {
  const iconMap: Record<string, string> = {
    Cash:  "payments",
    GCash: "smartphone",
    Card:  "credit_card",
  };
  return (
    <span
      className="material-symbols-outlined text-[#546067]"
      style={{ fontSize: "16px" }}
    >
      {iconMap[method] ?? "payments"}
    </span>
  );
}

interface RecentTransactionsTableProps {
  transactions: RecentTransactions;
}

export default function RecentTransactionsTable({
  transactions,
}: RecentTransactionsTableProps) {
  return (
    <div className="bg-white border border-[rgba(228,190,180,0.2)] rounded-lg overflow-hidden">
      {/* ── Header well ── */}
      <div className="bg-[#e8e8e8] px-6 py-4 border-b border-[rgba(228,190,180,0.15)] flex justify-between items-center">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#1a1c1c]">
          Recent Transaction Log
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#546067]">
          {transactions.length} entries
        </span>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f3f3f3]">
            <tr>
              {["TRX ID", "Time", "Items", "Payment", "Status", "Amount"].map(
                (col, i) => (
                  <th
                    key={col}
                    className={cn(
                      "px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[#546067]",
                      i === 5 && "text-right"
                    )}
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(228,190,180,0.12)]">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-[#546067]">
                  No transactions recorded today.
                </td>
              </tr>
            ) : (
              transactions.map((txn) => (
                <tr
                  key={txn.id}
                  className="hover:bg-[#f9f9f9] transition-colors duration-150"
                >
                  <td className="px-5 py-3.5 text-xs font-bold text-[#1a1c1c]">
                    {txn.id}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-medium text-[#546067]">
                    {txn.time}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-medium text-[#1a1c1c] text-center">
                    {txn.items}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <PaymentIcon method={txn.paymentMethod} />
                      <span className="text-xs font-medium text-[#546067]">
                        {txn.paymentMethod}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusChip status={txn.status} />
                  </td>
                  <td className="px-5 py-3.5 text-xs font-bold text-right text-[#1a1c1c]">
                    {formatCurrency(txn.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
