import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  checkoutPos,
  fetchCurrentCashSession,
  fetchPaymentMethods,
  fetchPosBootstrap,
  fetchPosCategories,
  fetchPosProducts,
  openCashSession,
  type PosCatalogQuery,
  type PosCheckoutPayload,
  type OpenCashSessionPayload,
} from "@/services/modules/pos.service";
import { queryKeys } from "@/services/query/queryKeys";

export function usePosCatalog(query: PosCatalogQuery) {
  const categoriesQuery = useQuery({
    queryKey: queryKeys.pos.categories,
    queryFn: fetchPosCategories,
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.pos.products(query),
    queryFn: () => fetchPosProducts(query),
  });

  return {
    categoriesQuery,
    productsQuery,
  };
}

export function usePosBootstrap() {
  return useQuery({
    queryKey: queryKeys.pos.bootstrap,
    queryFn: fetchPosBootstrap,
  });
}

export function useCurrentCashSession() {
  return useQuery({
    queryKey: queryKeys.pos.currentCashSession,
    queryFn: fetchCurrentCashSession,
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: queryKeys.pos.paymentMethods,
    queryFn: fetchPaymentMethods,
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PosCheckoutPayload) => checkoutPos(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
    },
  });
}

export function useOpenCashSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: OpenCashSessionPayload) => openCashSession(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pos.all });
    },
  });
}
