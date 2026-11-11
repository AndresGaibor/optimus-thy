"""Consentimiento informado por caso (HU-034, HU-035).

El consentimiento se registra con su finalidad (``base_legal``) y la versión del
texto firmado, de modo que siempre se pueda saber qué se autorizó y con qué
redacción. El retiro es inmediato: desde ese momento el caso deja de tener
consentimiento vigente y la inferencia se bloquea.

Un caso de otra institución responde 404, igual que uno inexistente (RS-ACC-04).
"""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime
from decimal import Decimal, InvalidOperation
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.config import get_settings
from app.db import session_dep
from app.models.consentimientos import Consentimiento
from app.models.fichas import Caso, FichaClinica, FichaVersion

router = APIRouter(tags=["casos"])

BaseLegal = Literal["consentimiento", "atencion_de_salud", "investigacion_con_anonimizacion"]

#: Finalidad que habilita ejecutar la inferencia sobre el caso (HU-035).
BASE_LEGAL_INFERENCIA = "atencion_de_salud"


class CrearConsentimientoRequest(BaseModel):
    """Finalidad y versión del texto firmado; nunca contenido clínico."""

    model_config = ConfigDict(str_strip_whitespace=True)

    base_legal: BaseLegal
    version_texto: str = Field(min_length=1, max_length=32, pattern=r"^[A-Za-z0-9._-]+$")
    otorgado_en: datetime | None = None

    @field_validator("otorgado_en")
    @classmethod
    def _no_futuro(cls, valor: datetime | None) -> datetime | None:
        if valor is None:
            return None
        momento = valor if valor.tzinfo else valor.replace(tzinfo=UTC)
        if momento > datetime.now(UTC):
            raise ValueError("la fecha de otorgamiento no puede estar en el futuro")
        return valor


class ConsentimientoOut(BaseModel):
    id: str
    caso_id: str
    base_legal: str
    version_texto: str
    otorgado_en: datetime
    revocado_en: datetime | None
    vigente: bool


class ConsentimientosListOut(BaseModel):
    total: int
    items: list[ConsentimientoOut]


def _no_encontrado(request: Request) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "error": {"code": "not_found", "message": "No encontrado"},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _conflicto(request: Request, codigo: str, mensaje: str) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
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


def _consentimiento_de(db: Session, caso: Caso, id_texto: str) -> Consentimiento | None:
    consentimiento_id = _uuid(id_texto)
    if consentimiento_id is None:
        return None
    return (
        db.query(Consentimiento)
        .filter(
            Consentimiento.id == consentimiento_id,
            Consentimiento.caso_id == caso.id,
        )
        .first()
    )


def _vista(consentimiento: Consentimiento) -> ConsentimientoOut:
    return ConsentimientoOut(
        id=str(consentimiento.id),
        caso_id=str(consentimiento.caso_id),
        base_legal=consentimiento.base_legal,
        version_texto=consentimiento.version_texto,
        otorgado_en=consentimiento.otorgado_en,
        revocado_en=consentimiento.revocado_en,
        vigente=consentimiento.revocado_en is None,
    )


@router.get("/casos/{caso_id}/consentimientos", response_model=None)
def listar_consentimientos(
    request: Request,
    caso_id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.leer"))],
) -> ConsentimientosListOut | JSONResponse:
    caso = _caso_de(db, actual, caso_id)
    if caso is None:
        return _no_encontrado(request)
    filas = (
        db.query(Consentimiento)
        .filter(Consentimiento.caso_id == caso.id)
        .order_by(Consentimiento.otorgado_en, Consentimiento.id)
        .all()
    )
    registrar(
        db,
        request,
        AuditAction.RECORD_READ,
        AuditModule.CLINICAL,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.CASE,
        objeto_id=caso.id,
        detalles={"resource_count": len(filas)},
    )
    return ConsentimientosListOut(total=len(filas), items=[_vista(f) for f in filas])


@router.post(
    "/casos/{caso_id}/consentimientos",
    status_code=status.HTTP_201_CREATED,
    response_model=None,
)
def crear_consentimiento(
    request: Request,
    caso_id: str,
    body: CrearConsentimientoRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.escribir"))],
) -> ConsentimientoOut | JSONResponse:
    caso = _caso_de(db, actual, caso_id)
    if caso is None:
        return _no_encontrado(request)
    consentimiento = Consentimiento(
        caso_id=caso.id,
        base_legal=body.base_legal,
        version_texto=body.version_texto,
        otorgado_por_id=actual.usuario.id,
    )
    if body.otorgado_en is not None:
        consentimiento.otorgado_en = body.otorgado_en
    db.add(consentimiento)
    db.commit()
    db.refresh(consentimiento)
    registrar(
        db,
        request,
        AuditAction.CONSENT_CREATE,
        AuditModule.CLINICAL,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.CONSENT,
        objeto_id=consentimiento.id,
        detalles={"from_status": "sin_consentimiento", "to_status": "vigente"},
    )
    return _vista(consentimiento)


@router.post(
    "/casos/{caso_id}/consentimientos/{consentimiento_id}/revocar",
    response_model=None,
)
def revocar_consentimiento(
    request: Request,
    caso_id: str,
    consentimiento_id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("paciente.escribir"))],
) -> ConsentimientoOut | JSONResponse:
    """Retiro del consentimiento: efecto inmediato, sin paso de aprobación."""
    caso = _caso_de(db, actual, caso_id)
    if caso is None:
        return _no_encontrado(request)
    consentimiento = _consentimiento_de(db, caso, consentimiento_id)
    if consentimiento is None:
        return _no_encontrado(request)
    if consentimiento.revocado_en is not None:
        return _conflicto(
            request,
            "ya_revocado",
            "El consentimiento ya estaba revocado; no hay nada que retirar.",
        )
    consentimiento.revocado_en = func.now()
    db.commit()
    db.refresh(consentimiento)
    registrar(
        db,
        request,
        AuditAction.CONSENT_REVOKE,
        AuditModule.CLINICAL,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.CONSENT,
        objeto_id=consentimiento.id,
        detalles={"from_status": "vigente", "to_status": "revocado"},
    )
    return _vista(consentimiento)


# ------------------------------------------------- ficha clínica (HU-040) ----

#: Valores admitidos de TI-RADS y de Bethesda (HU-041).
TIRADS_ADMITIDOS: tuple[str, ...] = ("TR1", "TR2", "TR3", "TR4", "TR5")
BETHESDA_ADMITIDOS: tuple[str, ...] = ("I", "II", "III", "IV", "V", "VI")

#: Campos que forman el snapshot JSONB de cada versión de la ficha.
CAMPOS_DE_FICHA: tuple[str, ...] = (
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
    "origen_datos",
)


class FichaClinicaRequest(BaseModel):
    """Secciones de la ficha (RF-CLI-09); todos los campos son opcionales.

    Solo se actualizan los campos enviados: así cada sección se puede guardar
    por separado sin borrar las demás. Un ``null`` explícito limpia el campo.
    """

    model_config = ConfigDict(str_strip_whitespace=True)

    tsh: float | str | None = None
    tsh_unidad: str | None = Field(default=None, max_length=16)
    tsh_fecha: date | None = None
    t3: float | str | None = None
    t3_unidad: str | None = Field(default=None, max_length=16)
    t3_fecha: date | None = None
    t4: float | str | None = None
    t4_unidad: str | None = Field(default=None, max_length=16)
    t4_fecha: date | None = None
    tamano_nodulo_mm: float | str | None = None
    lateralidad: str | None = Field(default=None, max_length=32)
    tirads: str | None = Field(default=None, max_length=16)
    bethesda: str | None = Field(default=None, max_length=16)
    cie10: str | None = Field(default=None, max_length=16)
    tipo_diagnostico: str | None = Field(default=None, max_length=64)
    tipo_consulta: str | None = Field(default=None, max_length=64)
    origen_datos: dict[str, str] | None = None
    motivo_cambio: str | None = Field(default=None, max_length=255)


class FichaOut(BaseModel):
    caso_id: str
    tsh: float | None
    tsh_unidad: str | None
    tsh_fecha: date | None
    t3: float | None
    t3_unidad: str | None
    t3_fecha: date | None
    t4: float | None
    t4_unidad: str | None
    t4_fecha: date | None
    tamano_nodulo_mm: float | None
    lateralidad: str | None
    tirads: str | None
    bethesda: str | None
    cie10: str | None
    tipo_diagnostico: str | None
    tipo_consulta: str | None
    origen_datos: dict[str, str] | None
    creado_en: datetime
    actualizado_en: datetime


class FichaVersionOut(BaseModel):
    id: str
    version: int
    creado_en: datetime
    autor_id: str | None
    autor: str | None
    motivo_cambio: str | None
    snapshot: dict[str, object]


class FichaVersionesOut(BaseModel):
    ficha: FichaOut | None
    versiones: list[FichaVersionOut]


def _invalido(request: Request, mensaje: str) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {"code": "validation_error", "message": mensaje},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _texto_limite(valor: float) -> str:
    texto = f"{valor:.3f}".rstrip("0").rstrip(".")
    return texto or "0"


def _lista_de(valores: tuple[str, ...]) -> str:
    return ", ".join(valores[:-1]) + " o " + valores[-1]


def _numero_admitido(
    valor: float | str | None,
    *,
    campo: str,
    minimo: float,
    maximo: float,
    unidad: str,
) -> tuple[Decimal | None, str | None]:
    """Convierte el valor (coma o punto decimal) y comprueba su rango."""
    rango = f"de {_texto_limite(minimo)} a {_texto_limite(maximo)} {unidad}"
    if valor is None:
        return None, None
    texto = valor.strip().replace(",", ".") if isinstance(valor, str) else str(valor)
    if texto == "":
        return None, None
    try:
        numero = Decimal(texto)
    except InvalidOperation:
        return None, f"{campo}: «{valor}» no es un número válido; se admite {rango}."
    if not numero.is_finite() or numero < Decimal(str(minimo)) or numero > Decimal(str(maximo)):
        return None, f"{campo}: «{valor}» está fuera del rango admitido, {rango}."
    return numero, None


def _categoria_admitida(
    valor: str | None,
    *,
    campo: str,
    admitidos: tuple[str, ...],
) -> tuple[str | None, str | None]:
    """Normaliza y comprueba una categoría cerrada (TI-RADS, Bethesda)."""
    if valor is None:
        return None, None
    limpio = valor.strip().upper()
    if limpio == "":
        return None, None
    if limpio not in admitidos:
        return None, (f"{campo}: «{valor}» no es válido; solo se admite {_lista_de(admitidos)}.")
    return limpio, None


def _ficha_de(db: Session, caso: Caso) -> FichaClinica | None:
    return db.query(FichaClinica).filter(FichaClinica.caso_id == caso.id).first()


def _decimal_a_float(valor: Decimal | None) -> float | None:
    return None if valor is None else float(valor)


def _ficha_vista(ficha: FichaClinica) -> FichaOut:
    return FichaOut(
        caso_id=str(ficha.caso_id),
        tsh=_decimal_a_float(ficha.tsh),
        tsh_unidad=ficha.tsh_unidad,
        tsh_fecha=ficha.tsh_fecha,
        t3=_decimal_a_float(ficha.t3),
        t3_unidad=ficha.t3_unidad,
        t3_fecha=ficha.t3_fecha,
        t4=_decimal_a_float(ficha.t4),
        t4_unidad=ficha.t4_unidad,
        t4_fecha=ficha.t4_fecha,
        tamano_nodulo_mm=_decimal_a_float(ficha.tamano_nodulo_mm),
        lateralidad=ficha.lateralidad,
        tirads=ficha.tirads,
        bethesda=ficha.bethesda,
        cie10=ficha.cie10,
        tipo_diagnostico=ficha.tipo_diagnostico,
        tipo_consulta=ficha.tipo_consulta,
        origen_datos=ficha.origen_datos,
        creado_en=ficha.creado_en,
        actualizado_en=ficha.actualizado_en,
    )


def _version_vista(version: FichaVersion) -> FichaVersionOut:
    autor = version.autor
    return FichaVersionOut(
        id=str(version.id),
        version=version.version,
        creado_en=version.creado_en,
        autor_id=str(version.autor_id) if version.autor_id else None,
        autor=autor.nombre if autor is not None else None,
        motivo_cambio=version.motivo_cambio,
        snapshot=version.snapshot,
    )


def _snapshot_de(ficha: FichaClinica) -> dict[str, object]:
    """Estado guardado, listo para JSONB y sin objetos de la base."""
    datos: dict[str, object] = {}
    for campo in CAMPOS_DE_FICHA:
        valor = getattr(ficha, campo)
        if isinstance(valor, Decimal):
            datos[campo] = str(valor)
        elif isinstance(valor, (datetime, date)):
            datos[campo] = valor.isoformat()
        elif isinstance(valor, dict):
            datos[campo] = dict(valor)
        elif valor is None:
            datos[campo] = None
        else:
            datos[campo] = str(valor)
    return datos


def _respuesta_de_ficha(db: Session, caso: Caso, ficha: FichaClinica | None) -> FichaVersionesOut:
    versiones = (
        db.query(FichaVersion)
        .filter(FichaVersion.caso_id == caso.id)
        .order_by(FichaVersion.version.desc())
        .all()
    )
    return FichaVersionesOut(
        ficha=_ficha_vista(ficha) if ficha is not None else None,
        versiones=[_version_vista(v) for v in versiones],
    )


@router.get("/casos/{caso_id}/ficha", response_model=None)
def obtener_ficha(
    request: Request,
    caso_id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("ficha.leer"))],
) -> FichaVersionesOut | JSONResponse:
    """Ficha del caso y el historial de versiones, de la más reciente a la más antigua."""
    caso = _caso_de(db, actual, caso_id)
    if caso is None:
        return _no_encontrado(request)
    ficha = _ficha_de(db, caso)
    respuesta = _respuesta_de_ficha(db, caso, ficha)
    registrar(
        db,
        request,
        AuditAction.RECORD_READ,
        AuditModule.CLINICAL,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.RECORD if ficha is not None else None,
        objeto_id=ficha.id if ficha is not None else None,
        detalles={"resource_count": len(respuesta.versiones)},
    )
    return respuesta


@router.put("/casos/{caso_id}/ficha", response_model=None)
def guardar_ficha(
    request: Request,
    caso_id: str,
    body: FichaClinicaRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("ficha.escribir"))],
) -> FichaVersionesOut | JSONResponse:
    """Upsert de la ficha; cada guardado crea una versión con su snapshot."""
    caso = _caso_de(db, actual, caso_id)
    if caso is None:
        return _no_encontrado(request)

    ajustes = get_settings()
    enviados = body.model_fields_set
    cambios: dict[str, object] = {}
    errores: list[str] = []

    if "tsh" in enviados:
        valor, error = _numero_admitido(
            body.tsh,
            campo="TSH",
            minimo=ajustes.ficha_tsh_min,
            maximo=ajustes.ficha_tsh_max,
            unidad="mU/L",
        )
        if error is not None:
            errores.append(error)
        else:
            cambios["tsh"] = valor
    if "t3" in enviados:
        valor, error = _numero_admitido(
            body.t3,
            campo="T3",
            minimo=ajustes.ficha_t3_min,
            maximo=ajustes.ficha_t3_max,
            unidad="ng/mL",
        )
        if error is not None:
            errores.append(error)
        else:
            cambios["t3"] = valor
    if "t4" in enviados:
        valor, error = _numero_admitido(
            body.t4,
            campo="T4",
            minimo=ajustes.ficha_t4_min,
            maximo=ajustes.ficha_t4_max,
            unidad="mcg/dL",
        )
        if error is not None:
            errores.append(error)
        else:
            cambios["t4"] = valor
    if "tamano_nodulo_mm" in enviados:
        valor, error = _numero_admitido(
            body.tamano_nodulo_mm,
            campo="tamaño del nódulo",
            minimo=ajustes.ficha_nodulo_min_mm,
            maximo=ajustes.ficha_nodulo_max_mm,
            unidad="mm",
        )
        if error is not None:
            errores.append(error)
        else:
            cambios["tamano_nodulo_mm"] = valor
    if "tirads" in enviados:
        categoria, error = _categoria_admitida(
            body.tirads, campo="TI-RADS", admitidos=TIRADS_ADMITIDOS
        )
        if error is not None:
            errores.append(error)
        else:
            cambios["tirads"] = categoria
    if "bethesda" in enviados:
        categoria, error = _categoria_admitida(
            body.bethesda, campo="Bethesda", admitidos=BETHESDA_ADMITIDOS
        )
        if error is not None:
            errores.append(error)
        else:
            cambios["bethesda"] = categoria
    if errores:
        return _invalido(request, " ".join(errores))

    for campo in (
        "tsh_unidad",
        "tsh_fecha",
        "t3_unidad",
        "t3_fecha",
        "t4_unidad",
        "t4_fecha",
        "lateralidad",
        "cie10",
        "tipo_diagnostico",
        "tipo_consulta",
        "origen_datos",
    ):
        if campo in enviados:
            cambios[campo] = getattr(body, campo)

    ficha = _ficha_de(db, caso)
    creada = ficha is None
    if ficha is None:
        ficha = FichaClinica(caso_id=caso.id)
        db.add(ficha)
    for campo, valor_aplicado in cambios.items():
        setattr(ficha, campo, valor_aplicado)
    db.flush()

    ultima = (
        db.query(func.max(FichaVersion.version)).filter(FichaVersion.caso_id == caso.id).scalar()
    )
    version = (ultima or 0) + 1
    db.add(
        FichaVersion(
            caso_id=caso.id,
            ficha_clinica_id=ficha.id,
            version=version,
            snapshot=_snapshot_de(ficha),
            autor_id=actual.usuario.id,
            motivo_cambio=body.motivo_cambio if "motivo_cambio" in enviados else None,
        )
    )
    db.commit()
    db.refresh(ficha)
    respuesta = _respuesta_de_ficha(db, caso, ficha)
    registrar(
        db,
        request,
        AuditAction.RECORD_CREATE if creada else AuditAction.RECORD_UPDATE,
        AuditModule.CLINICAL,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.RECORD,
        objeto_id=ficha.id,
        detalles={"version": version},
    )
    return respuesta
