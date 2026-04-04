import {
  getDashboardSnapshot,
  type DashboardSnapshot,
} from "@/services/dashboardService.service";

export type { DashboardSnapshot };

export interface DashboardSnapshotQuery {
  days?: number;
}

export async function fetchDashboardSnapshot(
  query?: DashboardSnapshotQuery
): Promise<DashboardSnapshot> {
  return getDashboardSnapshot(query);
}
