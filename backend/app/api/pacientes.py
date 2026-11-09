"""Pacientes y casos (HU-030, HU-031, HU-033).

Las respuestas nunca llevan la identidad: el paciente se ve por su código
interno. La identidad queda cifrada en ``identidades_paciente`` y revelarla es
otra operación, aún sin implementar (requiere el visto bueno del director).
Un paciente de otra institución responde 404, igual que uno que no existe.
"""

from __future__ import annotations

import secrets
import uuid
from collections.abc import Callable
from datetime import date, datetime
from typing import Annotated, cast

from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.fichas import Caso
from app.models.pacientes import IdentidadPaciente, Paciente
from app.security.encryption import get_cipher

router = APIRouter(tags=["pacientes"])

_LIMITE_MAXIMO = 100
_INTENTOS_CODIGO = 5


class CrearPacienteRequest(BaseModel):
    """Solo los datos mínimos para identificar a la persona (RF-PAC-01)."""

    model_config = ConfigDict(str_strip_whitespace=True)

    nombres: str = Field(min_length=1, max_length=120)
    apellidos: str = Field(min_length=1, max_length=120)
    documento: str = Field(min_length=5, max_length=20, pattern=r"^[A-Za-z0-9-]+$")
    fecha_nacimiento: date

    @field_validator("fecha_nacimiento")
    @classmethod
    def _fecha_razonable(cls, valor: date) -> date:
        if valor > date.today() or valor.year < 1900:
            raise ValueError("fecha de nacimiento fuera de rango")
        return valor


class PacienteOut(BaseModel):
    id: str
    codigo: str
    creado_en: datetime
    total_casos: int


class PacientesListOut(BaseModel):
    total: int
    items: list[PacienteOut]


class CasoOut(BaseModel):
    id: str
    codigo: str
    paciente_id: str
    paciente_codigo: str
    creado_en: datetime


class CasoDetalleOut(CasoOut):
    """Todo lo que cuelga del caso (HU-033); se llena a medida que existan los módulos."""

    tiene_ficha: bool
    documentos: int
    imagenes: int
    consentimientos: int


class PacienteDetalleOut(PacienteOut):
    casos: list[CasoOut]


def _no_encontrado(request: Request) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": {"code": "not_found", "message": "No encontrado"},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _id(valor: str) -> uuid.UUID | None:
    try:
        return uuid.UUID(valor)
    except ValueError:
        return None


def _codigo_nuevo(prefijo: str, existe: Callable[[str], bool]) -> str:
    """Código al azar (no secuencial: el orden de alta no debe deducirse del código)."""
    for _ in range(_INTENTOS_CODIGO):
        codigo = f"{prefijo}-{secrets.token_hex(4).upper()}"
        if not existe(codigo):
            return codigo
    raise RuntimeError("no se pudo generar un código único")  # pragma: no cover


def _paciente_de(db: Session, actual: SesionActual, id_texto: str) -> Paciente | None:
    """El paciente solo si existe y es de la institución de quien consulta (RS-ACC-04)."""
    paciente_id = _id(id_texto)
    if paciente_id is None:
        return None
    return (
        db.query(Paciente)
        .filter(
            Paciente.id == paciente_id,
            Paciente.institucion_id == actual.usuario.institucion_id,
        )
        .first()
    )


def _total_casos(db: Session, paciente_id: uuid.UUID) -> int:
    return db.query(func.count(Caso.id)).filter(Caso.paciente_id == paciente_id).scalar() or 0


def _paciente_out(db: Session, paciente: Paciente) -> PacienteOut:
    return PacienteOut(
        id=str(paciente.id),
        codigo=paciente.seudonimo,
        creado_en=cast(datetime, paciente.creado_en),
        total_casos=_total_casos(db, paciente.id),
    )


def _caso_out(caso: Caso, paciente: Paciente) -> CasoOut:
    return CasoOut(
        id=str(caso.id),
        codigo=caso.codigo_caso,
        paciente_id=str(paciente.id),
        paciente_codigo=paciente.seudonimo,
        creado_en=cast(datetime, caso.creado_en),
    )


@router.post("/pacientes", status_code=status.HTTP_201_CREATED)
def crear_paciente(
    request: Request,
    body: CrearPacienteRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.escribir"))],
) -> PacienteOut:
    codigo = _codigo_nuevo(
        "PAC",
        lambda c: db.query(Paciente.id).filter(Paciente.seudonimo == c).first() is not None,
    )
    paciente = Paciente(institucion_id=actual.usuario.institucion_id, seudonimo=codigo)
    db.add(paciente)
    db.flush()
    db.add(
        IdentidadPaciente(
            paciente_id=paciente.id,
            nombres_cifrados=body.nombres,
            apellidos_cifrados=body.apellidos,
            documento_cifrado=body.documento,
            fecha_nacimiento_cifrada=body.fecha_nacimiento.isoformat(),
            clave_version=get_cipher().key_id(),
        )
    )
    db.commit()
    db.refresh(paciente)
    registrar(
        db,
        request,
        AuditAction.PATIENT_CREATE,
        AuditModule.PATIENTS,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.PATIENT,
        objeto_id=paciente.id,
    )
    return _paciente_out(db, paciente)


@router.get("/pacientes")
def listar_pacientes(
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.leer"))],
    q: Annotated[str | None, Query(max_length=64)] = None,
    limite: Annotated[int, Query(ge=1)] = 25,
    desplazamiento: Annotated[int, Query(ge=0)] = 0,
) -> PacientesListOut:
    consulta = db.query(Paciente).filter(Paciente.institucion_id == actual.usuario.institucion_id)
    if q:
        patron = "%" + q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
        consulta = consulta.filter(Paciente.seudonimo.ilike(patron, escape="\\"))
    total = consulta.count()
    filas = (
        consulta.order_by(Paciente.creado_en.desc(), Paciente.id)
        .offset(desplazamiento)
        .limit(min(limite, _LIMITE_MAXIMO))
        .all()
    )
    registrar(
        db,
        request,
        AuditAction.PATIENT_READ,
        AuditModule.PATIENTS,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.PATIENT,
        detalles={"resource_count": len(filas)},
    )
    return PacientesListOut(total=total, items=[_paciente_out(db, p) for p in filas])


@router.get("/pacientes/{id}", response_model=None)
def obtener_paciente(
    request: Request,
    id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.leer"))],
) -> PacienteDetalleOut | JSONResponse:
    paciente = _paciente_de(db, actual, id)
    if paciente is None:
        return _no_encontrado(request)
    casos = db.query(Caso).filter(Caso.paciente_id == paciente.id).order_by(Caso.creado_en).all()
    registrar(
        db,
        request,
        AuditAction.PATIENT_READ,
        AuditModule.PATIENTS,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.PATIENT,
        objeto_id=paciente.id,
    )
    base = _paciente_out(db, paciente)
    return PacienteDetalleOut(**base.model_dump(), casos=[_caso_out(c, paciente) for c in casos])


@router.post("/pacientes/{id}/casos", status_code=status.HTTP_201_CREATED, response_model=None)
def crear_caso(
    request: Request,
    id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.escribir"))],
) -> CasoOut | JSONResponse:
    paciente = _paciente_de(db, actual, id)
    if paciente is None:
        return _no_encontrado(request)
    codigo = _codigo_nuevo(
        "CASO",
        lambda c: (
            db.query(Caso.id)
            .filter(Caso.institucion_id == paciente.institucion_id, Caso.codigo_caso == c)
            .first()
            is not None
        ),
    )
    caso = Caso(institucion_id=paciente.institucion_id, paciente_id=paciente.id, codigo_caso=codigo)
    db.add(caso)
    db.commit()
    db.refresh(caso)
    registrar(
        db,
        request,
        AuditAction.CASE_CREATE,
        AuditModule.PATIENTS,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.CASE,
        objeto_id=caso.id,
    )
    return _caso_out(caso, paciente)


@router.get("/casos/{id}", response_model=None)
def obtener_caso(
    request: Request,
    id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.leer"))],
) -> CasoDetalleOut | JSONResponse:
    caso_id = _id(id)
    caso = (
        db.query(Caso)
        .filter(Caso.id == caso_id, Caso.institucion_id == actual.usuario.institucion_id)
        .first()
        if caso_id
        else None
    )
    if caso is None:
        return _no_encontrado(request)
    registrar(
        db,
        request,
        AuditAction.RECORD_READ,
        AuditModule.PATIENTS,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.CASE,
        objeto_id=caso.id,
    )
    return CasoDetalleOut(
        **_caso_out(caso, caso.paciente).model_dump(),
        tiene_ficha=caso.ficha_clinica is not None,
        documentos=len(caso.documentos),
        imagenes=len(caso.imagenes),
        consentimientos=len(caso.consentimientos),
    )
