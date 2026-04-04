import { useQuery } from "@tanstack/react-query";

import {
  fetchPosCategories,
  fetchPosProducts,
  type PosCatalogQuery,
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
