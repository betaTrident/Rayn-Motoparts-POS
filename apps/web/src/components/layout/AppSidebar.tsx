import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import raynLogo from "@/assets/RAYN-LOGO.svg";

// ═══════════════════════════════════════════════════════
//  INDUSTRIAL ATELIER — AppSidebar
//  Crisp light sidebar with Racing Orange active states
// ═══════════════════════════════════════════════════════

const mainNavItems = [
  { title: "Dashboard", icon: "dashboard", key: "dashboard", enabled: true },
  { title: "Point of Sale", icon: "point_of_sale", key: "pos", enabled: true },
  { title: "Products", icon: "inventory_2", key: "catalog", enabled: true },
  { title: "Customers", icon: "groups", key: "customers", enabled: true },
  { title: "Inventory", icon: "warehouse", key: "inventory", enabled: true },
  {
    title: "Transactions",
    icon: "receipt_long",
    key: "transactions",
    enabled: true,
  },
  {
    title: "Returns",
    icon: "assignment_return",
    key: "returns",
    enabled: true,
  },
  { title: "Reports", icon: "bar_chart", key: "reports", enabled: true },
];

const adminNavItems = [
  { title: "Settings", icon: "settings", key: "settings", enabled: true },
];

const systemNavItems = [
  { title: "System Audit", icon: "fact_check", path: "/app/system/audit" },
  {
    title: "Cutover Controls",
    icon: "tune",
    path: "/app/system/cutover-controls",
  },
  { title: "System Health", icon: "monitor_heart", path: "/app/system/health" },
  {
    title: "System Rollout",
    icon: "rocket_launch",
    path: "/app/system/rollout",
  },
  {
    title: "Reconciliation",
    icon: "verified_user",
    path: "/app/system/reconciliation",
  },
];

// ── Single nav row ──
function NavItem({
  icon,
  title,
  isActive,
  onClick,
  collapsed,
}: {
  icon: string;
  title: string;
  isActive: boolean;
  onClick: () => void;
  collapsed: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? title : undefined}
      className={cn(
        "w-full flex items-center text-sm font-medium tracking-tight",
        "transition-colors duration-150 ease-in-out cursor-pointer relative",
        "border-r-2",
        isActive
          ? "text-[#ff5722] bg-[#f3f3f3] border-[#ff5722]"
          : "text-[#546067] hover:bg-[#f3f3f3] hover:text-[#1a1c1c] border-transparent",
        collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-2.5",
      )}
    >
      <span
        className="material-symbols-outlined text-xl shrink-0"
        style={{
          fontVariationSettings: isActive
            ? "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24"
            : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        }}
      >
        {icon}
      </span>
      {!collapsed && <span className="truncate">{title}</span>}
    </button>
  );
}

// ── Section divider / label ──
function SectionLabel({
  label,
  collapsed,
  hideLine,
}: {
  label: string;
  collapsed: boolean;
  hideLine?: boolean;
}) {
  if (collapsed) {
    if (hideLine) return <div className="my-1" />;
    return <div className="h-px bg-[rgba(84,96,103,0.25)] mx-2 my-2" />;
  }
  return (
    <div className="px-4 pt-2 pb-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#907067]">
        {label}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════
export default function AppSidebar({
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggle,
}: {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { canAccessAdmin, canAccessCatalog, canAccessPos, highestRole } =
    usePermissions();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const appBasePath = highestRole === "staff" ? "/app/staff" : "/app/admin";

  const resolvedMainItems = useMemo(() => {
    return mainNavItems
      .map((item) => ({ ...item, path: `${appBasePath}/${item.key}` }))
      .filter((item) => {
        if (highestRole === "staff" && item.key === "catalog") return false;
        if (highestRole === "staff" && item.key === "reports") return false;
        if (item.key === "catalog" && !canAccessCatalog) return false;
        if (item.key === "pos" && !canAccessPos) return false;
        if (item.key === "returns" && !canAccessPos) return false;
        return item.enabled || item.key === "dashboard";
      });
  }, [appBasePath, canAccessCatalog, canAccessPos, highestRole]);

  const resolvedAdminItems = useMemo(
    () =>
      adminNavItems
        .filter((i) => i.enabled)
        .map((item) => ({ ...item, path: `${appBasePath}/${item.key}` })),
    [appBasePath],
  );

  return (
    <aside
      className={cn(
        "fixed top-0 h-screen flex flex-col bg-white z-50",
        "border-r border-[rgba(84,96,103,0.22)] transition-all duration-200 ease-in-out",
        "left-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
        collapsed ? "lg:w-16 w-72" : "w-72 lg:w-64",
      )}
    >
      {/* ── Brand header ── */}
      <div
        className={cn(
          "h-16 flex items-center shrink-0",
          "border-b border-[rgba(84,96,103,0.22)]",
          collapsed ? "justify-center px-2" : "px-4 gap-3",
        )}
      >
        <div className="w-12 h-12 flex items-center justify-center shrink-0">
          <img 
            src={raynLogo} 
            alt="Rayn Motoparts" 
            className="w-full h-full object-contain"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-[#1a1c1c] tracking-tight leading-none truncate">
              Rayn Motoparts
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#546067] mt-0.5">
              Precision POS
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-2"
        style={{ scrollbarWidth: "none" }}
      >
        <SectionLabel label="Main Menu" collapsed={collapsed} hideLine />
        {resolvedMainItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            title={item.title}
            isActive={
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + "/")
            }
            onClick={() => {
              navigate(item.path);
              onMobileClose?.();
            }}
            collapsed={collapsed}
          />
        ))}

        {canAccessAdmin && (
          <>
            <SectionLabel label="Administration" collapsed={collapsed} />
            {resolvedAdminItems.map((item) => (
              <NavItem
                key={item.path}
                icon={item.icon}
                title={item.title}
                isActive={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  onMobileClose?.();
                }}
                collapsed={collapsed}
              />
            ))}
          </>
        )}

        {highestRole === "superadmin" && (
          <>
            <SectionLabel label="System" collapsed={collapsed} />
            {systemNavItems.map((item) => (
              <NavItem
                key={item.path}
                icon={item.icon}
                title={item.title}
                isActive={location.pathname === item.path}
                onClick={() => {
                  navigate(item.path);
                  onMobileClose?.();
                }}
                collapsed={collapsed}
              />
            ))}
          </>
        )}
      </nav>

      {/* ── Sign Out ── */}
      <div className="shrink-0 mb-4">
        <NavItem
          icon="logout"
          title="Sign Out"
          isActive={false}
          onClick={handleLogout}
          collapsed={collapsed}
        />
      </div>

      {/* ── Collapse toggle pin ── */}
      <button
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "absolute -right-3 top-19 z-20",
          "w-6 h-6 bg-white border border-[rgba(84,96,103,0.3)] rounded-full",
          "hidden lg:flex items-center justify-center shadow-sm cursor-pointer",
          "text-[#546067] hover:text-[#ff5722] hover:border-[#ff5722]",
          "transition-colors duration-150",
        )}
      >
        <span
          className={cn(
            "material-symbols-outlined transition-transform duration-200",
            collapsed && "rotate-180",
          )}
          style={{ fontSize: "14px" }}
        >
          chevron_left
        </span>
      </button>
    </aside>
  );
}
