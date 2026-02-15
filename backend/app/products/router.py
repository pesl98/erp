import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.database import get_db
from app.dependencies import get_current_active_user

from .schemas import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
    ProductCreate,
    ProductImageCreate,
    ProductImageResponse,
    ProductResponse,
    ProductUpdate,
)
from .service import ProductService

router = APIRouter()


# --- Categories ---

@router.get("/product-categories", response_model=list[CategoryResponse])
async def list_categories(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = ProductService(db)
    return await service.list_categories()


@router.post("/product-categories", response_model=CategoryResponse, status_code=201)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = ProductService(db)
    return await service.create_category(data)


@router.put("/product-categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = ProductService(db)
    return await service.update_category(category_id, data)


@router.delete("/product-categories/{category_id}", status_code=204)
async def delete_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = ProductService(db)
    await service.delete_category(category_id)


# --- Products ---

@router.get("/products", response_model=dict)
async def list_products(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
    status: str | None = Query(None),
    category_id: uuid.UUID | None = Query(None),
):
    service = ProductService(db)
    items, total = await service.list_products(skip, limit, search, status, category_id)
    return {
        "items": [ProductResponse.model_validate(p) for p in items],
        "total": total,
        "page": skip // limit + 1,
        "page_size": limit,
        "total_pages": (total + limit - 1) // limit if limit else 1,
    }


@router.post("/products", response_model=ProductResponse, status_code=201)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = ProductService(db)
    return await service.create_product(data)


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = ProductService(db)
    return await service.get_product(product_id)


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = ProductService(db)
    return await service.update_product(product_id, data)


@router.delete("/products/{product_id}", response_model=ProductResponse)
async def delete_product(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = ProductService(db)
    return await service.delete_product(product_id)


# --- Product Images ---

@router.post("/products/{product_id}/images", response_model=ProductImageResponse, status_code=201)
async def add_product_image(
    product_id: uuid.UUID,
    data: ProductImageCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = ProductService(db)
    return await service.add_image(product_id, data)


@router.delete("/products/{product_id}/images/{image_id}", status_code=204)
async def remove_product_image(
    product_id: uuid.UUID,
    image_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = ProductService(db)
    await service.remove_image(product_id, image_id)
