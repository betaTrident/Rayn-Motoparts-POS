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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main id="main-content" className="flex-1 overflow-auto p-6" tabIndex={-1}>
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
