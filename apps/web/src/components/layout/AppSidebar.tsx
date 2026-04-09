import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  RotateCcw,
  Activity,
  ClipboardList,
  Rocket,
  SlidersHorizontal,
  ShieldCheck,
  Receipt,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import RaynLogo from "@/assets/RaynLogo.svg";

// ── Navigation Items ──
const mainNavItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    key: "dashboard",
    enabled: true,
  },
  {
    title: "Point of Sale",
    icon: ShoppingCart,
    key: "pos",
    enabled: true,
  },
  {
    title: "Inventory",
    icon: Package,
    key: "inventory",
    enabled: true,
  },
  {
    title: "Transactions",
    icon: Receipt,
    key: "transactions",
    enabled: true,
  },
  {
    title: "Returns",
    icon: RotateCcw,
    key: "returns",
    enabled: true,
  },
];

const adminNavItems = [
  {
    title: "Staff Management",
    icon: Users,
    key: "staff",
    enabled: false,
  },
  {
    title: "Settings",
    icon: Settings,
    key: "settings",
    enabled: true,
  },
];

const systemNavItems = [
  {
    title: "System Audit",
    icon: ClipboardList,
    path: "/app/system/audit",
  },
  {
    title: "Cutover Controls",
    icon: SlidersHorizontal,
    path: "/app/system/cutover-controls",
  },
  {
    title: "System Health",
    icon: Activity,
    path: "/app/system/health",
  },
  {
    title: "System Rollout",
    icon: Rocket,
    path: "/app/system/rollout",
  },
  {
    title: "Reconciliation",
    icon: ShieldCheck,
    path: "/app/system/reconciliation",
  },
];

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { canAccessAdmin, canAccessPos, highestRole } = usePermissions();
  const { state, toggleSidebar } = useSidebar();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const appBasePath = highestRole === "staff" ? "/app/staff" : "/app/admin";

  const resolvedMainItems = useMemo(() => {
    return mainNavItems
      .map((item) => ({
        ...item,
        path: `${appBasePath}/${item.key}`,
      }))
      .filter((item) => {
        if (item.key === "pos" && !canAccessPos) {
          return false;
        }
        if (item.key === "returns" && !canAccessPos) {
          return false;
        }
        return item.enabled || item.key === "dashboard";
      });
  }, [appBasePath, canAccessPos, highestRole]);

  const resolvedAdminItems = useMemo(() => {
    return adminNavItems.map((item) => ({
      ...item,
      path: `${appBasePath}/${item.key}`,
    }));
  }, [appBasePath]);

  return (
    <Sidebar collapsible="icon">
      {/* ── Sidebar Header: Logo ── */}
      <SidebarHeader className="h-16 border-b border-sidebar-border/80 px-3 py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => navigate(`${appBasePath}/dashboard`)}
              className="h-12 cursor-pointer rounded-xl border border-sidebar-border/80 px-3"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <img
                  src={RaynLogo}
                  alt="Rayn Motorparts and accessories"
                  className="size-5 object-contain"
                />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-sm text-sidebar-foreground">Rayn Motorparts</span>
                <span className="text-xs text-sidebar-foreground/60">Operations Console</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Sidebar Content: Navigation ── */}
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup className="pt-4">
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resolvedMainItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.path}
                    tooltip={item.title}
                    onClick={() => navigate(item.path)}
                    className="h-10 cursor-pointer rounded-xl border border-transparent px-3 text-slate-600 transition-colors hover:border-sidebar-border hover:bg-slate-100 hover:text-slate-900 data-[active=true]:border-slate-900 data-[active=true]:bg-slate-900 data-[active=true]:text-white"
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Navigation */}
        {canAccessAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {resolvedAdminItems.map((item) => (
                  !item.enabled ? null : (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.path}
                      tooltip={item.title}
                      onClick={() => navigate(item.path)}
                      className="h-10 cursor-pointer rounded-xl border border-transparent px-3 text-slate-600 transition-colors hover:border-sidebar-border hover:bg-slate-100 hover:text-slate-900 data-[active=true]:border-slate-900 data-[active=true]:bg-slate-900 data-[active=true]:text-white"
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  )
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {highestRole === "superadmin" && (
          <SidebarGroup>
            <SidebarGroupLabel>System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemNavItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.path}
                      tooltip={item.title}
                      onClick={() => navigate(item.path)}
                      className="h-10 cursor-pointer rounded-xl border border-transparent px-3 text-slate-600 transition-colors hover:border-sidebar-border hover:bg-slate-100 hover:text-slate-900 data-[active=true]:border-slate-900 data-[active=true]:bg-slate-900 data-[active=true]:text-white"
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ── Sidebar Footer: User Menu ── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="h-10 cursor-pointer rounded-xl border border-sidebar-border/80 px-3 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* ── Edge Toggle Button ── */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
        className="absolute -right-3 top-4 z-20 hidden size-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground md:flex"
      >
        <ChevronLeft
          className={cn(
            "size-3 transition-transform duration-200",
            state === "collapsed" && "rotate-180"
          )}
        />
      </button>
    </Sidebar>
  );
}