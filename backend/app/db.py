"""Acceso a la base de datos con SQLAlchemy 2.x (creación perezosa)."""

from __future__ import annotations

from collections.abc import Iterator
from typing import TYPE_CHECKING

from sqlalchemy import MetaData, create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Base declarativa para los modelos ORM del proyecto."""

    metadata = MetaData(naming_convention=NAMING_CONVENTION)


_engine: Engine | None = None
_SessionLocal: sessionmaker[Session] | None = None


def _build_engine() -> Engine:
    global _engine, _SessionLocal
    if _engine is None:
        settings = get_settings()
        _engine = create_engine(settings.database_url, pool_pre_ping=True, future=True)
        _SessionLocal = sessionmaker(bind=_engine, autoflush=False, autocommit=False, future=True)
    return _engine


def get_engine() -> Engine:
    """Devuelve el engine, construyéndolo solo la primera vez."""
    return _build_engine()


def get_session_factory() -> sessionmaker[Session]:
    """Devuelve el sessionmaker, construyéndolo junto al engine."""
    _build_engine()
    assert _SessionLocal is not None
    return _SessionLocal


def session_dep() -> Iterator[Session]:
    """Dependencia FastAPI: abre y cierra una sesión por request."""
    factory = get_session_factory()
    session = factory()
    try:
        yield session
    finally:
        session.close()


if TYPE_CHECKING:  # pragma: no cover - solo tipado
    from sqlalchemy.orm import Session as _Session  # noqa: F401
