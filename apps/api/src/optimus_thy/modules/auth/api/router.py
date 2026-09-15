from fastapi import APIRouter, HTTPException, Request, Response, status

from optimus_thy.config.settings import get_settings
from optimus_thy.modules.auth.api.dependencies import (
    AuthServiceDependency,
    CurrentUserDependency,
    SessionDependency,
)
from optimus_thy.modules.auth.api.schemas import AuthUserResponse, ErrorResponse, LoginRequest
from optimus_thy.modules.auth.application.models import AuthUser
from optimus_thy.modules.auth.application.service import InvalidCredentialsError

router = APIRouter(prefix="/auth", tags=["auth"])


def _public_user(user: AuthUser) -> AuthUserResponse:
    return AuthUserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        role=user.role,
    )


@router.post(
    "/login",
    response_model=AuthUserResponse,
    responses={401: {"model": ErrorResponse, "description": "Invalid credentials"}},
)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    service: AuthServiceDependency,
    session: SessionDependency,
) -> AuthUserResponse:
    try:
        result = await service.login(
            payload.email,
            payload.password,
            getattr(request.state, "request_id", None),
        )
    except InvalidCredentialsError as exc:
        await session.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        ) from exc

    settings = get_settings()
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=result.session_token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="strict",
        path="/",
    )
    return _public_user(result.user)


@router.get(
    "/me",
    response_model=AuthUserResponse,
    responses={401: {"model": ErrorResponse, "description": "Not authenticated"}},
)
async def me(user: CurrentUserDependency) -> AuthUserResponse:
    return _public_user(user)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={401: {"model": ErrorResponse, "description": "Not authenticated"}},
)
async def logout(
    request: Request,
    response: Response,
    service: AuthServiceDependency,
    user: CurrentUserDependency,
) -> None:
    del user
    settings = get_settings()
    token = request.cookies[settings.auth_cookie_name]
    await service.logout(token, getattr(request.state, "request_id", None))
    response.delete_cookie(
        key=settings.auth_cookie_name,
        path="/",
        secure=settings.auth_cookie_secure,
        httponly=True,
        samesite="strict",
    )
