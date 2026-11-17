"""Punto de entrada de la API FastAPI."""

from __future__ import annotations

import logging
import time
import uuid
from collections.abc import Awaitable, Callable
from typing import Final

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, Response

from app.api.consentimientos import router as consentimientos_router
from app.api.imagenes import router as imagenes_router
from app.api.modelos_ia import router as modelos_ia_router
from app.api.pacientes import router as pacientes_router
from app.api.reportes import router as reportes_router
from app.api.resultados import router as resultados_router
from app.api.roles import router as roles_router
from app.api.trabajos import router as trabajos_router
from app.api.usuarios import router as usuarios_router
from app.auth.errors import NoAutenticado, Prohibido
from app.auth.routes import router as auth_router
from app.config import get_settings
from app.logging import configure_logging
from app.schemas import Health
from app.security.limites import (
    ESTADO_LIMITE_GLOBAL,
    RUTAS_SIN_LIMITE,
    LimiteExcedido,
    VentanaDeslizante,
    clave_de_peticion,
    obtener_limite,
)

logger = logging.getLogger("optimus_thy")

CABECERAS_SEGURIDAD: Final[dict[str, str]] = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
}
"""Cabeceras de toda respuesta de la API, salvo la documentación interactiva."""

_RUTAS_SIN_CABECERAS_ESTRICTAS: Final[frozenset[str]] = frozenset(
    {"/docs", "/openapi.json", "/redoc"}
)
"""Swagger necesita cargar su propio JavaScript; no se le impone la CSP estricta."""


def _get_request_id(request: Request) -> str:
    return str(getattr(request.state, "request_id", "-"))


def _respuesta_limite(request: Request, segundos_reintento: int) -> JSONResponse:
    """429 con el sobre de error habitual y el tiempo de espera."""
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": {
                "code": "rate_limited",
                "message": "Demasiadas peticiones. Espera unos segundos y vuelve a intentarlo.",
            },
            "request_id": _get_request_id(request),
        },
        headers={"Retry-After": str(max(1, segundos_reintento))},
    )


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
    # El estado del límite es de esta instancia, no de un global de módulo.
    app.state.limite_global = VentanaDeslizante(settings.rate_limit_por_minuto)
    app.state.limite_inferencia = VentanaDeslizante(settings.inferencia_por_minuto)

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
    async def rate_limit_middleware(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Cupo global por sesión o cliente; ``0`` lo desactiva (HT-082)."""
        if settings.rate_limit_por_minuto <= 0 or request.url.path in RUTAS_SIN_LIMITE:
            return await call_next(request)
        limite = obtener_limite(request.app, ESTADO_LIMITE_GLOBAL)
        clave = clave_de_peticion(request, settings.session_cookie_name)
        permitido, segundos = limite.permitir(clave)
        if not permitido:
            return _respuesta_limite(request, segundos)
        return await call_next(request)

    @app.middleware("http")
    async def security_headers_middleware(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        """Endurece las respuestas de la API; la documentación queda fuera."""
        response = await call_next(request)
        if request.url.path not in _RUTAS_SIN_CABECERAS_ESTRICTAS:
            for nombre, valor in CABECERAS_SEGURIDAD.items():
                response.headers.setdefault(nombre, valor)
        return response

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
    app.include_router(imagenes_router)
    app.include_router(consentimientos_router)
    app.include_router(resultados_router)
    app.include_router(reportes_router)
    app.include_router(modelos_ia_router)
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

    @app.exception_handler(LimiteExcedido)
    async def limite_excedido_handler(request: Request, exc: LimiteExcedido) -> JSONResponse:
        return _respuesta_limite(request, exc.segundos_reintento)

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
