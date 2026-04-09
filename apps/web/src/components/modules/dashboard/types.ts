import type { DashboardSnapshot } from "@/services/modules/dashboard.service";

export type DashboardVariant = "admin" | "staff";

export type DashboardSummary = DashboardSnapshot["summary"];
export type WeeklySales = DashboardSnapshot["weeklySales"];
export type CategorySales = DashboardSnapshot["categorySales"];
export type HourlySales = DashboardSnapshot["hourlySales"];
export type TopProducts = DashboardSnapshot["topProducts"];
export type InventoryAlerts = DashboardSnapshot["inventoryAlerts"];
export type MovementInsights = DashboardSnapshot["movementInsights"];
export type TopCashiers = DashboardSnapshot["topCashiers"];
export type PaymentMix = DashboardSnapshot["paymentMix"];
export type RecentTransactions = DashboardSnapshot["recentTransactions"];
