import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.database import get_db
from app.dependencies import get_current_active_user

from .schemas import (
    AggregatedStockResponse,
    ReorderAlertResponse,
    StockAdjustmentCreate,
    StockAdjustmentResponse,
    StockLevelResponse,
    StockMovementResponse,
    StockTransferCreate,
)
from .service import InventoryService

router = APIRouter()


@router.get("/inventory/stock-levels", response_model=dict)
async def get_stock_levels(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
):
    service = InventoryService(db)
    items, total = await service.get_aggregated_stock(skip, limit, search)
    return {
        "items": items,
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1,
    }


@router.get("/inventory/stock-levels/by-location", response_model=list[StockLevelResponse])
async def get_stock_by_location(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
    product_id: uuid.UUID | None = Query(None),
):
    service = InventoryService(db)
    items = await service.get_stock_by_location(product_id)
    results = []
    for item in items:
        results.append(StockLevelResponse(
            id=item.id,
            product_id=item.product_id,
            location_id=item.location_id,
            quantity_on_hand=item.quantity_on_hand,
            quantity_reserved=item.quantity_reserved,
            quantity_available=item.quantity_on_hand - item.quantity_reserved,
            updated_at=item.updated_at,
        ))
    return results


@router.get("/inventory/stock-levels/product/{product_id}", response_model=list[StockLevelResponse])
async def get_product_stock(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = InventoryService(db)
    items = await service.get_stock_by_location(product_id)
    results = []
    for item in items:
        results.append(StockLevelResponse(
            id=item.id,
            product_id=item.product_id,
            location_id=item.location_id,
            quantity_on_hand=item.quantity_on_hand,
            quantity_reserved=item.quantity_reserved,
            quantity_available=item.quantity_on_hand - item.quantity_reserved,
            updated_at=item.updated_at,
        ))
    return results


@router.get("/inventory/valuation")
async def get_stock_valuation(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = InventoryService(db)
    return await service.get_stock_valuation()


@router.get("/inventory/reorder-alerts", response_model=list[ReorderAlertResponse])
async def get_reorder_alerts(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = InventoryService(db)
    return await service.get_reorder_alerts()


@router.post("/inventory/adjustments", response_model=StockAdjustmentResponse, status_code=201)
async def create_adjustment(
    data: StockAdjustmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = InventoryService(db)
    return await service.create_adjustment(data, current_user.id)


@router.get("/inventory/adjustments", response_model=dict)
async def list_adjustments(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    service = InventoryService(db)
    items, total = await service.list_adjustments(skip, limit)
    return {
        "items": [StockAdjustmentResponse.model_validate(i) for i in items],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1,
    }


@router.get("/inventory/movements", response_model=dict)
async def list_movements(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    product_id: uuid.UUID | None = Query(None),
    movement_type: str | None = Query(None),
):
    service = InventoryService(db)
    items, total = await service.list_movements(skip, limit, product_id, movement_type)
    return {
        "items": [StockMovementResponse.model_validate(i) for i in items],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1,
    }


@router.post("/inventory/transfers", response_model=StockMovementResponse, status_code=201)
async def create_transfer(
    data: StockTransferCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    service = InventoryService(db)
    return await service.create_transfer(data, current_user.id)
