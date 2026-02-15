export interface POLineItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  status: string;
  order_date: string | null;
  expected_delivery_date: string | null;
  shipping_address: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  line_items: POLineItem[];
}

export interface POLineItemCreate {
  product_id: string;
  quantity_ordered: number;
  unit_price: number;
  sort_order?: number;
}

export interface PurchaseOrderCreate {
  vendor_id: string;
  order_date?: string;
  expected_delivery_date?: string;
  shipping_address?: string;
  tax_amount?: number;
  notes?: string;
  line_items: POLineItemCreate[];
}

export interface GoodsReceiptItem {
  id: string;
  goods_receipt_id: string;
  po_line_item_id: string;
  product_id: string;
  quantity_received: number;
  location_id: string;
  created_at: string;
}

export interface GoodsReceipt {
  id: string;
  receipt_number: string;
  purchase_order_id: string;
  received_date: string;
  notes: string | null;
  received_by: string;
  created_at: string;
  items: GoodsReceiptItem[];
}
