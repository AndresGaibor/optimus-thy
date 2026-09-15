import asyncio
import os
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from optimus_thy.modules.audit.application.service import AuditService
from optimus_thy.modules.audit.infrastructure.persistence.models import AuditEventModel
from optimus_thy.modules.auth.application.service import AuthService, InvalidCredentialsError
from optimus_thy.modules.auth.infrastructure.persistence.models import (
    InstitutionModel,
    RoleModel,
    SessionModel,
    UserModel,
)
from optimus_thy.modules.auth.infrastructure.persistence.repository import AuthRepository
from optimus_thy.shared.security.passwords import PasswordService
from optimus_thy.shared.security.session_tokens import hash_session_token

API_ROOT = Path(__file__).resolve().parents[1]
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
pytestmark = pytest.mark.integration
TEST_PASSWORD = "correct-password-123"


def _upgrade_head() -> None:
    if TEST_DATABASE_URL is None:
        pytest.skip("TEST_DATABASE_URL is required for auth service integration tests")
    env = os.environ.copy()
    env["DATABASE_URL"] = TEST_DATABASE_URL
    subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        cwd=API_ROOT,
        env=env,
        check=True,
    )


async def _create_user(
    session: AsyncSession,
    *,
    password_hash: str,
    active: bool = True,
) -> UserModel:
    institution = InstitutionModel(id=uuid4(), name=f"TES-7-{uuid4()}")
    role = RoleModel(id=uuid4(), code=f"medico-{uuid4()}", name="Médico")
    user = UserModel(
        id=uuid4(),
        institution_id=institution.id,
        role_id=role.id,
        email=f"auth-{uuid4()}@example.test",
        password_hash=password_hash,
        display_name="Médico de prueba",
        active=active,
    )
    session.add_all([institution, role, user])
    await session.flush()
    return user


class UpgradingPasswordService(PasswordService):
    def verify_and_update(self, password: str, stored_hash: str) -> tuple[bool, str | None]:
        if password == TEST_PASSWORD:
            return True, "$argon2id$upgraded-for-test"
        return False, None


async def _build_service(
    session: AsyncSession,
    *,
    password_service: PasswordService | None = None,
) -> AuthService:
    return AuthService(
        session=session,
        repository=AuthRepository(session),
        audit=AuditService(session),
        password_service=password_service or PasswordService(),
        session_ttl_seconds=8 * 60 * 60,
    )


async def _exercise_valid_login_lifecycle() -> None:
    assert TEST_DATABASE_URL is not None
    engine = create_async_engine(TEST_DATABASE_URL)
    password_service = PasswordService()
    try:
        async with engine.connect() as connection:
            transaction = await connection.begin()
            session = AsyncSession(bind=connection, expire_on_commit=False)
            user = await _create_user(
                session,
                password_hash=password_service.hash_password(TEST_PASSWORD),
            )
            service = await _build_service(session, password_service=password_service)

            result = await service.login(user.email, TEST_PASSWORD, "login-request")
            assert result.user.id == user.id
            assert result.user.email == user.email
            assert result.session_expires_at > datetime.now(UTC)

            stored_session = (
                await session.execute(select(SessionModel).where(SessionModel.user_id == user.id))
            ).scalar_one()
            assert stored_session.token_hash == hash_session_token(result.session_token)
            assert stored_session.token_hash != result.session_token

            authenticated = await service.authenticate_session(result.session_token)
            assert authenticated is not None
            assert authenticated.id == user.id

            await service.logout(result.session_token, "logout-request")
            assert await service.authenticate_session(result.session_token) is None

            actions = list(
                (
                    await session.execute(
                        select(AuditEventModel.action).where(
                            AuditEventModel.actor_user_id == user.id
                        )
                    )
                ).scalars()
            )
            assert "auth.login.success" in actions
            assert "auth.logout" in actions

            await session.close()
            await transaction.rollback()
    finally:
        await engine.dispose()


def test_valid_login_session_lifecycle() -> None:
    _upgrade_head()
    asyncio.run(_exercise_valid_login_lifecycle())


async def _exercise_invalid_login_cases() -> None:
    assert TEST_DATABASE_URL is not None
    engine = create_async_engine(TEST_DATABASE_URL)
    passwords = PasswordService()
    try:
        async with engine.connect() as connection:
            transaction = await connection.begin()
            session = AsyncSession(bind=connection, expire_on_commit=False)
            active_user = await _create_user(
                session, password_hash=passwords.hash_password(TEST_PASSWORD)
            )
            inactive_user = await _create_user(
                session,
                password_hash=passwords.hash_password(TEST_PASSWORD),
                active=False,
            )
            service = await _build_service(session, password_service=passwords)

            for email, password in (
                (active_user.email, "wrong-password-123"),
                (f"missing-{uuid4()}@example.test", TEST_PASSWORD),
                (inactive_user.email, TEST_PASSWORD),
            ):
                with pytest.raises(InvalidCredentialsError, match="Invalid credentials"):
                    await service.login(email, password, "failed-login-request")

            sessions = list((await session.execute(select(SessionModel))).scalars())
            assert sessions == []
            failed_actions = list(
                (
                    await session.execute(
                        select(AuditEventModel.action).where(
                            AuditEventModel.action == "auth.login.failed"
                        )
                    )
                ).scalars()
            )
            assert len(failed_actions) == 3

            await session.close()
            await transaction.rollback()
    finally:
        await engine.dispose()


def test_invalid_credentials_and_inactive_user_are_rejected() -> None:
    _upgrade_head()
    asyncio.run(_exercise_invalid_login_cases())


async def _exercise_hash_upgrade() -> None:
    assert TEST_DATABASE_URL is not None
    engine = create_async_engine(TEST_DATABASE_URL)
    try:
        async with engine.connect() as connection:
            transaction = await connection.begin()
            session = AsyncSession(bind=connection, expire_on_commit=False)
            user = await _create_user(session, password_hash="legacy-hash")
            service = await _build_service(
                session,
                password_service=UpgradingPasswordService(),
            )

            await service.login(user.email, TEST_PASSWORD, "upgrade-request")
            await session.refresh(user)

            assert user.password_hash == "$argon2id$upgraded-for-test"
            assert user.last_login_at is not None

            await session.close()
            await transaction.rollback()
    finally:
        await engine.dispose()


def test_login_upgrades_password_hash_and_tracks_last_login() -> None:
    _upgrade_head()
    asyncio.run(_exercise_hash_upgrade())
