import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class POLineItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity_ordered: int = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    sort_order: int = 0


class POLineItemResponse(BaseModel):
    id: uuid.UUID
    purchase_order_id: uuid.UUID
    product_id: uuid.UUID
    quantity_ordered: int
    quantity_received: int
    unit_price: float
    line_total: float = 0
    sort_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PurchaseOrderCreate(BaseModel):
    vendor_id: uuid.UUID
    order_date: date | None = None
    expected_delivery_date: date | None = None
    shipping_address: str | None = None
    tax_amount: float = Field(default=0, ge=0)
    notes: str | None = None
    line_items: list[POLineItemCreate] = []


class PurchaseOrderUpdate(BaseModel):
    order_date: date | None = None
    expected_delivery_date: date | None = None
    shipping_address: str | None = None
    tax_amount: float | None = Field(None, ge=0)
    notes: str | None = None
    line_items: list[POLineItemCreate] | None = None


class PurchaseOrderResponse(BaseModel):
    id: uuid.UUID
    po_number: str
    vendor_id: uuid.UUID
    status: str
    order_date: date | None
    expected_delivery_date: date | None
    shipping_address: str | None
    subtotal: float
    tax_amount: float
    total_amount: float
    notes: str | None
    created_by: uuid.UUID
    approved_by: uuid.UUID | None
    approved_at: datetime | None
    created_at: datetime
    updated_at: datetime
    line_items: list[POLineItemResponse] = []

    model_config = {"from_attributes": True}


class GoodsReceiptItemCreate(BaseModel):
    po_line_item_id: uuid.UUID
    product_id: uuid.UUID
    quantity_received: int = Field(..., gt=0)
    location_id: uuid.UUID


class GoodsReceiptCreate(BaseModel):
    received_date: date
    notes: str | None = None
    items: list[GoodsReceiptItemCreate]


class GoodsReceiptItemResponse(BaseModel):
    id: uuid.UUID
    goods_receipt_id: uuid.UUID
    po_line_item_id: uuid.UUID
    product_id: uuid.UUID
    quantity_received: int
    location_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class GoodsReceiptResponse(BaseModel):
    id: uuid.UUID
    receipt_number: str
    purchase_order_id: uuid.UUID
    received_date: date
    notes: str | None
    received_by: uuid.UUID
    created_at: datetime
    items: list[GoodsReceiptItemResponse] = []

    model_config = {"from_attributes": True}
