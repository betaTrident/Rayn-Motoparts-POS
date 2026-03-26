import { useLocation } from "react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

// Map route paths to display titles
const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/pos": "Point of Sale",
  "/products": "Products",
  "/transactions": "Transactions",
  "/staff": "Staff Management",
  "/settings": "Settings",
};

export default function AppHeader() {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] ?? "Page";

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      {/* Toggle sidebar on mobile */}
      <SidebarTrigger className="-ml-1 md:hidden" />

      <Separator orientation="vertical" className="mr-2 h-4! md:hidden" />

      {/* Breadcrumb showing current page */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm font-medium">
              {pageTitle}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </header>
  );
}
