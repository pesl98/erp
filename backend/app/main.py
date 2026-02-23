import logging
import time
from collections import defaultdict
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.auth.router import router as auth_router
from app.products.router import router as products_router
from app.vendors.router import router as vendors_router
from app.warehouse.router import router as warehouse_router
from app.purchasing.router import router as purchasing_router
from app.inventory.router import router as inventory_router
from app.reporting.router import router as reporting_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

# Simple in-memory rate limiter for auth endpoints
_rate_limit_store: dict[str, list[float]] = defaultdict(list)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX_REQUESTS = 10  # per window


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application starting up")
    yield
    logger.info("Application shutting down")


app = FastAPI(
    title="Webshop ERP",
    description="ERP backend for webshop operations",
    version="1.0.0",
    lifespan=lifespan,
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error("Validation error for %s %s: %s", request.method, request.url.path, exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def rate_limit_auth(request: Request, call_next):
    """Rate limit auth endpoints (login, register, refresh) to prevent brute force."""
    if request.url.path.startswith("/api/v1/auth/") and request.method == "POST":
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        # Prune old entries for this IP
        _rate_limit_store[client_ip] = [
            t for t in _rate_limit_store[client_ip] if now - t < RATE_LIMIT_WINDOW
        ]
        # Periodically evict IPs that have no recent requests to prevent memory growth
        if len(_rate_limit_store) > 10_000:
            stale_ips = [ip for ip, ts in _rate_limit_store.items() if not ts]
            for ip in stale_ips:
                del _rate_limit_store[ip]
        if len(_rate_limit_store[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
            logger.warning("Rate limit exceeded for %s on %s", client_ip, request.url.path)
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many requests. Please try again later."},
            )
        _rate_limit_store[client_ip].append(now)
    return await call_next(request)


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
