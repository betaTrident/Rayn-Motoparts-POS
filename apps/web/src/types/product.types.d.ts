export type ProductSize = string;

export interface TaxRateOption {
  id: number;
  name: string;
  rate: string;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  product_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
  is_active: boolean;
}

export interface Product {
  id: number;
  sku: string;
  part_number: string;
  name: string;
  category: number;
  category_name: string;
  uom_code: string;
  tax_rate: number;
  tax_rate_name: string;
  description: string;
  cost_price?: string;
  selling_price: string;
  is_active: boolean;
  is_taxable: boolean;
  is_serialized: boolean;
  variant_id: number | null;
  variant_sku: string;
  variant_name: string;
  variant_count?: number;
  variants?: Array<{
    id: number;
    variant_sku: string;
    variant_name: string | null;
    size: ProductSize;
    size_display: string | null;
    selling_price: string;
    cost_price?: string;
    is_active: boolean;
  }>;
  price: string;
  size: ProductSize | null;
  size_display: string | null;
  is_available: boolean;
  image: string | null;
  can_view_cost?: boolean;
  can_manage_pricing?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  sku?: string;
  name: string;
  part_number?: string;
  category: number;
  description: string;
  cost_price: number;
  selling_price: number;
  tax_rate?: number | null;
  price?: number;
  variant_sku?: string;
  variant_name?: string;
  size?: ProductSize | null;
  is_active: boolean;
  is_available?: boolean;
  is_taxable: boolean;
  is_serialized: boolean;
  image?: File | null;
}

export interface SizeOption {
  value: ProductSize;
  label: string;
}
