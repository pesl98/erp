from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.auth.router import router as auth_router
from app.products.router import router as products_router
from app.vendors.router import router as vendors_router
from app.warehouse.router import router as warehouse_router
from app.purchasing.router import router as purchasing_router
from app.inventory.router import router as inventory_router
from app.reporting.router import router as reporting_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Webshop ERP",
    description="ERP backend for webshop operations",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(products_router, prefix="/api/v1", tags=["Products"])
app.include_router(vendors_router, prefix="/api/v1", tags=["Vendors"])
app.include_router(warehouse_router, prefix="/api/v1", tags=["Warehouse"])
app.include_router(purchasing_router, prefix="/api/v1", tags=["Purchasing"])
app.include_router(inventory_router, prefix="/api/v1", tags=["Inventory"])
app.include_router(reporting_router, prefix="/api/v1", tags=["Dashboard & Reports"])


@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy"}
