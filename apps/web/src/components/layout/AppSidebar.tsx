import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  RotateCcw,
  BarChart3,
  Activity,
  Rocket,
  ShieldCheck,
  Receipt,
  Users,
  Settings,
  LogOut,
  ChevronUp,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
    title: "Catalog",
    icon: Package,
    key: "catalog",
    enabled: true,
  },
  {
    title: "Customers",
    icon: Users,
    key: "customers",
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
  {
    title: "Reports",
    icon: BarChart3,
    key: "reports",
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
  const { user, logout } = useAuth();
  const { canAccessAdmin, canAccessCatalog, canAccessPos, highestRole } = usePermissions();
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
        if (highestRole === "staff" && item.key === "catalog") {
          return false;
        }
        if (item.key === "catalog" && !canAccessCatalog) {
          return false;
        }
        if (item.key === "pos" && !canAccessPos) {
          return false;
        }
        if (item.key === "returns" && !canAccessPos) {
          return false;
        }
        if (highestRole === "staff" && item.key === "reports") {
          return false;
        }
        return item.enabled || item.key === "dashboard";
      });
  }, [appBasePath, canAccessCatalog, canAccessPos, highestRole]);

  const resolvedAdminItems = useMemo(() => {
    return adminNavItems.map((item) => ({
      ...item,
      path: `${appBasePath}/${item.key}`,
    }));
  }, [appBasePath]);

  // Get user initials for the avatar fallback
  const initials = user
    ? `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase()
    : "??";

  return (
    <Sidebar collapsible="icon">
      {/* ── Sidebar Header: Logo ── */}
      <SidebarHeader className="h-14 border-b border-sidebar-border py-0 justify-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => navigate(`${appBasePath}/dashboard`)}
              className="cursor-pointer"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white/15">
                <img
                  src={RaynLogo}
                  alt="Rayn Motorparts and accessories"
                  className="size-5 object-contain"
                />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-sm">Admin</span>
                <span className="text-xs text-sidebar-foreground/60">
                  Ansel Ray Tapales
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Sidebar Content: Navigation ── */}
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {resolvedMainItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.path}
                    tooltip={item.title}
                    onClick={() => navigate(item.path)}
                    className="cursor-pointer"
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
                      className="cursor-pointer"
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
                      className="cursor-pointer"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-white/20 text-white text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none text-left">
                    <span className="truncate text-sm font-medium">
                      {user?.first_name} {user?.last_name}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`${appBasePath}/dashboard`)}>
                  <Settings className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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