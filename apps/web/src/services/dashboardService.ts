import api from "@/services/api";
import { ENDPOINTS } from "@/services/endpoints";

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  name: string;
  category: string;
  sold: number;
  revenue: number;
}

export interface RecentTransaction {
  id: string;
  time: string;
  items: number;
  total: number;
  paymentMethod: "Cash" | "GCash" | "Card";
  status: "Completed" | "Refunded";
}

export interface CategorySale {
  category: string;
  revenue: number;
  fill: string;
}

export interface HourlySales {
  hour: string;
  orders: number;
}

export interface InventoryAlertItem {
  variantSku: string;
  productName: string;
  warehouseCode: string;
  qtyAvailable: number;
  reorderPoint: number;
}

export interface MovementInsightItem {
  variantSku: string;
  productName: string;
  category: string;
  sold: number;
  revenue: number;
}

export interface CashierPerformanceItem {
  cashierId: number;
  name: string;
  orders: number;
  revenue: number;
  avgOrderValue: number;
}

export interface PaymentMixItem {
  method: "Cash" | "GCash" | "Card";
  amount: number;
  percentage: number;
}

export interface SummaryStats {
  todayRevenue: number;
  todayOrders: number;
  avgOrderValue: number;
  itemsSold: number;
  revenueChange: number;
  ordersChange: number;
  avgOrderChange: number;
  itemsSoldChange: number;
}

export interface DashboardSnapshot {
  meta: {
    days: number;
    startDate: string;
    endDate: string;
    warehouseId: number | null;
  };
  summary: SummaryStats;
  weeklySales: DailySales[];
  topProducts: TopProduct[];
  recentTransactions: RecentTransaction[];
  categorySales: CategorySale[];
  hourlySales: HourlySales[];
  inventoryAlerts: {
    lowStock: InventoryAlertItem[];
    outOfStock: InventoryAlertItem[];
  };
  movementInsights: {
    fastMoving: MovementInsightItem[];
    slowMoving: MovementInsightItem[];
  };
  topCashiers: CashierPerformanceItem[];
  paymentMix: PaymentMixItem[];
}

export interface DashboardWarehouse {
  id: number;
  code: string;
  name: string;
}

interface DashboardQuery {
  days?: number;
  warehouseId?: number;
}

export async function getDashboardSnapshot(query?: DashboardQuery): Promise<DashboardSnapshot> {
  const params: Record<string, string> = {};
  if (query?.days) {
    params.days = String(query.days);
  }
  if (query?.warehouseId) {
    params.warehouse_id = String(query.warehouseId);
  }

  const { data } = await api.get<DashboardSnapshot>(ENDPOINTS.pos.dashboard, { params });
  return data;
}

export async function getDashboardWarehouses(): Promise<DashboardWarehouse[]> {
  const { data } = await api.get<DashboardWarehouse[]>(ENDPOINTS.pos.warehouses);
  return data;
}
