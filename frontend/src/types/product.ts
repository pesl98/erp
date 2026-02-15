export interface ProductImage {
  id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category_id: string | null;
  unit_of_measure: string;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  barcode: string | null;
  status: string;
  reorder_point: number;
  reorder_quantity: number;
  cost_price: number | null;
  created_at: string;
  updated_at: string;
  images: ProductImage[];
}

export interface ProductCreate {
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  unit_of_measure?: string;
  weight_kg?: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  barcode?: string;
  status?: string;
  reorder_point?: number;
  reorder_quantity?: number;
  cost_price?: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}
