from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from optimus_thy.config.settings import get_settings
from optimus_thy.modules.audit.application.service import AuditService
from optimus_thy.modules.auth.application.models import AuthUser
from optimus_thy.modules.auth.application.service import AuthService
from optimus_thy.modules.auth.infrastructure.persistence.repository import AuthRepository
from optimus_thy.shared.database.session import get_async_session
from optimus_thy.shared.security.passwords import PasswordService


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


async def get_current_user(
    request: Request,
    service: AuthServiceDependency,
) -> AuthUser:
    token = request.cookies.get(get_settings().auth_cookie_name)
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
