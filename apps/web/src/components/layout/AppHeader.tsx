import { useMemo } from "react";
import { useLocation } from "react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, ChevronDown, Search, Settings, Store } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Map route paths to display titles
const pageTitles: Record<string, string> = {
  "/app/admin/dashboard": "Dashboard",
  "/app/admin/pos": "Point of Sale",
  "/app/admin/catalog": "Products",
  "/app/admin/customers": "Customers",
  "/app/admin/inventory": "Inventory",
  "/app/admin/transactions": "Transactions",
  "/app/admin/returns": "Returns",
  "/app/admin/reports": "Reports",
  "/app/admin/settings": "Settings",
  "/app/staff/dashboard": "Dashboard",
  "/app/staff/pos": "Point of Sale",
  "/app/staff/customers": "Customers",
  "/app/staff/inventory": "Inventory",
  "/app/staff/transactions": "Transactions",
  "/app/staff/returns": "Returns",
  "/app/system/audit": "System Audit",
  "/app/system/cutover-controls": "Cutover Controls",
  "/app/system/health": "System Health",
  "/app/system/rollout": "System Rollout",
  "/app/system/reconciliation": "Reconciliation",
};

function toTitleFromPath(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean).pop();
  if (!segment) {
    return "Page";
  }
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AppHeader() {
  const location = useLocation();
  const { user } = useAuth();
  const pageTitle = pageTitles[location.pathname] ?? toTitleFromPath(location.pathname);
  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date()),
    []
  );
  const userInitials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : "RM";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-white/90 px-4 backdrop-blur-sm md:px-6">
      <h1 className="sr-only">{pageTitle}</h1>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <SidebarTrigger className="-ml-1 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors rounded-lg md:hidden" />
        <div className="relative w-full max-w-lg">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder={`Search in ${pageTitle}`}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition-all focus:border-slate-300 focus:shadow-sm focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <div className="hidden text-xs font-medium text-slate-500 lg:block">{formattedDate}</div>
        <button className="hidden h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 sm:flex">
          <Store className="size-4 text-slate-500" />
          <span>Main Branch</span>
          <ChevronDown className="size-4 text-slate-400" />
        </button>
        <button className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-600">
          <Bell className="size-4" />
        </button>
        <button className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-600">
          <Settings className="size-4" />
        </button>
        <div className="flex size-10 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-50 text-xs font-semibold text-slate-700 transition-all">
          {userInitials}
        </div>
      </div>
    </header>
  );
}
