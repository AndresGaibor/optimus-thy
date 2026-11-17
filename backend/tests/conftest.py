"""Configuración de tests con base de datos."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker

from app import models  # noqa: F401
from app.config import get_settings
from app.db import Base
from app.models.usuarios import Rol
from app.security.permisos import PERMISOS, PERMISOS_POR_ROL


@event.listens_for(Rol, "after_insert")
def _permisos_de_los_roles_base(mapper, connection, rol) -> None:
    """Los tests vacían la base y crean sus roles a mano: les damos la matriz base."""
    if rol.nombre not in PERMISOS_POR_ROL:
        return
    for codigo, descripcion in PERMISOS.items():
        connection.execute(
            text(
                "INSERT INTO permisos (codigo, descripcion) VALUES (:c, :d) "
                "ON CONFLICT (codigo) DO NOTHING"
            ),
            {"c": codigo, "d": descripcion},
        )
    for codigo in PERMISOS_POR_ROL[rol.nombre]:
        connection.execute(
            text(
                "INSERT INTO roles_permisos (rol_id, permiso_id) "
                "SELECT :r, id FROM permisos WHERE codigo = :c ON CONFLICT DO NOTHING"
            ),
            {"r": rol.id, "c": codigo},
        )


def pytest_configure(config: pytest.Config) -> None:
    """Deja el entorno listo antes de que se importen los módulos de prueba.

    El limitador de HT-082 va apagado por defecto en la suite: las pruebas que
    lo ejercitan crean su propia app con otro valor y limpian la caché de
    ``get_settings``. Se fija aquí (y no al importar ``app.main``) para que las
    apps creadas en el arranque y en las fixtures ya lo lean desactivado.
    """
    os.environ.setdefault("RATE_LIMIT_POR_MINUTO", "0")
    os.environ.setdefault("INFERENCIA_POR_MINUTO", "0")
    get_settings.cache_clear()
    if os.environ.get("REQUIRE_TEST_DB") == "1" and not os.environ.get("TEST_DATABASE_URL"):
        raise pytest.UsageError(
            "REQUIRE_TEST_DB=1 pero TEST_DATABASE_URL no está definida. "
            "Usa `make db-test` y exporta la variable que imprime."
        )


def _get_test_db_url() -> str | None:
    return os.environ.get("TEST_DATABASE_URL")


@pytest.fixture(scope="session")
def test_engine():
    db_url = _get_test_db_url()
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")
    engine = create_engine(db_url, pool_pre_ping=True)
    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def _apply_migrations_once(test_engine):
    from alembic.config import Config

    from alembic import command

    cfg = Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(os.path.dirname(__file__), "..", "alembic"))
    cfg.set_main_option("sqlalchemy.url", test_engine.url.render_as_string(hide_password=False))
    command.upgrade(cfg, "head")


@pytest.fixture()
def db_session(test_engine):
    TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(autouse=True)
def _clean_db(test_engine):
    with test_engine.begin() as conn:
        tables = []
        for table in reversed(Base.metadata.sorted_tables):
            if table.name == "alembic_version":
                continue
            tables.append(f'"{table.name}"')
        if tables:
            conn.execute(text(f"TRUNCATE {', '.join(tables)} RESTART IDENTITY CASCADE"))
    yield
    with test_engine.begin() as conn:
        tables = []
        for table in reversed(Base.metadata.sorted_tables):
            if table.name == "alembic_version":
                continue
            tables.append(f'"{table.name}"')
        if tables:
            conn.execute(text(f"TRUNCATE {', '.join(tables)} RESTART IDENTITY CASCADE"))


@pytest.fixture()
def client(test_engine):
    from app.db import session_dep
    from app.main import app as app_global
    from app.main import create_app

    app_instance = create_app()
    TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)

    def _override_session():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app_instance.dependency_overrides[session_dep] = _override_session
    app_global.dependency_overrides[session_dep] = _override_session

    with TestClient(app_instance) as c:
        yield c


@pytest.fixture()
def bare_app(test_engine):
    from app.db import session_dep
    from app.main import app as app_global
    from app.main import create_app

    app_instance = create_app()
    TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)

    def _override_session():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app_instance.dependency_overrides[session_dep] = _override_session
    app_global.dependency_overrides[session_dep] = _override_session
    return app_instance
