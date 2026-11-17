"""Rutas de administración de instituciones.

Una institución no se borra: se desactiva, porque los usuarios y la auditoría la
referencian. La desactivación se rechaza mientras tenga usuarios activos, de modo
que nadie queda sin institución por un cambio administrativo.
"""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.instituciones import Institucion
from app.models.usuarios import Usuario

router = APIRouter(tags=["instituciones"])

# Código corto y estable: se usa como identificador legible en reportes.
PATRON_CODIGO = r"^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$"


class CrearInstitucionRequest(BaseModel):
    nombre: str = Field(min_length=1, max_length=255)
    codigo: str = Field(pattern=PATRON_CODIGO)


class PatchInstitucionRequest(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=255)
    codigo: str | None = Field(default=None, pattern=PATRON_CODIGO)
    activa: bool | None = None


def _error(request: Request, code: str, message: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {"code": code, "message": message},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _usuarios_activos(db: Session, institucion_id: UUID) -> int:
    total = (
        db.query(func.count(Usuario.id))
        .filter(Usuario.institucion_id == institucion_id, Usuario.activo.is_(True))
        .scalar()
    )
    return int(total or 0)


def _to_out(db: Session, institucion: Institucion) -> dict[str, Any]:
    return {
        "id": str(institucion.id),
        "nombre": institucion.nombre,
        "codigo": institucion.codigo,
        "activa": bool(institucion.activa),
        "usuarios_activos": _usuarios_activos(db, institucion.id),
    }


def _codigo_duplicado(db: Session, codigo: str, excluir: UUID | None = None) -> bool:
    consulta = db.query(Institucion.id).filter(func.upper(Institucion.codigo) == codigo.upper())
    if excluir is not None:
        consulta = consulta.filter(Institucion.id != excluir)
    return consulta.first() is not None


@router.post("/instituciones", status_code=status.HTTP_201_CREATED, response_model=None)
def crear_institucion(
    request: Request,
    body: CrearInstitucionRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("usuario.gestionar"))],
) -> dict[str, Any] | JSONResponse:
    codigo = body.codigo.strip().upper()
    if _codigo_duplicado(db, codigo):
        return _error(
            request,
            "conflict",
            "Ya existe una institución con ese código",
            status.HTTP_409_CONFLICT,
        )

    institucion = Institucion(nombre=body.nombre.strip(), codigo=codigo, activa=True)
    db.add(institucion)
    db.commit()
    db.refresh(institucion)

    registrar(
        db,
        request,
        AuditAction.INSTITUTION_CREATE,
        AuditModule.ADMIN,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.INSTITUTION,
        objeto_id=institucion.id,
    )
    return _to_out(db, institucion)


@router.patch("/instituciones/{id}", response_model=None)
def patch_institucion(
    request: Request,
    id: str,
    body: PatchInstitucionRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("usuario.gestionar"))],
) -> dict[str, Any] | JSONResponse:
    try:
        institucion_id = UUID(id)
    except ValueError:
        return _error(request, "not_found", "Institución no encontrada", status.HTTP_404_NOT_FOUND)

    institucion = db.query(Institucion).filter(Institucion.id == institucion_id).first()
    if institucion is None:
        return _error(request, "not_found", "Institución no encontrada", status.HTTP_404_NOT_FOUND)

    if body.nombre is None and body.codigo is None and body.activa is None:
        return _error(
            request,
            "unprocessable_entity",
            "No hay cambios que aplicar",
            status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    if body.codigo is not None:
        codigo = body.codigo.strip().upper()
        if _codigo_duplicado(db, codigo, excluir=institucion.id):
            return _error(
                request,
                "conflict",
                "Ya existe una institución con ese código",
                status.HTTP_409_CONFLICT,
            )
        institucion.codigo = codigo

    if body.nombre is not None:
        institucion.nombre = body.nombre.strip()

    if body.activa is not None:
        if body.activa is False:
            activos = _usuarios_activos(db, institucion.id)
            if activos > 0:
                return _error(
                    request,
                    "conflict",
                    "La institución tiene usuarios activos; reasígnalos antes de desactivarla",
                    status.HTTP_409_CONFLICT,
                )
        institucion.activa = bool(body.activa)

    db.add(institucion)
    db.commit()
    db.refresh(institucion)

    registrar(
        db,
        request,
        AuditAction.INSTITUTION_UPDATE,
        AuditModule.ADMIN,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.INSTITUTION,
        objeto_id=institucion.id,
    )
    return _to_out(db, institucion)
