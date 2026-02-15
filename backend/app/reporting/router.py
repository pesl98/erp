from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import User
from app.database import get_db
from app.dependencies import get_current_active_user

from .service import ReportingService

router = APIRouter()


@router.get("/dashboard/kpis")
async def get_dashboard_kpis(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = ReportingService(db)
    return await service.get_dashboard_kpis()


@router.get("/dashboard/recent-activity")
async def get_recent_activity(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
    limit: int = Query(20, ge=1, le=50),
):
    service = ReportingService(db)
    return await service.get_recent_activity(limit)


@router.get("/reports/stock-summary")
async def get_stock_summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = ReportingService(db)
    return await service.get_stock_summary()


@router.get("/reports/purchase-history")
async def get_purchase_history(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
    days: int = Query(90, ge=1, le=365),
):
    service = ReportingService(db)
    return await service.get_purchase_history(days)


@router.get("/reports/vendor-performance")
async def get_vendor_performance(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    service = ReportingService(db)
    return await service.get_vendor_performance()
