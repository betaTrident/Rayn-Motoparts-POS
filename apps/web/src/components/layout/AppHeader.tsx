import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

// Map route paths to display titles
const pageTitles: Record<string, string> = {
  "/app/admin/dashboard":        "Dashboard",
  "/app/admin/pos":              "Point of Sale",
  "/app/admin/catalog":          "Catalog",
  "/app/admin/customers":        "Customers",
  "/app/admin/inventory":        "Inventory",
  "/app/admin/transactions":     "Transactions",
  "/app/admin/returns":          "Returns",
  "/app/admin/reports":          "Reports",
  "/app/admin/settings":         "Settings",
  "/app/staff/dashboard":        "Dashboard",
  "/app/staff/pos":              "Point of Sale",
  "/app/staff/customers":        "Customers",
  "/app/staff/inventory":        "Inventory",
  "/app/staff/transactions":     "Transactions",
  "/app/staff/returns":          "Returns",
  "/app/system/audit":           "System Audit",
  "/app/system/cutover-controls":"Cutover Controls",
  "/app/system/health":          "System Health",
  "/app/system/rollout":         "System Rollout",
  "/app/system/reconciliation":  "Reconciliation",
};

function toTitleFromPath(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean).pop();
  if (!segment) return "Page";
  return segment.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

interface AppHeaderProps {
  sidebarCollapsed: boolean;
}

export default function AppHeader({ sidebarCollapsed }: AppHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { highestRole } = usePermissions();
  const [searchValue, setSearchValue] = useState("");

  const pageTitle = pageTitles[location.pathname] ?? toTitleFromPath(location.pathname);
  const appBasePath = highestRole === "staff" ? "/app/staff" : "/app/admin";
  const leftOffset = sidebarCollapsed ? "left-16" : "left-64";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 z-40 flex items-center",
        "bg-white/85 backdrop-blur-md border-b border-[rgba(228,190,180,0.22)]",
        "px-5 gap-4 transition-all duration-200",
        leftOffset
      )}
    >
      {/* ── Search bar ── */}
      <div className="relative flex-1 max-w-md">
        <span
          className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#546067]"
          style={{ fontSize: "18px" }}
        >
          search
        </span>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Search parts, orders, customers..."
          className={cn(
            "w-full bg-[#f3f3f3] pl-9 pr-4 py-2 text-sm text-[#1a1c1c] placeholder:text-[#546067]",
            "border border-transparent rounded-sm",
            "focus:outline-none focus:border-[#ff5722] focus:border-[2px] focus:bg-white",
            "transition-all duration-150"
          )}
        />
      </div>

      {/* ── Right controls ── */}
      <div className="flex items-center gap-2 ml-auto">

        {/* Notifications */}
        <button
          className="w-8 h-8 flex items-center justify-center text-[#546067] hover:text-[#ff5722] hover:bg-[#f3f3f3] rounded-sm transition-colors"
          title="Notifications"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
            notifications
          </span>
        </button>

        {/* Settings shortcut */}
        <button
          onClick={() => navigate(`${appBasePath}/settings`)}
          className="w-8 h-8 flex items-center justify-center text-[#546067] hover:text-[#ff5722] hover:bg-[#f3f3f3] rounded-sm transition-colors"
          title="Settings"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
            settings
          </span>
        </button>

        {/* User avatar */}
        <div
          className="w-8 h-8 rounded-full bg-[#ff5722] flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-[#e04a1e] transition-colors select-none"
          title={`${user?.first_name} ${user?.last_name}`}
        >
          {user
            ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
            : "??"}
        </div>
      </div>

      {/* ── Hidden accessible heading ── */}
      <h1 className="sr-only">{pageTitle}</h1>
    </header>
  );
}
