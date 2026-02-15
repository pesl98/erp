"""Seed script to populate the database with demo data."""
import asyncio
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import text
from app.database import async_session, engine, Base
from app.auth.models import User
from app.auth.service import hash_password
from app.products.models import Product, ProductCategory
from app.vendors.models import Vendor
from app.warehouse.models import Warehouse, Zone, Location
from app.inventory.models import StockLevel

# Import all models so Base.metadata is complete
from app.purchasing.models import PurchaseOrder, POLineItem, GoodsReceipt, GoodsReceiptItem  # noqa
from app.inventory.models import StockMovement, StockAdjustment  # noqa
from app.products.models import ProductImage, ProductVendor  # noqa


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # --- Users ---
        admin = User(
            email="admin@erp.local",
            hashed_password=hash_password("admin123"),
            full_name="Admin User",
            role="admin",
        )
        buyer = User(
            email="buyer@erp.local",
            hashed_password=hash_password("buyer123"),
            full_name="Buyer User",
            role="buyer",
        )
        session.add_all([admin, buyer])
        await session.flush()

        # --- Categories ---
        electronics = ProductCategory(name="Electronics")
        accessories = ProductCategory(name="Accessories")
        cables = ProductCategory(name="Cables & Adapters")
        session.add_all([electronics, accessories, cables])
        await session.flush()

        # --- Products ---
        products = [
            Product(sku="ELEC-001", name="Wireless Mouse", category_id=electronics.id, cost_price=12.50, reorder_point=50, reorder_quantity=100, unit_of_measure="each"),
            Product(sku="ELEC-002", name="Mechanical Keyboard", category_id=electronics.id, cost_price=45.00, reorder_point=30, reorder_quantity=50, unit_of_measure="each"),
            Product(sku="ELEC-003", name="USB-C Hub 7-in-1", category_id=electronics.id, cost_price=22.00, reorder_point=40, reorder_quantity=80, unit_of_measure="each"),
            Product(sku="ACC-001", name="Laptop Stand", category_id=accessories.id, cost_price=18.00, reorder_point=25, reorder_quantity=50, unit_of_measure="each"),
            Product(sku="ACC-002", name="Mousepad XL", category_id=accessories.id, cost_price=8.50, reorder_point=100, reorder_quantity=200, unit_of_measure="each"),
            Product(sku="CBL-001", name="USB-C to USB-A Cable 1m", category_id=cables.id, cost_price=3.50, reorder_point=200, reorder_quantity=500, unit_of_measure="each"),
            Product(sku="CBL-002", name="HDMI Cable 2m", category_id=cables.id, cost_price=5.00, reorder_point=150, reorder_quantity=300, unit_of_measure="each"),
            Product(sku="ELEC-004", name="Webcam 1080p", category_id=electronics.id, cost_price=28.00, reorder_point=20, reorder_quantity=40, unit_of_measure="each"),
        ]
        session.add_all(products)
        await session.flush()

        # --- Vendors ---
        vendors = [
            Vendor(code="VND-001", name="TechSupply Co.", contact_name="John Smith", email="john@techsupply.com", phone="+1-555-0101", payment_terms_days=30, lead_time_days=5, rating=4.5, city="New York", country="USA"),
            Vendor(code="VND-002", name="Global Electronics Ltd", contact_name="Jane Doe", email="jane@globalelec.com", phone="+1-555-0202", payment_terms_days=45, lead_time_days=10, rating=4.0, city="Los Angeles", country="USA"),
            Vendor(code="VND-003", name="Cable World Inc", contact_name="Bob Wilson", email="bob@cableworld.com", phone="+1-555-0303", payment_terms_days=15, lead_time_days=3, rating=3.5, city="Chicago", country="USA"),
        ]
        session.add_all(vendors)
        await session.flush()

        # --- Warehouse ---
        warehouse = Warehouse(code="WH-MAIN", name="Main Warehouse", address="123 Industrial Ave, City")
        session.add(warehouse)
        await session.flush()

        zone_recv = Zone(warehouse_id=warehouse.id, code="RECV", name="Receiving", zone_type="receiving")
        zone_a = Zone(warehouse_id=warehouse.id, code="STOR-A", name="Storage A", zone_type="storage")
        zone_b = Zone(warehouse_id=warehouse.id, code="STOR-B", name="Storage B", zone_type="storage")
        zone_ship = Zone(warehouse_id=warehouse.id, code="SHIP", name="Shipping", zone_type="shipping")
        session.add_all([zone_recv, zone_a, zone_b, zone_ship])
        await session.flush()

        locations = [
            Location(zone_id=zone_recv.id, code="RECV-01", label="Receiving Dock 1", max_capacity=500),
            Location(zone_id=zone_a.id, code="A-01-01", label="Aisle A, Shelf 1, Bin 1", max_capacity=200),
            Location(zone_id=zone_a.id, code="A-01-02", label="Aisle A, Shelf 1, Bin 2", max_capacity=200),
            Location(zone_id=zone_a.id, code="A-02-01", label="Aisle A, Shelf 2, Bin 1", max_capacity=200),
            Location(zone_id=zone_b.id, code="B-01-01", label="Aisle B, Shelf 1, Bin 1", max_capacity=300),
            Location(zone_id=zone_b.id, code="B-01-02", label="Aisle B, Shelf 1, Bin 2", max_capacity=300),
            Location(zone_id=zone_ship.id, code="SHIP-01", label="Shipping Dock 1", max_capacity=500),
        ]
        session.add_all(locations)
        await session.flush()

        # --- Stock Levels (some products have stock, some are below reorder point) ---
        stock_levels = [
            StockLevel(product_id=products[0].id, location_id=locations[1].id, quantity_on_hand=120),  # Mouse - OK
            StockLevel(product_id=products[1].id, location_id=locations[2].id, quantity_on_hand=15),   # Keyboard - LOW
            StockLevel(product_id=products[2].id, location_id=locations[3].id, quantity_on_hand=60),   # USB Hub - OK
            StockLevel(product_id=products[3].id, location_id=locations[4].id, quantity_on_hand=10),   # Laptop Stand - LOW
            StockLevel(product_id=products[4].id, location_id=locations[4].id, quantity_on_hand=180),  # Mousepad - OK
            StockLevel(product_id=products[5].id, location_id=locations[5].id, quantity_on_hand=80),   # USB Cable - LOW
            StockLevel(product_id=products[6].id, location_id=locations[5].id, quantity_on_hand=200),  # HDMI Cable - OK
            # Product 7 (Webcam) has NO stock - should trigger alert
        ]
        session.add_all(stock_levels)

        await session.commit()
        print("Seed data created successfully!")
        print("Login credentials:")
        print("  Admin: admin@erp.local / admin123")
        print("  Buyer: buyer@erp.local / buyer123")


if __name__ == "__main__":
    asyncio.run(seed())
