"""Rutas de autenticación."""

from __future__ import annotations

import hashlib
import logging
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated
from uuid import UUID

import sqlalchemy as sa
from fastapi import APIRouter, BackgroundTasks, Depends, Request, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.exc import SQLAlchemyError
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
from app.correo.servicio import CorreoNoConfigurado, EnvioError, enviar_recuperacion, mostrar_ttl
from app.db import session_dep
from app.models.correo import TokenRecuperacion
from app.models.sesiones import Sesion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import (
    hash_password,
    validar_politica_password,
    verify_dummy,
    verify_password,
)

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


class CambioPasswordRequest(BaseModel):
    password_actual: str = Field(min_length=1, max_length=128)
    password_nueva: str = Field(min_length=1, max_length=128)


def _error_password(
    request: Request, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {"code": code, "message": message},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


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


@router.put("/password", status_code=status.HTTP_204_NO_CONTENT)
def cambiar_password(
    request: Request,
    body: CambioPasswordRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(sesion_actual)],
) -> Response:
    """Cambia la contraseña propia (HU-006).

    Exige la contraseña actual, aplica RS-ACC-01 y cierra las demás sesiones.
    La sesión que hace el cambio sigue viva y se renueva.
    """
    usuario = actual.usuario
    hash_actual = usuario.password_hash
    if hash_actual is None or not verify_password(body.password_actual, hash_actual)[0]:
        registrar(
            db,
            request,
            AuditAction.ACCESS_DENIED,
            AuditModule.AUTH,
            usuario=usuario,
            detalles={"reason_code": "password_actual_incorrecta"},
        )
        return _error_password(
            request,
            "password_actual_incorrecta",
            "La contraseña actual no es correcta.",
        )

    fallo = validar_politica_password(body.password_nueva)
    if fallo is not None:
        codigo, mensaje = fallo
        return _error_password(request, codigo, mensaje)

    if verify_password(body.password_nueva, hash_actual)[0]:
        return _error_password(
            request,
            "password_repetida",
            "La contraseña nueva debe ser distinta de la actual.",
        )

    ahora = datetime.now(UTC)
    usuario.password_hash = hash_password(usuario.email, body.password_nueva)
    usuario.intentos_fallidos = 0
    usuario.bloqueado_hasta = None
    revocadas = (
        db.query(Sesion)
        .filter(
            Sesion.usuario_id == usuario.id,
            Sesion.id != UUID(actual.sesion_id),
            Sesion.revocada_en.is_(None),
        )
        .update({Sesion.revocada_en: ahora}, synchronize_session=False)
    )
    # La sesión actual sigue abierta y renueva su ventana de inactividad.
    sesion_actual_fila = db.query(Sesion).filter(Sesion.id == UUID(actual.sesion_id)).first()
    if sesion_actual_fila is not None:
        sesion_actual_fila.ultima_actividad = ahora
        db.add(sesion_actual_fila)
    db.add(usuario)
    db.commit()
    registrar(
        db,
        request,
        AuditAction.PASSWORD_CHANGE,
        AuditModule.AUTH,
        usuario=usuario,
        detalles={"reason_code": "password_change", "resource_count": revocadas},
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


class RecuperacionRequest(BaseModel):
    correo: str = Field(min_length=3, max_length=255)


class RecuperacionConfirmarRequest(BaseModel):
    token: str = Field(min_length=20, max_length=128)
    password: str = Field(min_length=12, max_length=128)


def _hash_token(token: str) -> str:
    """En la base solo vive el hash: quien la lea no puede usar el enlace."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _ip_de(request: Request) -> str | None:
    import ipaddress

    host = request.client.host if request.client else None
    if host is None:
        return None
    try:
        return str(ipaddress.ip_address(host))
    except ValueError:
        return None


def _enlace_invalido(request: Request) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": {
                "code": "token_invalido",
                "message": "El enlace no es válido o ya caducó. Solicita uno nuevo.",
            },
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _enviar_enlace(
    usuario_id: str, destinatario: str, nombre: str, enlace: str, expira_en: str
) -> None:
    """Fuera de la petición: el tiempo de respuesta no delata si el correo existe."""
    from app.db import get_session_factory

    sesion = get_session_factory()()
    try:
        enviar_recuperacion(
            sesion,
            destinatario=destinatario,
            nombre=nombre,
            enlace=enlace,
            expira_en=expira_en,
        )
    except (CorreoNoConfigurado, EnvioError, SQLAlchemyError):
        # Sin correo configurado no se puede avisar al usuario; queda en el log
        # del servidor, sin dirección ni datos personales. Un fallo aquí nunca
        # debe cambiar la respuesta de la petición.
        logging.getLogger("optimus_thy.auth").warning(
            "recuperación: no se pudo enviar el correo (usuario %s)", usuario_id
        )
    finally:
        sesion.close()


@router.post("/recuperacion", status_code=status.HTTP_202_ACCEPTED)
def solicitar_recuperacion(
    request: Request,
    background: BackgroundTasks,
    body: RecuperacionRequest,
    db: Annotated[Session, Depends(session_dep)],
) -> Response:
    """Responde siempre lo mismo: nunca revela si el correo está registrado."""
    settings = get_settings()
    ahora = datetime.now(UTC)
    usuario = (
        db.query(Usuario)
        .filter(sa.func.lower(Usuario.email) == body.correo.strip().lower())
        .first()
    )
    if usuario is not None and usuario.activo and usuario.password_hash is not None:
        desde = ahora - timedelta(minutes=settings.recuperacion_ventana_minutos)
        recientes = (
            db.query(TokenRecuperacion)
            .filter(
                TokenRecuperacion.usuario_id == usuario.id,
                TokenRecuperacion.creado_en >= desde,
            )
            .count()
        )
        if recientes < settings.recuperacion_max_solicitudes:
            db.query(TokenRecuperacion).filter(
                TokenRecuperacion.usuario_id == usuario.id,
                TokenRecuperacion.usado_en.is_(None),
            ).update({TokenRecuperacion.usado_en: ahora}, synchronize_session=False)
            token = secrets.token_urlsafe(32)
            db.add(
                TokenRecuperacion(
                    usuario_id=usuario.id,
                    token_hash=_hash_token(token),
                    expira_en=ahora + timedelta(minutes=settings.recuperacion_ttl_minutos),
                    ip_origen=_ip_de(request),
                )
            )
            db.commit()
            background.add_task(
                _enviar_enlace,
                str(usuario.id),
                usuario.email,
                usuario.nombre or "",
                f"{settings.public_url_base}/restablecer/{token}",
                mostrar_ttl(settings.recuperacion_ttl_minutos),
            )
    return JSONResponse(status_code=status.HTTP_202_ACCEPTED, content={"ok": True})


@router.post("/recuperacion/confirmar", status_code=status.HTTP_204_NO_CONTENT)
def confirmar_recuperacion(
    request: Request,
    body: RecuperacionConfirmarRequest,
    db: Annotated[Session, Depends(session_dep)],
) -> Response:
    """Cambia la contraseña, quema el token y cierra todas las sesiones."""
    ahora = datetime.now(UTC)
    fila = (
        db.query(TokenRecuperacion)
        .filter(TokenRecuperacion.token_hash == _hash_token(body.token))
        .first()
    )
    if fila is None or fila.usado_en is not None or _aware(fila.expira_en) <= ahora:
        return _enlace_invalido(request)
    usuario = db.query(Usuario).filter(Usuario.id == fila.usuario_id).first()
    if usuario is None or not usuario.activo:
        return _enlace_invalido(request)

    # Solo uno gana el token, aunque lleguen dos confirmaciones a la vez.
    marcado = (
        db.query(TokenRecuperacion)
        .filter(TokenRecuperacion.id == fila.id, TokenRecuperacion.usado_en.is_(None))
        .update({TokenRecuperacion.usado_en: ahora}, synchronize_session=False)
    )
    if marcado != 1:
        return _enlace_invalido(request)

    db.query(TokenRecuperacion).filter(
        TokenRecuperacion.usuario_id == usuario.id,
        TokenRecuperacion.usado_en.is_(None),
    ).update({TokenRecuperacion.usado_en: ahora}, synchronize_session=False)
    usuario.password_hash = hash_password(usuario.email, body.password)
    usuario.intentos_fallidos = 0
    usuario.bloqueado_hasta = None
    db.query(Sesion).filter(Sesion.usuario_id == usuario.id, Sesion.revocada_en.is_(None)).update(
        {Sesion.revocada_en: ahora}, synchronize_session=False
    )
    db.add(usuario)
    db.commit()
    registrar(
        db,
        request,
        AuditAction.PASSWORD_RESET,
        AuditModule.AUTH,
        usuario=usuario,
        detalles={"reason_code": "token"},
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
