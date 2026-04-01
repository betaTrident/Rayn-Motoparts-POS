// ──────────────────────────────────────────────
// Dashboard mock data — simulates POS analytics
// Replace with real API calls once endpoints exist
// ──────────────────────────────────────────────

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

export interface SummaryStats {
  todayRevenue: number;
  todayOrders: number;
  avgOrderValue: number;
  itemsSold: number;
  revenueChange: number;   // % vs yesterday
  ordersChange: number;
  avgOrderChange: number;
  itemsSoldChange: number;
}

// ── Summary KPI cards ──
export function getSummaryStats(): SummaryStats {
  return {
    todayRevenue: 12_480,
    todayOrders: 87,
    avgOrderValue: 143.45,
    itemsSold: 214,
    revenueChange: 12.5,
    ordersChange: 8.2,
    avgOrderChange: 3.8,
    itemsSoldChange: 15.1,
  };
}

// ── Weekly sales (last 7 days) ──
export function getWeeklySales(): DailySales[] {
  return [
    { date: "Mon", revenue: 9_240, orders: 64 },
    { date: "Tue", revenue: 8_680, orders: 59 },
    { date: "Wed", revenue: 11_350, orders: 78 },
    { date: "Thu", revenue: 10_920, orders: 75 },
    { date: "Fri", revenue: 14_610, orders: 102 },
    { date: "Sat", revenue: 16_780, orders: 118 },
    { date: "Sun", revenue: 12_480, orders: 87 },
  ];
}

// ── Top-selling products ──
export function getTopProducts(): TopProduct[] {
  return [
    { name: "LED Headlight Bulb", category: "Accessories", sold: 38, revenue: 5_700 },
    { name: "Brake Pad Set", category: "Engine Parts", sold: 32, revenue: 3_520 },
    { name: "4T Engine Oil 1L", category: "Lubricants", sold: 27, revenue: 4_320 },
    { name: "Chain Sprocket Kit", category: "Engine Parts", sold: 24, revenue: 3_360 },
    { name: "Tire Valve Set", category: "Tires", sold: 22, revenue: 1_980 },
    { name: "Phone Mount", category: "Accessories", sold: 18, revenue: 2_700 },
  ];
}

// ── Recent transactions ──
export function getRecentTransactions(): RecentTransaction[] {
  return [
    { id: "TXN-0087", time: "2:45 PM", items: 3, total: 385, paymentMethod: "GCash", status: "Completed" },
    { id: "TXN-0086", time: "2:32 PM", items: 1, total: 150, paymentMethod: "Cash", status: "Completed" },
    { id: "TXN-0085", time: "2:18 PM", items: 4, total: 520, paymentMethod: "Card", status: "Completed" },
    { id: "TXN-0084", time: "2:05 PM", items: 2, total: 290, paymentMethod: "Cash", status: "Completed" },
    { id: "TXN-0083", time: "1:51 PM", items: 1, total: 160, paymentMethod: "GCash", status: "Refunded" },
    { id: "TXN-0082", time: "1:38 PM", items: 3, total: 440, paymentMethod: "GCash", status: "Completed" },
    { id: "TXN-0081", time: "1:22 PM", items: 2, total: 310, paymentMethod: "Cash", status: "Completed" },
  ];
}

// ── Sales by category (pie/donut chart) ──
export function getCategorySales(): CategorySale[] {
  return [
    { category: "Engine Parts", revenue: 6_880, fill: "var(--color-engine-parts)" },
    { category: "Accessories", revenue: 5_700, fill: "var(--color-accessories)" },
    { category: "Lubricants", revenue: 4_320, fill: "var(--color-lubricants)" },
    { category: "Tires", revenue: 4_680, fill: "var(--color-tires)" },
    { category: "Others", revenue: 900, fill: "var(--color-others)" },
  ];
}

// ── Hourly order distribution (today) ──
export function getHourlySales(): HourlySales[] {
  return [
    { hour: "7AM", orders: 4 },
    { hour: "8AM", orders: 12 },
    { hour: "9AM", orders: 18 },
    { hour: "10AM", orders: 14 },
    { hour: "11AM", orders: 10 },
    { hour: "12PM", orders: 8 },
    { hour: "1PM", orders: 9 },
    { hour: "2PM", orders: 7 },
    { hour: "3PM", orders: 5 },
  ];
}
