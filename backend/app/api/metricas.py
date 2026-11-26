"""Agregados de acuerdo entre inferencias y decisiones médicas registradas."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import UTC, date, datetime, time, timedelta
from typing import Annotated, Literal, cast

import sqlalchemy as sa
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.investigacion.cohortes import casos_de_cohorte
from app.models.cohortes import CohorteInvestigacion
from app.models.fichas import Caso
from app.models.imagenes import DecisionMedica, Imagen, Inferencia, ModeloIA

router = APIRouter(tags=["investigacion"])


def _error(request: Request, codigo: str, mensaje: str) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={
            "error": {"code": codigo, "message": mensaje},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


Resultado = Literal["benigno", "maligno", "sin_nodulo"]
_RESULTADOS: tuple[Resultado, ...] = ("benigno", "maligno", "sin_nodulo")


class ModeloMetricasOut(BaseModel):
    id: str
    nombre: str
    version: str
    hash_pesos: str


class ConteoResultadoOut(BaseModel):
    resultado: Resultado
    total: int
    acepta: int
    corrige: int
    descarta: int
    pendiente: int


class MetricasModeloOut(BaseModel):
    modelo: ModeloMetricasOut
    total: int
    acepta: int
    corrige: int
    descarta: int
    pendiente: int
    acuerdo: float | None
    por_resultado: list[ConteoResultadoOut]


@dataclass(slots=True)
class _Conteo:
    total: int = 0
    acepta: int = 0
    corrige: int = 0
    descarta: int = 0
    pendiente: int = 0


@dataclass(slots=True)
class _AcumuladoModelo:
    modelo: ModeloMetricasOut
    total: int = 0
    acepta: int = 0
    corrige: int = 0
    descarta: int = 0
    pendiente: int = 0
    por_resultado: dict[Resultado, _Conteo] = field(
        default_factory=lambda: {resultado: _Conteo() for resultado in _RESULTADOS}
    )


@router.get("/investigacion/metricas", response_model=list[MetricasModeloOut])
def consultar_metricas(
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("investigacion.leer"))],
    desde: Annotated[date | None, Query()] = None,
    hasta: Annotated[date | None, Query()] = None,
    modelo: Annotated[uuid.UUID | None, Query()] = None,
    cohorte_id: Annotated[uuid.UUID | None, Query()] = None,
) -> list[MetricasModeloOut] | JSONResponse:
    """Cuenta decisiones por modelo, opcionalmente limitadas a una cohorte propia."""
    casos_cohorte: set[uuid.UUID] | None = None
    if cohorte_id is not None:
        cohorte = (
            db.query(CohorteInvestigacion)
            .filter(
                CohorteInvestigacion.id == cohorte_id,
                CohorteInvestigacion.institucion_id == actual.usuario.institucion_id,
            )
            .one_or_none()
        )
        if cohorte is None:
            return _error(request, "not_found", "La cohorte no está disponible.")
        casos_cohorte = {caso.id for caso in casos_de_cohorte(db, actual, cohorte.filtros)}
    inferencias = (
        db.query(
            Inferencia.id.label("inferencia_id"),
            Inferencia.modelo_ia_id.label("modelo_id"),
            Inferencia.resultado.label("resultado"),
            DecisionMedica.decision.label("decision"),
        )
        .join(Imagen, Imagen.id == Inferencia.imagen_id)
        .join(Caso, Caso.id == Imagen.caso_id)
        .outerjoin(DecisionMedica, DecisionMedica.inferencia_id == Inferencia.id)
        .filter(Caso.institucion_id == actual.usuario.institucion_id)
    )
    if casos_cohorte is not None:
        inferencias = inferencias.filter(Caso.id.in_(casos_cohorte))
    if desde is not None:
        inferencias = inferencias.filter(
            Inferencia.creado_en >= datetime.combine(desde, time.min, tzinfo=UTC)
        )
    if hasta is not None:
        inferencias = inferencias.filter(
            Inferencia.creado_en < datetime.combine(hasta + timedelta(days=1), time.min, tzinfo=UTC)
        )
    filas_inferencias = inferencias.subquery()

    consulta = db.query(
        ModeloIA.id,
        ModeloIA.nombre,
        ModeloIA.version,
        ModeloIA.hash_pesos,
        filas_inferencias.c.resultado,
        filas_inferencias.c.decision,
        sa.func.count(filas_inferencias.c.inferencia_id),
    ).outerjoin(filas_inferencias, filas_inferencias.c.modelo_id == ModeloIA.id)
    if modelo is not None:
        consulta = consulta.filter(ModeloIA.id == modelo)
    filas = (
        consulta.group_by(
            ModeloIA.id,
            ModeloIA.nombre,
            ModeloIA.version,
            ModeloIA.hash_pesos,
            filas_inferencias.c.resultado,
            filas_inferencias.c.decision,
        )
        .order_by(
            ModeloIA.nombre,
            ModeloIA.version,
            ModeloIA.id,
            filas_inferencias.c.resultado,
            filas_inferencias.c.decision,
        )
        .all()
    )

    acumulados: dict[uuid.UUID, _AcumuladoModelo] = {}
    for modelo_id, nombre, version, hash_pesos, resultado, decision, cantidad in filas:
        acumulado = acumulados.get(modelo_id)
        if acumulado is None:
            acumulado = _AcumuladoModelo(
                modelo=ModeloMetricasOut(
                    id=str(modelo_id),
                    nombre=nombre,
                    version=version,
                    hash_pesos=hash_pesos,
                )
            )
            acumulados[modelo_id] = acumulado
        if resultado is None:
            continue

        total = int(cantidad)
        acumulado.total += total
        conteo = acumulado.por_resultado[cast(Resultado, resultado)]
        conteo.total += total
        if decision is None:
            acumulado.pendiente += total
            conteo.pendiente += total
        elif decision == "acepta":
            acumulado.acepta += total
            conteo.acepta += total
        elif decision == "corrige":
            acumulado.corrige += total
            conteo.corrige += total
        else:
            acumulado.descarta += total
            conteo.descarta += total

    respuesta = [
        MetricasModeloOut(
            modelo=acumulado.modelo,
            total=acumulado.total,
            acepta=acumulado.acepta,
            corrige=acumulado.corrige,
            descarta=acumulado.descarta,
            pendiente=acumulado.pendiente,
            acuerdo=round(acumulado.acepta / acumulado.total, 4) if acumulado.total else None,
            por_resultado=[
                ConteoResultadoOut(
                    resultado=resultado,
                    total=acumulado.por_resultado[resultado].total,
                    acepta=acumulado.por_resultado[resultado].acepta,
                    corrige=acumulado.por_resultado[resultado].corrige,
                    descarta=acumulado.por_resultado[resultado].descarta,
                    pendiente=acumulado.por_resultado[resultado].pendiente,
                )
                for resultado in _RESULTADOS
            ],
        )
        for acumulado in acumulados.values()
    ]
    registrar(
        db,
        request,
        AuditAction.INFERENCE_READ,
        AuditModule.INFERENCE,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.INFERENCE,
        detalles={"resource_count": sum(acumulado.total for acumulado in acumulados.values())},
    )
    return respuesta
