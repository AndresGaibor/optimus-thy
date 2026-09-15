from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from optimus_thy.config.settings import get_settings


@lru_cache
def _session_factory(database_url: str) -> async_sessionmaker[AsyncSession]:
    engine = create_async_engine(database_url, pool_pre_ping=True)
    return async_sessionmaker(engine, expire_on_commit=False)


async def get_async_session() -> AsyncIterator[AsyncSession]:
    database_url = get_settings().database_url
    if database_url is None:
        raise RuntimeError("DATABASE_URL is required")

    factory = _session_factory(database_url)
    async with factory() as session:
        yield session
