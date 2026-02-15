import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.exceptions import ConflictException, NotFoundException

from .models import Product, ProductCategory, ProductImage
from .schemas import CategoryCreate, CategoryUpdate, ProductCreate, ProductImageCreate, ProductUpdate


class ProductService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_categories(self) -> list[ProductCategory]:
        result = await self.db.execute(
            select(ProductCategory).order_by(ProductCategory.name)
        )
        return list(result.scalars().all())

    async def create_category(self, data: CategoryCreate) -> ProductCategory:
        category = ProductCategory(**data.model_dump())
        self.db.add(category)
        await self.db.flush()
        await self.db.refresh(category)
        return category

    async def update_category(self, category_id: uuid.UUID, data: CategoryUpdate) -> ProductCategory:
        result = await self.db.execute(
            select(ProductCategory).where(ProductCategory.id == category_id)
        )
        category = result.scalar_one_or_none()
        if not category:
            raise NotFoundException("Category not found")
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(category, key, value)
        await self.db.flush()
        await self.db.refresh(category)
        return category

    async def delete_category(self, category_id: uuid.UUID) -> None:
        result = await self.db.execute(
            select(ProductCategory).where(ProductCategory.id == category_id)
        )
        category = result.scalar_one_or_none()
        if not category:
            raise NotFoundException("Category not found")
        await self.db.delete(category)

    async def list_products(
        self,
        skip: int = 0,
        limit: int = 20,
        search: str | None = None,
        status: str | None = None,
        category_id: uuid.UUID | None = None,
    ) -> tuple[list[Product], int]:
        query = select(Product).options(selectinload(Product.images))
        count_query = select(func.count()).select_from(Product)

        if search:
            search_filter = Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%")
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)
        if status:
            query = query.where(Product.status == status)
            count_query = count_query.where(Product.status == status)
        if category_id:
            query = query.where(Product.category_id == category_id)
            count_query = count_query.where(Product.category_id == category_id)

        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(
            query.order_by(Product.name).offset(skip).limit(limit)
        )
        return list(result.scalars().all()), total

    async def get_product(self, product_id: uuid.UUID) -> Product:
        result = await self.db.execute(
            select(Product)
            .options(selectinload(Product.images))
            .where(Product.id == product_id)
        )
        product = result.scalar_one_or_none()
        if not product:
            raise NotFoundException("Product not found")
        return product

    async def create_product(self, data: ProductCreate) -> Product:
        existing = await self.db.execute(
            select(Product).where(Product.sku == data.sku)
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"Product with SKU '{data.sku}' already exists")

        product = Product(**data.model_dump())
        self.db.add(product)
        await self.db.flush()
        await self.db.refresh(product)
        return product

    async def update_product(self, product_id: uuid.UUID, data: ProductUpdate) -> Product:
        product = await self.get_product(product_id)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(product, key, value)
        await self.db.flush()
        await self.db.refresh(product)
        return product

    async def delete_product(self, product_id: uuid.UUID) -> Product:
        product = await self.get_product(product_id)
        product.status = "inactive"
        await self.db.flush()
        return product

    async def add_image(self, product_id: uuid.UUID, data: ProductImageCreate) -> ProductImage:
        await self.get_product(product_id)
        image = ProductImage(product_id=product_id, **data.model_dump())
        self.db.add(image)
        await self.db.flush()
        await self.db.refresh(image)
        return image

    async def remove_image(self, product_id: uuid.UUID, image_id: uuid.UUID) -> None:
        result = await self.db.execute(
            select(ProductImage).where(
                ProductImage.id == image_id, ProductImage.product_id == product_id
            )
        )
        image = result.scalar_one_or_none()
        if not image:
            raise NotFoundException("Image not found")
        await self.db.delete(image)
