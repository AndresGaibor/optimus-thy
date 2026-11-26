"""Registro y lectura de la decisión médica sobre una inferencia (TES-337).

- La inferencia es inmutable: la conclusión del médico vive en
  ``decisiones_medicas`` y no sobrescribe el resultado del modelo.
- Solo se decide sobre inferencias de casos de la propia institución; un caso
  o una inferencia ajena responde 404, igual que uno inexistente.
- El autor se devuelve por identificador y rol, sin datos personales.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.fichas import Caso
from app.models.imagenes import DecisionMedica, Inferencia
from app.models.usuarios import Rol, UsuarioRol

router = APIRouter(tags=["decisiones"])


class DecisionIn(BaseModel):
    """Conclusión del médico; las observaciones son opcionales y acotadas."""

    decision: Literal["acepta", "corrige", "descarta"]
    resultado_corregido: Literal["benigno", "maligno", "sin_nodulo"] | None = None
    observaciones: str | None = Field(default=None, min_length=10, max_length=2000)

    @model_validator(mode="after")
    def _correccion_coherente(self) -> DecisionIn:
        if self.decision == "corrige" and self.resultado_corregido is None:
            raise ValueError("una corrección exige el resultado clínico correcto")
        if self.decision != "corrige" and self.resultado_corregido is not None:
            raise ValueError("solo una corrección lleva resultado corregido")
        return self


class AutorOut(BaseModel):
    """Quién registró la decisión: solo identificador y rol."""

    id: str
    rol: str | None


class DecisionOut(BaseModel):
    decision: str
    resultado: str
    resultado_corregido: str | None
    observaciones: str | None
    creado_en: datetime
    autor: AutorOut


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


def _inferencia_de(
    db: Session, actual: SesionActual, caso_id: str, inferencia_id: str
) -> Inferencia | None:
    """La inferencia solo si el caso es de la institución y la contiene."""
    caso_uuid = _uuid(caso_id)
    inferencia_uuid = _uuid(inferencia_id)
    caso = (
        db.query(Caso)
        .filter(Caso.id == caso_uuid, Caso.institucion_id == actual.usuario.institucion_id)
        .first()
        if caso_uuid
        else None
    )
    if caso is None or inferencia_uuid is None:
        return None
    return (
        db.query(Inferencia)
        .filter(Inferencia.id == inferencia_uuid, Inferencia.imagen.has(caso_id=caso.id))
        .first()
    )


def _rol_de(db: Session, usuario_id: uuid.UUID) -> str | None:
    """Primer rol asignado al autor, en orden estable; nunca datos personales."""
    fila = (
        db.query(Rol.nombre)
        .join(UsuarioRol, UsuarioRol.rol_id == Rol.id)
        .filter(UsuarioRol.usuario_id == usuario_id)
        .order_by(Rol.nombre)
        .first()
    )
    return fila[0] if fila else None


@router.post(
    "/casos/{caso_id}/inferencias/{inferencia_id}/decision",
    status_code=status.HTTP_201_CREATED,
    response_model=None,
)
def registrar_decision(
    request: Request,
    caso_id: str,
    inferencia_id: str,
    cuerpo: DecisionIn,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("inferencia.ejecutar"))],
) -> DecisionOut | JSONResponse:
    """Registra una única conclusión por inferencia; la segunda responde 409."""
    inferencia = _inferencia_de(db, actual, caso_id, inferencia_id)
    if inferencia is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")
    if (
        db.query(DecisionMedica).filter(DecisionMedica.inferencia_id == inferencia.id).first()
        is not None
    ):
        return _error(
            request,
            status.HTTP_409_CONFLICT,
            "decision_existente",
            "Esta inferencia ya tiene una decisión registrada.",
        )
    if (
        cuerpo.resultado_corregido is not None
        and cuerpo.resultado_corregido == inferencia.resultado
    ):
        return _error(
            request,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "correccion_sin_cambio",
            "El resultado corregido debe ser distinto del resultado del modelo.",
        )

    fila = DecisionMedica(
        inferencia_id=inferencia.id,
        usuario_id=actual.usuario.id,
        decision=cuerpo.decision,
        resultado_corregido=cuerpo.resultado_corregido,
        observaciones=cuerpo.observaciones,
    )
    db.add(fila)
    try:
        db.flush()
    except IntegrityError:
        # Dos envíos simultáneos: la restricción única decide y no se sobrescribe.
        db.rollback()
        return _error(
            request,
            status.HTTP_409_CONFLICT,
            "decision_existente",
            "Esta inferencia ya tiene una decisión registrada.",
        )
    registrar(
        db,
        request,
        AuditAction.INFERENCE_DECISION,
        AuditModule.INFERENCE,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.INFERENCE,
        objeto_id=inferencia.id,
        detalles={"decision_code": cuerpo.decision},
    )
    db.refresh(fila)
    return DecisionOut(
        decision=fila.decision,
        resultado=inferencia.resultado,
        resultado_corregido=fila.resultado_corregido,
        observaciones=fila.observaciones,
        creado_en=fila.creado_en,
        autor=AutorOut(
            id=str(fila.usuario_id),
            rol=actual.rol_activo.nombre if actual.rol_activo else _rol_de(db, fila.usuario_id),
        ),
    )


@router.get(
    "/casos/{caso_id}/inferencias/{inferencia_id}/decision",
    response_model=None,
)
def consultar_decision(
    request: Request,
    caso_id: str,
    inferencia_id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("inferencia.leer"))],
) -> DecisionOut | JSONResponse:
    """Decisión registrada, con fecha y autor sin datos personales."""
    inferencia = _inferencia_de(db, actual, caso_id, inferencia_id)
    if inferencia is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")
    fila = db.query(DecisionMedica).filter(DecisionMedica.inferencia_id == inferencia.id).first()
    if fila is None:
        return _error(
            request,
            status.HTTP_404_NOT_FOUND,
            "decision_no_encontrada",
            "La inferencia no tiene una decisión registrada.",
        )
    salida = DecisionOut(
        decision=fila.decision,
        resultado=inferencia.resultado,
        resultado_corregido=fila.resultado_corregido,
        observaciones=fila.observaciones,
        creado_en=fila.creado_en,
        autor=AutorOut(id=str(fila.usuario_id), rol=_rol_de(db, fila.usuario_id)),
    )
    registrar(
        db,
        request,
        AuditAction.INFERENCE_READ,
        AuditModule.INFERENCE,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.INFERENCE,
        objeto_id=inferencia.id,
        detalles={"resource_count": 1},
    )
    return salida
