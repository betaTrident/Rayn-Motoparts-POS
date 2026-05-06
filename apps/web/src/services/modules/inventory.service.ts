import api from "@/services/api.service";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface InventoryCategoryOption {
  id: number;
  name: string;
}

export interface InventoryPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface InventoryStockRow {
  id: number;
  variant_id: number;
  variant_sku: string;
  product_name: string;
  category: string;
  qty_on_hand: number;
  qty_reserved: number;
  qty_available: number;
  reorder_point: number;
  reorder_qty: number;
  max_stock_level: number | null;
  avg_cost: number;
  status: StockStatus;
  last_counted_at: string | null;
}

export interface InventoryStockSummary {
  total_variants_tracked: number;
  in_stock_count: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_stock_value: number;
}

export interface StockMovementRow {
  id: number;
  variant_sku: string;
  product_name: string;
  movement_type: string;
  reference_type: string;
  reference_id: number;
  qty_before: number;
  qty_change: number;
  qty_after: number;
  performed_by: string;
  created_at: string;
}

export interface InventoryStockParams {
  search?: string;
  status?: StockStatus | "all";
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface StockMovementParams {
  variant_sku?: string;
  movement_type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
}

export interface InventoryStockResponse {
  results: InventoryStockRow[];
  categories: InventoryCategoryOption[];
  pagination: InventoryPagination;
}

export interface StockMovementResponse {
  results: StockMovementRow[];
  movementTypes: string[];
  pagination: InventoryPagination;
}

export interface StockAdjustPayload {
  variant_id: number;
  adjustment_type: "add" | "subtract";
  quantity: number;
  reason: string;
  notes?: string;
}

export interface StockConfigurePayload {
  reorder_point: number;
  reorder_qty: number;
  max_stock_level?: number | null;
}

function compactParams(params: Record<string, string | number | undefined>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== "")
  );
}

export async function fetchInventorySummary(): Promise<InventoryStockSummary> {
  const { data } = await api.get<InventoryStockSummary>("inventory/stock/summary/");
  return data;
}

export async function fetchInventoryStock(
  params: InventoryStockParams = {}
): Promise<InventoryStockResponse> {
  const { data } = await api.get<InventoryStockResponse>("inventory/stock/", {
    params: compactParams({
      search: params.search,
      status: params.status && params.status !== "all" ? params.status : undefined,
      category: params.category && params.category !== "all" ? params.category : undefined,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 500,
    }),
  });
  return data;
}

export async function fetchStockByVariantId(variantId: number): Promise<InventoryStockRow> {
  const { data } = await api.get<InventoryStockResponse>("inventory/stock/", {
    params: compactParams({
      variant_id: variantId,
      page_size: 1,
    }),
  });
  const row = data.results[0];
  if (!row) {
    throw new Error(`No stock row found for variant ${variantId}`);
  }
  if (row.variant_id !== variantId) {
    throw new Error(`Mismatched stock row returned for variant ${variantId}`);
  }
  return row;
}

export async function fetchStockMovements(
  params: StockMovementParams = {}
): Promise<StockMovementResponse> {
  const { data } = await api.get<StockMovementResponse>("inventory/movements/", {
    params: compactParams({
      variant_sku: params.variant_sku,
      movement_type:
        params.movement_type && params.movement_type !== "all"
          ? params.movement_type
          : undefined,
      date_from: params.date_from,
      date_to: params.date_to,
      page: params.page ?? 1,
      page_size: params.pageSize ?? 500,
    }),
  });
  return data;
}

export async function adjustStock(payload: StockAdjustPayload) {
  const { data } = await api.post("inventory/adjust/", payload);
  return data;
}

export async function configureStock(id: number, payload: StockConfigurePayload) {
  const { data } = await api.patch<InventoryStockRow>(
    `inventory/stock/${id}/configure/`,
    payload
  );
  return data;
}
