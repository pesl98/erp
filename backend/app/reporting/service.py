from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.inventory.models import StockLevel, StockMovement
from app.products.models import Product
from app.purchasing.models import PurchaseOrder, GoodsReceipt
from app.vendors.models import Vendor


class ReportingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_kpis(self) -> dict:
        # Total stock value
        stock_value_result = await self.db.execute(
            select(func.sum(StockLevel.quantity_on_hand * Product.cost_price))
            .join(Product, Product.id == StockLevel.product_id)
            .where(Product.cost_price.isnot(None))
        )
        total_stock_value = float(stock_value_result.scalar() or 0)

        # Pending PO count
        pending_po_result = await self.db.execute(
            select(func.count())
            .select_from(PurchaseOrder)
            .where(PurchaseOrder.status.in_(["draft", "pending_approval", "approved", "sent"]))
        )
        pending_po_count = pending_po_result.scalar() or 0

        # Low stock alerts count
        stock_subquery = (
            select(
                StockLevel.product_id,
                func.sum(StockLevel.quantity_on_hand).label("total_on_hand"),
            )
            .group_by(StockLevel.product_id)
            .subquery()
        )
        low_stock_result = await self.db.execute(
            select(func.count())
            .select_from(Product)
            .outerjoin(stock_subquery, stock_subquery.c.product_id == Product.id)
            .where(
                Product.status == "active",
                Product.reorder_point > 0,
                func.coalesce(stock_subquery.c.total_on_hand, 0) < Product.reorder_point,
            )
        )
        low_stock_count = low_stock_result.scalar() or 0

        # Movements today
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        movements_result = await self.db.execute(
            select(func.count())
            .select_from(StockMovement)
            .where(StockMovement.created_at >= today_start)
        )
        movements_today = movements_result.scalar() or 0

        return {
            "total_stock_value": total_stock_value,
            "pending_po_count": pending_po_count,
            "low_stock_count": low_stock_count,
            "movements_today": movements_today,
        }

    async def get_recent_activity(self, limit: int = 20) -> list[dict]:
        result = await self.db.execute(
            select(
                StockMovement.id,
                StockMovement.movement_type,
                StockMovement.product_id,
                StockMovement.quantity,
                StockMovement.created_at,
                Product.sku,
                Product.name.label("product_name"),
            )
            .join(Product, Product.id == StockMovement.product_id)
            .order_by(StockMovement.created_at.desc())
            .limit(limit)
        )
        return [
            {
                "id": str(row.id),
                "type": row.movement_type,
                "product_id": str(row.product_id),
                "product_sku": row.sku,
                "product_name": row.product_name,
                "quantity": row.quantity,
                "created_at": row.created_at.isoformat(),
            }
            for row in result.all()
        ]

    async def get_stock_summary(self) -> list[dict]:
        result = await self.db.execute(
            select(
                Product.id,
                Product.sku,
                Product.name,
                Product.cost_price,
                func.coalesce(func.sum(StockLevel.quantity_on_hand), 0).label("total_on_hand"),
                func.coalesce(func.sum(StockLevel.quantity_reserved), 0).label("total_reserved"),
            )
            .outerjoin(StockLevel, StockLevel.product_id == Product.id)
            .where(Product.status == "active")
            .group_by(Product.id, Product.sku, Product.name, Product.cost_price)
            .order_by(Product.name)
        )
        return [
            {
                "product_id": str(row.id),
                "sku": row.sku,
                "name": row.name,
                "total_on_hand": row.total_on_hand,
                "total_reserved": row.total_reserved,
                "total_available": row.total_on_hand - row.total_reserved,
                "cost_price": float(row.cost_price) if row.cost_price else None,
                "stock_value": float(row.total_on_hand * row.cost_price) if row.cost_price else None,
            }
            for row in result.all()
        ]

    async def get_purchase_history(
        self, days: int = 90
    ) -> list[dict]:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        result = await self.db.execute(
            select(
                PurchaseOrder.id,
                PurchaseOrder.po_number,
                PurchaseOrder.status,
                PurchaseOrder.total_amount,
                PurchaseOrder.order_date,
                PurchaseOrder.created_at,
                Vendor.code.label("vendor_code"),
                Vendor.name.label("vendor_name"),
            )
            .join(Vendor, Vendor.id == PurchaseOrder.vendor_id)
            .where(PurchaseOrder.created_at >= since)
            .order_by(PurchaseOrder.created_at.desc())
        )
        return [
            {
                "po_id": str(row.id),
                "po_number": row.po_number,
                "status": row.status,
                "total_amount": float(row.total_amount),
                "order_date": row.order_date.isoformat() if row.order_date else None,
                "created_at": row.created_at.isoformat(),
                "vendor_code": row.vendor_code,
                "vendor_name": row.vendor_name,
            }
            for row in result.all()
        ]

    async def get_vendor_performance(self) -> list[dict]:
        result = await self.db.execute(
            select(
                Vendor.id,
                Vendor.code,
                Vendor.name,
                Vendor.rating,
                func.count(PurchaseOrder.id).label("order_count"),
                func.sum(PurchaseOrder.total_amount).label("total_spend"),
                func.avg(Vendor.lead_time_days).label("avg_lead_time"),
            )
            .outerjoin(PurchaseOrder, PurchaseOrder.vendor_id == Vendor.id)
            .where(Vendor.status == "active")
            .group_by(Vendor.id, Vendor.code, Vendor.name, Vendor.rating)
            .order_by(func.count(PurchaseOrder.id).desc())
        )
        return [
            {
                "vendor_id": str(row.id),
                "vendor_code": row.code,
                "vendor_name": row.name,
                "rating": float(row.rating) if row.rating else None,
                "order_count": row.order_count,
                "total_spend": float(row.total_spend or 0),
                "avg_lead_time": float(row.avg_lead_time) if row.avg_lead_time else None,
            }
            for row in result.all()
        ]
