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
  "/app/admin/dashboard": "Dashboard",
  "/app/admin/pos": "Point of Sale",
  "/app/admin/catalog": "Catalog",
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
  const pageTitle = pageTitles[location.pathname] ?? toTitleFromPath(location.pathname);

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
