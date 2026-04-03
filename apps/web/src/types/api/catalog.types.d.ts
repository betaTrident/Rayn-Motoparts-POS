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
  name: string;
  category: number;
  category_name: string;
  description: string | null;
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
