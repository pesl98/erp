import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions import BadRequestException, ConflictException, NotFoundException
from app.inventory.models import StockLevel

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
        return await self.get_warehouse(warehouse.id)

    async def update_warehouse(self, warehouse_id: uuid.UUID, data: WarehouseUpdate) -> Warehouse:
        result = await self.db.execute(select(Warehouse).where(Warehouse.id == warehouse_id))
        warehouse = result.scalar_one_or_none()
        if not warehouse:
            raise NotFoundException("Warehouse not found")
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(warehouse, key, value)
        await self.db.flush()
        return await self.get_warehouse(warehouse.id)

    async def create_zone(self, warehouse_id: uuid.UUID, data: ZoneCreate) -> Zone:
        result = await self.db.execute(select(Warehouse).where(Warehouse.id == warehouse_id))
        if not result.scalar_one_or_none():
            raise NotFoundException("Warehouse not found")
        zone = Zone(warehouse_id=warehouse_id, **data.model_dump())
        self.db.add(zone)
        await self.db.flush()
        result = await self.db.execute(
            select(Zone).options(selectinload(Zone.locations)).where(Zone.id == zone.id)
        )
        return result.scalar_one()

    async def update_zone(self, zone_id: uuid.UUID, data: ZoneUpdate) -> Zone:
        result = await self.db.execute(select(Zone).where(Zone.id == zone_id))
        zone = result.scalar_one_or_none()
        if not zone:
            raise NotFoundException("Zone not found")
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(zone, key, value)
        await self.db.flush()
        result = await self.db.execute(
            select(Zone).options(selectinload(Zone.locations)).where(Zone.id == zone.id)
        )
        return result.scalar_one()

    async def delete_zone(self, zone_id: uuid.UUID) -> None:
        result = await self.db.execute(
            select(Zone).options(selectinload(Zone.locations)).where(Zone.id == zone_id)
        )
        zone = result.scalar_one_or_none()
        if not zone:
            raise NotFoundException("Zone not found")
        # Check if any locations in this zone have stock
        location_ids = [loc.id for loc in zone.locations]
        if location_ids:
            stock_count = (
                await self.db.execute(
                    select(func.count())
                    .select_from(StockLevel)
                    .where(StockLevel.location_id.in_(location_ids))
                )
            ).scalar() or 0
            if stock_count > 0:
                raise BadRequestException(
                    "Cannot delete zone: locations within it still have stock"
                )
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
        # Check if location has stock before deleting
        stock_count = (
            await self.db.execute(
                select(func.count())
                .select_from(StockLevel)
                .where(StockLevel.location_id == location_id)
            )
        ).scalar() or 0
        if stock_count > 0:
            raise BadRequestException(
                "Cannot delete location: it still has stock records"
            )
        await self.db.delete(location)
