from collections.abc import AsyncIterator
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from optimus_thy.config.settings import get_settings


@lru_cache
def _engine(database_url: str) -> AsyncEngine:
    return create_async_engine(database_url, pool_pre_ping=True)


@lru_cache
def _session_factory(database_url: str) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(_engine(database_url), expire_on_commit=False)


async def get_async_session() -> AsyncIterator[AsyncSession]:
    database_url = get_settings().database_url
    if database_url is None:
        raise RuntimeError("DATABASE_URL is required")

    factory = _session_factory(database_url)
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def dispose_database_connections() -> None:
    database_url = get_settings().database_url
    if database_url is None:
        return
    await _engine(database_url).dispose()
    _session_factory.cache_clear()
    _engine.cache_clear()
