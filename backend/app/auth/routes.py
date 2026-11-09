"""Rutas de autenticación."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule
from app.audit.http import registrar
from app.auth.deps import SesionActual, sesion_actual
from app.auth.sessions import (
    create_session,
    get_session_by_token,
    revoke_session,
    segundos_para_expirar,
)
from app.config import get_settings
from app.db import session_dep
from app.models.sesiones import Sesion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import verify_dummy, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    correo: str
    password: str


class UsuarioOut(BaseModel):
    id: str
    correo: str
    nombre: str


class LoginResponse(BaseModel):
    usuario: UsuarioOut
    roles: list[str]
    rol_activo: str | None
    segundos_para_expirar: int | None = None


class RolActivoRequest(BaseModel):
    rol: str


def _no_autenticado(request: Request) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "error": {"code": "unauthorized", "message": "No autenticado"},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _credenciales_invalidas(request: Request, db: Session, usuario: Usuario | None) -> JSONResponse:
    """Misma respuesta y misma bitácora para cualquier fallo: no revela cuál falló."""
    detalles: dict[str, str | int] = {"reason_code": "invalid_credentials"}
    if usuario is not None:
        # El contador solo se audita para una cuenta real (HU-004).
        detalles["attempt_count"] = usuario.intentos_fallidos
    registrar(
        db,
        request,
        AuditAction.LOGIN_FAILED,
        AuditModule.AUTH,
        usuario=usuario,
        detalles=detalles,
    )
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "error": {"code": "invalid_credentials", "message": "Credenciales inválidas"},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _roles_de(db: Session, usuario_id: object) -> list[Rol]:
    """Roles asignados en orden estable por nombre."""
    return (
        db.query(Rol)
        .join(UsuarioRol, UsuarioRol.rol_id == Rol.id)
        .filter(UsuarioRol.usuario_id == usuario_id)
        .order_by(Rol.nombre)
        .all()
    )


def _respuesta(
    usuario: Usuario, roles: list[Rol], activo: str | None, segundos: int | None = None
) -> LoginResponse:
    return LoginResponse(
        usuario=UsuarioOut(id=str(usuario.id), correo=usuario.email, nombre=usuario.nombre or ""),
        roles=[r.nombre for r in roles],
        rol_activo=activo,
        segundos_para_expirar=segundos,
    )


def _aware(momento: datetime) -> datetime:
    """Normaliza a UTC una marca que puede venir sin zona desde la base."""
    if momento.tzinfo is None:
        return momento.replace(tzinfo=UTC)
    return momento


def _cuenta_bloqueada(
    request: Request, db: Session, usuario: Usuario, restante: int
) -> JSONResponse:
    """Aviso claro sin decir si el correo existe más allá de lo ya evidente (HU-004).

    Solo se llega aquí con una cuenta real, así que el texto no distingue cuentas
    inexistentes de contraseñas erróneas: habla del bloqueo, no de la cuenta.
    """
    registrar(
        db,
        request,
        AuditAction.LOGIN_FAILED,
        AuditModule.AUTH,
        usuario=usuario,
        detalles={"reason_code": "account_locked"},
    )
    segundos = max(1, restante)
    minutos = max(1, (segundos + 59) // 60)
    return JSONResponse(
        status_code=status.HTTP_423_LOCKED,
        content={
            "error": {
                "code": "account_locked",
                "message": (
                    "Demasiados intentos fallidos. La cuenta está bloqueada "
                    f"temporalmente; vuelve a intentarlo en {minutos} min."
                ),
            },
            "retry_after_seconds": segundos,
            "request_id": getattr(request.state, "request_id", "-"),
        },
        headers={"Retry-After": str(segundos)},
    )


def _registrar_intento_fallido(db: Session, usuario: Usuario) -> None:
    """Suma el intento y bloquea la cuenta al llegar al máximo configurado."""
    settings = get_settings()
    usuario.intentos_fallidos = (usuario.intentos_fallidos or 0) + 1
    if usuario.intentos_fallidos >= settings.login_max_intentos:
        usuario.bloqueado_hasta = datetime.now(UTC) + timedelta(
            minutes=settings.login_bloqueo_minutos
        )
    db.add(usuario)
    db.commit()


@router.post("/login", response_model=None)
def login(
    request: Request,
    response: Response,
    body: LoginRequest,
    db: Annotated[Session, Depends(session_dep)],
) -> LoginResponse | JSONResponse:
    settings = get_settings()
    usuario = db.query(Usuario).filter(Usuario.email == body.correo).first()
    if usuario is None or not usuario.activo or usuario.password_hash is None:
        verify_dummy(body.password)  # mismo costo que un intento real
        return _credenciales_invalidas(request, db, usuario)

    # HU-004: el bloqueo se revisa antes de la contraseña, así no se puede
    # entrar ni acertando mientras dure, y el aviso siempre es el mismo.
    ahora = datetime.now(UTC)
    if usuario.bloqueado_hasta is not None:
        if _aware(usuario.bloqueado_hasta) > ahora:
            restante = int((_aware(usuario.bloqueado_hasta) - ahora).total_seconds())
            return _cuenta_bloqueada(request, db, usuario, restante)
        usuario.bloqueado_hasta = None
        usuario.intentos_fallidos = 0
        db.add(usuario)
        db.commit()

    ok, new_hash = verify_password(body.password, usuario.password_hash)
    if not ok:
        _registrar_intento_fallido(db, usuario)
        return _credenciales_invalidas(request, db, usuario)
    if new_hash is not None:
        usuario.password_hash = new_hash
        db.add(usuario)
        db.commit()
    if usuario.intentos_fallidos:
        usuario.intentos_fallidos = 0
        db.add(usuario)
        db.commit()

    roles = _roles_de(db, usuario.id)
    activo = roles[0] if roles else None
    sesion, token = create_session(db, usuario.id, rol_activo_id=activo.id if activo else None)
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        samesite="strict",
        secure=settings.session_cookie_secure,
        path="/",
        # La cookie no vive más que la inactividad permitida (HU-005).
        max_age=min(settings.session_ttl_minutes, settings.session_inactividad_minutos) * 60,
    )
    registrar(
        db,
        request,
        AuditAction.SESSION_START,
        AuditModule.AUTH,
        usuario=usuario,
        rol=activo.nombre if activo else None,
    )
    return _respuesta(
        usuario, roles, activo.nombre if activo else None, segundos_para_expirar(sesion)
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(session_dep)],
) -> Response:
    settings = get_settings()
    token = request.cookies.get(settings.session_cookie_name)
    if token is not None:
        sesion = get_session_by_token(db, token)
        if sesion is not None:
            usuario = db.query(Usuario).filter(Usuario.id == sesion.usuario_id).first()
            revoke_session(db, sesion)
            registrar(db, request, AuditAction.SESSION_END, AuditModule.AUTH, usuario=usuario)
    response.delete_cookie(key=settings.session_cookie_name, path="/")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=None)
def me(
    request: Request,
    actual: Annotated[SesionActual, Depends(sesion_actual)],
) -> LoginResponse | JSONResponse:
    return _respuesta(
        actual.usuario,
        sorted(actual.roles, key=lambda r: r.nombre),
        actual.rol_activo.nombre if actual.rol_activo else None,
        actual.segundos_para_expirar,
    )


@router.put("/rol-activo", response_model=None)
def put_rol_activo(
    request: Request,
    body: RolActivoRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(sesion_actual)],
) -> LoginResponse | JSONResponse:
    asignados = {r.nombre: r for r in actual.roles}
    if body.rol not in asignados:
        registrar(
            db,
            request,
            AuditAction.ACCESS_DENIED,
            AuditModule.AUTH,
            usuario=actual.usuario,
            detalles={"reason_code": "role_not_assigned"},
        )
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "error": {"code": "forbidden", "message": "Prohibido"},
                "request_id": getattr(request.state, "request_id", "-"),
            },
        )
    rol = asignados[body.rol]
    sesion = db.query(Sesion).filter(Sesion.id == actual.sesion_id).first()
    if sesion is None:
        return _no_autenticado(request)
    anterior = actual.rol_activo.nombre if actual.rol_activo else "none"
    sesion.rol_activo_id = rol.id
    db.add(sesion)
    db.commit()
    registrar(
        db,
        request,
        AuditAction.ROLE_SWITCH,
        AuditModule.AUTH,
        usuario=actual.usuario,
        rol=rol.nombre,
        detalles={"from_status": anterior, "to_status": rol.nombre},
    )
    return _respuesta(
        actual.usuario,
        sorted(actual.roles, key=lambda r: r.nombre),
        rol.nombre,
        actual.segundos_para_expirar,
    )
