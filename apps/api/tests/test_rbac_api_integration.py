import asyncio
import os
import subprocess
import sys
from pathlib import Path
from typing import Annotated
from uuid import uuid4

import httpx2
import pytest
from fastapi import Depends, FastAPI
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from optimus_thy.config.settings import get_settings
from optimus_thy.main import create_app
from optimus_thy.modules.audit.infrastructure.persistence.models import AuditEventModel
from optimus_thy.modules.auth.api.dependencies import require_roles
from optimus_thy.modules.auth.application.models import AuthUser
from optimus_thy.modules.auth.infrastructure.persistence.models import (
    InstitutionModel,
    RoleModel,
    UserModel,
)
from optimus_thy.shared.database.session import dispose_database_connections
from optimus_thy.shared.security.passwords import PasswordService

API_ROOT = Path(__file__).resolve().parents[1]
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
TEST_PASSWORD = "correct-password-123"
pytestmark = pytest.mark.integration
AdminOnlyDependency = Annotated[AuthUser, Depends(require_roles("administrador"))]


def _upgrade_head() -> None:
    if TEST_DATABASE_URL is None:
        pytest.skip("TEST_DATABASE_URL is required for RBAC integration tests")
    env = os.environ.copy()
    env["DATABASE_URL"] = TEST_DATABASE_URL
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=API_ROOT,
        env=env,
        check=True,
    )


def _configure_test_database() -> None:
    assert TEST_DATABASE_URL is not None
    os.environ["DATABASE_URL"] = TEST_DATABASE_URL
    os.environ["AUTH_COOKIE_SECURE"] = "false"
    get_settings.cache_clear()


async def _create_user(role_code: str) -> UserModel:
    assert TEST_DATABASE_URL is not None
    engine = create_async_engine(TEST_DATABASE_URL)
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            role = (
                await session.execute(select(RoleModel).where(RoleModel.code == role_code))
            ).scalar_one_or_none()
            if role is None:
                role = RoleModel(id=uuid4(), code=role_code, name=role_code.title())
                session.add(role)
            institution = InstitutionModel(id=uuid4(), name=f"RBAC-{uuid4()}")
            user = UserModel(
                id=uuid4(),
                institution_id=institution.id,
                role_id=role.id,
                email=f"rbac-{uuid4()}@example.test",
                password_hash=PasswordService().hash_password(TEST_PASSWORD),
                display_name=f"Usuario {role_code}",
                active=True,
            )
            session.add_all([institution, user])
            await session.commit()
            return user
    finally:
        await engine.dispose()


def _protected_app() -> FastAPI:
    application = create_app()

    @application.get("/test/admin-only")
    async def admin_only(
        user: AdminOnlyDependency,
    ) -> dict[str, str]:
        return {"role": user.role}

    return application


async def _login(client: httpx2.AsyncClient, user: UserModel) -> None:
    response = await client.post(
        "/auth/login",
        json={"email": user.email, "password": TEST_PASSWORD},
    )
    assert response.status_code == 200


async def _exercise_unauthenticated_denial() -> None:
    transport = httpx2.ASGITransport(app=_protected_app())
    try:
        async with httpx2.AsyncClient(transport=transport, base_url="http://testserver") as client:
            response = await client.get("/test/admin-only")
        assert response.status_code == 401
    finally:
        await dispose_database_connections()


async def _exercise_role_denial_audit() -> None:
    assert TEST_DATABASE_URL is not None
    doctor = await _create_user("medico")
    transport = httpx2.ASGITransport(app=_protected_app())
    try:
        async with httpx2.AsyncClient(transport=transport, base_url="http://testserver") as client:
            await _login(client, doctor)
            response = await client.get(
                "/test/admin-only",
                headers={"X-Request-ID": "rbac-denied-001", "X-Role": "administrador"},
            )
        assert response.status_code == 403

        engine = create_async_engine(TEST_DATABASE_URL)
        try:
            async with AsyncSession(engine) as session:
                event = (
                    await session.execute(
                        select(AuditEventModel).where(
                            AuditEventModel.action == "auth.access.denied",
                            AuditEventModel.request_id == "rbac-denied-001",
                            AuditEventModel.actor_user_id == doctor.id,
                        )
                    )
                ).scalar_one()
                assert event.actor_user_id == doctor.id
                assert event.actor_role == "medico"
                assert event.allowed is False
                assert event.resource_type == "route"
                assert event.resource_id == "/test/admin-only"
        finally:
            await engine.dispose()
    finally:
        await dispose_database_connections()


async def _exercise_allowed_admin() -> None:
    administrator = await _create_user("administrador")
    transport = httpx2.ASGITransport(app=_protected_app())
    try:
        async with httpx2.AsyncClient(transport=transport, base_url="http://testserver") as client:
            await _login(client, administrator)
            response = await client.get("/test/admin-only")
        assert response.status_code == 200
        assert response.json() == {"role": "administrador"}
    finally:
        await dispose_database_connections()


def test_unauthenticated_role_guard_returns_401() -> None:
    _upgrade_head()
    _configure_test_database()
    asyncio.run(_exercise_unauthenticated_denial())


def test_authenticated_wrong_role_returns_403_and_is_audited() -> None:
    _upgrade_head()
    _configure_test_database()
    asyncio.run(_exercise_role_denial_audit())


def test_authenticated_allowed_role_passes_guard() -> None:
    _upgrade_head()
    _configure_test_database()
    asyncio.run(_exercise_allowed_admin())
