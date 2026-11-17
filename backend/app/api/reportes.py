"""Descarga del reporte PDF de una inferencia (HU-080, HU-082).

- El PDF se genera al vuelo; no se guarda copia en la base ni en el almacenamiento.
- Un caso ajeno responde 404, igual que uno inexistente.
- Cada descarga deja un evento `REPORT_DOWNLOAD` con usuario, reporte y hora.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.fichas import Caso
from app.models.imagenes import Inferencia
from app.reportes.inferencia import construir_reporte
from app.storage.s3 import ObjectStorage, StorageError, get_storage

router = APIRouter(tags=["reportes"])


def _uuid(valor: str) -> uuid.UUID | None:
    try:
        return uuid.UUID(valor)
    except ValueError:
        return None


def _error(request: Request, codigo: int, clave: str, mensaje: str) -> JSONResponse:
    return JSONResponse(
        status_code=codigo,
        content={
            "error": {"code": clave, "message": mensaje},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


@router.get("/casos/{caso_id}/inferencias/{inferencia_id}/reporte.pdf", response_model=None)
def descargar_reporte(
    request: Request,
    caso_id: str,
    inferencia_id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("reporte.generar"))],
    storage: Annotated[ObjectStorage, Depends(get_storage)],
) -> Response | JSONResponse:
    """PDF de una inferencia del caso, con aviso de apoyo y datos mínimos."""
    caso_uuid = _uuid(caso_id)
    inferencia_uuid = _uuid(inferencia_id)
    caso = (
        db.query(Caso)
        .filter(Caso.id == caso_uuid, Caso.institucion_id == actual.usuario.institucion_id)
        .first()
        if caso_uuid
        else None
    )
    if caso is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")
    inferencia = (
        db.query(Inferencia)
        .filter(Inferencia.id == inferencia_uuid, Inferencia.imagen.has(caso_id=caso.id))
        .first()
        if inferencia_uuid
        else None
    )
    if inferencia is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")

    try:
        imagen = storage.get_bytes(inferencia.imagen.ruta_s3)
    except StorageError:
        imagen = None

    pdf = construir_reporte(
        paciente_codigo=caso.paciente.seudonimo,
        caso_codigo=caso.codigo_caso,
        inferencia=inferencia,
        usuario=actual.usuario.email,
        imagen=imagen,
        generado_en=datetime.now(UTC),
    )
    registrar(
        db,
        request,
        AuditAction.REPORT_DOWNLOAD,
        AuditModule.INFERENCE,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.REPORT,
        objeto_id=inferencia.id,
    )
    nombre = f"reporte-{caso.codigo_caso}-{inferencia.creado_en:%Y%m%d}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{nombre}"'},
    )
