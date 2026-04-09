import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  getCategories,
  getProducts,
  getSizes,
  updateCategory,
  updateProduct,
} from "@/services/productService.service";
import type {
  Category,
  CategoryFormData,
  Product,
  ProductFormData,
  SizeOption,
} from "@/types/product.types";

export type {
  Category,
  CategoryFormData,
  Product,
  ProductFormData,
  SizeOption,
};

export interface ProductListFilters {
  category?: number;
  available?: boolean;
  size?: string;
  search?: string;
}

export async function fetchCategories(activeOnly?: boolean): Promise<Category[]> {
  return getCategories(activeOnly);
}

export async function fetchProducts(filters?: ProductListFilters): Promise<Product[]> {
  return getProducts(filters);
}

export async function fetchSizes(): Promise<SizeOption[]> {
  return getSizes();
}

export async function createCatalogProduct(payload: ProductFormData): Promise<Product> {
  return createProduct(payload);
}

export async function updateCatalogProduct(
  id: number,
  payload: Partial<ProductFormData>
): Promise<Product> {
  return updateProduct(id, payload);
}

export async function removeCatalogProduct(id: number): Promise<void> {
  return deleteProduct(id);
}

export async function createCatalogCategory(payload: CategoryFormData): Promise<Category> {
  return createCategory(payload);
}

export async function updateCatalogCategory(
  id: number,
  payload: Partial<CategoryFormData>
): Promise<Category> {
  return updateCategory(id, payload);
}

export async function removeCatalogCategory(id: number): Promise<void> {
  return deleteCategory(id);
}
