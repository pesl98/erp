import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.database import get_db
from app.dependencies import get_current_active_user

from .schemas import (
    LocationCreate,
    LocationResponse,
    LocationUpdate,
    WarehouseCreate,
    WarehouseDetailResponse,
    WarehouseResponse,
    WarehouseUpdate,
    ZoneCreate,
    ZoneResponse,
    ZoneUpdate,
)
from .service import WarehouseService

router = APIRouter()


@router.get("/warehouses", response_model=list[WarehouseResponse])
async def list_warehouses(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = WarehouseService(db)
    return await service.list_warehouses()


@router.post("/warehouses", response_model=WarehouseResponse, status_code=201)
async def create_warehouse(
    data: WarehouseCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = WarehouseService(db)
    return await service.create_warehouse(data)


@router.get("/warehouses/{warehouse_id}", response_model=WarehouseDetailResponse)
async def get_warehouse(
    warehouse_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = WarehouseService(db)
    return await service.get_warehouse(warehouse_id)


@router.put("/warehouses/{warehouse_id}", response_model=WarehouseResponse)
async def update_warehouse(
    warehouse_id: uuid.UUID,
    data: WarehouseUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = WarehouseService(db)
    return await service.update_warehouse(warehouse_id, data)


@router.post("/warehouses/{warehouse_id}/zones", response_model=ZoneResponse, status_code=201)
async def create_zone(
    warehouse_id: uuid.UUID,
    data: ZoneCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = WarehouseService(db)
    return await service.create_zone(warehouse_id, data)


@router.put("/zones/{zone_id}", response_model=ZoneResponse)
async def update_zone(
    zone_id: uuid.UUID,
    data: ZoneUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = WarehouseService(db)
    return await service.update_zone(zone_id, data)


@router.delete("/zones/{zone_id}", status_code=204)
async def delete_zone(
    zone_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = WarehouseService(db)
    await service.delete_zone(zone_id)


@router.post("/zones/{zone_id}/locations", response_model=LocationResponse, status_code=201)
async def create_location(
    zone_id: uuid.UUID,
    data: LocationCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = WarehouseService(db)
    return await service.create_location(zone_id, data)


@router.put("/locations/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: uuid.UUID,
    data: LocationUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = WarehouseService(db)
    return await service.update_location(location_id, data)


@router.delete("/locations/{location_id}", status_code=204)
async def delete_location(
    location_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = WarehouseService(db)
    await service.delete_location(location_id)
