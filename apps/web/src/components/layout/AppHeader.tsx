import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import DateTimeDisplay from "@/components/layout/DateTimeDisplay";

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
  onToggleMobileSidebar?: () => void;
}

export default function AppHeader({ sidebarCollapsed, onToggleMobileSidebar }: AppHeaderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { highestRole } = usePermissions();

  
  const pageTitle = pageTitles[location.pathname] ?? toTitleFromPath(location.pathname);
  const appBasePath = highestRole === "staff" ? "/app/staff" : "/app/admin";
  const leftOffset = sidebarCollapsed ? "left-0 lg:left-16" : "left-0 lg:left-64";

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 z-40 flex items-center",
        "bg-white/85 backdrop-blur-md border-b border-[rgba(84,96,103,0.22)]",
        "px-5 gap-4 transition-all duration-200",
        leftOffset
      )}
    >
      {/* ── Hamburger Menu ── */}
      <button
        onClick={onToggleMobileSidebar}
        className="lg:hidden w-10 h-10 -ml-2 flex items-center justify-center text-[#546067] hover:text-[#ff5722] rounded-sm shrink-0"
        aria-label="Open navigation"
      >
        <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>menu</span>
      </button>

     

      {/* Search icon fallback on very small screens */}
      <button className="sm:hidden w-10 h-10 -ml-2 flex items-center justify-center text-[#546067] hover:text-[#ff5722] rounded-sm shrink-0 mr-auto" aria-label="Search">
        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>search</span>
      </button>

      {/* ── Right controls ── */}
      <div className="flex items-center gap-2 ml-auto">
        <DateTimeDisplay className="mr-4" />

        {/* Notifications shortcut */}
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
