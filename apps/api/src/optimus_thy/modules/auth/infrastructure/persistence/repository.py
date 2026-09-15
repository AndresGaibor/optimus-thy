from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from optimus_thy.modules.auth.infrastructure.persistence.models import (
    RoleModel,
    SessionModel,
    UserModel,
)


@dataclass(frozen=True, slots=True)
class AuthUserRecord:
    id: UUID
    email: str
    display_name: str
    role: str
    password_hash: str
    active: bool


@dataclass(frozen=True, slots=True)
class AuthenticatedUser:
    id: UUID
    email: str
    display_name: str
    role: str


class AuthRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_user_by_email(self, email: str) -> AuthUserRecord | None:
        statement = (
            select(
                UserModel.id,
                UserModel.email,
                UserModel.display_name,
                RoleModel.code,
                UserModel.password_hash,
                UserModel.active,
            )
            .join(RoleModel, UserModel.role_id == RoleModel.id)
            .where(UserModel.email == email)
        )
        row = (await self._session.execute(statement)).one_or_none()
        if row is None:
            return None
        return AuthUserRecord(
            id=row.id,
            email=row.email,
            display_name=row.display_name,
            role=row.code,
            password_hash=row.password_hash,
            active=row.active,
        )

    async def update_password_hash(self, user_id: UUID, password_hash: str) -> None:
        await self._session.execute(
            update(UserModel).where(UserModel.id == user_id).values(password_hash=password_hash)
        )

    async def update_last_login(self, user_id: UUID, last_login_at: datetime) -> None:
        await self._session.execute(
            update(UserModel).where(UserModel.id == user_id).values(last_login_at=last_login_at)
        )

    async def create_session(
        self,
        user_id: UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> UUID:
        model = SessionModel(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self._session.add(model)
        await self._session.flush()
        return model.id

    async def get_session_user(
        self,
        token_hash: str,
        now: datetime,
    ) -> AuthenticatedUser | None:
        statement = (
            select(UserModel.id, UserModel.email, UserModel.display_name, RoleModel.code)
            .join(SessionModel, SessionModel.user_id == UserModel.id)
            .join(RoleModel, UserModel.role_id == RoleModel.id)
            .where(
                SessionModel.token_hash == token_hash,
                SessionModel.revoked_at.is_(None),
                SessionModel.expires_at > now,
                UserModel.active.is_(True),
            )
        )
        row = (await self._session.execute(statement)).one_or_none()
        if row is None:
            return None
        return AuthenticatedUser(
            id=row.id,
            email=row.email,
            display_name=row.display_name,
            role=row.code,
        )

    async def revoke_session(self, token_hash: str, revoked_at: datetime) -> bool:
        statement = (
            update(SessionModel)
            .where(SessionModel.token_hash == token_hash, SessionModel.revoked_at.is_(None))
            .values(revoked_at=revoked_at)
            .returning(SessionModel.id)
        )
        return (await self._session.execute(statement)).scalar_one_or_none() is not None
