import api from "@/services/api.service";
import { ENDPOINTS } from "@/services/endpoints.service";

export interface SystemAuditLogQueryInput {
  q?: string;
  table?: string;
  action?: "INSERT" | "UPDATE" | "DELETE" | "";
  page?: number;
  pageSize?: number;
}

export interface SystemAuditLogEntry {
  id: number;
  tableName: string;
  recordPk: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  changedBy: {
    id: number | null;
    username: string | null;
    email: string | null;
  };
  ipAddress: string | null;
  createdAt: string;
}

export interface SystemAuditLogResponse {
  results: SystemAuditLogEntry[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: {
    actions: Array<"INSERT" | "UPDATE" | "DELETE">;
    tables: string[];
  };
}

export async function fetchSystemAuditLogs(
  input: SystemAuditLogQueryInput = {}
): Promise<SystemAuditLogResponse> {
  const { data } = await api.get<SystemAuditLogResponse>(ENDPOINTS.system.audit, {
    params: {
      q: input.q || undefined,
      table: input.table || undefined,
      action: input.action || undefined,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20,
    },
  });

  return data;
}
