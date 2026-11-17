"""Consentimiento informado por caso (HU-034, HU-035).

- Se registra con su finalidad (``base_legal``) y la versión del texto firmado.
- El retiro es inmediato: desde ese momento el caso deja de tener consentimiento
  vigente y la inferencia se bloquea.
- Un caso de otra institución responde 404, igual que uno inexistente.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.consentimientos import Consentimiento
from app.models.fichas import Caso

router = APIRouter(tags=["consentimientos"])

BaseLegal = Literal["consentimiento", "atencion_de_salud", "investigacion_con_anonimizacion"]

#: Finalidad que habilita ejecutar la inferencia sobre el caso (HU-035).
BASE_LEGAL_INFERENCIA: str = "atencion_de_salud"


class CrearConsentimientoRequest(BaseModel):
    """Finalidad y versión del texto firmado; nunca contenido clínico."""

    model_config = ConfigDict(str_strip_whitespace=True)

    base_legal: BaseLegal
    version_texto: str = Field(min_length=1, max_length=32, pattern=r"^[A-Za-z0-9._-]+$")
    otorgado_en: datetime | None = None

    @field_validator("otorgado_en")
    @classmethod
    def _no_futuro(cls, valor: datetime | None) -> datetime | None:
        if valor is None:
            return None
        momento = valor if valor.tzinfo else valor.replace(tzinfo=UTC)
        if momento > datetime.now(UTC):
            raise ValueError("la fecha de otorgamiento no puede estar en el futuro")
        return valor


class ConsentimientoOut(BaseModel):
    id: str
    caso_id: str
    base_legal: str
    version_texto: str
    otorgado_en: datetime
    revocado_en: datetime | None
    vigente: bool


class ConsentimientosListOut(BaseModel):
    total: int
    items: list[ConsentimientoOut]


def _error(request: Request, codigo_http: int, codigo: str, mensaje: str) -> JSONResponse:
    return JSONResponse(
        status_code=codigo_http,
        content={
            "error": {"code": codigo, "message": mensaje},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _uuid(valor: str) -> uuid.UUID | None:
    try:
        return uuid.UUID(valor)
    except ValueError:
        return None


def _caso_de(db: Session, actual: SesionActual, id_texto: str) -> Caso | None:
    """El caso solo si existe y es de la institución de quien consulta."""
    caso_id = _uuid(id_texto)
    if caso_id is None:
        return None
    return (
        db.query(Caso)
        .filter(Caso.id == caso_id, Caso.institucion_id == actual.usuario.institucion_id)
        .first()
    )


def _consentimiento_de(db: Session, caso: Caso, id_texto: str) -> Consentimiento | None:
    consentimiento_id = _uuid(id_texto)
    if consentimiento_id is None:
        return None
    return (
        db.query(Consentimiento)
        .filter(Consentimiento.id == consentimiento_id, Consentimiento.caso_id == caso.id)
        .first()
    )


def _vista(consentimiento: Consentimiento) -> ConsentimientoOut:
    return ConsentimientoOut(
        id=str(consentimiento.id),
        caso_id=str(consentimiento.caso_id),
        base_legal=consentimiento.base_legal,
        version_texto=consentimiento.version_texto,
        otorgado_en=consentimiento.otorgado_en,
        revocado_en=consentimiento.revocado_en,
        vigente=consentimiento.revocado_en is None,
    )


def hay_consentimiento_vigente(db: Session, caso_id: uuid.UUID) -> bool:
    """True si el caso tiene un consentimiento vigente de atención de salud."""
    return (
        db.query(Consentimiento)
        .filter(
            Consentimiento.caso_id == caso_id,
            Consentimiento.base_legal == BASE_LEGAL_INFERENCIA,
            Consentimiento.revocado_en.is_(None),
        )
        .first()
        is not None
    )


@router.get("/casos/{caso_id}/consentimientos", response_model=None)
def listar_consentimientos(
    request: Request,
    caso_id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.leer"))],
) -> ConsentimientosListOut | JSONResponse:
    caso = _caso_de(db, actual, caso_id)
    if caso is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")
    filas = (
        db.query(Consentimiento)
        .filter(Consentimiento.caso_id == caso.id)
        .order_by(Consentimiento.otorgado_en, Consentimiento.id)
        .all()
    )
    registrar(
        db,
        request,
        AuditAction.RECORD_READ,
        AuditModule.CLINICAL,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.CASE,
        objeto_id=caso.id,
        detalles={"resource_count": len(filas)},
    )
    return ConsentimientosListOut(total=len(filas), items=[_vista(fila) for fila in filas])


@router.post(
    "/casos/{caso_id}/consentimientos",
    status_code=status.HTTP_201_CREATED,
    response_model=None,
)
def crear_consentimiento(
    request: Request,
    caso_id: str,
    body: CrearConsentimientoRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.escribir"))],
) -> ConsentimientoOut | JSONResponse:
    caso = _caso_de(db, actual, caso_id)
    if caso is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")
    consentimiento = Consentimiento(
        caso_id=caso.id,
        base_legal=body.base_legal,
        version_texto=body.version_texto,
        otorgado_por_id=actual.usuario.id,
    )
    if body.otorgado_en is not None:
        consentimiento.otorgado_en = body.otorgado_en
    db.add(consentimiento)
    db.commit()
    db.refresh(consentimiento)
    registrar(
        db,
        request,
        AuditAction.CONSENT_CREATE,
        AuditModule.CLINICAL,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.CONSENT,
        objeto_id=consentimiento.id,
        detalles={"from_status": "sin_consentimiento", "to_status": "vigente"},
    )
    return _vista(consentimiento)


@router.post(
    "/casos/{caso_id}/consentimientos/{consentimiento_id}/revocar",
    response_model=None,
)
def revocar_consentimiento(
    request: Request,
    caso_id: str,
    consentimiento_id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.escribir"))],
) -> ConsentimientoOut | JSONResponse:
    """Retiro del consentimiento: efecto inmediato, sin paso de aprobación."""
    caso = _caso_de(db, actual, caso_id)
    if caso is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")
    consentimiento = _consentimiento_de(db, caso, consentimiento_id)
    if consentimiento is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")
    if consentimiento.revocado_en is not None:
        return _error(
            request,
            status.HTTP_409_CONFLICT,
            "ya_revocado",
            "El consentimiento ya estaba revocado; no hay nada que retirar.",
        )
    consentimiento.revocado_en = datetime.now(UTC)
    db.commit()
    db.refresh(consentimiento)
    registrar(
        db,
        request,
        AuditAction.CONSENT_REVOKE,
        AuditModule.CLINICAL,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.CONSENT,
        objeto_id=consentimiento.id,
        detalles={"from_status": "vigente", "to_status": "revocado"},
    )
    return _vista(consentimiento)
