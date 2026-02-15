import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import BadRequestException, NotFoundException
from app.products.models import Product

from .models import StockAdjustment, StockLevel, StockMovement
from .schemas import StockAdjustmentCreate, StockTransferCreate


class InventoryService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_aggregated_stock(
        self,
        skip: int = 0,
        limit: int = 20,
        search: str | None = None,
    ) -> tuple[list[dict], int]:
        query = (
            select(
                Product.id.label("product_id"),
                Product.sku.label("product_sku"),
                Product.name.label("product_name"),
                func.coalesce(func.sum(StockLevel.quantity_on_hand), 0).label("total_on_hand"),
                func.coalesce(func.sum(StockLevel.quantity_reserved), 0).label("total_reserved"),
                Product.reorder_point,
                Product.cost_price,
            )
            .outerjoin(StockLevel, StockLevel.product_id == Product.id)
            .where(Product.status == "active")
            .group_by(Product.id, Product.sku, Product.name, Product.reorder_point, Product.cost_price)
        )

        if search:
            query = query.where(
                Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%")
            )

        count_subquery = query.subquery()
        count_result = await self.db.execute(
            select(func.count()).select_from(count_subquery)
        )
        total = count_result.scalar() or 0

        result = await self.db.execute(query.offset(skip).limit(limit))
        items = []
        for row in result.all():
            on_hand = row.total_on_hand
            reserved = row.total_reserved
            available = on_hand - reserved
            stock_value = float(on_hand * row.cost_price) if row.cost_price else None
            items.append({
                "product_id": row.product_id,
                "product_sku": row.product_sku,
                "product_name": row.product_name,
                "total_on_hand": on_hand,
                "total_reserved": reserved,
                "total_available": available,
                "reorder_point": row.reorder_point,
                "cost_price": float(row.cost_price) if row.cost_price else None,
                "stock_value": stock_value,
            })
        return items, total

    async def get_stock_by_location(
        self, product_id: uuid.UUID | None = None
    ) -> list[StockLevel]:
        query = select(StockLevel)
        if product_id:
            query = query.where(StockLevel.product_id == product_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_stock_valuation(self) -> dict:
        result = await self.db.execute(
            select(
                func.sum(StockLevel.quantity_on_hand * Product.cost_price).label("total_value"),
                func.count(func.distinct(Product.id)).label("product_count"),
                func.sum(StockLevel.quantity_on_hand).label("total_units"),
            )
            .join(Product, Product.id == StockLevel.product_id)
            .where(Product.cost_price.isnot(None))
        )
        row = result.one()
        return {
            "total_value": float(row.total_value or 0),
            "product_count": row.product_count or 0,
            "total_units": row.total_units or 0,
        }

    async def get_reorder_alerts(self) -> list[dict]:
        subquery = (
            select(
                StockLevel.product_id,
                func.sum(StockLevel.quantity_on_hand).label("total_on_hand"),
            )
            .group_by(StockLevel.product_id)
            .subquery()
        )

        result = await self.db.execute(
            select(
                Product.id.label("product_id"),
                Product.sku.label("product_sku"),
                Product.name.label("product_name"),
                func.coalesce(subquery.c.total_on_hand, 0).label("total_on_hand"),
                Product.reorder_point,
                Product.reorder_quantity,
            )
            .outerjoin(subquery, subquery.c.product_id == Product.id)
            .where(
                Product.status == "active",
                Product.reorder_point > 0,
                func.coalesce(subquery.c.total_on_hand, 0) < Product.reorder_point,
            )
            .order_by(
                (Product.reorder_point - func.coalesce(subquery.c.total_on_hand, 0)).desc()
            )
        )

        alerts = []
        for row in result.all():
            alerts.append({
                "product_id": row.product_id,
                "product_sku": row.product_sku,
                "product_name": row.product_name,
                "total_on_hand": row.total_on_hand,
                "reorder_point": row.reorder_point,
                "reorder_quantity": row.reorder_quantity,
                "deficit": row.reorder_point - row.total_on_hand,
            })
        return alerts

    async def create_adjustment(
        self, data: StockAdjustmentCreate, user_id: uuid.UUID
    ) -> StockAdjustment:
        # Update stock level
        stock_result = await self.db.execute(
            select(StockLevel).where(
                StockLevel.product_id == data.product_id,
                StockLevel.location_id == data.location_id,
            )
        )
        stock = stock_result.scalar_one_or_none()
        if stock:
            stock.quantity_on_hand += data.quantity_change
            if stock.quantity_on_hand < 0:
                raise BadRequestException("Stock cannot go below zero")
        else:
            if data.quantity_change < 0:
                raise BadRequestException("Stock cannot go below zero")
            stock = StockLevel(
                product_id=data.product_id,
                location_id=data.location_id,
                quantity_on_hand=data.quantity_change,
            )
            self.db.add(stock)

        adjustment = StockAdjustment(
            product_id=data.product_id,
            location_id=data.location_id,
            adjustment_type=data.adjustment_type,
            quantity_change=data.quantity_change,
            reason=data.reason,
            adjusted_by=user_id,
        )
        self.db.add(adjustment)

        # Create movement record
        movement_type = "in" if data.quantity_change > 0 else "out"
        movement = StockMovement(
            movement_type="adjustment",
            product_id=data.product_id,
            to_location_id=data.location_id if data.quantity_change > 0 else None,
            from_location_id=data.location_id if data.quantity_change < 0 else None,
            quantity=abs(data.quantity_change),
            reference_type="adjustment",
            reference_id=adjustment.id,
            performed_by=user_id,
        )
        self.db.add(movement)

        await self.db.flush()
        await self.db.refresh(adjustment)
        return adjustment

    async def list_adjustments(
        self, skip: int = 0, limit: int = 20
    ) -> tuple[list[StockAdjustment], int]:
        count = (
            await self.db.execute(select(func.count()).select_from(StockAdjustment))
        ).scalar() or 0
        result = await self.db.execute(
            select(StockAdjustment)
            .order_by(StockAdjustment.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all()), count

    async def create_transfer(
        self, data: StockTransferCreate, user_id: uuid.UUID
    ) -> StockMovement:
        if data.from_location_id == data.to_location_id:
            raise BadRequestException("Source and destination must be different")

        # Debit source
        source_result = await self.db.execute(
            select(StockLevel).where(
                StockLevel.product_id == data.product_id,
                StockLevel.location_id == data.from_location_id,
            )
        )
        source = source_result.scalar_one_or_none()
        if not source or source.quantity_on_hand < data.quantity:
            raise BadRequestException("Insufficient stock at source location")
        source.quantity_on_hand -= data.quantity

        # Credit destination
        dest_result = await self.db.execute(
            select(StockLevel).where(
                StockLevel.product_id == data.product_id,
                StockLevel.location_id == data.to_location_id,
            )
        )
        dest = dest_result.scalar_one_or_none()
        if dest:
            dest.quantity_on_hand += data.quantity
        else:
            dest = StockLevel(
                product_id=data.product_id,
                location_id=data.to_location_id,
                quantity_on_hand=data.quantity,
            )
            self.db.add(dest)

        movement = StockMovement(
            movement_type="transfer",
            product_id=data.product_id,
            from_location_id=data.from_location_id,
            to_location_id=data.to_location_id,
            quantity=data.quantity,
            reference_type="transfer",
            notes=data.notes,
            performed_by=user_id,
        )
        self.db.add(movement)
        await self.db.flush()
        await self.db.refresh(movement)
        return movement

    async def list_movements(
        self,
        skip: int = 0,
        limit: int = 20,
        product_id: uuid.UUID | None = None,
        movement_type: str | None = None,
    ) -> tuple[list[StockMovement], int]:
        query = select(StockMovement)
        count_query = select(func.count()).select_from(StockMovement)

        if product_id:
            query = query.where(StockMovement.product_id == product_id)
            count_query = count_query.where(StockMovement.product_id == product_id)
        if movement_type:
            query = query.where(StockMovement.movement_type == movement_type)
            count_query = count_query.where(StockMovement.movement_type == movement_type)

        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(
            query.order_by(StockMovement.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total
