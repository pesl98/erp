import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio(loop_scope="session")

async def test_create_product(client: AsyncClient):
    payload = {
        "sku": "TEST-SKU-1",
        "name": "Test Product",
        "description": "It is a test product",
        "unit_of_measure": "each",
        "status": "active"
    }
    response = await client.post("/api/v1/products", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["sku"] == payload["sku"]
    assert data["name"] == payload["name"]
    assert "id" in data

async def test_list_products(client: AsyncClient):
    # First create a product
    payload = {
        "sku": "TEST-SKU-2",
        "name": "Test Product 2",
        "unit_of_measure": "each",
        "status": "active"
    }
    await client.post("/api/v1/products", json=payload)
    
    # List products
    response = await client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) >= 1
    assert data["total"] >= 1

async def test_get_product(client: AsyncClient):
    # Prepare data
    payload = {
        "sku": "TEST-SKU-3",
        "name": "Test Product 3",
        "unit_of_measure": "each",
        "status": "active"
    }
    create_resp = await client.post("/api/v1/products", json=payload)
    assert create_resp.status_code == 201
    product_id = create_resp.json()["id"]
    
    # Fetch it
    response = await client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == product_id
    assert data["sku"] == payload["sku"]
