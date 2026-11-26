"""Gestión de cohortes de investigación de cada institución."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, ValidationError
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.investigacion.cohortes import casos_de_cohorte, normalizar_filtros
from app.models.cohortes import CohorteInvestigacion

router = APIRouter(tags=["investigacion"])


class CrearCohorteRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    nombre: str = Field(min_length=1, max_length=120)
    filtros: dict[str, Any] = Field(default_factory=dict)


class CohorteOut(BaseModel):
    id: str
    nombre: str
    filtros: dict[str, Any]
    total_casos: int
    creado_en: datetime
    actualizado_en: datetime


class CohortesListOut(BaseModel):
    total: int
    items: list[CohorteOut]


def _error(request: Request, codigo_http: int, codigo: str, mensaje: str) -> JSONResponse:
    return JSONResponse(
        status_code=codigo_http,
        content={
            "error": {"code": codigo, "message": mensaje},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _cohorte_out(db: Session, actual: SesionActual, cohorte: CohorteInvestigacion) -> CohorteOut:
    return CohorteOut(
        id=str(cohorte.id),
        nombre=cohorte.nombre,
        filtros=cohorte.filtros,
        total_casos=len(casos_de_cohorte(db, actual, cohorte.filtros)),
        creado_en=cohorte.creado_en,
        actualizado_en=cohorte.actualizado_en,
    )


@router.get("/cohortes", response_model=CohortesListOut)
def listar_cohortes(
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("investigacion.leer"))],
) -> CohortesListOut:
    institucion_id = actual.usuario.institucion_id
    cohortes = (
        db.query(CohorteInvestigacion)
        .filter(CohorteInvestigacion.institucion_id == institucion_id)
        .order_by(CohorteInvestigacion.creado_en.desc(), CohorteInvestigacion.id)
        .all()
    )
    respuesta = CohortesListOut(
        total=len(cohortes),
        items=[_cohorte_out(db, actual, cohorte) for cohorte in cohortes],
    )
    registrar(
        db,
        request,
        AuditAction.RECORD_READ,
        AuditModule.RESEARCH,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.DATASET,
    )
    return respuesta


@router.post("/cohortes", response_model=CohorteOut, status_code=status.HTTP_201_CREATED)
def crear_cohorte(
    body: CrearCohorteRequest,
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("investigacion.leer"))],
) -> CohorteOut | JSONResponse:
    try:
        filtros = normalizar_filtros(body.filtros)
    except ValidationError:
        return _error(
            request,
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "filtro_invalido",
            "Los filtros de la cohorte no son válidos.",
        )

    institucion_id = actual.usuario.institucion_id
    duplicada = (
        db.query(CohorteInvestigacion.id)
        .filter(
            CohorteInvestigacion.institucion_id == institucion_id,
            func.lower(CohorteInvestigacion.nombre) == body.nombre.lower(),
        )
        .first()
    )
    if duplicada:
        return _error(
            request,
            status.HTTP_409_CONFLICT,
            "cohorte_duplicada",
            "Ya existe una cohorte con ese nombre.",
        )

    cohorte = CohorteInvestigacion(
        institucion_id=institucion_id,
        nombre=body.nombre,
        filtros=filtros,
        creado_por_id=actual.usuario.id,
    )
    db.add(cohorte)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        return _error(
            request,
            status.HTTP_409_CONFLICT,
            "cohorte_duplicada",
            "Ya existe una cohorte con ese nombre.",
        )
    salida = _cohorte_out(db, actual, cohorte)
    registrar(
        db,
        request,
        AuditAction.EXPORT,
        AuditModule.RESEARCH,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.DATASET,
        objeto_id=cohorte.id,
    )
    return salida


@router.delete(
    "/cohortes/{cohorte_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None
)
def borrar_cohorte(
    cohorte_id: uuid.UUID,
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("investigacion.leer"))],
) -> JSONResponse | Response:
    cohorte = (
        db.query(CohorteInvestigacion)
        .filter(
            CohorteInvestigacion.id == cohorte_id,
            CohorteInvestigacion.institucion_id == actual.usuario.institucion_id,
        )
        .one_or_none()
    )
    if cohorte is None:
        return _error(
            request, status.HTTP_404_NOT_FOUND, "not_found", "La cohorte no está disponible."
        )
    objeto_id = cohorte.id
    db.delete(cohorte)
    registrar(
        db,
        request,
        AuditAction.EXPORT,
        AuditModule.RESEARCH,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.DATASET,
        objeto_id=objeto_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
