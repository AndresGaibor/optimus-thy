import asyncio
import os
import subprocess
import sys
from collections.abc import Awaitable
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

import httpx2
import pytest
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from optimus_thy.config.settings import get_settings
from optimus_thy.main import create_app
from optimus_thy.modules.auth.infrastructure.persistence.models import (
    InstitutionModel,
    RoleModel,
    SessionModel,
    UserModel,
)
from optimus_thy.shared.database.session import (
    _session_factory,
    dispose_database_connections,
)
from optimus_thy.shared.security.passwords import PasswordService

API_ROOT = Path(__file__).resolve().parents[1]
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
pytestmark = pytest.mark.integration
TEST_PASSWORD = "correct-password-123"


def _upgrade_head() -> None:
    if TEST_DATABASE_URL is None:
        pytest.skip("TEST_DATABASE_URL is required for auth API integration tests")
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
    _session_factory.cache_clear()


async def _run_with_database_cleanup(coro: Awaitable[object]) -> None:
    try:
        await coro
    finally:
        await dispose_database_connections()


async def _create_user(*, active: bool = True, role: str = "medico") -> UserModel:
    assert TEST_DATABASE_URL is not None
    engine = create_async_engine(TEST_DATABASE_URL)
    try:
        async with AsyncSession(engine, expire_on_commit=False) as session:
            institution = InstitutionModel(id=uuid4(), name=f"API-{uuid4()}")
            role_model = RoleModel(id=uuid4(), code=f"{role}-{uuid4()}", name=role)
            user = UserModel(
                id=uuid4(),
                institution_id=institution.id,
                role_id=role_model.id,
                email=f"api-{uuid4()}@example.test",
                password_hash=PasswordService().hash_password(TEST_PASSWORD),
                display_name="Usuario API",
                active=active,
            )
            session.add_all([institution, role_model, user])
            await session.commit()
            return user
    finally:
        await engine.dispose()


async def _exercise_login_me_logout() -> None:
    user = await _create_user()
    transport = httpx2.ASGITransport(app=create_app())
    async with httpx2.AsyncClient(transport=transport, base_url="http://testserver") as client:
        login = await client.post(
            "/auth/login",
            json={"email": user.email, "password": TEST_PASSWORD},
        )
        assert login.status_code == 200
        assert set(login.json()) == {"id", "email", "display_name", "role"}
        assert login.json()["id"] == str(user.id)
        assert "session_token" not in login.text
        set_cookie = login.headers["set-cookie"].lower()
        assert "httponly" in set_cookie
        assert "samesite=strict" in set_cookie
        assert "path=/" in set_cookie
        assert "domain=" not in set_cookie
        assert "secure" not in set_cookie

        me = await client.get("/auth/me")
        assert me.status_code == 200
        assert me.json()["id"] == str(user.id)

        logout = await client.post("/auth/logout")
        assert logout.status_code == 204
        assert "max-age=0" in logout.headers["set-cookie"].lower()

        after_logout = await client.get("/auth/me")
        assert after_logout.status_code == 401


def test_login_me_logout_cookie_contract() -> None:
    _upgrade_head()
    _configure_test_database()
    asyncio.run(_run_with_database_cleanup(_exercise_login_me_logout()))


async def _exercise_invalid_login_responses() -> None:
    inactive_user = await _create_user(active=False)
    transport = httpx2.ASGITransport(app=create_app())
    async with httpx2.AsyncClient(transport=transport, base_url="http://testserver") as client:
        responses = [
            await client.post(
                "/auth/login",
                json={"email": f"missing-{uuid4()}@example.test", "password": TEST_PASSWORD},
            ),
            await client.post(
                "/auth/login",
                json={"email": inactive_user.email, "password": TEST_PASSWORD},
            ),
            await client.post(
                "/auth/login",
                json={"email": inactive_user.email, "password": "wrong-password-123"},
            ),
        ]

    assert {response.status_code for response in responses} == {401}
    assert {response.json()["detail"] for response in responses} == {"Invalid credentials"}


def test_invalid_and_inactive_logins_share_generic_401() -> None:
    _upgrade_head()
    _configure_test_database()
    asyncio.run(_run_with_database_cleanup(_exercise_invalid_login_responses()))


async def _exercise_expired_session_and_secret_safety() -> None:
    assert TEST_DATABASE_URL is not None
    user = await _create_user()
    transport = httpx2.ASGITransport(app=create_app())
    async with httpx2.AsyncClient(transport=transport, base_url="http://testserver") as client:
        login = await client.post(
            "/auth/login",
            json={"email": user.email, "password": TEST_PASSWORD},
        )
        assert login.status_code == 200
        raw_token = client.cookies.get("optimus_thy_session")
        assert raw_token is not None

        engine = create_async_engine(TEST_DATABASE_URL)
        try:
            async with AsyncSession(engine) as session:
                stored = (
                    await session.execute(
                        select(SessionModel).where(SessionModel.user_id == user.id)
                    )
                ).scalar_one()
                assert stored.token_hash != raw_token
                await session.execute(
                    update(SessionModel)
                    .where(SessionModel.id == stored.id)
                    .values(expires_at=datetime.now(UTC) - timedelta(seconds=1))
                )
                await session.commit()
        finally:
            await engine.dispose()

        expired = await client.get("/auth/me")
        assert expired.status_code == 401


def test_expired_session_is_rejected_and_raw_token_is_not_persisted() -> None:
    _upgrade_head()
    _configure_test_database()
    asyncio.run(_run_with_database_cleanup(_exercise_expired_session_and_secret_safety()))
