import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.database import get_db
from app.dependencies import get_current_active_user, require_roles

from .schemas import (
    GoodsReceiptCreate,
    GoodsReceiptResponse,
    PurchaseOrderCreate,
    PurchaseOrderResponse,
    PurchaseOrderUpdate,
)
from .service import PurchaseOrderService

router = APIRouter()


@router.get("/purchase-orders", response_model=dict)
async def list_purchase_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    vendor_id: uuid.UUID | None = Query(None),
):
    service = PurchaseOrderService(db)
    items, total = await service.list_purchase_orders(skip, limit, status, vendor_id)
    return {
        "items": [PurchaseOrderResponse.model_validate(i) for i in items],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1,
    }


@router.post("/purchase-orders", response_model=PurchaseOrderResponse, status_code=201)
async def create_purchase_order(
    data: PurchaseOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = PurchaseOrderService(db)
    return await service.create_purchase_order(data, current_user.id)


@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(
    po_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = PurchaseOrderService(db)
    return await service.get_purchase_order(po_id)


@router.put("/purchase-orders/{po_id}", response_model=PurchaseOrderResponse)
async def update_purchase_order(
    po_id: uuid.UUID,
    data: PurchaseOrderUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = PurchaseOrderService(db)
    return await service.update_purchase_order(po_id, data)


@router.post("/purchase-orders/{po_id}/submit", response_model=PurchaseOrderResponse)
async def submit_po(
    po_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = PurchaseOrderService(db)
    return await service.submit_po(po_id)


@router.post("/purchase-orders/{po_id}/approve", response_model=PurchaseOrderResponse)
async def approve_po(
    po_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
):
    service = PurchaseOrderService(db)
    return await service.approve_po(po_id, current_user.id)


@router.post("/purchase-orders/{po_id}/send", response_model=PurchaseOrderResponse)
async def send_po(
    po_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = PurchaseOrderService(db)
    return await service.send_po(po_id)


@router.post("/purchase-orders/{po_id}/cancel", response_model=PurchaseOrderResponse)
async def cancel_po(
    po_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = PurchaseOrderService(db)
    return await service.cancel_po(po_id)


@router.post("/purchase-orders/{po_id}/receive", response_model=GoodsReceiptResponse, status_code=201)
async def receive_goods(
    po_id: uuid.UUID,
    data: GoodsReceiptCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = PurchaseOrderService(db)
    return await service.receive_goods(po_id, data, current_user.id)
