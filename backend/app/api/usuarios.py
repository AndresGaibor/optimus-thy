"""Rutas de administración de usuarios."""

from __future__ import annotations

import contextlib
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

router = APIRouter(tags=["usuarios"])


class InstitucionOut(BaseModel):
    id: str
    nombre: str
    codigo: str


class InstitucionUsuarioOut(BaseModel):
    id: str
    nombre: str


class UsuarioItemOut(BaseModel):
    id: str
    correo: str
    nombre: str | None = None
    activo: bool
    institucion: InstitucionUsuarioOut
    roles: list[str]


class UsuariosListOut(BaseModel):
    total: int
    items: list[UsuarioItemOut]


class CrearUsuarioRequest(BaseModel):
    correo: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=255)
    nombre: str | None = Field(default=None, max_length=255)
    institucion_id: str
    roles: list[str]
    # RS-ACC-01: mínimo 12 caracteres.
    password: str = Field(min_length=12, max_length=128)


class PatchUsuarioRequest(BaseModel):
    nombre: str | None = None
    activo: bool | None = None
    institucion_id: str | None = None


class RolesRequest(BaseModel):
    roles: list[str]


def _error(request: Request, code: str, message: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {"code": code, "message": message},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _usuario_to_item(usuario: Usuario, roles_list: list[str]) -> dict[str, Any]:
    return {
        "id": str(usuario.id),
        "correo": usuario.email,
        "nombre": usuario.nombre,
        "activo": bool(usuario.activo),
        "institucion": {
            "id": str(usuario.institucion.id) if usuario.institucion else "",
            "nombre": usuario.institucion.nombre if usuario.institucion else "",
        },
        "roles": roles_list,
    }


@router.get("/instituciones", response_model=None)
def listar_instituciones(
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("usuario.gestionar"))],
) -> list[InstitucionOut] | JSONResponse:
    instituciones = (
        db.query(Institucion)
        .filter(Institucion.activa.is_(True))
        .order_by(Institucion.nombre.asc())
        .all()
    )
    result: list[InstitucionOut] = [
        InstitucionOut(id=str(i.id), nombre=i.nombre, codigo=i.codigo) for i in instituciones
    ]
    return result


@router.get("/usuarios", response_model=None)
def listar_usuarios(
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("usuario.gestionar"))],
    institucion_id: str | None = None,
    activo: bool | None = None,
    q: str | None = None,
    limite: int = Query(default=25, ge=1),
    desplazamiento: int = Query(default=0, ge=0),
) -> UsuariosListOut | JSONResponse:
    if limite > 100:
        limite = 100

    query = db.query(Usuario).options(
        joinedload(Usuario.institucion),
        joinedload(Usuario.usuarios_roles).joinedload(UsuarioRol.rol),
    )

    if institucion_id is not None:
        with contextlib.suppress(Exception):
            query = query.filter(Usuario.institucion_id == UUID(institucion_id))

    if activo is not None:
        query = query.filter(Usuario.activo == activo)

    if q:
        q_lower = f"%{q.lower()}%"
        query = query.filter(
            or_(func.lower(Usuario.email).like(q_lower), func.lower(Usuario.nombre).like(q_lower))
        )

    total = query.count()

    usuarios = (
        query.order_by(Usuario.creado_en.asc(), Usuario.id.asc())
        .offset(desplazamiento)
        .limit(limite)
        .all()
    )

    items_model: list[UsuarioItemOut] = []
    for usuario in usuarios:
        roles_list = []
        for ur in usuario.usuarios_roles:
            if ur.rol is not None:
                roles_list.append(ur.rol.nombre)
        items_model.append(UsuarioItemOut(**_usuario_to_item(usuario, roles_list)))

    return UsuariosListOut(total=total, items=items_model)


@router.post("/usuarios", status_code=status.HTTP_201_CREATED, response_model=None)
def crear_usuario(
    request: Request,
    body: CrearUsuarioRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("usuario.gestionar"))],
) -> dict[str, Any] | JSONResponse:
    # Verificar correo duplicado
    existe = db.query(Usuario).filter(Usuario.email == body.correo).first()
    if existe is not None:
        return _error(request, "conflict", "El correo ya está registrado", status.HTTP_409_CONFLICT)

    # Verificar institución
    try:
        inst_id = UUID(body.institucion_id)
    except Exception:
        return _error(request, "not_found", "Institución no encontrada", status.HTTP_404_NOT_FOUND)

    institucion = db.query(Institucion).filter(Institucion.id == inst_id).first()
    if institucion is None:
        return _error(request, "not_found", "Institución no encontrada", status.HTTP_404_NOT_FOUND)

    # Verificar roles
    if not body.roles or len(body.roles) == 0:
        return _error(
            request,
            "unprocessable_entity",
            "Debe asignar al menos un rol",
            status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    # Validar roles conocidos
    roles_objs = []
    for nombre_rol in body.roles:
        rol = db.query(Rol).filter(Rol.nombre == nombre_rol).first()
        if rol is None:
            return _error(
                request,
                "unprocessable_entity",
                "Rol desconocido",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        roles_objs.append(rol)

    # Crear usuario
    password_hash = hash_password(body.correo, body.password)
    usuario = Usuario(
        institucion_id=inst_id,
        email=body.correo,
        password_hash=password_hash,
        nombre=body.nombre,
        activo=True,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    # Asignar roles
    for rol in roles_objs:
        ur = UsuarioRol(usuario_id=usuario.id, rol_id=rol.id)
        db.add(ur)
    db.commit()
    registrar(
        db,
        request,
        AuditAction.USER_CREATE,
        AuditModule.ADMIN,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.USER,
        objeto_id=usuario.id,
    )

    # Recargar con relaciones
    usuario_ref = (
        db.query(Usuario)
        .options(
            joinedload(Usuario.institucion),
            joinedload(Usuario.usuarios_roles).joinedload(UsuarioRol.rol),
        )
        .filter(Usuario.id == usuario.id)
        .first()
    )
    if usuario_ref is None:
        return _error(request, "not_found", "Usuario no encontrado", status.HTTP_404_NOT_FOUND)
    usuario_loaded = usuario_ref

    roles_list = []
    for ur in usuario_loaded.usuarios_roles:
        if ur.rol is not None:
            roles_list.append(ur.rol.nombre)

    return _usuario_to_item(usuario_loaded, roles_list)


@router.patch("/usuarios/{id}", response_model=None)
def patch_usuario(
    request: Request,
    id: str,
    body: PatchUsuarioRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("usuario.gestionar"))],
) -> dict[str, Any] | JSONResponse:
    try:
        usuario_id = UUID(id)
    except Exception:
        return _error(request, "not_found", "Usuario no encontrado", status.HTTP_404_NOT_FOUND)

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if usuario is None:
        return _error(request, "not_found", "Usuario no encontrado", status.HTTP_404_NOT_FOUND)

    # Un admin no puede desactivarse a sí mismo
    if body.activo is False and actual.usuario.id == usuario.id:
        return _error(
            request, "forbidden", "No puedes desactivarte a ti mismo", status.HTTP_403_FORBIDDEN
        )

    if body.nombre is not None:
        usuario.nombre = body.nombre
    if body.activo is not None:
        usuario.activo = bool(body.activo)
    if body.institucion_id is not None:
        try:
            inst_id = UUID(body.institucion_id)
        except Exception:
            return _error(
                request, "not_found", "Institución no encontrada", status.HTTP_404_NOT_FOUND
            )
        institucion = db.query(Institucion).filter(Institucion.id == inst_id).first()
        if institucion is None:
            return _error(
                request, "not_found", "Institución no encontrada", status.HTTP_404_NOT_FOUND
            )
        usuario.institucion_id = inst_id

    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    registrar(
        db,
        request,
        AuditAction.USER_UPDATE,
        AuditModule.ADMIN,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.USER,
        objeto_id=usuario.id,
    )

    usuario_ref = (
        db.query(Usuario)
        .options(
            joinedload(Usuario.institucion),
            joinedload(Usuario.usuarios_roles).joinedload(UsuarioRol.rol),
        )
        .filter(Usuario.id == usuario.id)
        .first()
    )
    if usuario_ref is None:
        return _error(request, "not_found", "Usuario no encontrado", status.HTTP_404_NOT_FOUND)
    usuario_loaded = usuario_ref

    roles_list = []
    for ur in usuario_loaded.usuarios_roles:
        if ur.rol is not None:
            roles_list.append(ur.rol.nombre)

    return _usuario_to_item(usuario_loaded, roles_list)


@router.put("/usuarios/{id}/roles", response_model=None)
def put_roles_usuario(
    request: Request,
    id: str,
    body: RolesRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("usuario.gestionar"))],
) -> dict[str, Any] | JSONResponse:
    try:
        usuario_id = UUID(id)
    except Exception:
        return _error(request, "not_found", "Usuario no encontrado", status.HTTP_404_NOT_FOUND)

    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if usuario is None:
        return _error(request, "not_found", "Usuario no encontrado", status.HTTP_404_NOT_FOUND)

    if not body.roles or len(body.roles) == 0:
        return _error(
            request,
            "unprocessable_entity",
            "Debe asignar al menos un rol",
            status.HTTP_422_UNPROCESSABLE_ENTITY,
        )

    roles_objs = []
    for nombre_rol in body.roles:
        rol = db.query(Rol).filter(Rol.nombre == nombre_rol).first()
        if rol is None:
            return _error(
                request,
                "unprocessable_entity",
                "Rol desconocido",
                status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        roles_objs.append(rol)

    # Reemplazar matriz de roles
    db.query(UsuarioRol).filter(UsuarioRol.usuario_id == usuario.id).delete()
    for rol in roles_objs:
        ur = UsuarioRol(usuario_id=usuario.id, rol_id=rol.id)
        db.add(ur)
    db.commit()
    registrar(
        db,
        request,
        AuditAction.USER_ROLE_CHANGE,
        AuditModule.ADMIN,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.USER,
        objeto_id=usuario.id,
        detalles={"resource_count": len(roles_objs)},
    )

    usuario_ref = (
        db.query(Usuario)
        .options(
            joinedload(Usuario.institucion),
            joinedload(Usuario.usuarios_roles).joinedload(UsuarioRol.rol),
        )
        .filter(Usuario.id == usuario.id)
        .first()
    )
    if usuario_ref is None:
        return _error(request, "not_found", "Usuario no encontrado", status.HTTP_404_NOT_FOUND)
    usuario_loaded = usuario_ref

    roles_list = []
    for ur in usuario_loaded.usuarios_roles:
        if ur.rol is not None:
            roles_list.append(ur.rol.nombre)

    return _usuario_to_item(usuario_loaded, roles_list)
