export interface StockLevel {
  id: string;
  product_id: string;
  location_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  updated_at: string;
}

export interface AggregatedStock {
  product_id: string;
  product_sku: string;
  product_name: string;
  total_on_hand: number;
  total_reserved: number;
  total_available: number;
  reorder_point: number;
  cost_price: number | null;
  stock_value: number | null;
}

export interface StockMovement {
  id: string;
  movement_type: string;
  product_id: string;
  from_location_id: string | null;
  to_location_id: string | null;
  quantity: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  performed_by: string;
  created_at: string;
}

export interface ReorderAlert {
  product_id: string;
  product_sku: string;
  product_name: string;
  total_on_hand: number;
  reorder_point: number;
  reorder_quantity: number;
  deficit: number;
}

export interface StockAdjustmentCreate {
  product_id: string;
  location_id: string;
  adjustment_type: string;
  quantity_change: number;
  reason: string;
}

export interface StockTransferCreate {
  product_id: string;
  from_location_id: string;
  to_location_id: string;
  quantity: number;
  notes?: string;
}
