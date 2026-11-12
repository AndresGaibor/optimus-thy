"""API de trabajos en cola."""

from __future__ import annotations

from typing import Annotated, Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.casos import BASE_LEGAL_INFERENCIA
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.jobs.queue import encolar, reintentar
from app.models.consentimientos import Consentimiento
from app.models.fichas import Caso
from app.models.imagenes import Imagen
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


def _payload_invalido(request: Request, mensaje: str) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {"code": "payload_invalido", "message": mensaje},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _sin_consentimiento(request: Request) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "error": {
                "code": "sin_consentimiento",
                "message": (
                    "El caso no tiene un consentimiento vigente de atención de salud. "
                    "Regístralo en «POST /casos/{caso_id}/consentimientos» y vuelve a "
                    "solicitar la inferencia."
                ),
            },
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _uuid_o_nada(valor: Any) -> UUID | None:
    if not isinstance(valor, str):
        return None
    try:
        return UUID(valor)
    except ValueError:
        return None


def _caso_del_payload(
    db: Session, request: Request, actual: SesionActual, payload: dict[str, Any]
) -> tuple[Caso | None, JSONResponse | None]:
    """Resuelve el caso de una inferencia: ``caso_id`` o, si no, ``imagen_id``."""
    aceptados = "«caso_id» (UUID del caso) o «imagen_id» (UUID de una imagen del caso)"
    institucion_id = actual.usuario.institucion_id
    if payload.get("caso_id") is not None:
        caso_id = _uuid_o_nada(payload["caso_id"])
        if caso_id is None:
            return None, _payload_invalido(
                request, f"El payload debe incluir {aceptados}; «caso_id» no es un UUID válido."
            )
        caso = (
            db.query(Caso).filter(Caso.id == caso_id, Caso.institucion_id == institucion_id).first()
        )
        return caso, None if caso is not None else _no_encontrado(request)
    if payload.get("imagen_id") is not None:
        imagen_id = _uuid_o_nada(payload["imagen_id"])
        if imagen_id is None:
            return None, _payload_invalido(
                request, f"El payload debe incluir {aceptados}; «imagen_id» no es un UUID válido."
            )
        caso = (
            db.query(Caso)
            .join(Imagen, Imagen.caso_id == Caso.id)
            .filter(Imagen.id == imagen_id, Caso.institucion_id == institucion_id)
            .first()
        )
        return caso, None if caso is not None else _no_encontrado(request)
    return None, _payload_invalido(request, f"El payload debe incluir {aceptados}.")


@router.post("/trabajos", status_code=status.HTTP_202_ACCEPTED, response_model=None)
def crear_trabajo(
    request: Request,
    body: CrearTrabajoRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("inferencia.ejecutar"))],
) -> dict[str, Any] | JSONResponse:
    if body.tipo == "inferencia":
        caso, error = _caso_del_payload(db, request, actual, body.payload)
        if error is not None:
            return error
        if caso is None:  # pragma: no cover - _caso_del_payload siempre resuelve o falla
            return _no_encontrado(request)
        vigente = (
            db.query(Consentimiento.id)
            .filter(
                Consentimiento.caso_id == caso.id,
                Consentimiento.base_legal == BASE_LEGAL_INFERENCIA,
                Consentimiento.revocado_en.is_(None),
            )
            .first()
        )
        if vigente is None:
            return _sin_consentimiento(request)
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
