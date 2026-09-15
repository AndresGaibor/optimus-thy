import asyncio
import os
import subprocess
import sys
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from optimus_thy.modules.audit.application.service import AuditService
from optimus_thy.modules.audit.infrastructure.persistence.models import AuditEventModel
from optimus_thy.modules.auth.infrastructure.persistence.models import (
    InstitutionModel,
    RoleModel,
    UserModel,
)
from optimus_thy.modules.auth.infrastructure.persistence.repository import AuthRepository

API_ROOT = Path(__file__).resolve().parents[1]
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
pytestmark = pytest.mark.integration


def _upgrade_head() -> None:
    if TEST_DATABASE_URL is None:
        pytest.skip("TEST_DATABASE_URL is required for auth repository integration tests")
    env = os.environ.copy()
    env["DATABASE_URL"] = TEST_DATABASE_URL
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"], cwd=API_ROOT, env=env, check=True
    )


async def _seed_user(session: AsyncSession, *, role_code: str = "medico") -> UserModel:
    institution = InstitutionModel(id=uuid4(), name="TES-7")
    role = RoleModel(id=uuid4(), code=f"{role_code}-{uuid4()}", name=role_code.title())
    user = UserModel(
        id=uuid4(),
        institution_id=institution.id,
        role_id=role.id,
        email=f"user-{uuid4()}@example.test",
        password_hash="$argon2id$test-hash",
        display_name="Usuario de prueba",
        active=True,
    )
    session.add_all([institution, role, user])
    await session.flush()
    user._test_role_code = role.code  # type: ignore[attr-defined]
    return user


async def _exercise_repository() -> None:
    assert TEST_DATABASE_URL is not None
    engine = create_async_engine(TEST_DATABASE_URL)
    try:
        async with engine.connect() as connection:
            transaction = await connection.begin()
            session = AsyncSession(bind=connection, expire_on_commit=False)
            user = await _seed_user(session)
            repo = AuthRepository(session)
            record = await repo.get_user_by_email(user.email)
            assert record is not None
            assert record.id == user.id
            assert record.password_hash == user.password_hash
            assert record.role.startswith("medico-")

            now = datetime.now(UTC)
            await repo.create_session(user.id, "active-hash", now + timedelta(hours=1))
            active = await repo.get_session_user("active-hash", now)
            assert active is not None
            assert active.id == user.id
            assert active.role == record.role

            await repo.create_session(user.id, "expired-hash", now - timedelta(seconds=1))
            assert await repo.get_session_user("expired-hash", now) is None

            assert await repo.revoke_session("active-hash", now) is True
            assert await repo.get_session_user("active-hash", now) is None
            assert await repo.revoke_session("active-hash", now) is False

            audit = AuditService(session)
            await audit.record(
                action="auth.access.denied",
                resource_type="route",
                actor_user_id=user.id,
                actor_role=record.role,
                active_view=None,
                allowed=False,
                request_id="tes7-repository-test",
            )
            event = (
                await session.execute(
                    select(AuditEventModel).where(
                        AuditEventModel.request_id == "tes7-repository-test"
                    )
                )
            ).scalar_one()
            assert event.actor_user_id == user.id
            assert event.actor_role == record.role
            assert event.active_view is None
            assert event.allowed is False

            await session.close()
            await transaction.rollback()
    finally:
        await engine.dispose()


def test_repository_sessions_and_audit_writer() -> None:
    _upgrade_head()
    asyncio.run(_exercise_repository())
