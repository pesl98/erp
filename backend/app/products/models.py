import uuid
from datetime import datetime

from sqlalchemy import TIMESTAMP, Boolean, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin


class ProductCategory(TimestampMixin, Base):
    __tablename__ = "product_categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_categories.id"), nullable=True
    )

    children: Mapped[list["ProductCategory"]] = relationship("ProductCategory", back_populates="parent")
    parent: Mapped["ProductCategory | None"] = relationship(
        "ProductCategory", back_populates="children", remote_side="ProductCategory.id"
    )
    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(TimestampMixin, Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sku: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_categories.id"), nullable=True
    )
    unit_of_measure: Mapped[str] = mapped_column(String(20), nullable=False, default="each")
    weight_kg: Mapped[float | None] = mapped_column(Numeric(10, 3), nullable=True)
    length_cm: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    width_cm: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    height_cm: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    barcode: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(10), nullable=False, default="active")
    reorder_point: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reorder_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cost_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    category: Mapped["ProductCategory | None"] = relationship(back_populates="products")
    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product", cascade="all, delete-orphan"
    )
    vendor_links: Mapped[list["ProductVendor"]] = relationship(
        "ProductVendor", back_populates="product", cascade="all, delete-orphan"
    )


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    product: Mapped["Product"] = relationship(back_populates="images")


class ProductVendor(Base):
    __tablename__ = "product_vendors"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id"), nullable=False
    )
    vendor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vendors.id"), nullable=False
    )
    vendor_sku: Mapped[str | None] = mapped_column(String(50), nullable=True)
    unit_cost: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    is_preferred: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), nullable=False
    )

    product: Mapped["Product"] = relationship(back_populates="vendor_links")
    vendor: Mapped["Vendor"] = relationship(back_populates="product_links")

    __table_args__ = (
        UniqueConstraint("product_id", "vendor_id", name="uq_product_vendor"),
    )
