from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from optimus_thy.modules.audit.application.service import AuditService
from optimus_thy.modules.auth.application.models import AuthUser, LoginResult
from optimus_thy.modules.auth.infrastructure.persistence.repository import (
    AuthRepository,
    AuthUserRecord,
)
from optimus_thy.shared.security.passwords import PasswordService
from optimus_thy.shared.security.session_tokens import (
    generate_session_token,
    hash_session_token,
)


class InvalidCredentialsError(Exception):
    def __init__(self) -> None:
        super().__init__("Invalid credentials")


class AuthService:
    def __init__(
        self,
        *,
        session: AsyncSession,
        repository: AuthRepository,
        audit: AuditService,
        password_service: PasswordService,
        session_ttl_seconds: int,
    ) -> None:
        self._session = session
        self._repository = repository
        self._audit = audit
        self._password_service = password_service
        self._session_ttl_seconds = session_ttl_seconds

    async def _record_failed_login(
        self,
        user: AuthUserRecord | None,
        request_id: str | None,
    ) -> None:
        await self._audit.record(
            action="auth.login.failed",
            resource_type="auth_session",
            actor_user_id=user.id if user is not None else None,
            actor_role=user.role if user is not None else None,
            allowed=False,
            request_id=request_id,
        )

    async def login(
        self,
        email: str,
        password: str,
        request_id: str | None,
    ) -> LoginResult:
        user = await self._repository.get_user_by_email(email.strip().lower())
        if user is None or not user.active:
            await self._record_failed_login(user, request_id)
            raise InvalidCredentialsError()

        try:
            valid, updated_hash = self._password_service.verify_and_update(
                password,
                user.password_hash,
            )
        except Exception:
            valid, updated_hash = False, None

        if not valid:
            await self._record_failed_login(user, request_id)
            raise InvalidCredentialsError()

        now = datetime.now(UTC)
        if updated_hash is not None:
            await self._repository.update_password_hash(user.id, updated_hash)
        await self._repository.update_last_login(user.id, now)

        raw_token = generate_session_token()
        expires_at = now + timedelta(seconds=self._session_ttl_seconds)
        session_id = await self._repository.create_session(
            user.id,
            hash_session_token(raw_token),
            expires_at,
        )
        await self._audit.record(
            action="auth.login.success",
            resource_type="auth_session",
            actor_user_id=user.id,
            actor_role=user.role,
            resource_id=str(session_id),
            request_id=request_id,
        )
        await self._session.flush()
        return LoginResult(
            user=AuthUser(
                id=user.id,
                email=user.email,
                display_name=user.display_name,
                role=user.role,
            ),
            session_token=raw_token,
            session_expires_at=expires_at,
        )

    async def authenticate_session(self, raw_token: str) -> AuthUser | None:
        record = await self._repository.get_session_user(
            hash_session_token(raw_token),
            datetime.now(UTC),
        )
        if record is None:
            return None
        return AuthUser(
            id=record.id,
            email=record.email,
            display_name=record.display_name,
            role=record.role,
        )

    async def logout(self, raw_token: str, request_id: str | None) -> None:
        user = await self.authenticate_session(raw_token)
        revoked = await self._repository.revoke_session(
            hash_session_token(raw_token),
            datetime.now(UTC),
        )
        if not revoked:
            return
        await self._audit.record(
            action="auth.logout",
            resource_type="auth_session",
            actor_user_id=user.id if user is not None else None,
            actor_role=user.role if user is not None else None,
            request_id=request_id,
        )
        await self._session.flush()
