import api from "@/services/api.service";
import { ENDPOINTS } from "@/services/endpoints.service";

export type HealthCheckStatus = "healthy" | "degraded";

export interface SystemHealthSnapshot {
  status: HealthCheckStatus;
  checks: Array<{
    name: string;
    status: HealthCheckStatus;
    message: string;
  }>;
  metrics: {
    usersTotal: number;
    usersActive: number;
    productsActive: number;
    customersActive: number;
    openCashSessions: number;
    pendingTransactions: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
}

export async function fetchSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  const { data } = await api.get<SystemHealthSnapshot>(ENDPOINTS.system.health);
  return data;
}
