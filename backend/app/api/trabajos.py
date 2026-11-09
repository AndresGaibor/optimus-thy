"""API de trabajos en cola."""

from __future__ import annotations

from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.jobs.queue import encolar, reintentar
from app.models.trabajos import Trabajo

router = APIRouter(tags=["trabajos"])


class CrearTrabajoRequest(BaseModel):
    tipo: Literal["ocr", "inferencia"]
    payload: dict[str, Any]


def _no_encontrado(request: Request) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": {"code": "not_found", "message": "Trabajo no encontrado"},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _propio(db: Session, request: Request, id: str, actual: SesionActual) -> Trabajo | None:
    """Trabajo del propio usuario (o de cualquiera si el rol activo es admin).

    Un trabajo ajeno responde igual que uno inexistente.
    """
    try:
        trabajo_id = UUID(id)
    except ValueError:
        return None
    trabajo = db.query(Trabajo).filter(Trabajo.id == trabajo_id).first()
    if trabajo is None:
        return None
    es_admin = actual.rol_activo is not None and actual.rol_activo.nombre == "admin"
    if trabajo.creado_por != actual.usuario.id and not es_admin:
        return None
    return trabajo


def _vista(trabajo: Trabajo) -> dict[str, Any]:
    return {
        "id": str(trabajo.id),
        "tipo": trabajo.tipo,
        "estado": trabajo.estado,
        "intentos": trabajo.intentos,
        "max_intentos": trabajo.max_intentos,
        "resultado": trabajo.resultado,
        "error_detalle": trabajo.error_detalle,
    }


@router.post("/trabajos", status_code=status.HTTP_202_ACCEPTED, response_model=None)
def crear_trabajo(
    request: Request,
    body: CrearTrabajoRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("inferencia.ejecutar"))],
) -> dict[str, Any] | JSONResponse:
    trabajo = encolar(db, body.tipo, body.payload, creado_por=actual.usuario.id)
    return {"id": str(trabajo.id), "estado": trabajo.estado}


@router.get("/trabajos/{id}", response_model=None)
def obtener_trabajo(
    request: Request,
    id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("inferencia.leer"))],
) -> dict[str, Any] | JSONResponse:
    trabajo = _propio(db, request, id, actual)
    if trabajo is None:
        return _no_encontrado(request)
    return _vista(trabajo)


@router.post("/trabajos/{id}/reintentar", response_model=None)
def reintentar_trabajo(
    request: Request,
    id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("inferencia.ejecutar"))],
) -> dict[str, Any] | JSONResponse:
    """Reintento manual (HT-010): solo un trabajo en ``error``."""
    trabajo = _propio(db, request, id, actual)
    if trabajo is None:
        return _no_encontrado(request)
    if trabajo.estado != "error":
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "error": {"code": "conflict", "message": "Solo se reintentan trabajos con error"},
                "request_id": getattr(request.state, "request_id", "-"),
            },
        )
    return _vista(reintentar(db, trabajo))
