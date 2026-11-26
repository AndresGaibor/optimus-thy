"""Solicitudes de derechos de los titulares (RS-DER-07, HU-100).

El administrador registra cada solicitud con su fecha, su responsable y un plazo
de respuesta de 15 días por defecto; el listado muestra el plazo restante y
marca las vencidas. Solo se guardan la referencia interna del titular y
metadatos: nunca datos clínicos ni identificadores directos.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.cumplimiento import PLAZO_POR_DEFECTO, SolicitudDerecho
from app.models.usuarios import Rol, UsuarioRol

router = APIRouter(tags=["cumplimiento"])

TipoDerecho = Literal["acceso", "rectificacion", "cancelacion", "oposicion"]
EstadoSolicitud = Literal["pendiente", "atendida", "rechazada"]


class CrearSolicitudRequest(BaseModel):
    tipo: TipoDerecho
    referencia_titular: str = Field(min_length=3, max_length=64, pattern=r"^[A-Za-z0-9._-]+$")
    solicitada_en: date | None = None
    plazo_dias: int = Field(default=PLAZO_POR_DEFECTO, ge=1, le=60)


class PatchSolicitudRequest(BaseModel):
    estado: EstadoSolicitud
    respuesta: str | None = Field(default=None, min_length=10, max_length=2000)

    @model_validator(mode="after")
    def _respuesta_coherente(self) -> PatchSolicitudRequest:
        if self.estado == "pendiente" and self.respuesta is not None:
            raise ValueError("una solicitud pendiente no lleva respuesta")
        if self.estado != "pendiente" and self.respuesta is None:
            raise ValueError("cerrar una solicitud exige una respuesta")
        return self


class ResponsableOut(BaseModel):
    id: str
    rol: str | None


class SolicitudOut(BaseModel):
    id: str
    tipo: str
    referencia_titular: str
    solicitada_en: date
    plazo_dias: int
    fecha_limite: date
    dias_restantes: int
    vencida: bool
    estado: str
    respuesta: str | None
    responsable: ResponsableOut
    creado_en: datetime
    actualizado_en: datetime


class SolicitudesOut(BaseModel):
    total: int
    pendientes: int
    vencidas: int
    items: list[SolicitudOut]


def _error(request: Request, code: str, message: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {"code": code, "message": message},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _rol_de(db: Session, usuario_id: object) -> str | None:
    fila = (
        db.query(Rol.nombre)
        .join(UsuarioRol, UsuarioRol.rol_id == Rol.id)
        .filter(UsuarioRol.usuario_id == usuario_id)
        .order_by(Rol.nombre)
        .first()
    )
    return fila[0] if fila else None


def _fecha_limite(solicitud: SolicitudDerecho) -> date:
    return solicitud.solicitada_en + timedelta(days=solicitud.plazo_dias)


def _a_salida(db: Session, solicitud: SolicitudDerecho) -> SolicitudOut:
    limite = _fecha_limite(solicitud)
    restantes = (limite - datetime.now(UTC).date()).days
    return SolicitudOut(
        id=str(solicitud.id),
        tipo=solicitud.tipo,
        referencia_titular=solicitud.referencia_titular,
        solicitada_en=solicitud.solicitada_en,
        plazo_dias=solicitud.plazo_dias,
        fecha_limite=limite,
        dias_restantes=restantes,
        vencida=solicitud.estado == "pendiente" and restantes < 0,
        estado=solicitud.estado,
        respuesta=solicitud.respuesta,
        responsable=ResponsableOut(
            id=str(solicitud.responsable_id), rol=_rol_de(db, solicitud.responsable_id)
        ),
        creado_en=solicitud.creado_en,
        actualizado_en=solicitud.actualizado_en,
    )


@router.get("/administrador/solicitudes-derechos", response_model=SolicitudesOut)
def listar_solicitudes(
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("derechos.gestionar"))],
    estado: Annotated[EstadoSolicitud | None, Query()] = None,
    limite: Annotated[int, Query(ge=1, le=200)] = 50,
    desplazamiento: Annotated[int, Query(ge=0)] = 0,
) -> SolicitudesOut:
    """Solicitudes de la institución, con el plazo restante de cada una."""
    base = db.query(SolicitudDerecho).filter(
        SolicitudDerecho.institucion_id == actual.usuario.institucion_id
    )
    consulta = base.filter(SolicitudDerecho.estado == estado) if estado else base
    filas = (
        consulta.order_by(SolicitudDerecho.solicitada_en.asc(), SolicitudDerecho.creado_en.asc())
        .offset(desplazamiento)
        .limit(limite)
        .all()
    )
    pendientes = base.filter(SolicitudDerecho.estado == "pendiente").all()
    hoy = datetime.now(UTC).date()
    vencidas = sum(1 for fila in pendientes if _fecha_limite(fila) < hoy)
    items = [_a_salida(db, fila) for fila in filas]
    registrar(
        db,
        request,
        AuditAction.RIGHTS_REQUEST_READ,
        AuditModule.ADMIN,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.RIGHTS_REQUEST,
        detalles={"resource_count": len(items)},
    )
    return SolicitudesOut(
        total=consulta.count(),
        pendientes=len(pendientes),
        vencidas=vencidas,
        items=items,
    )


@router.post(
    "/administrador/solicitudes-derechos",
    status_code=status.HTTP_201_CREATED,
    response_model=None,
)
def crear_solicitud(
    request: Request,
    cuerpo: CrearSolicitudRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("derechos.gestionar"))],
) -> SolicitudOut | JSONResponse:
    """Registra una solicitud con el administrador de la sesión como responsable."""
    fila = SolicitudDerecho(
        institucion_id=actual.usuario.institucion_id,
        tipo=cuerpo.tipo,
        referencia_titular=cuerpo.referencia_titular,
        solicitada_en=cuerpo.solicitada_en or datetime.now(UTC).date(),
        plazo_dias=cuerpo.plazo_dias,
        estado="pendiente",
        responsable_id=actual.usuario.id,
    )
    db.add(fila)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return _error(
            request,
            "solicitud_duplicada",
            "Ya existe una solicitud de ese tipo para el titular en esa fecha.",
            status.HTTP_409_CONFLICT,
        )
    db.refresh(fila)
    registrar(
        db,
        request,
        AuditAction.RIGHTS_REQUEST_CREATE,
        AuditModule.ADMIN,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.RIGHTS_REQUEST,
        objeto_id=fila.id,
        detalles={"request_type": fila.tipo, "deadline_days": fila.plazo_dias},
    )
    return _a_salida(db, fila)


@router.patch("/administrador/solicitudes-derechos/{solicitud_id}", response_model=None)
def actualizar_solicitud(
    request: Request,
    solicitud_id: str,
    cuerpo: PatchSolicitudRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("derechos.gestionar"))],
) -> SolicitudOut | JSONResponse:
    """Cierra o reabre la solicitud; reabrir borra la respuesta anterior."""
    fila = (
        db.query(SolicitudDerecho)
        .filter(
            SolicitudDerecho.id == solicitud_id,
            SolicitudDerecho.institucion_id == actual.usuario.institucion_id,
        )
        .first()
    )
    if fila is None:
        return _error(
            request,
            "not_found",
            "No encontrado",
            status.HTTP_404_NOT_FOUND,
        )
    fila.estado = cuerpo.estado
    fila.respuesta = cuerpo.respuesta
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return _error(
            request,
            "solicitud_invalida",
            "La solicitud no se pudo actualizar.",
            status.HTTP_422_UNPROCESSABLE_CONTENT,
        )
    db.refresh(fila)
    registrar(
        db,
        request,
        AuditAction.RIGHTS_REQUEST_UPDATE,
        AuditModule.ADMIN,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.RIGHTS_REQUEST,
        objeto_id=fila.id,
        detalles={"to_status": fila.estado},
    )
    return _a_salida(db, fila)
