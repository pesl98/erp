import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class StockLevelResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    location_id: uuid.UUID
    quantity_on_hand: int
    quantity_reserved: int
    quantity_available: int = 0
    updated_at: datetime

    model_config = {"from_attributes": True}


class AggregatedStockResponse(BaseModel):
    product_id: uuid.UUID
    product_sku: str
    product_name: str
    total_on_hand: int
    total_reserved: int
    total_available: int
    reorder_point: int
    cost_price: float | None
    stock_value: float | None


class StockAdjustmentCreate(BaseModel):
    product_id: uuid.UUID
    location_id: uuid.UUID
    adjustment_type: str = Field(..., pattern="^(count|damage|correction|write_off)$")
    quantity_change: int
    reason: str = Field(..., min_length=1)


class StockAdjustmentResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    location_id: uuid.UUID
    adjustment_type: str
    quantity_change: int
    reason: str
    adjusted_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class StockTransferCreate(BaseModel):
    product_id: uuid.UUID
    from_location_id: uuid.UUID
    to_location_id: uuid.UUID
    quantity: int = Field(..., gt=0)
    notes: str | None = None


class StockMovementResponse(BaseModel):
    id: uuid.UUID
    movement_type: str
    product_id: uuid.UUID
    from_location_id: uuid.UUID | None
    to_location_id: uuid.UUID | None
    quantity: int
    reference_type: str | None
    reference_id: uuid.UUID | None
    notes: str | None
    performed_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class ReorderAlertResponse(BaseModel):
    product_id: uuid.UUID
    product_sku: str
    product_name: str
    total_on_hand: int
    reorder_point: int
    reorder_quantity: int
    deficit: int
