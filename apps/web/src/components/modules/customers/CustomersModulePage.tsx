import { useDeferredValue, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, Users, X } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { useCustomers } from "@/hooks/modules/useCustomers";
import { cn } from "@/lib/utils";
import type { CustomerRow } from "@/services/modules/customers.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  PageEmptyState,
  PageErrorState,
} from "@/components/ui/page-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatDateTime(value: string): string {
  const date = new Date(value);
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const customerColumns: ColumnDef<CustomerRow>[] = [
  {
    accessorKey: "fullName",
    header: "Customer",
    cell: ({ row }) => (
      <div className="min-w-[13rem]">
        <p className="text-[13px] font-semibold">{row.original.fullName}</p>
        <p className="mt-1 text-xs text-muted-foreground">{row.original.customerCode}</p>
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.original.phone || "-",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="block max-w-[14rem] truncate">{row.original.email || "-"}</span>
    ),
  },
  {
    accessorKey: "addressCount",
    header: () => <span className="text-right">Addresses</span>,
    cell: ({ row }) => row.original.addressCount,
    meta: { headerClassName: "text-right", cellClassName: "text-right tabular-nums" },
  },
  {
    accessorKey: "isActive",
    header: () => <span className="text-center">Status</span>,
    cell: ({ row }) => (
      <div className="text-center">
        <Badge
          variant="outline"
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            row.original.isActive
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
          )}
        >
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>
    ),
    meta: { headerClassName: "text-center", cellClassName: "text-center" },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {formatDateTime(row.original.createdAt)}
      </span>
    ),
  },
];

export default function CustomersModulePage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);
  const deferredQuery = useDeferredValue(q);

  const customersQuery = useCustomers({
    q: deferredQuery,
    active,
    page,
    pageSize: 20,
  });
  const totalsQuery = useCustomers({ page: 1, pageSize: 1, active: "all" });
  const activeCountQuery = useCustomers({ page: 1, pageSize: 1, active: "active" });
  const inactiveCountQuery = useCustomers({ page: 1, pageSize: 1, active: "inactive" });

  const results = customersQuery.data?.results ?? [];
  const pagination = customersQuery.data?.pagination;
  const hasActiveFilters = Boolean(q) || active !== "all";

  function clearFilters() {
    setQ("");
    setActive("all");
    setPage(1);
  }

  const toolbar = (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="text-muted-foreground absolute left-3.5 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
          placeholder="Search customer name, code, phone, or email..."
          className="h-9 rounded-md border-border/70 bg-card pl-10 pr-10 text-xs shadow-xs"
        />
        {q ? (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setPage(1);
            }}
            aria-label="Clear customer search"
            className="text-muted-foreground hover:text-foreground absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={active}
          onValueChange={(value) => {
            setActive(value as "all" | "active" | "inactive");
            setPage(1);
          }}
        >
          <SelectTrigger className="h-10 w-40 rounded-lg border-border/70 bg-card text-sm shadow-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-lg">
            <SelectItem value="all">All Customers</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters ? (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="h-10 rounded-lg border-border/70 bg-card px-3 text-sm"
          >
            <X className="mr-1.5 size-3.5" />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Customer directory sourced from the dedicated customers API"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Customers" value={totalsQuery.data?.pagination.totalCount ?? 0} />
        <StatCard label="Active Customers" value={activeCountQuery.data?.pagination.totalCount ?? 0} />
        <StatCard label="Inactive Customers" value={inactiveCountQuery.data?.pagination.totalCount ?? 0} />
        <StatCard label="Visible This Page" value={results.length} />
      </div>

      {customersQuery.isError ? (
        <PageErrorState
          title="Unable to load customers"
          description="Please check your connection and try again."
          onRetry={() => customersQuery.refetch()}
        />
      ) : (
        <DataTable
          columns={customerColumns}
          data={results}
          isLoading={customersQuery.isLoading}
          enablePagination={false}
          toolbar={toolbar}
          loadingState={<span className="text-muted-foreground text-sm">Loading customers...</span>}
          emptyState={
            <PageEmptyState
              icon={Users}
              title={hasActiveFilters ? "No matching customers" : "No customers found"}
              description={
                hasActiveFilters
                  ? "Try adjusting search or status filters."
                  : "Customer records will appear here once they are created."
              }
            />
          }
          mobileCardRenderer={(row) => (
            <div className="rounded-xl border border-border/70 bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{row.fullName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{row.customerCode}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    row.isActive
                      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
                  )}
                >
                  {row.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Metric label="Phone" value={row.phone || "-"} />
                <Metric label="Addresses" value={row.addressCount} />
                <Metric label="Email" value={row.email || "-"} />
                <Metric label="Created" value={formatDateTime(row.createdAt)} />
              </div>
            </div>
          )}
          footer={
            pagination ? (
              <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground">
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrevious}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNext}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null
          }
        />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="py-4">
      <CardContent className="pb-0">
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-muted-foreground mt-1 text-xs">{label}</p>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 truncate">{value}</p>
    </div>
  );
}
