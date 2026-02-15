from fastapi import Depends, Query
from pydantic import BaseModel

from app.auth.service import get_current_user
from app.auth.models import User


class PaginationParams(BaseModel):
    skip: int = 0
    limit: int = 20


def get_pagination(
    skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100)
) -> PaginationParams:
    return PaginationParams(skip=skip, limit=limit)


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        from app.exceptions import ForbiddenException
        raise ForbiddenException(detail="Inactive user")
    return current_user
