"""Consulta de la bitácora de auditoría (HU-020).

- Solo se ven los eventos de la institución de quien consulta.
- Filtros combinables por usuario, acción, fecha y recurso; respuesta paginada.
- La consulta en sí queda registrada como `AUDIT_READ`, como exige RF-AUD-10.
- La bitácora es de solo lectura: no hay endpoints de edición ni borrado.
"""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, time, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.auditoria import Auditoria

router = APIRouter(tags=["auditoria"])

_LIMITE_MAXIMO = 100
_RECURSOS = (
    "PATIENT",
    "CASE",
    "RECORD",
    "DOCUMENT",
    "IMAGE",
    "INFERENCE",
    "CONSENT",
    "USER",
    "ROLE",
    "SYSTEM",
    "DATASET",
    "REPORT",
    "AUDIT",
)


class EventoAuditoriaOut(BaseModel):
    id: int
    ocurrido_en: datetime
    usuario_id: str | None
    accion: str
    entidad: str
    entidad_id: str | None
    direccion_ip: str | None
    detalles: dict[str, Any] | None


class BitacoraOut(BaseModel):
    total: int
    items: list[EventoAuditoriaOut]


def _error(request: Request, codigo: int, clave: str, mensaje: str) -> JSONResponse:
    return JSONResponse(
        status_code=codigo,
        content={
            "error": {"code": clave, "message": mensaje},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _uuid(valor: str) -> uuid.UUID | None:
    try:
        return uuid.UUID(valor)
    except ValueError:
        return None


@router.get("/auditoria", response_model=None)
def consultar_bitacora(
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("auditoria.leer"))],
    usuario: Annotated[str | None, Query(max_length=36)] = None,
    accion: Annotated[str | None, Query(max_length=128)] = None,
    desde: Annotated[date | None, Query()] = None,
    hasta: Annotated[date | None, Query()] = None,
    recurso: Annotated[str | None, Query(pattern="^(" + "|".join(_RECURSOS) + ")$")] = None,
    limite: Annotated[int, Query(ge=1)] = 50,
    desplazamiento: Annotated[int, Query(ge=0)] = 0,
) -> BitacoraOut | JSONResponse:
    """Eventos de la institución, del más reciente al más antiguo."""
    if desde and hasta and desde > hasta:
        return _error(
            request,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "validation_error",
            "La fecha inicial no puede ser posterior a la final.",
        )
    consulta = db.query(Auditoria).filter(Auditoria.institucion_id == actual.usuario.institucion_id)
    if usuario:
        usuario_id = _uuid(usuario)
        if usuario_id is None:
            return _error(
                request,
                status.HTTP_422_UNPROCESSABLE_CONTENT,
                "validation_error",
                "El usuario no es un identificador válido.",
            )
        consulta = consulta.filter(Auditoria.usuario_id == usuario_id)
    if accion:
        patron = accion.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
        consulta = consulta.filter(Auditoria.accion.like(patron, escape="\\"))
    if desde:
        consulta = consulta.filter(
            Auditoria.ocurrido_en >= datetime.combine(desde, time.min, tzinfo=UTC)
        )
    if hasta:
        consulta = consulta.filter(
            Auditoria.ocurrido_en
            < datetime.combine(hasta + timedelta(days=1), time.min, tzinfo=UTC)
        )
    if recurso:
        consulta = consulta.filter(Auditoria.entidad == recurso)

    total = consulta.count()
    filas = (
        consulta.order_by(Auditoria.ocurrido_en.desc(), Auditoria.id.desc())
        .offset(desplazamiento)
        .limit(min(limite, _LIMITE_MAXIMO))
        .all()
    )
    items = [
        EventoAuditoriaOut(
            id=fila.id,
            ocurrido_en=fila.ocurrido_en,
            usuario_id=str(fila.usuario_id) if fila.usuario_id else None,
            accion=fila.accion,
            entidad=fila.entidad,
            entidad_id=fila.entidad_id,
            direccion_ip=fila.direccion_ip,
            detalles=fila.detalles,
        )
        for fila in filas
    ]
    registrar(
        db,
        request,
        AuditAction.AUDIT_READ,
        AuditModule.AUDIT,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.AUDIT,
        detalles={"resource_count": len(items)},
    )
    return BitacoraOut(total=total, items=items)
