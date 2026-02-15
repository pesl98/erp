import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.database import get_db
from app.dependencies import get_current_active_user

from .schemas import (
    ProductVendorCreate,
    ProductVendorResponse,
    VendorCreate,
    VendorResponse,
    VendorUpdate,
)
from .service import VendorService

router = APIRouter()


@router.get("/vendors", response_model=dict)
async def list_vendors(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
):
    service = VendorService(db)
    items, total = await service.list_vendors(skip, limit, search, status)
    return {
        "items": [VendorResponse.model_validate(v) for v in items],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1,
    }


@router.post("/vendors", response_model=VendorResponse, status_code=201)
async def create_vendor(
    data: VendorCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = VendorService(db)
    return await service.create_vendor(data)


@router.get("/vendors/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = VendorService(db)
    return await service.get_vendor(vendor_id)


@router.put("/vendors/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: uuid.UUID,
    data: VendorUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = VendorService(db)
    return await service.update_vendor(vendor_id, data)


@router.delete("/vendors/{vendor_id}", response_model=VendorResponse)
async def delete_vendor(
    vendor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = VendorService(db)
    return await service.delete_vendor(vendor_id)


@router.get("/vendors/{vendor_id}/products", response_model=list[ProductVendorResponse])
async def get_vendor_products(
    vendor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = VendorService(db)
    return await service.get_vendor_products(vendor_id)


@router.post("/vendors/{vendor_id}/products", response_model=ProductVendorResponse, status_code=201)
async def link_product_to_vendor(
    vendor_id: uuid.UUID,
    data: ProductVendorCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = VendorService(db)
    return await service.link_product(vendor_id, data)
