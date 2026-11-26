"""Auditoría individual de predicciones (HU-093, RF-INV-06).

- Solo se ven las inferencias de casos de la institución de quien consulta.
- Cada fila cruza la predicción con el modelo que la produjo, la huella de la
  imagen y la referencia clínica registrada por el médico; la diferencia es
  «coincide» cuando la referencia acepta el resultado, «difiere» cuando lo
  corrige o descarta y «pendiente» cuando aún no hay decisión.
- La bitácora no guarda contenido clínico, así que la auditoría se resuelve
  sobre las tablas de inferencia y decisión, no sobre los eventos.
- La consulta queda registrada como `INFERENCE_READ`, como el resto de lecturas
  de inferencia, sin copiar contenido clínico a la bitácora.
"""

from __future__ import annotations

import uuid
from datetime import UTC, date, datetime, time, timedelta
from typing import Annotated, Any, Literal

import sqlalchemy as sa
from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Query as OrmQuery
from sqlalchemy.orm import Session, joinedload

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.models.fichas import Caso
from app.models.imagenes import DecisionMedica, Imagen, Inferencia, ModeloIA
from app.models.trabajos import Trabajo
from app.models.usuarios import Rol, UsuarioRol

router = APIRouter(tags=["investigacion"])

_LIMITE_MAXIMO = 100
_RESULTADOS = ("benigno", "maligno", "sin_nodulo")
_DECISIONES = ("acepta", "corrige", "descarta", "pendiente")


class AutorOut(BaseModel):
    """Quién lanzó la inferencia: identificador y rol, sin datos personales."""

    id: str
    rol: str | None


class ModeloPrediccionOut(BaseModel):
    id: str
    nombre: str
    version: str
    hash_pesos: str


class ImagenPrediccionOut(BaseModel):
    id: str
    hash_sha256: str


class ReferenciaClinicaOut(BaseModel):
    decision: str
    creado_en: datetime


class PrediccionOut(BaseModel):
    id: str
    creado_en: datetime
    caso_id: str
    caso_codigo: str
    paciente_codigo: str
    imagen: ImagenPrediccionOut
    modelo: ModeloPrediccionOut
    resultado: str
    confianza: float | None
    lanzado_por: AutorOut | None
    referencia_clinica: ReferenciaClinicaOut | None
    diferencia: str


class PrediccionesOut(BaseModel):
    total: int
    items: list[PrediccionOut]


def _error(request: Request, codigo: int, clave: str, mensaje: str) -> JSONResponse:
    return JSONResponse(
        status_code=codigo,
        content={
            "error": {"code": clave, "message": mensaje},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _uuid(valor: str) -> uuid.UUID | None:
    try:
        return uuid.UUID(valor)
    except ValueError:
        return None


def _diferencia(decision: str | None) -> str:
    """Diferencia entre la predicción y la referencia clínica (RF-INV-06)."""
    if decision is None:
        return "pendiente"
    return "coincide" if decision == "acepta" else "difiere"


def _roles_por_usuario(db: Session, ids: set[uuid.UUID]) -> dict[uuid.UUID, str]:
    """Primer rol asignado a cada usuario, en orden estable y sin datos personales."""
    if not ids:
        return {}
    filas = (
        db.query(UsuarioRol.usuario_id, Rol.nombre)
        .join(Rol, UsuarioRol.rol_id == Rol.id)
        .filter(UsuarioRol.usuario_id.in_(ids))
        .order_by(Rol.nombre)
        .all()
    )
    roles: dict[uuid.UUID, str] = {}
    for usuario_id, nombre in filas:
        roles.setdefault(usuario_id, nombre)
    return roles


def _consulta(db: Session, institucion_id: uuid.UUID) -> OrmQuery[Any]:
    """Inferencias de la institución con su imagen, caso, modelo y decisión."""
    return (
        db.query(
            Inferencia,
            Caso,
            Imagen,
            ModeloIA,
            DecisionMedica,
            Trabajo.creado_por,
        )
        .join(Imagen, Inferencia.imagen_id == Imagen.id)
        .join(Caso, Imagen.caso_id == Caso.id)
        .join(ModeloIA, Inferencia.modelo_ia_id == ModeloIA.id)
        .outerjoin(DecisionMedica, DecisionMedica.inferencia_id == Inferencia.id)
        .outerjoin(
            Trabajo,
            sa.and_(
                Trabajo.tipo == "inferencia",
                Trabajo.resultado["inferencia_id"].astext == sa.cast(Inferencia.id, sa.String),
            ),
        )
        .filter(Caso.institucion_id == institucion_id)
    )


@router.get("/investigacion/predicciones", response_model=None)
def auditar_predicciones(
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("investigacion.leer"))],
    desde: Annotated[date | None, Query()] = None,
    hasta: Annotated[date | None, Query()] = None,
    resultado: Annotated[str | None, Query(pattern="^(" + "|".join(_RESULTADOS) + ")$")] = None,
    decision: Annotated[str | None, Query(pattern="^(" + "|".join(_DECISIONES) + ")$")] = None,
    caso: Annotated[str | None, Query(max_length=36)] = None,
    modelo: Annotated[str | None, Query(max_length=36)] = None,
    limite: Annotated[int, Query(ge=1)] = 25,
    desplazamiento: Annotated[int, Query(ge=0)] = 0,
) -> PrediccionesOut | JSONResponse:
    """Predicciones auditables, de la más reciente a la más antigua."""
    if desde and hasta and desde > hasta:
        return _error(
            request,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "validation_error",
            "La fecha inicial no puede ser posterior a la final.",
        )
    consulta = _consulta(db, actual.usuario.institucion_id)
    if desde:
        consulta = consulta.filter(
            Inferencia.creado_en >= datetime.combine(desde, time.min, tzinfo=UTC)
        )
    if hasta:
        consulta = consulta.filter(
            Inferencia.creado_en < datetime.combine(hasta + timedelta(days=1), time.min, tzinfo=UTC)
        )
    if resultado:
        consulta = consulta.filter(Inferencia.resultado == resultado)
    if decision == "pendiente":
        consulta = consulta.filter(DecisionMedica.id.is_(None))
    elif decision:
        consulta = consulta.filter(DecisionMedica.decision == decision)
    if caso:
        caso_id = _uuid(caso)
        if caso_id is None:
            return _error(
                request,
                status.HTTP_422_UNPROCESSABLE_CONTENT,
                "validation_error",
                "El caso no es un identificador válido.",
            )
        consulta = consulta.filter(Caso.id == caso_id)
    if modelo:
        modelo_id = _uuid(modelo)
        if modelo_id is None:
            return _error(
                request,
                status.HTTP_422_UNPROCESSABLE_CONTENT,
                "validation_error",
                "El modelo no es un identificador válido.",
            )
        consulta = consulta.filter(ModeloIA.id == modelo_id)

    subconsulta = consulta.with_entities(Inferencia.id).distinct().subquery()
    total = db.query(sa.func.count()).select_from(subconsulta).scalar() or 0
    filas = (
        consulta.options(joinedload(Caso.paciente))
        .order_by(Inferencia.creado_en.desc(), Inferencia.id.desc())
        .offset(desplazamiento)
        .limit(min(limite, _LIMITE_MAXIMO))
        .all()
    )

    lanzadores = {fila.creado_por for fila in filas if fila.creado_por is not None}
    roles = _roles_por_usuario(db, lanzadores)
    items = [
        PrediccionOut(
            id=str(inferencia.id),
            creado_en=inferencia.creado_en,
            caso_id=str(caso_fila.id),
            caso_codigo=caso_fila.codigo_caso,
            paciente_codigo=caso_fila.paciente.seudonimo,
            imagen=ImagenPrediccionOut(
                id=str(imagen.id),
                hash_sha256=imagen.hash_sha256,
            ),
            modelo=ModeloPrediccionOut(
                id=str(modelo_fila.id),
                nombre=modelo_fila.nombre,
                version=modelo_fila.version,
                hash_pesos=modelo_fila.hash_pesos,
            ),
            resultado=inferencia.resultado,
            confianza=inferencia.confianza,
            lanzado_por=(
                AutorOut(id=str(creado_por), rol=roles.get(creado_por))
                if creado_por is not None
                else None
            ),
            referencia_clinica=(
                ReferenciaClinicaOut(
                    decision=referencia.decision,
                    creado_en=referencia.creado_en,
                )
                if referencia is not None
                else None
            ),
            diferencia=_diferencia(referencia.decision if referencia is not None else None),
        )
        for inferencia, caso_fila, imagen, modelo_fila, referencia, creado_por in filas
    ]
    registrar(
        db,
        request,
        AuditAction.INFERENCE_READ,
        AuditModule.INFERENCE,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.INFERENCE,
        detalles={"resource_count": len(items)},
    )
    return PrediccionesOut(total=total, items=items)


_MALIGNO = "maligno"


def _contar(db: Session, consulta: OrmQuery[Any]) -> int:
    """Cuenta inferencias distintas: el join con trabajos puede duplicar filas."""
    subconsulta = consulta.with_entities(Inferencia.id).distinct().subquery()
    return db.query(sa.func.count()).select_from(subconsulta).scalar() or 0


class ErrorPrediccionOut(BaseModel):
    """Predicción corregida, clasificada como falso positivo o falso negativo."""

    id: str
    tipo: Literal["falso_positivo", "falso_negativo"]
    creado_en: datetime
    caso_id: str
    caso_codigo: str
    paciente_codigo: str
    modelo: ModeloPrediccionOut
    imagen: ImagenPrediccionOut
    resultado: str
    resultado_corregido: str
    confianza: float | None


class ErroresOut(BaseModel):
    total: int
    falsos_positivos: int
    falsos_negativos: int
    items: list[ErrorPrediccionOut]


@router.get("/investigacion/errores", response_model=ErroresOut)
def analizar_errores(
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("investigacion.leer"))],
    desde: Annotated[date | None, Query()] = None,
    hasta: Annotated[date | None, Query()] = None,
    tipo: Annotated[str | None, Query(pattern="^(falso_positivo|falso_negativo|todos)$")] = None,
    modelo: Annotated[str | None, Query(max_length=36)] = None,
    limite: Annotated[int, Query(ge=1)] = 25,
    desplazamiento: Annotated[int, Query(ge=0)] = 0,
) -> ErroresOut | JSONResponse:
    """Falsos positivos y negativos según la corrección médica (RF-INV-07).

    Un falso positivo es una predicción de malignidad que el médico corrigió a
    un resultado no maligno; un falso negativo, al revés. Solo cuentan las
    inferencias con corrección registrada y resultado corregido.
    """
    if desde and hasta and desde > hasta:
        return _error(
            request,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "validation_error",
            "La fecha inicial no puede ser posterior a la final.",
        )
    consulta = _consulta(db, actual.usuario.institucion_id).filter(
        DecisionMedica.decision == "corrige",
        DecisionMedica.resultado_corregido.is_not(None),
    )
    if desde:
        consulta = consulta.filter(
            Inferencia.creado_en >= datetime.combine(desde, time.min, tzinfo=UTC)
        )
    if hasta:
        consulta = consulta.filter(
            Inferencia.creado_en < datetime.combine(hasta + timedelta(days=1), time.min, tzinfo=UTC)
        )
    if modelo:
        modelo_id = _uuid(modelo)
        if modelo_id is None:
            return _error(
                request,
                status.HTTP_422_UNPROCESSABLE_CONTENT,
                "validation_error",
                "El modelo no es un identificador válido.",
            )
        consulta = consulta.filter(ModeloIA.id == modelo_id)

    falsos_positivos = _contar(db, consulta.filter(Inferencia.resultado == _MALIGNO))
    falsos_negativos = _contar(db, consulta.filter(Inferencia.resultado != _MALIGNO))
    if tipo == "falso_positivo":
        consulta = consulta.filter(
            Inferencia.resultado == _MALIGNO,
            DecisionMedica.resultado_corregido != _MALIGNO,
        )
    elif tipo == "falso_negativo":
        consulta = consulta.filter(
            Inferencia.resultado != _MALIGNO,
            DecisionMedica.resultado_corregido == _MALIGNO,
        )
    else:
        consulta = consulta.filter(
            sa.or_(
                sa.and_(
                    Inferencia.resultado == _MALIGNO,
                    DecisionMedica.resultado_corregido != _MALIGNO,
                ),
                sa.and_(
                    Inferencia.resultado != _MALIGNO,
                    DecisionMedica.resultado_corregido == _MALIGNO,
                ),
            )
        )

    subconsulta = consulta.with_entities(Inferencia.id).distinct().subquery()
    total = db.query(sa.func.count()).select_from(subconsulta).scalar() or 0
    filas = (
        consulta.order_by(Inferencia.creado_en.desc(), Inferencia.id.desc())
        .offset(desplazamiento)
        .limit(min(limite, _LIMITE_MAXIMO))
        .all()
    )
    items = [
        ErrorPrediccionOut(
            id=str(inferencia.id),
            tipo=("falso_positivo" if inferencia.resultado == _MALIGNO else "falso_negativo"),
            creado_en=inferencia.creado_en,
            caso_id=str(caso_fila.id),
            caso_codigo=caso_fila.codigo_caso,
            paciente_codigo=caso_fila.paciente.seudonimo,
            modelo=ModeloPrediccionOut(
                id=str(modelo_fila.id),
                nombre=modelo_fila.nombre,
                version=modelo_fila.version,
                hash_pesos=modelo_fila.hash_pesos,
            ),
            imagen=ImagenPrediccionOut(id=str(imagen.id), hash_sha256=imagen.hash_sha256),
            resultado=inferencia.resultado,
            resultado_corregido=str(referencia.resultado_corregido),
            confianza=inferencia.confianza,
        )
        for inferencia, caso_fila, imagen, modelo_fila, referencia, _creado_por in filas
    ]
    registrar(
        db,
        request,
        AuditAction.INFERENCE_READ,
        AuditModule.INFERENCE,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.INFERENCE,
        detalles={"resource_count": len(items)},
    )
    return ErroresOut(
        total=total,
        falsos_positivos=falsos_positivos,
        falsos_negativos=falsos_negativos,
        items=items,
    )
