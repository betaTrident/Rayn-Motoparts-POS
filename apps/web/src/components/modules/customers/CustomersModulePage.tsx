import { useState } from "react";
import { Users } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomers } from "@/hooks/modules/useCustomers";

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

export default function CustomersModulePage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<"all" | "active" | "inactive">("all");
  const [page, setPage] = useState(1);

  const customersQuery = useCustomers({
    q,
    active,
    page,
    pageSize: 20,
  });

  const results = customersQuery.data?.results ?? [];
  const pagination = customersQuery.data?.pagination;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Customer directory from the dedicated customers API"
      />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px]">
            <Input
              value={q}
              onChange={(event) => {
                setQ(event.target.value);
                setPage(1);
              }}
              placeholder="Search customer name"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant={active === "all" ? "default" : "outline"}
                onClick={() => {
                  setActive("all");
                  setPage(1);
                }}
              >
                All
              </Button>
              <Button
                type="button"
                variant={active === "active" ? "default" : "outline"}
                onClick={() => {
                  setActive("active");
                  setPage(1);
                }}
              >
                Active
              </Button>
              <Button
                type="button"
                variant={active === "inactive" ? "default" : "outline"}
                onClick={() => {
                  setActive("inactive");
                  setPage(1);
                }}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {customersQuery.isLoading ? (
        <PageLoadingState label="Loading customers..." />
      ) : customersQuery.isError ? (
        <PageErrorState
          title="Unable to load customers"
          description="Please check your connection and try again."
          onRetry={() => customersQuery.refetch()}
        />
      ) : results.length === 0 ? (
        <PageEmptyState
          icon={Users}
          title="No customers found"
          description="Try adjusting search or status filters."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Addresses</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.fullName}</TableCell>
                      <TableCell>{row.customerCode}</TableCell>
                      <TableCell>{row.phone || "-"}</TableCell>
                      <TableCell>{row.email || "-"}</TableCell>
                      <TableCell className="text-right">{row.addressCount}</TableCell>
                      <TableCell>{row.isActive ? "Active" : "Inactive"}</TableCell>
                      <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {pagination && (
              <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
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
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
