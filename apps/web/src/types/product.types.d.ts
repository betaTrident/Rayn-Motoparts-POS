// ──────────────────────────────────────────────
// Product & Category types (mirrors Django models)
// ──────────────────────────────────────────────

export type ProductSize = "solo" | "small" | "medium" | "large";

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
  tax_rate_name: string;
  description: string;
  cost_price: string;
  selling_price: string;
  is_active: boolean;
  is_taxable: boolean;
  is_serialized: boolean;
  variant_sku: string;
  variant_name: string;
  price: string;            // Django DecimalField → string
  size: ProductSize;
  size_display: string;
  is_available: boolean;
  image: string | null;
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
  price?: number;
  variant_sku?: string;
  variant_name?: string;
  size: ProductSize;
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
