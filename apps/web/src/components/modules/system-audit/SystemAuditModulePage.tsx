import { useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
import { useSystemAuditLogs } from "@/hooks/modules/useSystemAudit";

const PAGE_SIZE = 20;

export default function SystemAuditModulePage() {
  const [searchValue, setSearchValue] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [actionFilter, setActionFilter] = useState<"" | "INSERT" | "UPDATE" | "DELETE">("");
  const [page, setPage] = useState(1);

  const queryInput = useMemo(
    () => ({
      q: appliedSearch,
      table: tableFilter,
      action: actionFilter,
      page,
      pageSize: PAGE_SIZE,
    }),
    [actionFilter, appliedSearch, page, tableFilter]
  );

  const auditQuery = useSystemAuditLogs(queryInput);

  function applySearch() {
    setPage(1);
    setAppliedSearch(searchValue.trim());
  }

  if (auditQuery.isLoading) {
    return <PageLoadingState label="Loading system audit logs..." />;
  }

  if (auditQuery.isError || !auditQuery.data) {
    return (
      <PageErrorState
        title="Unable to load system audit logs"
        description="Please check your connection and try again."
        onRetry={() => auditQuery.refetch()}
      />
    );
  }

  const { results, pagination, filters } = auditQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Audit"
        description="Trace critical system changes and reconciliation-related operations"
        actions={
          <Badge variant="outline" className="gap-1">
            <ClipboardList className="size-3.5" /> {pagination.total} records
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2 flex gap-2">
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search table, record id, user email"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applySearch();
                }
              }}
            />
            <Button onClick={applySearch} className="gap-1">
              <Search className="size-4" /> Search
            </Button>
          </div>

          <select
            value={tableFilter}
            onChange={(event) => {
              setPage(1);
              setTableFilter(event.target.value);
            }}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All tables</option>
            {filters.tables.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </select>

          <select
            value={actionFilter}
            onChange={(event) => {
              setPage(1);
              setActionFilter(event.target.value as "" | "INSERT" | "UPDATE" | "DELETE");
            }}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All actions</option>
            {filters.actions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit records matched your filter.</p>
          ) : (
            results.map((entry) => (
              <div key={entry.id} className="rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{entry.action}</Badge>
                    <p className="text-sm font-medium">{entry.tableName}</p>
                    <p className="text-xs text-muted-foreground">PK: {entry.recordPk}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
                  <p>
                    User: {entry.changedBy.email || entry.changedBy.username || "System"}
                  </p>
                  <p>IP: {entry.ipAddress || "-"}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages || 1}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPrevious}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!pagination.hasNext}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
