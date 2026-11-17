"""Configuración del correo saliente y sus plantillas (ajustes del sistema)."""

from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.correo.servicio import (
    ASUNTO_RECUPERACION,
    PLANTILLA_RECUPERACION,
    VARIABLES,
    CorreoNoConfigurado,
    EnvioError,
    enviar,
    plantilla,
    variables_no_permitidas,
)
from app.db import session_dep
from app.models.correo import CLAVE_RECUPERACION, SEGURIDADES, ConfiguracionCorreo, PlantillaCorreo
from app.security.encryption import get_cipher

router = APIRouter(tags=["correo"])

_CORREO = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

Configuracion = Annotated[SesionActual, Depends(requiere_permiso("ajustes.gestionar"))]

PRESET = ConfiguracionCorreo(
    id=1,
    host="smtp.gmail.com",
    puerto=587,
    seguridad="starttls",
    usuario="",
    remitente="",
    remitente_nombre="OPTIMUS-THY",
    activo=False,
)


class ConfiguracionOut(BaseModel):
    host: str
    puerto: int
    seguridad: Literal["starttls", "ssl"]
    usuario: str
    remitente: str
    remitente_nombre: str | None
    activo: bool
    tiene_password: bool


class ConfiguracionIn(BaseModel):
    host: str = Field(min_length=1, max_length=255)
    puerto: int = Field(ge=1, le=65535)
    seguridad: Literal["starttls", "ssl"]
    usuario: str = Field(min_length=1, max_length=255)
    remitente: str = Field(min_length=3, max_length=255)
    remitente_nombre: str | None = Field(default=None, max_length=120)
    activo: bool = True
    password: str | None = Field(default=None, max_length=128)


class PlantillaOut(BaseModel):
    clave: str
    asunto: str
    html: str
    variables: list[str]
    de_fabrica: bool


class PlantillaIn(BaseModel):
    asunto: str = Field(min_length=1, max_length=200)
    html: str = Field(min_length=1, max_length=20000)


class PruebaOut(BaseModel):
    destinatario: str


def _error(code: str, message: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code, content={"error": {"code": code, "message": message}}
    )


def _salida(fila: ConfiguracionCorreo | None) -> ConfiguracionOut:
    origen = fila or PRESET
    return ConfiguracionOut(
        host=origen.host,
        puerto=origen.puerto,
        seguridad=origen.seguridad,  # type: ignore[arg-type]
        usuario=origen.usuario,
        remitente=origen.remitente,
        remitente_nombre=origen.remitente_nombre,
        activo=origen.activo,
        tiene_password=fila is not None and fila.password_cifrado is not None,
    )


@router.get("/configuracion-correo", response_model=ConfiguracionOut)
def leer_configuracion(
    _actual: Configuracion, db: Annotated[Session, Depends(session_dep)]
) -> ConfiguracionOut:
    """Devuelve el servidor configurado; nunca la contraseña."""
    return _salida(db.get(ConfiguracionCorreo, 1))


@router.put("/configuracion-correo", response_model=ConfiguracionOut)
def guardar_configuracion(
    request: Request,
    body: ConfiguracionIn,
    actual: Configuracion,
    db: Annotated[Session, Depends(session_dep)],
) -> ConfiguracionOut | JSONResponse:
    if body.seguridad not in SEGURIDADES:  # pragma: no cover - lo fija el tipo
        return _error("seguridad_invalida", "Forma de cifrado no admitida.", 422)
    if not _CORREO.match(body.remitente):
        return _error("remitente_invalido", "El remitente no es un correo válido.", 422)
    if body.activo and not body.password:
        fila_previa = db.get(ConfiguracionCorreo, 1)
        if fila_previa is None or fila_previa.password_cifrado is None:
            return _error(
                "password_requerida",
                "Para activar el correo hace falta la contraseña del servidor.",
                422,
            )

    fila = db.get(ConfiguracionCorreo, 1) or ConfiguracionCorreo(id=1)
    fila.host = body.host.strip()
    fila.puerto = body.puerto
    fila.seguridad = body.seguridad
    fila.usuario = body.usuario.strip()
    fila.remitente = body.remitente.strip()
    fila.remitente_nombre = body.remitente_nombre.strip() if body.remitente_nombre else None
    fila.activo = body.activo
    if body.password:
        fila.password_cifrado = get_cipher().encrypt(body.password)
    fila.actualizado_en = datetime.now(UTC)
    fila.actualizado_por = actual.usuario.id
    db.add(fila)
    db.commit()
    db.refresh(fila)
    registrar(
        db,
        request,
        AuditAction.SETTINGS_CHANGE,
        AuditModule.ADMIN,
        usuario=actual.usuario,
        detalles={"setting_key": "smtp", "to_status": "activo" if fila.activo else "inactivo"},
    )
    return _salida(fila)


@router.post("/configuracion-correo/probar", response_model=PruebaOut)
def probar_configuracion(
    actual: Configuracion, db: Annotated[Session, Depends(session_dep)]
) -> PruebaOut | JSONResponse:
    """Envía un correo de prueba a la cuenta del administrador que lo pide."""
    destino = actual.usuario.email
    try:
        enviar(
            db,
            destinatario=destino,
            asunto="Prueba de correo de OPTIMUS-THY",
            html=(
                "<p>Si ves este mensaje, el servidor de correo está configurado correctamente.</p>"
            ),
        )
    except CorreoNoConfigurado as exc:
        return _error("correo_no_configurado", str(exc), status.HTTP_409_CONFLICT)
    except EnvioError as exc:
        return _error("envio_fallido", str(exc), status.HTTP_502_BAD_GATEWAY)
    return PruebaOut(destinatario=destino)


def _clave_valida(clave: str) -> bool:
    return clave == CLAVE_RECUPERACION


@router.get("/plantillas-correo/{clave}", response_model=PlantillaOut)
def leer_plantilla(
    clave: str, _actual: Configuracion, db: Annotated[Session, Depends(session_dep)]
) -> PlantillaOut | JSONResponse:
    if not _clave_valida(clave):
        return _error("plantilla_desconocida", "No existe esa plantilla.", 404)
    fila = plantilla(db, clave)
    if fila is None:  # pragma: no cover - la de fábrica siempre existe
        return _error("plantilla_desconocida", "No existe esa plantilla.", 404)
    guardada = db.get(PlantillaCorreo, clave) is not None
    return PlantillaOut(
        clave=fila.clave,
        asunto=fila.asunto,
        html=fila.html,
        variables=sorted(VARIABLES),
        de_fabrica=not guardada,
    )


@router.put("/plantillas-correo/{clave}", response_model=PlantillaOut)
def guardar_plantilla(
    request: Request,
    clave: str,
    body: PlantillaIn,
    actual: Configuracion,
    db: Annotated[Session, Depends(session_dep)],
) -> PlantillaOut | JSONResponse:
    if not _clave_valida(clave):
        return _error("plantilla_desconocida", "No existe esa plantilla.", 404)
    desconocidas = variables_no_permitidas(body.asunto) | variables_no_permitidas(body.html)
    if desconocidas:
        return _error(
            "variable_desconocida",
            f"Variables no admitidas: {', '.join(sorted(desconocidas))}.",
            422,
        )
    fila = db.get(PlantillaCorreo, clave) or PlantillaCorreo(clave=clave)
    fila.asunto = body.asunto.strip()
    fila.html = body.html
    fila.actualizado_en = datetime.now(UTC)
    fila.actualizado_por = actual.usuario.id
    db.add(fila)
    db.commit()
    db.refresh(fila)
    registrar(
        db,
        request,
        AuditAction.SETTINGS_CHANGE,
        AuditModule.ADMIN,
        usuario=actual.usuario,
        detalles={"setting_key": f"plantilla_{clave}"},
    )
    return PlantillaOut(
        clave=fila.clave,
        asunto=fila.asunto,
        html=fila.html,
        variables=sorted(VARIABLES),
        de_fabrica=False,
    )


@router.post("/plantillas-correo/{clave}/restaurar", response_model=PlantillaOut)
def restaurar_plantilla(
    request: Request,
    clave: str,
    actual: Configuracion,
    db: Annotated[Session, Depends(session_dep)],
) -> PlantillaOut | JSONResponse:
    """Vuelve a la plantilla de fábrica borrando la guardada."""
    if not _clave_valida(clave):
        return _error("plantilla_desconocida", "No existe esa plantilla.", 404)
    fila = db.get(PlantillaCorreo, clave)
    if fila is not None:
        db.delete(fila)
        db.commit()
    registrar(
        db,
        request,
        AuditAction.SETTINGS_CHANGE,
        AuditModule.ADMIN,
        usuario=actual.usuario,
        detalles={"setting_key": f"plantilla_{clave}", "to_status": "fabrica"},
    )
    return PlantillaOut(
        clave=clave,
        asunto=ASUNTO_RECUPERACION,
        html=PLANTILLA_RECUPERACION,
        variables=sorted(VARIABLES),
        de_fabrica=True,
    )
