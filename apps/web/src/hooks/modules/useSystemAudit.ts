import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/services/query/queryKeys";
import {
  fetchSystemAuditLogs,
  type SystemAuditLogQueryInput,
  type SystemAuditLogResponse,
} from "@/services/modules/systemAudit.service";

export function useSystemAuditLogs(input: SystemAuditLogQueryInput) {
  return useQuery<SystemAuditLogResponse>({
    queryKey: queryKeys.system.audit(input),
    queryFn: () => fetchSystemAuditLogs(input),
    refetchInterval: 30_000,
  });
}
