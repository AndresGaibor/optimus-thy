"""Edición versionada, historial y cierre de la ficha clínica."""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.fichas import Caso, FichaClinica, FichaVersion
from app.models.usuarios import Usuario

router = APIRouter(tags=["fichas"])

CAMPOS_EDITABLES = (
    "tsh",
    "tsh_unidad",
    "tsh_fecha",
    "t3",
    "t3_unidad",
    "t3_fecha",
    "t4",
    "t4_unidad",
    "t4_fecha",
    "tamano_nodulo_mm",
    "lateralidad",
    "tirads",
    "bethesda",
    "cie10",
    "tipo_diagnostico",
    "tipo_consulta",
)


class FichaCambio(BaseModel):
    """Campos que puede registrar o corregir un usuario en la ficha."""

    model_config = ConfigDict(extra="forbid")

    tsh: Decimal | None = None
    tsh_unidad: str | None = None
    tsh_fecha: date | None = None
    t3: Decimal | None = None
    t3_unidad: str | None = None
    t3_fecha: date | None = None
    t4: Decimal | None = None
    t4_unidad: str | None = None
    t4_fecha: date | None = None
    tamano_nodulo_mm: Decimal | None = None
    lateralidad: str | None = None
    tirads: str | None = None
    bethesda: str | None = None
    cie10: str | None = None
    tipo_diagnostico: str | None = None
    tipo_consulta: str | None = None


class FichaEstadoOut(BaseModel):
    caso_id: uuid.UUID
    registrada: bool
    cerrada_en: datetime | None
    cerrada_por_id: uuid.UUID | None
    cerrada_por_nombre: str | None


class VersionFichaOut(BaseModel):
    version: int
    creado_en: datetime
    autor_id: uuid.UUID | None
    autor_nombre: str | None
    campos_cambiados: list[str]
    antes: dict[str, str | None] | None
    despues: dict[str, str | None]


class HistorialFichaOut(BaseModel):
    items: list[VersionFichaOut]


def _error(request: Request, codigo: int, clave: str, mensaje: str) -> JSONResponse:
    return JSONResponse(
        status_code=codigo,
        content={
            "error": {"code": clave, "message": mensaje},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _buscar_caso(
    db: Session,
    caso_id: uuid.UUID,
    institucion_id: uuid.UUID,
    *,
    bloquear: bool = False,
) -> Caso | None:
    consulta = db.query(Caso).filter(
        Caso.id == caso_id,
        Caso.institucion_id == institucion_id,
    )
    if bloquear:
        consulta = consulta.with_for_update()
    return consulta.first()


def _texto(valor: object) -> str | None:
    if valor is None:
        return None
    if isinstance(valor, date):
        return valor.isoformat()
    return str(valor)


def _instantanea(ficha: FichaClinica) -> dict[str, str | None]:
    return {campo: _texto(getattr(ficha, campo)) for campo in CAMPOS_EDITABLES}


def _estado(
    db: Session,
    caso_id: uuid.UUID,
    ficha: FichaClinica | None,
) -> FichaEstadoOut:
    cerrada_por = db.get(Usuario, ficha.cerrada_por_id) if ficha and ficha.cerrada_por_id else None
    return FichaEstadoOut(
        caso_id=caso_id,
        registrada=ficha is not None,
        cerrada_en=ficha.cerrada_en if ficha else None,
        cerrada_por_id=ficha.cerrada_por_id if ficha else None,
        cerrada_por_nombre=cerrada_por.nombre if cerrada_por else None,
    )


def _registrar_lectura(
    db: Session,
    request: Request,
    actual: SesionActual,
    caso_id: uuid.UUID,
    cantidad: int,
) -> None:
    registrar(
        db,
        request,
        AuditAction.RECORD_READ,
        AuditModule.PATIENTS,
        usuario=actual.usuario,
        tipo_objeto=AuditObjectType.CASE,
        objeto_id=caso_id,
        detalles={"resource_count": cantidad},
    )


@router.get("/casos/{caso_id}/ficha", response_model=FichaEstadoOut)
def obtener_estado_ficha(
    caso_id: uuid.UUID,
    request: Request,
    actual: Annotated[SesionActual, Depends(requiere_permiso("ficha.leer"))],
    db: Annotated[Session, Depends(session_dep)],
) -> FichaEstadoOut | JSONResponse:
    caso = _buscar_caso(db, caso_id, actual.usuario.institucion_id)
    if caso is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")
    ficha = db.query(FichaClinica).filter(FichaClinica.caso_id == caso_id).first()
    estado = _estado(db, caso_id, ficha)
    _registrar_lectura(db, request, actual, caso_id, int(ficha is not None))
    return estado


@router.get("/casos/{caso_id}/ficha/historial", response_model=HistorialFichaOut)
def obtener_historial_ficha(
    caso_id: uuid.UUID,
    request: Request,
    actual: Annotated[SesionActual, Depends(requiere_permiso("ficha.leer"))],
    db: Annotated[Session, Depends(session_dep)],
) -> HistorialFichaOut | JSONResponse:
    caso = _buscar_caso(db, caso_id, actual.usuario.institucion_id)
    if caso is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")

    registros = (
        db.query(FichaVersion, Usuario.nombre)
        .outerjoin(Usuario, FichaVersion.autor_id == Usuario.id)
        .filter(FichaVersion.caso_id == caso_id)
        .order_by(FichaVersion.version.desc())
        .all()
    )
    versiones = {version.version: version for version, _ in registros}
    items: list[VersionFichaOut] = []
    for version, autor_nombre in registros:
        antes = version.snapshot_anterior
        if antes is None:
            anterior = versiones.get(version.version - 1)
            antes = anterior.snapshot if anterior else None
        despues = version.snapshot
        campos_cambiados = sorted(
            campo
            for campo in set(antes or {}) | set(despues)
            if (antes or {}).get(campo) != despues.get(campo)
        )
        items.append(
            VersionFichaOut(
                version=version.version,
                creado_en=version.creado_en,
                autor_id=version.autor_id,
                autor_nombre=autor_nombre,
                campos_cambiados=campos_cambiados,
                antes=antes,
                despues=despues,
            )
        )

    _registrar_lectura(db, request, actual, caso_id, len(items))
    return HistorialFichaOut(items=items)


@router.patch("/casos/{caso_id}/ficha", response_model=FichaEstadoOut)
def actualizar_ficha(
    caso_id: uuid.UUID,
    cambios: FichaCambio,
    request: Request,
    actual: Annotated[SesionActual, Depends(requiere_permiso("ficha.escribir"))],
    db: Annotated[Session, Depends(session_dep)],
) -> FichaEstadoOut | JSONResponse:
    valores = cambios.model_dump(exclude_unset=True)
    if not valores:
        return _error(
            request,
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "ficha_sin_cambios",
            "Indica al menos un campo para guardar.",
        )

    caso = _buscar_caso(db, caso_id, actual.usuario.institucion_id, bloquear=True)
    if caso is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")
    ficha = db.query(FichaClinica).filter(FichaClinica.caso_id == caso_id).first()
    if ficha is not None and ficha.cerrada_en is not None:
        return _error(
            request,
            status.HTTP_409_CONFLICT,
            "ficha_cerrada",
            "Reabre la ficha antes de editarla.",
        )

    nueva = ficha is None
    if ficha is None:
        ficha = FichaClinica(caso_id=caso.id)
    antes = _instantanea(ficha)
    for campo, valor in valores.items():
        setattr(ficha, campo, valor)
    despues = _instantanea(ficha)
    campos_cambiados = sorted(campo for campo in valores if antes[campo] != despues[campo])
    if not campos_cambiados:
        return _estado(db, caso_id, None if nueva else ficha)

    if nueva:
        db.add(ficha)
    db.flush()
    ultimo_numero = (
        db.query(func.max(FichaVersion.version)).filter(FichaVersion.caso_id == caso_id).scalar()
    )
    db.add(
        FichaVersion(
            caso_id=caso_id,
            ficha_clinica_id=ficha.id,
            version=(ultimo_numero or 0) + 1,
            snapshot=despues,
            snapshot_anterior=antes,
            autor_id=actual.usuario.id,
        )
    )
    estado = _estado(db, caso_id, ficha)
    registrar(
        db,
        request,
        AuditAction.RECORD_UPDATE,
        AuditModule.PATIENTS,
        usuario=actual.usuario,
        tipo_objeto=AuditObjectType.CASE,
        objeto_id=caso_id,
        detalles={"changed_fields": "+".join(campos_cambiados)},
    )
    return estado


@router.post("/casos/{caso_id}/ficha/cerrar", response_model=FichaEstadoOut)
def cerrar_ficha(
    caso_id: uuid.UUID,
    request: Request,
    actual: Annotated[SesionActual, Depends(requiere_permiso("ficha.escribir"))],
    db: Annotated[Session, Depends(session_dep)],
) -> FichaEstadoOut | JSONResponse:
    caso = _buscar_caso(db, caso_id, actual.usuario.institucion_id, bloquear=True)
    if caso is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")
    ficha = db.query(FichaClinica).filter(FichaClinica.caso_id == caso_id).first()
    if ficha is None:
        return _error(
            request,
            status.HTTP_404_NOT_FOUND,
            "ficha_no_encontrada",
            "La ficha clínica todavía no está registrada.",
        )
    if ficha.cerrada_en is None:
        ficha.cerrada_en = datetime.now(UTC)
        ficha.cerrada_por_id = actual.usuario.id
        db.flush()
        estado = _estado(db, caso_id, ficha)
        registrar(
            db,
            request,
            AuditAction.RECORD_CLOSE,
            AuditModule.PATIENTS,
            usuario=actual.usuario,
            tipo_objeto=AuditObjectType.CASE,
            objeto_id=caso_id,
            detalles={"changed_fields": "cerrada_en+cerrada_por_id"},
        )
        return estado
    return _estado(db, caso_id, ficha)


@router.post("/casos/{caso_id}/ficha/reabrir", response_model=FichaEstadoOut)
def reabrir_ficha(
    caso_id: uuid.UUID,
    request: Request,
    actual: Annotated[SesionActual, Depends(requiere_permiso("ficha.escribir"))],
    db: Annotated[Session, Depends(session_dep)],
) -> FichaEstadoOut | JSONResponse:
    caso = _buscar_caso(db, caso_id, actual.usuario.institucion_id, bloquear=True)
    if caso is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")
    ficha = db.query(FichaClinica).filter(FichaClinica.caso_id == caso_id).first()
    if ficha is None:
        return _error(
            request,
            status.HTTP_404_NOT_FOUND,
            "ficha_no_encontrada",
            "La ficha clínica todavía no está registrada.",
        )
    if ficha.cerrada_en is not None:
        ficha.cerrada_en = None
        ficha.cerrada_por_id = None
        db.flush()
        estado = _estado(db, caso_id, ficha)
        registrar(
            db,
            request,
            AuditAction.RECORD_REOPEN,
            AuditModule.PATIENTS,
            usuario=actual.usuario,
            tipo_objeto=AuditObjectType.CASE,
            objeto_id=caso_id,
            detalles={"changed_fields": "cerrada_en+cerrada_por_id"},
        )
        return estado
    return _estado(db, caso_id, ficha)
