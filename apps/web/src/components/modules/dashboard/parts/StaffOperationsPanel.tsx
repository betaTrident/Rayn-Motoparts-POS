import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";

const staffActions = [
  {
    title: "Open POS",
    description: "Start a new checkout flow for walk-in customers.",
    icon: "point_of_sale",
    path: "/app/staff/pos",
    disabled: false,
  },
  {
    title: "Review Transactions",
    description: "Inspect recent sales and verify completed payments.",
    icon: "receipt_long",
    path: "/app/staff/transactions",
    disabled: false,
  },
  {
    title: "Check Stock Alerts",
    description: "Review low-stock items before assisting customers.",
    icon: "inventory_2",
    path: "/app/staff/inventory",
    disabled: false,
  },
] as const;

export default function StaffOperationsPanel() {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-[rgba(84,96,103,0.2)] rounded-lg shadow-sm overflow-hidden">
      {/* Header well */}
      <div className="bg-[#e8e8e8] px-6 py-4 border-b border-[rgba(84,96,103,0.15)]">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#1a1c1c]">
          Shift Operations
        </h3>
        <p className="text-[10px] text-[#546067] font-medium mt-0.5">
          Quick links for frequent staff actions
        </p>
      </div>
      <div className="p-5 grid gap-3 md:grid-cols-3">
        {staffActions.map((action) => (
          <div
            key={action.title}
            className="border border-[rgba(84,96,103,0.2)] p-4 flex flex-col gap-3 hover:bg-[#f9f9f9] transition-colors rounded-md"
          >
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-[#ff5722]"
                style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
              >
                {action.icon}
              </span>
              <p className="text-xs font-bold text-[#1a1c1c]">{action.title}</p>
            </div>
            <p className="text-[10px] text-[#546067] font-medium leading-relaxed">
              {action.description}
            </p>
            <button
              disabled={action.disabled}
              onClick={() => navigate(action.path)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-md",
                "text-[10px] font-bold uppercase tracking-widest",
                "border transition-colors duration-150",
                action.disabled
                  ? "border-[rgba(84,96,103,0.2)] text-[#546067] cursor-not-allowed opacity-50"
                  : "border-[#ff5722] text-[#ff5722] hover:bg-[#ff5722] hover:text-white"
              )}
            >
              {action.disabled ? "Coming Soon" : "Open"}
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                arrow_forward
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
