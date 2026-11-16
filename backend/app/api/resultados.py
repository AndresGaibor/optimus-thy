"""Consulta de resultados de inferencia de un caso (HU-071).

- Solo se ven las inferencias de casos de la propia institución: un caso ajeno
  responde 404, igual que uno inexistente.
- Cada artefacto se lee por enlace firmado de corta duración; la base nunca
  sirve el archivo.
- La respuesta incluye clase y probabilidades en números: la interfaz decide
  cómo mostrarlas, pero no puede depender solo del color.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.fichas import Caso
from app.models.imagenes import Inferencia, Nodulo
from app.storage.s3 import ObjectStorage, StorageError, get_storage

router = APIRouter(tags=["resultados"])


class ModeloResumenOut(BaseModel):
    id: str
    nombre: str
    version: str


class CajaOut(BaseModel):
    x: float | None
    y: float | None
    w: float | None
    h: float | None


class ArtefactosOut(BaseModel):
    mascara_url: str | None
    mgac_url: str | None
    xml_url: str | None
    superposicion_url: str | None


class NoduloInferenciaOut(BaseModel):
    indice: int
    clase: str | None
    confianza: float | None
    probabilidad_benigno: float | None
    probabilidad_maligno: float | None
    caja: CajaOut
    region_analizada: dict[str, Any] | None
    pixeles_mascara: int | None
    artefactos: ArtefactosOut


class InferenciaOut(BaseModel):
    id: str
    imagen_id: str
    modelo: ModeloResumenOut
    resultado: str
    confianza: float | None
    tiempo_ms: int | None
    ancho: int | None
    alto: int | None
    version_contrato: str | None
    huella_modelos: str | None
    umbrales: dict[str, float] | None
    creado_en: datetime
    nodulos: list[NoduloInferenciaOut]


class InferenciasListOut(BaseModel):
    total: int
    items: list[InferenciaOut]


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


def _enlace(storage: ObjectStorage, ruta: str | None) -> str | None:
    return storage.generate_presigned_link(ruta).url if ruta else None


def _artefactos(storage: ObjectStorage, nodulo: Nodulo) -> ArtefactosOut:
    return ArtefactosOut(
        mascara_url=_enlace(storage, nodulo.mascara_ruta_s3),
        mgac_url=_enlace(storage, nodulo.mgac_ruta_s3),
        xml_url=_enlace(storage, nodulo.xml_ruta_s3),
        superposicion_url=_enlace(storage, nodulo.superposicion_ruta_s3),
    )


def _vista(inferencia: Inferencia, storage: ObjectStorage) -> InferenciaOut:
    """Vista completa de una inferencia; los enlaces se firman al responder."""
    return InferenciaOut(
        id=str(inferencia.id),
        imagen_id=str(inferencia.imagen_id),
        modelo=ModeloResumenOut(
            id=str(inferencia.modelo_ia.id),
            nombre=inferencia.modelo_ia.nombre,
            version=inferencia.modelo_ia.version,
        ),
        resultado=inferencia.resultado,
        confianza=inferencia.confianza,
        tiempo_ms=inferencia.tiempo_ms,
        ancho=inferencia.ancho,
        alto=inferencia.alto,
        version_contrato=inferencia.version_contrato,
        huella_modelos=inferencia.huella_modelos,
        umbrales=inferencia.umbrales,
        creado_en=inferencia.creado_en,
        nodulos=[
            NoduloInferenciaOut(
                indice=nodulo.indice,
                clase=nodulo.clase,
                confianza=nodulo.confianza,
                probabilidad_benigno=nodulo.probabilidad_benigno,
                probabilidad_maligno=nodulo.probabilidad_maligno,
                caja=CajaOut(x=nodulo.caja_x, y=nodulo.caja_y, w=nodulo.caja_w, h=nodulo.caja_h),
                region_analizada=nodulo.region_analizada,
                pixeles_mascara=nodulo.pixeles_mascara,
                artefactos=_artefactos(storage, nodulo),
            )
            for nodulo in sorted(inferencia.nodulos, key=lambda fila: fila.indice)
        ],
    )


@router.get("/casos/{caso_id}/inferencias", response_model=None)
def listar_inferencias(
    request: Request,
    caso_id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("inferencia.leer"))],
    storage: Annotated[ObjectStorage, Depends(get_storage)],
) -> InferenciasListOut | JSONResponse:
    """Inferencias del caso, de la más reciente a la más antigua."""
    caso = _caso_de(db, actual, caso_id)
    if caso is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")
    filas = (
        db.query(Inferencia)
        .filter(Inferencia.imagen.has(caso_id=caso.id))
        .order_by(Inferencia.creado_en.desc(), Inferencia.id)
        .all()
    )
    try:
        items = [_vista(fila, storage) for fila in filas]
    except StorageError:
        return _error(
            request,
            status.HTTP_502_BAD_GATEWAY,
            "storage_error",
            "No se pudieron firmar los enlaces; intenta de nuevo.",
        )
    registrar(
        db,
        request,
        AuditAction.INFERENCE_READ,
        AuditModule.INFERENCE,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.CASE,
        objeto_id=caso.id,
        detalles={"resource_count": len(items)},
    )
    return InferenciasListOut(total=len(items), items=items)
