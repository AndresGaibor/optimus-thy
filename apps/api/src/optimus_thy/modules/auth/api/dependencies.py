from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi.security import APIKeyCookie
from fastapi import Depends, HTTPException, Request, Security, status
from sqlalchemy.ext.asyncio import AsyncSession

from optimus_thy.config.settings import get_settings
from optimus_thy.modules.audit.application.service import AuditService
from optimus_thy.modules.auth.application.models import AuthUser
from optimus_thy.modules.auth.application.service import AuthService
from optimus_thy.modules.auth.infrastructure.persistence.repository import AuthRepository
from optimus_thy.shared.database.session import get_async_session
from optimus_thy.shared.security.passwords import PasswordService


_SESSION_COOKIE_SCHEME = APIKeyCookie(
    name=get_settings().auth_cookie_name,
    scheme_name="SessionCookie",
    description="Opaque server-side session cookie.",
    auto_error=False,
)


async def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_async_session)],
) -> AuthService:
    settings = get_settings()
    return AuthService(
        session=session,
        repository=AuthRepository(session),
        audit=AuditService(session),
        password_service=PasswordService(),
        session_ttl_seconds=settings.auth_session_ttl_seconds,
    )


AuthServiceDependency = Annotated[AuthService, Depends(get_auth_service)]
SessionDependency = Annotated[AsyncSession, Depends(get_async_session)]
SessionTokenDependency = Annotated[str | None, Security(_SESSION_COOKIE_SCHEME)]


async def get_current_user(
    service: AuthServiceDependency,
    token: SessionTokenDependency,
) -> AuthUser:
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    user = await service.authenticate_session(token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    return user


CurrentUserDependency = Annotated[AuthUser, Depends(get_current_user)]


_ALLOWED_ROLES = frozenset({"medico", "investigador", "administrador"})


def require_roles(*allowed_roles: str) -> Callable[..., Awaitable[AuthUser]]:
    if not allowed_roles:
        raise ValueError("at least one allowed role is required")
    unknown_roles = set(allowed_roles) - _ALLOWED_ROLES
    if unknown_roles:
        raise ValueError(f"unknown roles: {sorted(unknown_roles)}")

    async def role_dependency(
        request: Request,
        user: CurrentUserDependency,
        session: SessionDependency,
    ) -> AuthUser:
        if user.role in allowed_roles:
            return user

        audit = AuditService(session)
        await audit.record(
            action="auth.access.denied",
            resource_type="route",
            actor_user_id=user.id,
            actor_role=user.role,
            resource_id=request.url.path,
            allowed=False,
            request_id=getattr(request.state, "request_id", None),
        )
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden",
        )

    return role_dependency
