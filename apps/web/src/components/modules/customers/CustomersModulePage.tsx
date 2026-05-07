import { useDeferredValue, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, Users, X, UserCheck, UserMinus, Eye, ChevronLeft, ChevronRight} from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableSkeleton } from "@/components/ui/skeletons/DataTableSkeleton";
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
      <div className="min-w-52">
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
      <span className="block max-w-56 truncate">{row.original.email || "-"}</span>
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
        <StatCard
          label="Total Customers"
          value={totalsQuery.data?.pagination.totalCount ?? 0}
          icon={Users}
          accent="primary"
          isLoading={totalsQuery.isLoading}
        />
        <StatCard
          label="Active Customers"
          value={activeCountQuery.data?.pagination.totalCount ?? 0}
          icon={UserCheck}
          accent="green"
          isLoading={activeCountQuery.isLoading}
        />
        <StatCard
          label="Inactive Customers"
          value={inactiveCountQuery.data?.pagination.totalCount ?? 0}
          icon={UserMinus}
          accent="amber"
          isLoading={inactiveCountQuery.isLoading}
        />
        <StatCard
          label="Visible This Page"
          value={results.length}
          icon={Eye}
          accent="blue"
          isLoading={customersQuery.isLoading}
        />
      </div>

      {customersQuery.isError ? (
        <PageErrorState
          title="Unable to load customers"
          description="Please check your connection and try again."
          onRetry={() => customersQuery.refetch()}
        />
      ) : customersQuery.isLoading ? (
        <DataTableSkeleton columnCount={6} rowCount={10} />
      ) : (
        <DataTable
          columns={customerColumns}
          data={results}
          isLoading={customersQuery.isLoading}
          enablePagination={false}
          toolbar={toolbar}
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
            <div className="rounded-md border border-border/70 bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="bg-primary/8 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Users className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{row.fullName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{row.customerCode}</p>
                  </div>
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
                <div className="text-muted-foreground text-[12px]">
                  Showing page <span className="font-medium text-foreground">{pagination.page}</span> of{" "}
                  <span className="font-medium text-foreground">{pagination.totalPages}</span> (
                  <span className="font-medium text-foreground">{pagination.totalCount}</span> total)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrevious}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="h-8 gap-1 px-2 text-[12px]"
                  >
                    <ChevronLeft className="size-3.5" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNext}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="h-8 gap-1 px-2 text-[12px]"
                  >
                    Next
                    <ChevronRight className="size-3.5" />
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

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  isLoading = false,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: "primary" | "green" | "amber" | "blue";
  isLoading?: boolean;
}) {
  const colors = {
    primary: "bg-primary/10 text-primary border-primary/20",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-900",
    amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-900",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900",
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-none shadow-sm ring-1 ring-border">
        <CardContent className="p-4 flex items-center gap-4">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-none shadow-sm ring-1 ring-border">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
          colors[accent]
        )}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-tight text-foreground leading-none">
            {value}
          </p>
          <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 truncate">
            {label}
          </p>
        </div>
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
