import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import BadRequestException, ConflictException, NotFoundException
from app.products.models import ProductVendor
from app.purchasing.models import PurchaseOrder

from .models import Vendor
from .schemas import ProductVendorCreate, VendorCreate, VendorUpdate


class VendorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_vendors(
        self,
        skip: int = 0,
        limit: int = 20,
        search: str | None = None,
        status: str | None = None,
    ) -> tuple[list[Vendor], int]:
        query = select(Vendor)
        count_query = select(func.count()).select_from(Vendor)

        if search:
            search_filter = Vendor.name.ilike(f"%{search}%") | Vendor.code.ilike(f"%{search}%")
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)
        if status:
            query = query.where(Vendor.status == status)
            count_query = count_query.where(Vendor.status == status)

        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(query.order_by(Vendor.name).offset(skip).limit(limit))
        return list(result.scalars().all()), total

    async def get_vendor(self, vendor_id: uuid.UUID) -> Vendor:
        result = await self.db.execute(select(Vendor).where(Vendor.id == vendor_id))
        vendor = result.scalar_one_or_none()
        if not vendor:
            raise NotFoundException("Vendor not found")
        return vendor

    async def create_vendor(self, data: VendorCreate) -> Vendor:
        existing = await self.db.execute(select(Vendor).where(Vendor.code == data.code))
        if existing.scalar_one_or_none():
            raise ConflictException(f"Vendor with code '{data.code}' already exists")
        vendor = Vendor(**data.model_dump())
        self.db.add(vendor)
        await self.db.flush()
        await self.db.refresh(vendor)
        return vendor

    async def update_vendor(self, vendor_id: uuid.UUID, data: VendorUpdate) -> Vendor:
        vendor = await self.get_vendor(vendor_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(vendor, key, value)
        await self.db.flush()
        await self.db.refresh(vendor)
        return vendor

    async def delete_vendor(self, vendor_id: uuid.UUID) -> Vendor:
        vendor = await self.get_vendor(vendor_id)
        # Check for active (non-terminal) POs before deactivating
        active_po_count = (
            await self.db.execute(
                select(func.count())
                .select_from(PurchaseOrder)
                .where(
                    PurchaseOrder.vendor_id == vendor_id,
                    PurchaseOrder.status.notin_(["received", "cancelled"]),
                )
            )
        ).scalar() or 0
        if active_po_count > 0:
            raise BadRequestException(
                f"Cannot deactivate vendor: {active_po_count} active purchase order(s) exist"
            )
        vendor.status = "inactive"
        await self.db.flush()
        return vendor

    async def get_vendor_products(self, vendor_id: uuid.UUID) -> list[ProductVendor]:
        await self.get_vendor(vendor_id)
        result = await self.db.execute(
            select(ProductVendor).where(ProductVendor.vendor_id == vendor_id)
        )
        return list(result.scalars().all())

    async def link_product(self, vendor_id: uuid.UUID, data: ProductVendorCreate) -> ProductVendor:
        await self.get_vendor(vendor_id)
        existing = await self.db.execute(
            select(ProductVendor).where(
                ProductVendor.vendor_id == vendor_id,
                ProductVendor.product_id == data.product_id,
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException("Product already linked to this vendor")

        link = ProductVendor(
            vendor_id=vendor_id,
            product_id=data.product_id,
            vendor_sku=data.vendor_sku,
            unit_cost=data.unit_cost,
            is_preferred=data.is_preferred,
        )
        self.db.add(link)
        await self.db.flush()
        await self.db.refresh(link)
        return link
