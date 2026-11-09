"""Punto de entrada de la API FastAPI."""

from __future__ import annotations

import logging
import time
import uuid
from collections.abc import Awaitable, Callable

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.pacientes import router as pacientes_router
from app.api.roles import router as roles_router
from app.api.trabajos import router as trabajos_router
from app.api.usuarios import router as usuarios_router
from app.auth.errors import NoAutenticado, Prohibido
from app.auth.routes import router as auth_router
from app.config import get_settings
from app.logging import configure_logging
from app.schemas import Health

logger = logging.getLogger("optimus_thy")


def _get_request_id(request: Request) -> str:
    return str(getattr(request.state, "request_id", "-"))


def create_app() -> FastAPI:
    """Construye y configura la aplicación FastAPI."""
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title="OPTIMUS-THY API",
        version="0.1.0",
        docs_url="/docs",
        redoc_url=None,
    )

    @app.middleware("http")
    async def origin_middleware(
        request: Request, call_next: Callable[[Request], Awaitable[JSONResponse]]
    ) -> JSONResponse:
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            origin = request.headers.get("origin")
            if origin is not None:
                normalized = origin.strip().rstrip("/")
                if normalized not in get_settings().allowed_origins_set:
                    return JSONResponse(
                        status_code=status.HTTP_403_FORBIDDEN,
                        content={
                            "error": {
                                "code": "origin_forbidden",
                                "message": "El origen de la solicitud no está permitido.",
                            },
                            "request_id": _get_request_id(request),
                        },
                    )
        return await call_next(request)

    @app.middleware("http")
    async def logging_middleware(
        request: Request, call_next: Callable[[Request], Awaitable[JSONResponse]]
    ) -> JSONResponse:
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        request.state.request_id = request_id
        start = time.perf_counter()
        response: JSONResponse | None = None
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        finally:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            logger.info(
                "request",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status": status_code,
                    "duration_ms": duration_ms,
                },
            )
            if response is not None:
                response.headers["X-Request-ID"] = request_id
                # La API devuelve datos de sesión o clínicos: nunca se cachean
                # (HU-002: al volver atrás no se ven datos).
                response.headers.setdefault("Cache-Control", "no-store")

    @app.get(
        "/health",
        response_model=Health,
        operation_id="health",
        summary="Chequeo de salud",
        responses={200: {"description": "Servicio operativo"}},
    )
    async def health() -> Health:
        return Health(status="ok")

    app.include_router(pacientes_router)
    app.include_router(roles_router)
    app.include_router(usuarios_router)
    app.include_router(trabajos_router)
    app.include_router(auth_router)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        logger.warning(
            "validation_error",
            extra={
                "request_id": _get_request_id(request),
                "method": request.method,
                "path": request.url.path,
                "errors_count": len(exc.errors()),
            },
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "validation_error",
                    "message": "Datos de entrada inválidos",
                },
                "request_id": _get_request_id(request),
            },
        )

    @app.exception_handler(NoAutenticado)
    async def no_autenticado_handler(request: Request, exc: NoAutenticado) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "error": {"code": "unauthorized", "message": "No autenticado"},
                "request_id": _get_request_id(request),
            },
        )

    @app.exception_handler(Prohibido)
    async def prohibido_handler(request: Request, exc: Prohibido) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "error": {"code": "forbidden", "message": "Prohibido"},
                "request_id": _get_request_id(request),
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        # Detalle completo solo en el log del servidor; el cliente ve mensaje genérico.
        logger.exception(
            "unhandled_exception",
            extra={
                "request_id": _get_request_id(request),
                "method": request.method,
                "path": request.url.path,
            },
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {"code": "internal_error", "message": "Error interno"},
                "request_id": _get_request_id(request),
            },
        )

    return app


app = create_app()
