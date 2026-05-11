export type ProductSizeDto = string;

export interface CategoryDto {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductDto {
  id: number;
  sku: string;
  part_number: string | null;
  name: string;
  category: number;
  category_name: string;
  uom_code: string;
  tax_rate: number;
  tax_rate_name: string;
  description: string | null;
  cost_price?: string;
  selling_price: string;
  is_active: boolean;
  is_taxable: boolean;
  is_serialized: boolean;
  variant_id: number | null;
  variant_sku: string | null;
  variant_name: string | null;
  variant_count?: number;
  variants?: Array<{
    id: number;
    variant_sku: string;
    variant_name: string | null;
    size: ProductSizeDto;
    size_display: string;
    selling_price: string;
    cost_price?: string;
    is_active: boolean;
  }>;
  price: string;
  size: ProductSizeDto | null;
  size_display: string | null;
  is_available: boolean;
  image: string | null;
  can_view_cost?: boolean;
  can_manage_pricing?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SizeOptionDto {
  value: ProductSizeDto;
  label: string;
}

export interface TaxRateDto {
  id: number;
  name: string;
  rate: string;
  is_active: boolean;
}
