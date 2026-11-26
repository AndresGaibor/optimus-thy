"""Consulta y exportación de la bitácora de auditoría (HU-020, HU-022).

- Solo se ven los eventos de la institución de quien consulta.
- Filtros combinables por usuario, acción, fecha y recurso; respuesta paginada.
- La consulta en sí queda registrada como `AUDIT_READ`, como exige RF-AUD-10.
- La exportación CSV aplica los mismos filtros, omite la dirección IP y queda
  registrada como `EXPORT.EXPORT` con el número de filas, nunca con su contenido.
- La bitácora es de solo lectura: no hay endpoints de edición ni borrado.
"""

from __future__ import annotations

import csv
import io
import json
import uuid
from datetime import UTC, date, datetime, time, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from sqlalchemy.orm import Query as QuerySQL
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.audit.service import hash_evento
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.auditoria import Auditoria, AuditoriaAncla

router = APIRouter(tags=["auditoria"])

_LIMITE_MAXIMO = 100
#: Tope documentado de la exportación: el resto de filas no se incluye.
_LIMITE_EXPORTACION = 5000
#: Mismas columnas del listado menos `direccion_ip`, que es dato personal.
_COLUMNAS_EXPORTACION = (
    "id",
    "ocurrido_en",
    "usuario_id",
    "accion",
    "entidad",
    "entidad_id",
    "detalles",
)
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


class IntegridadOut(BaseModel):
    valida: bool
    registros: int
    primer_fallo: int | None


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


def _validar_filtros(
    request: Request,
    *,
    usuario: str | None,
    desde: date | None,
    hasta: date | None,
) -> tuple[uuid.UUID | None, JSONResponse | None]:
    """Valida los filtros comunes; devuelve el error 422 cuando no proceden."""
    if desde and hasta and desde > hasta:
        return None, _error(
            request,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "validation_error",
            "La fecha inicial no puede ser posterior a la final.",
        )
    if not usuario:
        return None, None
    identificador = _uuid(usuario)
    if identificador is None:
        return None, _error(
            request,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "validation_error",
            "El usuario no es un identificador válido.",
        )
    return identificador, None


def _consulta_filtrada(
    db: Session,
    institucion_id: uuid.UUID | None,
    *,
    usuario: uuid.UUID | None = None,
    accion: str | None = None,
    desde: date | None = None,
    hasta: date | None = None,
    recurso: str | None = None,
) -> QuerySQL[Auditoria]:
    """Consulta de la institución con los filtros combinables de la bitácora."""
    consulta = db.query(Auditoria).filter(Auditoria.institucion_id == institucion_id)
    if usuario is not None:
        consulta = consulta.filter(Auditoria.usuario_id == usuario)
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
    return consulta


def _fila_csv(fila: Auditoria) -> list[str | int]:
    """Una fila de la exportación, con las columnas del listado sin la IP."""
    return [
        fila.id,
        fila.ocurrido_en.isoformat(),
        str(fila.usuario_id) if fila.usuario_id else "",
        fila.accion,
        fila.entidad,
        fila.entidad_id or "",
        json.dumps(fila.detalles, ensure_ascii=False, sort_keys=True) if fila.detalles else "",
    ]


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
    usuario_id, error = _validar_filtros(request, usuario=usuario, desde=desde, hasta=hasta)
    if error is not None:
        return error
    consulta = _consulta_filtrada(
        db,
        actual.usuario.institucion_id,
        usuario=usuario_id,
        accion=accion,
        desde=desde,
        hasta=hasta,
        recurso=recurso,
    )

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


@router.get("/auditoria/integridad", response_model=IntegridadOut)
def verificar_integridad(
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("auditoria.leer"))],
) -> IntegridadOut:
    """Comprueba los hashes de los eventos frente al ancla persistida."""
    hash_anterior: str | None = None
    registros = 0
    ancla = db.get(AuditoriaAncla, 1)
    for evento in db.query(Auditoria).order_by(Auditoria.id.asc()).yield_per(500):
        registros += 1
        hash_actual = hash_evento(
            hash_anterior,
            evento.ocurrido_en,
            evento.usuario_id,
            evento.accion,
            evento.entidad,
            evento.entidad_id,
            evento.detalles,
        )
        if evento.hash_anterior != hash_anterior or evento.hash_actual != hash_actual:
            return IntegridadOut(valida=False, registros=registros, primer_fallo=evento.id)
        hash_anterior = evento.hash_actual
    if ancla is None or ancla.registros != registros or ancla.hash_actual != hash_anterior:
        return IntegridadOut(valida=False, registros=registros, primer_fallo=None)
    return IntegridadOut(valida=True, registros=registros, primer_fallo=None)


@router.get("/auditoria/exportar", response_model=None)
def exportar_bitacora(
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("auditoria.leer"))],
    usuario: Annotated[str | None, Query(max_length=36)] = None,
    accion: Annotated[str | None, Query(max_length=128)] = None,
    desde: Annotated[date | None, Query()] = None,
    hasta: Annotated[date | None, Query()] = None,
    recurso: Annotated[str | None, Query(pattern="^(" + "|".join(_RECURSOS) + ")$")] = None,
) -> Response | JSONResponse:
    """CSV de la bitácora filtrada, con un tope de 5000 filas.

    Aplica los mismos filtros que el listado, omite la dirección IP y registra
    un evento `EXPORT.EXPORT` con el número de filas, nunca con su contenido.
    """
    usuario_id, error = _validar_filtros(request, usuario=usuario, desde=desde, hasta=hasta)
    if error is not None:
        return error
    filas = (
        _consulta_filtrada(
            db,
            actual.usuario.institucion_id,
            usuario=usuario_id,
            accion=accion,
            desde=desde,
            hasta=hasta,
            recurso=recurso,
        )
        .order_by(Auditoria.ocurrido_en.desc(), Auditoria.id.desc())
        .limit(_LIMITE_EXPORTACION)
        .all()
    )

    salida = io.StringIO()
    # BOM: sin él Excel en español abre los acentos como mojibake.
    salida.write("\ufeff")
    escritor = csv.writer(salida)
    escritor.writerow(_COLUMNAS_EXPORTACION)
    escritor.writerows(_fila_csv(fila) for fila in filas)

    registrar(
        db,
        request,
        AuditAction.EXPORT,
        AuditModule.EXPORT,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.AUDIT,
        detalles={"resource_count": len(filas)},
    )
    nombre = f"bitacora-{datetime.now(UTC):%Y%m%d-%H%M%S}.csv"
    return Response(
        content=salida.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{nombre}"'},
    )
