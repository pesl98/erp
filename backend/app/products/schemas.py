import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(..., max_length=100)
    parent_id: uuid.UUID | None = None


class CategoryUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    parent_id: uuid.UUID | None = None


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    parent_id: uuid.UUID | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductImageResponse(BaseModel):
    id: uuid.UUID
    url: str
    is_primary: bool
    sort_order: int

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    sku: str = Field(..., max_length=50)
    name: str = Field(..., max_length=255)
    description: str | None = None
    category_id: uuid.UUID | None = None
    unit_of_measure: str = Field(default="each", max_length=20)
    weight_kg: float | None = None
    length_cm: float | None = None
    width_cm: float | None = None
    height_cm: float | None = None
    barcode: str | None = Field(None, max_length=50)
    status: str = Field(default="active", pattern="^(active|inactive)$")
    reorder_point: int = Field(default=0, ge=0)
    reorder_quantity: int = Field(default=0, ge=0)
    cost_price: float | None = Field(None, ge=0)


class ProductUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    description: str | None = None
    category_id: uuid.UUID | None = None
    unit_of_measure: str | None = Field(None, max_length=20)
    weight_kg: float | None = None
    length_cm: float | None = None
    width_cm: float | None = None
    height_cm: float | None = None
    barcode: str | None = Field(None, max_length=50)
    status: str | None = Field(None, pattern="^(active|inactive)$")
    reorder_point: int | None = Field(None, ge=0)
    reorder_quantity: int | None = Field(None, ge=0)
    cost_price: float | None = Field(None, ge=0)


class ProductResponse(BaseModel):
    id: uuid.UUID
    sku: str
    name: str
    description: str | None
    category_id: uuid.UUID | None
    unit_of_measure: str
    weight_kg: float | None
    length_cm: float | None
    width_cm: float | None
    height_cm: float | None
    barcode: str | None
    status: str
    reorder_point: int
    reorder_quantity: int
    cost_price: float | None
    created_at: datetime
    updated_at: datetime
    images: list[ProductImageResponse] = []

    model_config = {"from_attributes": True}


class ProductImageCreate(BaseModel):
    url: str = Field(..., max_length=500)
    is_primary: bool = False
    sort_order: int = 0
