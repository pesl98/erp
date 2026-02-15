import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class VendorCreate(BaseModel):
    code: str = Field(..., max_length=20)
    name: str = Field(..., max_length=255)
    contact_name: str | None = Field(None, max_length=150)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=50)
    address_line1: str | None = Field(None, max_length=255)
    address_line2: str | None = Field(None, max_length=255)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=20)
    country: str | None = Field(None, max_length=100)
    payment_terms_days: int = 30
    lead_time_days: int = 7
    rating: float | None = Field(None, ge=0, le=5)
    status: str = Field(default="active", pattern="^(active|inactive)$")
    notes: str | None = None


class VendorUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    contact_name: str | None = Field(None, max_length=150)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=50)
    address_line1: str | None = Field(None, max_length=255)
    address_line2: str | None = Field(None, max_length=255)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    postal_code: str | None = Field(None, max_length=20)
    country: str | None = Field(None, max_length=100)
    payment_terms_days: int | None = None
    lead_time_days: int | None = None
    rating: float | None = Field(None, ge=0, le=5)
    status: str | None = Field(None, pattern="^(active|inactive)$")
    notes: str | None = None


class VendorResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    contact_name: str | None
    email: str | None
    phone: str | None
    address_line1: str | None
    address_line2: str | None
    city: str | None
    state: str | None
    postal_code: str | None
    country: str | None
    payment_terms_days: int
    lead_time_days: int
    rating: float | None
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductVendorCreate(BaseModel):
    product_id: uuid.UUID
    vendor_sku: str | None = Field(None, max_length=50)
    unit_cost: float | None = Field(None, ge=0)
    is_preferred: bool = False


class ProductVendorResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    vendor_id: uuid.UUID
    vendor_sku: str | None
    unit_cost: float | None
    is_preferred: bool
    created_at: datetime

    model_config = {"from_attributes": True}
