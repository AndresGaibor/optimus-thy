"""Pacientes y casos (HU-030, HU-031, HU-033).

Las respuestas nunca llevan la identidad: el paciente se ve por su código
interno. La identidad queda cifrada en ``identidades_paciente``; solo se
revela en ``GET /pacientes/{id}/identidad``, que queda auditado como
``PII_REVEAL``. Un paciente de otra institución responde 404, igual que uno
que no existe.
"""

from __future__ import annotations

import csv
import io
import secrets
import uuid
from collections.abc import Callable
from datetime import date, datetime
from typing import Annotated, Any, Literal, cast

from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.fichas import Caso
from app.models.imagenes import DecisionMedica, Imagen, Inferencia, ModeloIA
from app.models.pacientes import IdentidadPaciente, Paciente
from app.security.encryption import get_cipher

router = APIRouter(tags=["pacientes"])

_LIMITE_MAXIMO = 100
_INTENTOS_CODIGO = 5


def _fecha_nacimiento_valida(valor: date) -> date:
    if valor > date.today() or valor.year < 1900:
        raise ValueError("fecha de nacimiento fuera de rango")
    return valor


def _quitar_default_confirmacion(schema: dict[str, Any]) -> None:
    schema.pop("default", None)


class CrearPacienteRequest(BaseModel):
    """Solo los datos mínimos para identificar a la persona (RF-PAC-01)."""

    model_config = ConfigDict(str_strip_whitespace=True)

    nombres: str = Field(min_length=1, max_length=120)
    apellidos: str = Field(min_length=1, max_length=120)
    documento: str = Field(min_length=5, max_length=20, pattern=r"^[A-Za-z0-9 .-]+$")
    fecha_nacimiento: date
    confirmar_duplicado: bool = Field(default=False, json_schema_extra=_quitar_default_confirmacion)

    @field_validator("fecha_nacimiento")
    @classmethod
    def _fecha_razonable(cls, valor: date) -> date:
        return _fecha_nacimiento_valida(valor)


class PatchPacienteRequest(BaseModel):
    """Corrección de la identidad (TES-327); solo se aplica lo enviado."""

    model_config = ConfigDict(str_strip_whitespace=True)

    nombres: str | None = Field(default=None, min_length=1, max_length=120)
    apellidos: str | None = Field(default=None, min_length=1, max_length=120)
    documento: str | None = Field(
        default=None, min_length=5, max_length=20, pattern=r"^[A-Za-z0-9 .-]+$"
    )
    fecha_nacimiento: date | None = None

    @field_validator("fecha_nacimiento")
    @classmethod
    def _fecha_razonable(cls, valor: date | None) -> date | None:
        return None if valor is None else _fecha_nacimiento_valida(valor)


class IdentidadOut(BaseModel):
    """Identidad descifrada; solo la devuelve la ruta que la revela."""

    nombres: str
    apellidos: str
    documento: str
    fecha_nacimiento: date


class PacienteOut(BaseModel):
    id: str
    codigo: str
    creado_en: datetime
    total_casos: int
    archivado_en: datetime | None


class PacientesListOut(BaseModel):
    total: int
    items: list[PacienteOut]


class ErrorDuplicadoDetalle(BaseModel):
    code: Literal["posible_duplicado"]
    message: str


class ErrorDuplicado(BaseModel):
    error: ErrorDuplicadoDetalle
    request_id: str


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


def _error(request: Request, codigo_http: int, clave: str, mensaje: str) -> JSONResponse:
    return JSONResponse(
        status_code=codigo_http,
        content={
            "error": {"code": clave, "message": mensaje},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _no_encontrado(request: Request) -> JSONResponse:
    return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")


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


def _paciente_de(
    db: Session, actual: SesionActual, id_texto: str, *, bloquear: bool = False
) -> Paciente | None:
    """El paciente solo si existe y es de la institución de quien consulta (RS-ACC-04)."""
    paciente_id = _id(id_texto)
    if paciente_id is None:
        return None
    consulta = db.query(Paciente).filter(
        Paciente.id == paciente_id,
        Paciente.institucion_id == actual.usuario.institucion_id,
    )
    if bloquear:
        consulta = consulta.with_for_update()
    return consulta.first()


def _total_casos(db: Session, paciente_id: uuid.UUID) -> int:
    return db.query(func.count(Caso.id)).filter(Caso.paciente_id == paciente_id).scalar() or 0


def _documento_canonico(documento: str) -> str:
    return documento.upper().replace(" ", "").replace("-", "").replace(".", "")


def _bloquear_documento(db: Session, institucion_id: uuid.UUID, documento: str) -> None:
    if db.get_bind().dialect.name == "postgresql":
        db.execute(
            text("SELECT pg_advisory_xact_lock(hashtext(:clave))"),
            {"clave": f"{institucion_id}:{_documento_canonico(documento)}"},
        )


def _documento_en_uso(
    db: Session, institucion_id: uuid.UUID, documento: str, excluir: uuid.UUID | None
) -> uuid.UUID | None:
    """Devuelve el ID de un paciente de la institución con ese documento, si existe."""
    consulta = (
        db.query(IdentidadPaciente.paciente_id, IdentidadPaciente.documento_cifrado)
        .join(Paciente, Paciente.id == IdentidadPaciente.paciente_id)
        .filter(Paciente.institucion_id == institucion_id)
    )
    if excluir is not None:
        consulta = consulta.filter(Paciente.id != excluir)
    for paciente_id, documento_guardado in consulta.all():
        if _documento_canonico(documento_guardado) == _documento_canonico(documento):
            return paciente_id
    return None


def _paciente_out(db: Session, paciente: Paciente) -> PacienteOut:
    return PacienteOut(
        id=str(paciente.id),
        codigo=paciente.seudonimo,
        creado_en=cast(datetime, paciente.creado_en),
        total_casos=_total_casos(db, paciente.id),
        archivado_en=paciente.archivado_en,
    )


def _caso_out(caso: Caso, paciente: Paciente) -> CasoOut:
    return CasoOut(
        id=str(caso.id),
        codigo=caso.codigo_caso,
        paciente_id=str(paciente.id),
        paciente_codigo=paciente.seudonimo,
        creado_en=caso.creado_en,
    )


@router.post(
    "/pacientes",
    status_code=status.HTTP_201_CREATED,
    response_model=PacienteOut,
    responses={
        409: {
            "model": ErrorDuplicado,
            "description": "Ya existe un paciente con ese documento",
        }
    },
)
def crear_paciente(
    request: Request,
    body: CrearPacienteRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.escribir"))],
) -> Any:
    _bloquear_documento(db, actual.usuario.institucion_id, body.documento)
    if not body.confirmar_duplicado and _documento_en_uso(
        db, actual.usuario.institucion_id, body.documento, excluir=None
    ):
        return _error(
            request,
            status.HTTP_409_CONFLICT,
            "posible_duplicado",
            "Ya existe un paciente con ese documento",
        )
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


@router.patch(
    "/pacientes/{id}",
    response_model=None,
    responses={
        409: {
            "model": ErrorDuplicado,
            "description": "Ya existe un paciente con ese documento",
        }
    },
)
def actualizar_paciente(
    request: Request,
    id: str,
    body: PatchPacienteRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.escribir"))],
) -> PacienteOut | JSONResponse:
    paciente = _paciente_de(db, actual, id)
    if paciente is None:
        return _no_encontrado(request)
    identidad = paciente.identidad
    if identidad is None:
        return _no_encontrado(request)

    if not body.model_fields_set:
        return _error(
            request,
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "unprocessable_entity",
            "No hay cambios que aplicar",
        )
    if any(getattr(body, campo) is None for campo in body.model_fields_set):
        return _error(
            request,
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "validation_error",
            "Datos de entrada inválidos",
        )

    cambios: list[str] = []
    if body.nombres is not None and body.nombres != identidad.nombres_cifrados:
        identidad.nombres_cifrados = body.nombres
        cambios.append("nombres")
    if body.apellidos is not None and body.apellidos != identidad.apellidos_cifrados:
        identidad.apellidos_cifrados = body.apellidos
        cambios.append("apellidos")
    if body.documento is not None and body.documento != identidad.documento_cifrado:
        _bloquear_documento(db, paciente.institucion_id, body.documento)
        if _documento_en_uso(db, paciente.institucion_id, body.documento, paciente.id):
            return _error(
                request,
                status.HTTP_409_CONFLICT,
                "posible_duplicado",
                "Ya existe un paciente con ese documento",
            )
        identidad.documento_cifrado = body.documento
        cambios.append("documento")
    if body.fecha_nacimiento is not None:
        fecha = body.fecha_nacimiento.isoformat()
        if fecha != identidad.fecha_nacimiento_cifrada:
            identidad.fecha_nacimiento_cifrada = fecha
            cambios.append("fecha_nacimiento")

    # Un PATCH idempotente no reescribe ni audita nada: no hubo cambio real.
    if not cambios:
        return _paciente_out(db, paciente)

    identidad.clave_version = get_cipher().key_id()
    db.add(identidad)
    db.commit()
    db.refresh(paciente)
    registrar(
        db,
        request,
        AuditAction.PATIENT_UPDATE,
        AuditModule.PATIENTS,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.PATIENT,
        objeto_id=paciente.id,
        # Solo nombres de campo; el valor corregido nunca entra en la bitácora.
        detalles={"changed_fields": ".".join(cambios)},
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
    incluir_archivados: bool = False,
) -> PacientesListOut:
    consulta = db.query(Paciente).filter(Paciente.institucion_id == actual.usuario.institucion_id)
    if not incluir_archivados:
        consulta = consulta.filter(Paciente.archivado_en.is_(None))
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


@router.post(
    "/pacientes/{id}/archivar",
    response_model=PacienteOut,
    responses={409: {"description": "El paciente ya está archivado."}},
)
def archivar_paciente(
    request: Request,
    id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.archivar"))],
) -> PacienteOut | JSONResponse:
    paciente = _paciente_de(db, actual, id, bloquear=True)
    if paciente is None:
        return _no_encontrado(request)
    if paciente.archivado_en is not None:
        return _error(
            request,
            status.HTTP_409_CONFLICT,
            "paciente_ya_archivado",
            "El paciente ya está archivado",
        )
    paciente.archivado_en = func.now()
    paciente.archivado_por_id = actual.usuario.id
    db.commit()
    db.refresh(paciente)
    registrar(
        db,
        request,
        AuditAction.PATIENT_ARCHIVE,
        AuditModule.PATIENTS,
        usuario=actual.usuario,
        tipo_objeto=AuditObjectType.PATIENT,
        objeto_id=paciente.id,
    )
    return _paciente_out(db, paciente)


@router.post(
    "/pacientes/{id}/desarchivar",
    response_model=PacienteOut,
    responses={409: {"description": "El paciente no está archivado."}},
)
def desarchivar_paciente(
    request: Request,
    id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.archivar"))],
) -> PacienteOut | JSONResponse:
    paciente = _paciente_de(db, actual, id, bloquear=True)
    if paciente is None:
        return _no_encontrado(request)
    if paciente.archivado_en is None:
        return _error(
            request,
            status.HTTP_409_CONFLICT,
            "paciente_no_archivado",
            "El paciente no está archivado",
        )
    paciente.archivado_en = None
    paciente.archivado_por_id = None
    db.commit()
    db.refresh(paciente)
    registrar(
        db,
        request,
        AuditAction.PATIENT_UNARCHIVE,
        AuditModule.PATIENTS,
        usuario=actual.usuario,
        tipo_objeto=AuditObjectType.PATIENT,
        objeto_id=paciente.id,
    )
    return _paciente_out(db, paciente)


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


@router.get("/pacientes/{id}/identidad", response_model=None)
def obtener_identidad(
    request: Request,
    id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.leer"))],
) -> IdentidadOut | JSONResponse:
    paciente = _paciente_de(db, actual, id)
    if paciente is None or paciente.identidad is None:
        return _no_encontrado(request)
    identidad = paciente.identidad
    datos = IdentidadOut(
        nombres=identidad.nombres_cifrados,
        apellidos=identidad.apellidos_cifrados,
        documento=identidad.documento_cifrado,
        fecha_nacimiento=date.fromisoformat(identidad.fecha_nacimiento_cifrada),
    )
    # Revelar la identidad es un acceso a datos personales: se audita siempre.
    registrar(
        db,
        request,
        AuditAction.PII_REVEAL,
        AuditModule.PATIENTS,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.PATIENT,
        objeto_id=paciente.id,
    )
    return datos


@router.get("/pacientes/{id}/exportacion", response_model=None)
def exportar_paciente(
    request: Request,
    id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.leer"))],
    formato: Annotated[Literal["json", "csv"], Query()] = "json",
) -> Response:
    paciente = _paciente_de(db, actual, id)
    if paciente is None:
        return _no_encontrado(request)

    identidad = paciente.identidad
    identidad_exportada = {
        "seudonimo": paciente.seudonimo,
        "nombres": identidad.nombres_cifrados if identidad else None,
        "apellidos": identidad.apellidos_cifrados if identidad else None,
        "documento": identidad.documento_cifrado if identidad else None,
        "fecha_nacimiento": (
            date.fromisoformat(identidad.fecha_nacimiento_cifrada).isoformat()
            if identidad
            else None
        ),
    }
    casos_exportados: list[dict[str, Any]] = []
    filas: list[list[str]] = []
    casos = db.query(Caso).filter(Caso.paciente_id == paciente.id).order_by(Caso.creado_en).all()
    for caso in casos:
        inferencias = (
            db.query(Inferencia)
            .join(Imagen, Inferencia.imagen_id == Imagen.id)
            .filter(Imagen.caso_id == caso.id)
            .order_by(Inferencia.creado_en, Inferencia.id)
            .all()
        )
        filas_inferencia: list[dict[str, Any]] = []
        for inferencia in inferencias:
            modelo = db.get(ModeloIA, inferencia.modelo_ia_id)
            decision = (
                db.query(DecisionMedica.decision)
                .filter(DecisionMedica.inferencia_id == inferencia.id)
                .scalar()
            )
            dato = {
                "fecha": inferencia.creado_en.isoformat(),
                "resultado": inferencia.resultado,
                "confianza": inferencia.confianza,
                "modelo": modelo.nombre if modelo else None,
                "version_contrato": inferencia.version_contrato,
                "decision": decision,
            }
            filas_inferencia.append(dato)
            filas.append(
                [
                    paciente.seudonimo,
                    identidad_exportada["documento"] or "",
                    caso.codigo_caso,
                    dato["fecha"],
                    dato["resultado"],
                    "" if dato["confianza"] is None else str(dato["confianza"]),
                    dato["modelo"] or "",
                    dato["decision"] or "",
                ]
            )
        if not inferencias:
            filas.append(
                [
                    paciente.seudonimo,
                    identidad_exportada["documento"] or "",
                    caso.codigo_caso,
                    "",
                    "",
                    "",
                    "",
                    "",
                ]
            )
        casos_exportados.append(
            {
                "codigo_caso": caso.codigo_caso,
                "creado_en": caso.creado_en.isoformat(),
                "inferencias": filas_inferencia,
            }
        )
    resource_count = sum(len(caso["inferencias"]) for caso in casos_exportados)

    registrar(
        db,
        request,
        AuditAction.EXPORT,
        AuditModule.EXPORT,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.PATIENT,
        objeto_id=paciente.id,
        detalles={"format": formato, "resource_count": resource_count},
    )
    headers = {
        "Content-Disposition": f'attachment; filename="datos-{paciente.seudonimo}.{formato}"'
    }
    if formato == "json":
        return JSONResponse(
            content={"paciente": identidad_exportada, "casos": casos_exportados},
            headers=headers,
        )

    salida = io.StringIO(newline="")
    salida.write("\ufeff")
    escritor = csv.writer(salida)
    escritor.writerow(
        [
            "seudonimo",
            "documento",
            "codigo_caso",
            "fecha_inferencia",
            "resultado",
            "confianza",
            "modelo",
            "decision",
        ]
    )
    escritor.writerows(filas)
    return Response(
        content=salida.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers=headers,
    )


@router.post("/pacientes/{id}/casos", status_code=status.HTTP_201_CREATED, response_model=None)
def crear_caso(
    request: Request,
    id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.escribir"))],
) -> CasoOut | JSONResponse:
    paciente = _paciente_de(db, actual, id, bloquear=True)
    if paciente is None:
        return _no_encontrado(request)
    if paciente.archivado_en is not None:
        return _error(
            request,
            status.HTTP_409_CONFLICT,
            "paciente_archivado",
            "No se pueden crear casos para un paciente archivado",
        )
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
