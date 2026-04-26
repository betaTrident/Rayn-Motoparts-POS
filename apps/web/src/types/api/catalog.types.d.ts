export type ProductSizeDto = 'solo' | 'small' | 'medium' | 'large';

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
  tax_rate_name: string;
  description: string | null;
  cost_price: string;
  selling_price: string;
  is_active: boolean;
  is_taxable: boolean;
  is_serialized: boolean;
  variant_sku: string | null;
  variant_name: string | null;
  price: string;
  size: ProductSizeDto;
  size_display: string;
  is_available: boolean;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface SizeOptionDto {
  value: ProductSizeDto;
  label: string;
}
