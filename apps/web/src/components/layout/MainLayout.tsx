import { useState } from "react";
import { Outlet } from "react-router";
import AppSidebar from "@/components/layout/AppSidebar";
import AppHeader from "@/components/layout/AppHeader";
import { cn } from "@/lib/utils";

/**
 * MainLayout — the shell for all authenticated pages.
 *
 * STRUCTURE:
 * ┌──────────────┬──────────────────────────────────┐
 * │              │  TopBar (glassmorphism header)    │
 * │  AppSidebar  ├──────────────────────────────────┤
 * │  (fixed,     │  <Outlet />                      │
 * │   Industrial │  (page canvas: bg-[#f9f9f9])     │
 * │   Atelier)   │                                  │
 * └──────────────┴──────────────────────────────────┘
 *
 * Sidebar collapse state is lifted here so AppHeader
 * can adjust its left-offset in sync.
 */
export default function MainLayout() {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("ia-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("ia-sidebar-collapsed", String(next));
    } catch {
      /* ignore */
    }
  };

  // Sync content margin with sidebar width
  const contentOffset = collapsed ? "lg:ml-16" : "lg:ml-64";

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      {/* Skip navigation for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-sm focus:bg-[#ff5722] focus:px-3 focus:py-2 focus:text-white focus:text-xs focus:font-bold"
      >
        Skip to main content
      </a>

      {/* Mobile Backdrop Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Fixed sidebar */}
      <AppSidebar 
        mobileOpen={mobileSidebarOpen} 
        onMobileClose={() => setMobileSidebarOpen(false)}
        collapsed={collapsed}
        onToggle={toggleSidebar}
      />

      {/* Content shell (offset matches sidebar width) */}
      <div className={cn("transition-all duration-200 ease-in-out", contentOffset)}>
        {/* Fixed top bar */}
        <AppHeader 
          sidebarCollapsed={collapsed} 
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* Page canvas: starts below the 64px header */}
        <main
          id="main-content"
          className="pt-16 min-h-screen"
          tabIndex={-1}
        >
          <div className="p-4 sm:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
