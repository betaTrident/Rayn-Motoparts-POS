import { Outlet } from "react-router";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import AppHeader from "@/components/layout/AppHeader";

/**
 * MainLayout — the shell for all authenticated pages.
 *
 * STRUCTURE:
 * ┌──────────┬──────────────────────────────┐
 * │          │  Header (breadcrumb, toggle) │
 * │ Sidebar  ├──────────────────────────────┤
 * │ (nav +   │                              │
 * │  user    │  <Outlet />                  │
 * │  menu)   │  (page content renders here) │
 * │          │                              │
 * └──────────┴──────────────────────────────┘
 *
 * <Outlet /> renders whichever child route is active
 * (Dashboard, POS, Products, etc.)
 */
export default function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
