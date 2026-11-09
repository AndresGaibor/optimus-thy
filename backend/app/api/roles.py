"""Rutas de administración de roles y de la matriz de permisos (HU-011).

La matriz es visible y editable por el rol administrador, y cada cambio queda
en la bitácora como ``ADMIN.PERMISSION_CHANGE``.
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.usuarios import Permiso, Rol, RolPermiso
from app.security.permisos import PERMISO_IRRENUNCIABLE_ADMIN

router = APIRouter(tags=["roles"])


class PermisoOut(BaseModel):
    codigo: str
    descripcion: str | None = None


class RolMatrizOut(BaseModel):
    id: str
    nombre: str
    descripcion: str | None = None
    permisos: list[str]


class MatrizOut(BaseModel):
    roles: list[RolMatrizOut]
    permisos: list[PermisoOut]


class PermisosRequest(BaseModel):
    permisos: list[str]


def _error(request: Request, code: str, message: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {"code": code, "message": message},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _rol_matriz(db: Session, rol: Rol) -> RolMatrizOut:
    codigos = (
        db.query(Permiso.codigo)
        .join(RolPermiso, RolPermiso.permiso_id == Permiso.id)
        .filter(RolPermiso.rol_id == rol.id)
        .order_by(Permiso.codigo.asc())
        .all()
    )
    return RolMatrizOut(
        id=str(rol.id),
        nombre=rol.nombre,
        descripcion=rol.descripcion,
        permisos=[codigo for (codigo,) in codigos],
    )


@router.get("/roles", response_model=None)
def matriz_roles(
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("rol.gestionar"))],
) -> MatrizOut | JSONResponse:
    roles = db.query(Rol).order_by(Rol.nombre.asc()).all()
    permisos = db.query(Permiso).order_by(Permiso.codigo.asc()).all()
    return MatrizOut(
        roles=[_rol_matriz(db, rol) for rol in roles],
        permisos=[
            PermisoOut(codigo=permiso.codigo, descripcion=permiso.descripcion)
            for permiso in permisos
        ],
    )


@router.put("/roles/{id}/permisos", response_model=None)
def put_permisos_rol(
    request: Request,
    id: str,
    body: PermisosRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("rol.gestionar"))],
) -> RolMatrizOut | JSONResponse:
    try:
        rol_id = UUID(id)
    except ValueError:
        return _error(request, "not_found", "Rol no encontrado", status.HTTP_404_NOT_FOUND)

    rol = db.query(Rol).filter(Rol.id == rol_id).first()
    if rol is None:
        return _error(request, "not_found", "Rol no encontrado", status.HTTP_404_NOT_FOUND)

    codigos = sorted({codigo.strip() for codigo in body.permisos if codigo.strip()})
    permisos = (
        db.query(Permiso).filter(Permiso.codigo.in_(codigos)).order_by(Permiso.codigo.asc()).all()
        if codigos
        else []
    )
    if len(permisos) != len(codigos):
        return _error(
            request,
            "unprocessable_entity",
            "Permiso desconocido",
            status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    if rol.nombre == "admin" and PERMISO_IRRENUNCIABLE_ADMIN not in codigos:
        return _error(
            request,
            "unprocessable_entity",
            "El rol administrador debe conservar el permiso de gestión de roles",
            status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    db.query(RolPermiso).filter(RolPermiso.rol_id == rol.id).delete()
    for permiso in permisos:
        db.add(RolPermiso(rol_id=rol.id, permiso_id=permiso.id))

    registrar(
        db,
        request,
        AuditAction.PERMISSION_CHANGE,
        AuditModule.ADMIN,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo is not None else None,
        tipo_objeto=AuditObjectType.ROLE,
        objeto_id=rol.id,
        detalles={"resource_count": len(permisos)},
    )
    db.refresh(rol)

    return _rol_matriz(db, rol)
