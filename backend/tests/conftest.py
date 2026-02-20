import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
import uuid

from app.main import app
from app.database import get_db
from app.config import settings
from app.dependencies import get_current_active_user
from app.auth.models import User

# Using the main test database URL
engine = create_async_engine(settings.DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture
async def db_session() -> AsyncSession: # type: ignore
    async with engine.begin() as connection:
        # Start a transaction and nested transaction for rollback
        transaction = await connection.begin_nested()
        
        async_session = TestingSessionLocal(bind=connection)
        
        yield async_session
        
        await async_session.close()
        # Rollback the transaction to maintain a clean database state
        if transaction.is_active:
             await transaction.rollback()
        await connection.rollback()

@pytest.fixture
def override_user():
    return User(
        id=uuid.uuid4(),
        email="test@example.com",
        username="testuser",
        hashed_password="foo",
        is_active=True,
        is_superuser=True
    )

@pytest.fixture
async def client(db_session: AsyncSession, override_user: User):
    async def override_get_db():
        yield db_session

    async def override_get_current_active_user():
        return override_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_current_active_user
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
        
    app.dependency_overrides.clear()
