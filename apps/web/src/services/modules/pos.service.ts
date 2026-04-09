import {
  fetchCategories,
  fetchProducts,
  type Category,
  type Product,
} from "@/services/modules/catalog.service";

export interface PosCatalogQuery {
  categoryId?: number;
  search?: string;
}

export async function fetchPosCategories(): Promise<Category[]> {
  return fetchCategories(true);
}

export async function fetchPosProducts(query: PosCatalogQuery = {}): Promise<Product[]> {
  return fetchProducts({
    category: query.categoryId,
    search: query.search,
    available: true,
  });
}
