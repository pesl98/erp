import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class LocationCreate(BaseModel):
    code: str = Field(..., max_length=30)
    label: str | None = Field(None, max_length=100)
    max_capacity: int | None = None
    is_active: bool = True


class LocationResponse(BaseModel):
    id: uuid.UUID
    zone_id: uuid.UUID
    code: str
    label: str | None
    max_capacity: int | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ZoneCreate(BaseModel):
    code: str = Field(..., max_length=20)
    name: str = Field(..., max_length=100)
    zone_type: str | None = Field(None, max_length=30)


class ZoneResponse(BaseModel):
    id: uuid.UUID
    warehouse_id: uuid.UUID
    code: str
    name: str
    zone_type: str | None
    created_at: datetime
    locations: list[LocationResponse] = []

    model_config = {"from_attributes": True}


class ZoneUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    zone_type: str | None = Field(None, max_length=30)


class WarehouseCreate(BaseModel):
    code: str = Field(..., max_length=20)
    name: str = Field(..., max_length=150)
    address: str | None = Field(None, max_length=500)
    is_active: bool = True


class WarehouseUpdate(BaseModel):
    name: str | None = Field(None, max_length=150)
    address: str | None = Field(None, max_length=500)
    is_active: bool | None = None


class WarehouseResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    address: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WarehouseDetailResponse(WarehouseResponse):
    zones: list[ZoneResponse] = []


class LocationUpdate(BaseModel):
    label: str | None = Field(None, max_length=100)
    max_capacity: int | None = None
    is_active: bool | None = None
