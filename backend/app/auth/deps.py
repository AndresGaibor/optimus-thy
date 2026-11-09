"""Dependencias de autenticación y autorización."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Annotated, Any

from fastapi import Depends, Request, Security
from fastapi.security import APIKeyCookie
from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule
from app.audit.http import registrar, registrar_denegado
from app.auth.errors import NoAutenticado, Prohibido
from app.auth.sessions import (
    get_session_by_token,
    revoke_session,
    segundos_para_expirar,
    sesion_inactiva,
    tocar_sesion,
)
from app.config import get_settings
from app.db import session_dep
from app.models.usuarios import Permiso, Rol, RolPermiso, Usuario, UsuarioRol

_session_cookie_scheme = APIKeyCookie(
    name=get_settings().session_cookie_name,
    scheme_name="SessionCookie",
    auto_error=False,
)


@dataclass
class SesionActual:
    sesion_id: str
    usuario: Usuario
    roles: list[Rol]
    rol_activo: Rol | None
    segundos_para_expirar: int = 0


def sesion_actual(
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    optimus_session: Annotated[str | None, Security(_session_cookie_scheme)],
) -> SesionActual:
    token = optimus_session
    if token is None:
        raise NoAutenticado

    sesion = get_session_by_token(db, token)
    if sesion is None:
        raise NoAutenticado

    usuario = db.query(Usuario).filter(Usuario.id == sesion.usuario_id).first()
    if usuario is None or not usuario.activo:
        raise NoAutenticado

    # HU-005: sin actividad suficiente la sesión se cierra y se avisa con 401,
    # para que la interfaz vuelva a pedir credenciales.
    if sesion_inactiva(sesion):
        revoke_session(db, sesion)
        registrar(
            db,
            request,
            AuditAction.SESSION_END,
            AuditModule.AUTH,
            usuario=usuario,
            detalles={"reason_code": "inactivity_timeout"},
        )
        raise NoAutenticado
    tocar_sesion(db, sesion)

    roles: list[Rol] = (
        db.query(Rol)
        .join(UsuarioRol, UsuarioRol.rol_id == Rol.id)
        .filter(UsuarioRol.usuario_id == usuario.id)
        .order_by(Rol.nombre)
        .all()
    )

    rol_activo = None
    if sesion.rol_activo_id is not None:
        rol_activo = db.query(Rol).filter(Rol.id == sesion.rol_activo_id).first()

    return SesionActual(
        sesion_id=str(sesion.id),
        usuario=usuario,
        roles=roles,
        rol_activo=rol_activo,
        segundos_para_expirar=segundos_para_expirar(sesion),
    )


def requiere_permiso(codigo: str) -> Any:
    """Exige que el rol ACTIVO de la sesión tenga el permiso ``codigo``.

    Tener un rol asignado no basta (HU-003): se usa el rol con el que se trabaja
    ahora, y la matriz sale de la base (HU-011). Cada denegación queda en la
    bitácora (RF-AUD-07). El atributo ``permiso`` permite a las pruebas comprobar
    que ninguna ruta se queda sin protección.
    """

    def _dependencia(
        request: Request,
        db: Annotated[Session, Depends(session_dep)],
        actual: Annotated[SesionActual, Depends(sesion_actual)],
    ) -> SesionActual:
        rol = actual.rol_activo
        tiene = rol is not None and db.scalar(
            select(
                exists().where(
                    RolPermiso.rol_id == rol.id,
                    RolPermiso.permiso_id == Permiso.id,
                    Permiso.codigo == codigo,
                )
            )
        )
        if not tiene:
            registrar_denegado(
                db,
                request,
                AuditModule.AUTH,
                motivo="permission_missing",
                usuario=actual.usuario,
                rol=rol.nombre if rol else None,
            )
            raise Prohibido
        return actual

    _dependencia.permiso = codigo  # type: ignore[attr-defined]
    return _dependencia
