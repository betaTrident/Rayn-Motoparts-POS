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
  name: string;
  category: number;
  category_name: string;
  description: string;
  price: string;            // Django DecimalField → string
  size: ProductSize;
  size_display: string;
  is_available: boolean;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  category: number;
  description: string;
  price: number;
  size: ProductSize;
  is_available: boolean;
  image?: File | null;
}

export interface SizeOption {
  value: ProductSize;
  label: string;
}
