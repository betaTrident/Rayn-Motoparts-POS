import api from "@/services/api";
import type {
  Category,
  CategoryFormData,
  Product,
  ProductFormData,
  SizeOption,
} from "@/types/product";

// ════════════════════════════════════════════════
// Categories
// ════════════════════════════════════════════════

export async function getCategories(activeOnly?: boolean): Promise<Category[]> {
  const params = activeOnly != null ? { active: String(activeOnly) } : {};
  const { data } = await api.get<Category[]>("products/categories/", { params });
  return data;
}

export async function getCategory(id: number): Promise<Category> {
  const { data } = await api.get<Category>(`products/categories/${id}/`);
  return data;
}

export async function createCategory(payload: CategoryFormData): Promise<Category> {
  const { data } = await api.post<Category>("products/categories/", payload);
  return data;
}

export async function updateCategory(id: number, payload: Partial<CategoryFormData>): Promise<Category> {
  const { data } = await api.patch<Category>(`products/categories/${id}/`, payload);
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`products/categories/${id}/`);
}

// ════════════════════════════════════════════════
// Products
// ════════════════════════════════════════════════

interface ProductFilters {
  category?: number;
  available?: boolean;
  size?: string;
  search?: string;
}

export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  const params: Record<string, string> = {};
  if (filters?.category) params.category = String(filters.category);
  if (filters?.available != null) params.available = String(filters.available);
  if (filters?.size) params.size = filters.size;
  if (filters?.search) params.search = filters.search;

  const { data } = await api.get<Product[]>("products/items/", { params });
  return data;
}

export async function getProduct(id: number): Promise<Product> {
  const { data } = await api.get<Product>(`products/items/${id}/`);
  return data;
}

export async function createProduct(payload: ProductFormData): Promise<Product> {
  const { data } = await api.post<Product>("products/items/", payload);
  return data;
}

export async function updateProduct(id: number, payload: Partial<ProductFormData>): Promise<Product> {
  const { data } = await api.patch<Product>(`products/items/${id}/`, payload);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`products/items/${id}/`);
}

export async function getSizes(): Promise<SizeOption[]> {
  const { data } = await api.get<SizeOption[]>("products/items/sizes/");
  return data;
}
