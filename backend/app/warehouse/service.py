import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions import ConflictException, NotFoundException

from .models import Location, Warehouse, Zone
from .schemas import (
    LocationCreate,
    LocationUpdate,
    WarehouseCreate,
    WarehouseUpdate,
    ZoneCreate,
    ZoneUpdate,
)


class WarehouseService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_warehouses(self) -> list[Warehouse]:
        result = await self.db.execute(select(Warehouse).order_by(Warehouse.name))
        return list(result.scalars().all())

    async def get_warehouse(self, warehouse_id: uuid.UUID) -> Warehouse:
        result = await self.db.execute(
            select(Warehouse)
            .options(selectinload(Warehouse.zones).selectinload(Zone.locations))
            .where(Warehouse.id == warehouse_id)
        )
        warehouse = result.scalar_one_or_none()
        if not warehouse:
            raise NotFoundException("Warehouse not found")
        return warehouse

    async def create_warehouse(self, data: WarehouseCreate) -> Warehouse:
        existing = await self.db.execute(select(Warehouse).where(Warehouse.code == data.code))
        if existing.scalar_one_or_none():
            raise ConflictException(f"Warehouse with code '{data.code}' already exists")
        warehouse = Warehouse(**data.model_dump())
        self.db.add(warehouse)
        await self.db.flush()
        await self.db.refresh(warehouse)
        return warehouse

    async def update_warehouse(self, warehouse_id: uuid.UUID, data: WarehouseUpdate) -> Warehouse:
        result = await self.db.execute(select(Warehouse).where(Warehouse.id == warehouse_id))
        warehouse = result.scalar_one_or_none()
        if not warehouse:
            raise NotFoundException("Warehouse not found")
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(warehouse, key, value)
        await self.db.flush()
        await self.db.refresh(warehouse)
        return warehouse

    async def create_zone(self, warehouse_id: uuid.UUID, data: ZoneCreate) -> Zone:
        result = await self.db.execute(select(Warehouse).where(Warehouse.id == warehouse_id))
        if not result.scalar_one_or_none():
            raise NotFoundException("Warehouse not found")
        zone = Zone(warehouse_id=warehouse_id, **data.model_dump())
        self.db.add(zone)
        await self.db.flush()
        await self.db.refresh(zone)
        return zone

    async def update_zone(self, zone_id: uuid.UUID, data: ZoneUpdate) -> Zone:
        result = await self.db.execute(select(Zone).where(Zone.id == zone_id))
        zone = result.scalar_one_or_none()
        if not zone:
            raise NotFoundException("Zone not found")
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(zone, key, value)
        await self.db.flush()
        await self.db.refresh(zone)
        return zone

    async def delete_zone(self, zone_id: uuid.UUID) -> None:
        result = await self.db.execute(select(Zone).where(Zone.id == zone_id))
        zone = result.scalar_one_or_none()
        if not zone:
            raise NotFoundException("Zone not found")
        await self.db.delete(zone)

    async def create_location(self, zone_id: uuid.UUID, data: LocationCreate) -> Location:
        result = await self.db.execute(select(Zone).where(Zone.id == zone_id))
        if not result.scalar_one_or_none():
            raise NotFoundException("Zone not found")
        location = Location(zone_id=zone_id, **data.model_dump())
        self.db.add(location)
        await self.db.flush()
        await self.db.refresh(location)
        return location

    async def update_location(self, location_id: uuid.UUID, data: LocationUpdate) -> Location:
        result = await self.db.execute(select(Location).where(Location.id == location_id))
        location = result.scalar_one_or_none()
        if not location:
            raise NotFoundException("Location not found")
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(location, key, value)
        await self.db.flush()
        await self.db.refresh(location)
        return location

    async def delete_location(self, location_id: uuid.UUID) -> None:
        result = await self.db.execute(select(Location).where(Location.id == location_id))
        location = result.scalar_one_or_none()
        if not location:
            raise NotFoundException("Location not found")
        await self.db.delete(location)
