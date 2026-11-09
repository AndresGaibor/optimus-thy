"""Configuración de tests con base de datos."""

from __future__ import annotations

import contextlib
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker

from app import models  # noqa: F401
from app.db import Base
from app.main import app, create_app
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
    """En CI y en `make check` saltarse las pruebas de BD es un error, no un «verde»."""
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
    app_instance = create_app()
    TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)

    def _override_session():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    try:
        from app import db as app_db

        app_instance.dependency_overrides[app_db.session_dep] = _override_session
    except Exception:
        pass

    with contextlib.suppress(Exception):
        app_instance.dependency_overrides[app_db.session_dep] = _override_session

    # Also override in the global app if different
    with contextlib.suppress(Exception):
        app.dependency_overrides[__import__("app.db", fromlist=["session_dep"]).session_dep] = (
            _override_session
        )

    app_instance.dependency_overrides = getattr(app_instance, "dependency_overrides", {})
    # try to import and override common dependency names
    try:
        from app.db import session_dep as session_dep_app

        app_instance.dependency_overrides[session_dep_app] = _override_session
    except Exception:
        pass

    try:
        import app.auth.deps as auth_deps

        # If there is a session dependency used by auth, try to override by common patterns
        for name in dir(auth_deps):
            getattr(auth_deps, name)
            # not obvious; we'll also rely on routes using session_dep from app.db
    except Exception:
        pass

    # Ensure using app.db.session_dep
    try:
        from app import db as app_db_mod

        app_instance.dependency_overrides[app_db_mod.session_dep] = _override_session
        app.dependency_overrides[app_db_mod.session_dep] = _override_session
    except Exception:
        pass

    with TestClient(app_instance) as c:
        yield c


@pytest.fixture()
def bare_app(test_engine):
    app_instance = create_app()
    TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)

    def _override_session():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    try:
        from app import db as app_db_mod

        app_instance.dependency_overrides[app_db_mod.session_dep] = _override_session
        app.dependency_overrides[app_db_mod.session_dep] = _override_session
    except Exception:
        pass
    return app_instance
