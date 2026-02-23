import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions import BadRequestException, NotFoundException
from app.inventory.models import StockLevel, StockMovement

from .models import GoodsReceipt, GoodsReceiptItem, POLineItem, PurchaseOrder
from .schemas import GoodsReceiptCreate, PurchaseOrderCreate, PurchaseOrderUpdate

VALID_TRANSITIONS = {
    "draft": ["pending_approval", "cancelled"],
    "pending_approval": ["approved", "draft", "cancelled"],
    "approved": ["sent", "cancelled"],
    "sent": ["partially_received", "received", "cancelled"],
    "partially_received": ["received"],
}


class PurchaseOrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _generate_po_number(self) -> str:
        year = datetime.now(timezone.utc).year
        result = await self.db.execute(
            select(func.count())
            .select_from(PurchaseOrder)
            .where(PurchaseOrder.po_number.like(f"PO-{year}%"))
        )
        count = (result.scalar() or 0) + 1
        return f"PO-{year}{count:04d}"

    async def list_purchase_orders(
        self,
        skip: int = 0,
        limit: int = 20,
        status: str | None = None,
        vendor_id: uuid.UUID | None = None,
    ) -> tuple[list[PurchaseOrder], int]:
        query = select(PurchaseOrder).options(selectinload(PurchaseOrder.line_items))
        count_query = select(func.count()).select_from(PurchaseOrder)

        if status:
            query = query.where(PurchaseOrder.status == status)
            count_query = count_query.where(PurchaseOrder.status == status)
        if vendor_id:
            query = query.where(PurchaseOrder.vendor_id == vendor_id)
            count_query = count_query.where(PurchaseOrder.vendor_id == vendor_id)

        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(
            query.order_by(PurchaseOrder.created_at.desc()).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def get_purchase_order(self, po_id: uuid.UUID) -> PurchaseOrder:
        result = await self.db.execute(
            select(PurchaseOrder)
            .options(
                selectinload(PurchaseOrder.line_items),
                selectinload(PurchaseOrder.goods_receipts).selectinload(GoodsReceipt.items),
            )
            .where(PurchaseOrder.id == po_id)
        )
        po = result.scalar_one_or_none()
        if not po:
            raise NotFoundException("Purchase order not found")
        return po

    async def create_purchase_order(
        self, data: PurchaseOrderCreate, user_id: uuid.UUID
    ) -> PurchaseOrder:
        po_number = await self._generate_po_number()

        subtotal = sum(item.quantity_ordered * item.unit_price for item in data.line_items)
        total_amount = subtotal + data.tax_amount

        po = PurchaseOrder(
            po_number=po_number,
            vendor_id=data.vendor_id,
            status="draft",
            order_date=data.order_date,
            expected_delivery_date=data.expected_delivery_date,
            shipping_address=data.shipping_address,
            subtotal=subtotal,
            tax_amount=data.tax_amount,
            total_amount=total_amount,
            notes=data.notes,
            created_by=user_id,
        )
        self.db.add(po)
        await self.db.flush()

        for item_data in data.line_items:
            line_item = POLineItem(
                purchase_order_id=po.id,
                product_id=item_data.product_id,
                quantity_ordered=item_data.quantity_ordered,
                unit_price=item_data.unit_price,
                sort_order=item_data.sort_order,
            )
            self.db.add(line_item)

        await self.db.flush()
        return await self.get_purchase_order(po.id)

    async def update_purchase_order(
        self, po_id: uuid.UUID, data: PurchaseOrderUpdate
    ) -> PurchaseOrder:
        po = await self.get_purchase_order(po_id)
        if po.status != "draft":
            raise BadRequestException("Can only edit draft purchase orders")

        if data.line_items is not None:
            # Replace all line items
            for item in po.line_items:
                await self.db.delete(item)
            await self.db.flush()

            for item_data in data.line_items:
                line_item = POLineItem(
                    purchase_order_id=po.id,
                    product_id=item_data.product_id,
                    quantity_ordered=item_data.quantity_ordered,
                    unit_price=item_data.unit_price,
                    sort_order=item_data.sort_order,
                )
                self.db.add(line_item)

            subtotal = sum(i.quantity_ordered * i.unit_price for i in data.line_items)
            po.subtotal = subtotal
            tax = data.tax_amount if data.tax_amount is not None else po.tax_amount
            po.tax_amount = tax
            po.total_amount = subtotal + tax

        update_fields = data.model_dump(exclude_unset=True, exclude={"line_items"})
        for key, value in update_fields.items():
            setattr(po, key, value)

        if "tax_amount" in update_fields and data.line_items is None:
            po.total_amount = po.subtotal + po.tax_amount

        await self.db.flush()
        return await self.get_purchase_order(po.id)

    async def _transition_status(self, po_id: uuid.UUID, new_status: str, user_id: uuid.UUID | None = None) -> PurchaseOrder:
        po = await self.get_purchase_order(po_id)
        valid = VALID_TRANSITIONS.get(po.status, [])
        if new_status not in valid:
            raise BadRequestException(
                f"Cannot transition from '{po.status}' to '{new_status}'"
            )
        po.status = new_status
        if new_status == "approved" and user_id:
            po.approved_by = user_id
            po.approved_at = datetime.now(timezone.utc)
        await self.db.flush()
        return await self.get_purchase_order(po.id)

    async def submit_po(self, po_id: uuid.UUID) -> PurchaseOrder:
        return await self._transition_status(po_id, "pending_approval")

    async def approve_po(self, po_id: uuid.UUID, user_id: uuid.UUID) -> PurchaseOrder:
        return await self._transition_status(po_id, "approved", user_id)

    async def send_po(self, po_id: uuid.UUID) -> PurchaseOrder:
        return await self._transition_status(po_id, "sent")

    async def cancel_po(self, po_id: uuid.UUID) -> PurchaseOrder:
        po = await self.get_purchase_order(po_id)
        if po.status in ("received",):
            raise BadRequestException("Cannot cancel a fully received PO")
        valid = VALID_TRANSITIONS.get(po.status, [])
        if "cancelled" not in valid:
            raise BadRequestException(f"Cannot cancel PO in '{po.status}' status")
        po.status = "cancelled"
        await self.db.flush()
        return await self.get_purchase_order(po_id)

    async def receive_goods(
        self, po_id: uuid.UUID, data: GoodsReceiptCreate, user_id: uuid.UUID
    ) -> GoodsReceipt:
        po = await self.get_purchase_order(po_id)
        if po.status not in ("sent", "partially_received"):
            raise BadRequestException("PO must be 'sent' or 'partially_received' to receive goods")

        # Generate receipt number
        result = await self.db.execute(
            select(func.count()).select_from(GoodsReceipt)
        )
        count = (result.scalar() or 0) + 1
        receipt_number = f"GR-{datetime.now(timezone.utc).year}{count:04d}"

        receipt = GoodsReceipt(
            receipt_number=receipt_number,
            purchase_order_id=po_id,
            received_date=data.received_date,
            notes=data.notes,
            received_by=user_id,
        )
        self.db.add(receipt)
        await self.db.flush()

        # Create receipt items and update stock
        for item_data in data.items:
            receipt_item = GoodsReceiptItem(
                goods_receipt_id=receipt.id,
                po_line_item_id=item_data.po_line_item_id,
                product_id=item_data.product_id,
                quantity_received=item_data.quantity_received,
                location_id=item_data.location_id,
            )
            self.db.add(receipt_item)

            # Update PO line item received quantity
            line_result = await self.db.execute(
                select(POLineItem).where(POLineItem.id == item_data.po_line_item_id)
            )
            line_item = line_result.scalar_one_or_none()
            if line_item:
                line_item.quantity_received += item_data.quantity_received

            # Update stock level
            stock_result = await self.db.execute(
                select(StockLevel)
                .where(
                    StockLevel.product_id == item_data.product_id,
                    StockLevel.location_id == item_data.location_id,
                )
                .with_for_update()
            )
            stock = stock_result.scalar_one_or_none()
            if stock:
                stock.quantity_on_hand += item_data.quantity_received
            else:
                stock = StockLevel(
                    product_id=item_data.product_id,
                    location_id=item_data.location_id,
                    quantity_on_hand=item_data.quantity_received,
                )
                self.db.add(stock)

            # Create stock movement
            movement = StockMovement(
                movement_type="in",
                product_id=item_data.product_id,
                to_location_id=item_data.location_id,
                quantity=item_data.quantity_received,
                reference_type="goods_receipt",
                reference_id=receipt.id,
                performed_by=user_id,
            )
            self.db.add(movement)

        await self.db.flush()

        # Check if PO is fully received
        await self.db.refresh(po)
        all_received = all(
            li.quantity_received >= li.quantity_ordered for li in po.line_items
        )
        if all_received:
            po.status = "received"
        else:
            po.status = "partially_received"

        await self.db.flush()
        # Fetch with items loaded for response
        result = await self.db.execute(
            select(GoodsReceipt)
            .options(selectinload(GoodsReceipt.items))
            .where(GoodsReceipt.id == receipt.id)
        )
        return result.scalar_one()
