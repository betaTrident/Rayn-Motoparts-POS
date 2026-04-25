import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════
//  INDUSTRIAL ATELIER — AppSidebar
//  Crisp light sidebar with Racing Orange active states
// ═══════════════════════════════════════════════════════

const mainNavItems = [
  { title: "Dashboard",     icon: "dashboard",         key: "dashboard",    enabled: true  },
  { title: "Point of Sale", icon: "point_of_sale",     key: "pos",          enabled: true  },
  { title: "Catalog",       icon: "inventory_2",        key: "catalog",      enabled: true  },
  { title: "Customers",     icon: "groups",             key: "customers",    enabled: true  },
  { title: "Inventory",     icon: "warehouse",          key: "inventory",    enabled: true  },
  { title: "Transactions",  icon: "receipt_long",       key: "transactions", enabled: true  },
  { title: "Returns",       icon: "assignment_return",  key: "returns",      enabled: true  },
  { title: "Reports",       icon: "bar_chart",          key: "reports",      enabled: true  },
];

const adminNavItems = [
  { title: "Settings", icon: "settings", key: "settings", enabled: true },
];

const systemNavItems = [
  { title: "System Audit",     icon: "fact_check",    path: "/app/system/audit"            },
  { title: "Cutover Controls", icon: "tune",          path: "/app/system/cutover-controls" },
  { title: "System Health",    icon: "monitor_heart", path: "/app/system/health"           },
  { title: "System Rollout",   icon: "rocket_launch", path: "/app/system/rollout"          },
  { title: "Reconciliation",   icon: "verified_user", path: "/app/system/reconciliation"   },
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
        collapsed ? "justify-center px-2 py-3" : "gap-3 px-4 py-2.5"
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
function SectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) {
    return <div className="h-px bg-[rgba(228,190,180,0.25)] mx-2 my-2" />;
  }
  return (
    <div className="px-4 pt-4 pb-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#907067]">
        {label}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  Main Component
// ═══════════════════════════════════════════════════════
export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { canAccessAdmin, canAccessCatalog, canAccessPos, highestRole } = usePermissions();

  // Collapse state with localStorage persistence
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("ia-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem("ia-sidebar-collapsed", String(next)); } catch { /* */ }
  };

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
        if (item.key === "catalog" && !canAccessCatalog)       return false;
        if (item.key === "pos"     && !canAccessPos)           return false;
        if (item.key === "returns" && !canAccessPos)           return false;
        return item.enabled || item.key === "dashboard";
      });
  }, [appBasePath, canAccessCatalog, canAccessPos, highestRole]);

  const resolvedAdminItems = useMemo(() =>
    adminNavItems
      .filter((i) => i.enabled)
      .map((item) => ({ ...item, path: `${appBasePath}/${item.key}` })),
    [appBasePath]
  );

  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : "??";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen flex flex-col bg-white z-50",
        "border-r border-[rgba(228,190,180,0.22)] transition-all duration-200 ease-in-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* ── Brand header ── */}
      <div
        className={cn(
          "h-16 flex items-center shrink-0",
          "border-b border-[rgba(228,190,180,0.22)]",
          collapsed ? "justify-center px-2" : "px-4 gap-3"
        )}
      >
        <div className="w-8 h-8 bg-[#ff5722] flex items-center justify-center rounded-sm shrink-0">
          <span
            className="material-symbols-outlined text-white"
            style={{ fontSize: "18px", fontVariationSettings: "'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24" }}
          >
            precision_manufacturing
          </span>
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
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2" style={{ scrollbarWidth: "none" }}>
        <SectionLabel label="Main Menu" collapsed={collapsed} />
        {resolvedMainItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            title={item.title}
            isActive={location.pathname === item.path || location.pathname.startsWith(item.path + "/")}
            onClick={() => navigate(item.path)}
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
                onClick={() => navigate(item.path)}
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
                onClick={() => navigate(item.path)}
                collapsed={collapsed}
              />
            ))}
          </>
        )}
      </nav>

      {/* ── New Sale CTA (only expanded) ── */}
      {!collapsed && (
        <div className="px-3 pt-2 pb-0 border-t border-[rgba(228,190,180,0.22)]">
          <button
            onClick={() => navigate(`${appBasePath}/pos`)}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2 px-4 rounded-sm",
              "bg-[#ff5722] text-white",
              "text-[10px] font-bold uppercase tracking-widest",
              "hover:bg-[#e04a1e] active:scale-[0.97] transition-all duration-150"
            )}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px", fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20" }}>
              add_circle
            </span>
            New Sale
          </button>
        </div>
      )}

      {/* ── User row ── */}
      <div
        className={cn(
          "border-t border-[rgba(228,190,180,0.22)] shrink-0",
          collapsed ? "p-2" : "p-3"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3 rounded-sm",
            "hover:bg-[#f3f3f3] transition-colors duration-150 group",
            collapsed ? "justify-center p-2" : "px-2 py-2"
          )}
          title={collapsed ? `${user?.first_name} ${user?.last_name}\n${user?.email}` : undefined}
        >
          {/* Initials avatar */}
          <div className="w-7 h-7 rounded-full bg-[#ff5722] flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
            {initials}
          </div>

          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#1a1c1c] truncate leading-none">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[10px] text-[#546067] truncate mt-0.5">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Sign out"
                className={cn(
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  "text-[#546067] hover:text-[#ba1a1a] cursor-pointer"
                )}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                  logout
                </span>
              </button>
            </>
          )}
        </div>

        {collapsed && (
          <button
            onClick={handleLogout}
            title="Sign out"
            className="w-full flex justify-center py-1.5 mt-1 text-[#546067] hover:text-[#ba1a1a] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>logout</span>
          </button>
        )}
      </div>

      {/* ── Collapse toggle pin ── */}
      <button
        onClick={toggleCollapse}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={cn(
          "absolute -right-3 top-[4.75rem] z-20",
          "w-6 h-6 bg-white border border-[rgba(228,190,180,0.3)] rounded-full",
          "flex items-center justify-center shadow-sm cursor-pointer",
          "text-[#546067] hover:text-[#ff5722] hover:border-[#ff5722]",
          "transition-colors duration-150"
        )}
      >
        <span
          className={cn("material-symbols-outlined transition-transform duration-200", collapsed && "rotate-180")}
          style={{ fontSize: "14px" }}
        >
          chevron_left
        </span>
      </button>
    </aside>
  );
}