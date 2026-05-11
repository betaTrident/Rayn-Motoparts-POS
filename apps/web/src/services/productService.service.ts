import api from "@/services/api.service";
import { ENDPOINTS } from "@/services/endpoints.service";
import type {
  Category,
  CategoryFormData,
  Product,
  ProductFormData,
  SizeOption,
  TaxRateOption,
} from "@/types/product.types";
import type { CategoryDto, ProductDto, SizeOptionDto, TaxRateDto } from "@/types/api/catalog.types";

const toCategory = (dto: CategoryDto): Category => ({
  ...dto,
  description: dto.description ?? "",
});

const toProduct = (dto: ProductDto): Product => ({
  ...dto,
  part_number: dto.part_number ?? "",
  description: dto.description ?? "",
  cost_price: dto.cost_price,
  selling_price: dto.selling_price ?? dto.price,
  is_active: dto.is_active ?? dto.is_available,
  is_taxable: dto.is_taxable ?? true,
  is_serialized: dto.is_serialized ?? false,
  variant_id: dto.variant_id ?? null,
  variant_sku: dto.variant_sku ?? "",
  variant_name: dto.variant_name ?? "",
  variant_count: dto.variant_count ?? (dto.variants?.length ?? 0),
  variants:
    dto.variants?.map((variant) => ({
      ...variant,
      variant_name: variant.variant_name ?? "",
      size_display: variant.size_display ?? null,
    })) ?? [],
  price: dto.selling_price ?? dto.price,
  size_display: dto.size_display ?? null,
  is_available: dto.is_active ?? dto.is_available,
  can_view_cost: dto.can_view_cost ?? false,
  can_manage_pricing: dto.can_manage_pricing ?? false,
});

// ════════════════════════════════════════════════
// Categories
// ════════════════════════════════════════════════

export async function getCategories(activeOnly?: boolean): Promise<Category[]> {
  const params = activeOnly != null ? { active: String(activeOnly) } : {};
  const { data } = await api.get<CategoryDto[]>(ENDPOINTS.products.categories, { params });
  return data.map(toCategory);
}

export async function getCategory(id: number): Promise<Category> {
  const { data } = await api.get<CategoryDto>(ENDPOINTS.products.categoryById(id));
  return toCategory(data);
}

export async function createCategory(payload: CategoryFormData): Promise<Category> {
  const { data } = await api.post<CategoryDto>(ENDPOINTS.products.categories, payload);
  return toCategory(data);
}

export async function updateCategory(id: number, payload: Partial<CategoryFormData>): Promise<Category> {
  const { data } = await api.patch<CategoryDto>(ENDPOINTS.products.categoryById(id), payload);
  return toCategory(data);
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(ENDPOINTS.products.categoryById(id));
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

  const { data } = await api.get<ProductDto[]>(ENDPOINTS.products.items, { params });
  return data.map(toProduct);
}

export async function getProduct(id: number): Promise<Product> {
  const { data } = await api.get<ProductDto>(ENDPOINTS.products.itemById(id));
  return toProduct(data);
}

export async function createProduct(payload: ProductFormData): Promise<Product> {
  const { data } = await api.post<ProductDto>(ENDPOINTS.products.items, payload);
  return toProduct(data);
}

export async function updateProduct(id: number, payload: Partial<ProductFormData>): Promise<Product> {
  const { data } = await api.patch<ProductDto>(ENDPOINTS.products.itemById(id), payload);
  return toProduct(data);
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(ENDPOINTS.products.itemById(id));
}

export async function getSizes(): Promise<SizeOption[]> {
  const { data } = await api.get<SizeOptionDto[]>(ENDPOINTS.products.sizes);
  return data as SizeOption[];
}

const toTaxRate = (dto: TaxRateDto): TaxRateOption => ({
  id: dto.id,
  name: dto.name,
  rate: dto.rate,
  is_active: dto.is_active,
});

export async function getTaxRates(): Promise<TaxRateOption[]> {
  const { data } = await api.get<TaxRateDto[]>(ENDPOINTS.products.taxRates);
  return data.map(toTaxRate);
}
