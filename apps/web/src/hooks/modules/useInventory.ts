import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  adjustStock,
  configureStock,
  fetchInventoryStock,
  fetchInventorySummary,
  fetchStockMovements,
  type InventoryStockParams,
  type StockAdjustPayload,
  type StockConfigurePayload,
  type StockMovementParams,
} from "@/services/modules/inventory.service";
import { queryKeys } from "@/services/query/queryKeys";

export function useInventorySummary() {
  return useQuery({
    queryKey: queryKeys.inventory.summary,
    queryFn: fetchInventorySummary,
  });
}

export function useInventoryStock(params: InventoryStockParams = {}) {
  return useQuery({
    queryKey: queryKeys.inventory.stock(params),
    queryFn: () => fetchInventoryStock(params),
  });
}

export function useStockMovements(params: StockMovementParams = {}) {
  return useQuery({
    queryKey: queryKeys.inventory.movements(params),
    queryFn: () => fetchStockMovements(params),
  });
}

export function useStockAdjust() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StockAdjustPayload) => adjustStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
  });
}

export function useStockConfigure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: StockConfigurePayload;
    }) => configureStock(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
  });
}
