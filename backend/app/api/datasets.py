"""Datasets anonimizados de investigación (HT-070, HU-090).

- Solo entran casos con consentimiento vigente de
  ``investigacion_con_anonimizacion`` y de la institución de quien consulta.
- `k` nunca baja de 5 y el conjunto resultante debe alcanzar ese umbral; si no,
  la respuesta es 422.
- La respuesta solo expone filas anonimizadas por
  ``app.investigacion.anonimizacion``; el vínculo interno con el caso no sale
  de la base.
- Crear, listar y abrir un dataset deja un evento en la bitácora.
"""

from __future__ import annotations

import uuid
from collections.abc import Iterable, Mapping
from datetime import UTC, date, datetime, time, timedelta
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.investigacion.anonimizacion import (
    anonimizar_caso,
    cuasi_identificadores,
    huella_de,
    sujeto_nuevo,
)
from app.models.consentimientos import Consentimiento
from app.models.datasets import Dataset, DatasetCaso
from app.models.fichas import Caso, FichaClinica
from app.models.pacientes import Paciente

router = APIRouter(tags=["investigacion"])

K_MINIMO = 5
"""Umbral de anonimización: ningún dataset se publica con menos casos."""

_BASE_LEGAL_INVESTIGACION = "investigacion_con_anonimizacion"
_PATRON_CATEGORIA = r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$"


class FiltroCasos(BaseModel):
    """Criterios clínicos del conjunto; nunca identificadores de pacientes."""

    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    desde: date | None = None
    hasta: date | None = None
    tipo_diagnostico: str | None = Field(default=None, pattern=_PATRON_CATEGORIA)
    tipo_consulta: str | None = Field(default=None, pattern=_PATRON_CATEGORIA)
    tirads: str | None = Field(default=None, max_length=16)
    bethesda: str | None = Field(default=None, max_length=16)
    cie10: str | None = Field(default=None, max_length=16)

    @model_validator(mode="after")
    def _rango_valido(self) -> FiltroCasos:
        if self.desde is not None and self.hasta is not None and self.desde > self.hasta:
            raise ValueError("la fecha inicial no puede ser posterior a la final")
        return self


class CrearDatasetRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    nombre: str = Field(min_length=1, max_length=128)
    descripcion: str | None = Field(default=None, max_length=2000)
    k: int = Field(default=K_MINIMO)
    filtro: FiltroCasos = Field(default_factory=FiltroCasos)


class CasoAnonimizadoOut(BaseModel):
    """Una fila publicable: sin identificadores ni vínculo con el caso."""

    sujeto: str
    edad_rango: str | None
    mes_caso: str | None
    mes_tsh: str | None
    tsh: float | None
    tsh_unidad: str | None
    mes_t3: str | None
    t3: float | None
    t3_unidad: str | None
    mes_t4: str | None
    t4: float | None
    t4_unidad: str | None
    tamano_nodulo_mm: float | None
    lateralidad: str | None
    tirads: str | None
    bethesda: str | None
    cie10: str | None
    tipo_diagnostico: str | None
    tipo_consulta: str | None


class DatasetResumenOut(BaseModel):
    id: str
    nombre: str
    descripcion: str | None
    total_casos: int
    k: int
    k_efectivo: int
    huella: str
    criterios: dict[str, Any]
    creado_en: datetime


class DatasetOut(DatasetResumenOut):
    items: list[CasoAnonimizadoOut]


class DatasetsListOut(BaseModel):
    total: int
    items: list[DatasetResumenOut]


def _error(request: Request, codigo_http: int, codigo: str, mensaje: str) -> JSONResponse:
    return JSONResponse(
        status_code=codigo_http,
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


def _consulta_casos(db: Session, actual: SesionActual, filtro: FiltroCasos) -> list[Caso]:
    """Casos consentidos para investigación, con los filtros combinados."""
    consulta = db.query(Caso).filter(
        Caso.institucion_id == actual.usuario.institucion_id,
        Caso.consentimientos.any(
            and_(
                Consentimiento.base_legal == _BASE_LEGAL_INVESTIGACION,
                Consentimiento.revocado_en.is_(None),
            )
        ),
    )
    if filtro.desde is not None:
        consulta = consulta.filter(
            Caso.creado_en >= datetime.combine(filtro.desde, time.min, tzinfo=UTC)
        )
    if filtro.hasta is not None:
        consulta = consulta.filter(
            Caso.creado_en
            < datetime.combine(filtro.hasta + timedelta(days=1), time.min, tzinfo=UTC)
        )

    clinicos = (
        filtro.tipo_diagnostico,
        filtro.tipo_consulta,
        filtro.tirads,
        filtro.bethesda,
        filtro.cie10,
    )
    if any(valor is not None for valor in clinicos):
        consulta = consulta.join(FichaClinica, FichaClinica.caso_id == Caso.id)
        if filtro.tipo_diagnostico is not None:
            consulta = consulta.filter(FichaClinica.tipo_diagnostico == filtro.tipo_diagnostico)
        if filtro.tipo_consulta is not None:
            consulta = consulta.filter(FichaClinica.tipo_consulta == filtro.tipo_consulta)
        if filtro.tirads is not None:
            consulta = consulta.filter(FichaClinica.tirads == filtro.tirads)
        if filtro.bethesda is not None:
            consulta = consulta.filter(FichaClinica.bethesda == filtro.bethesda)
        if filtro.cie10 is not None:
            consulta = consulta.filter(FichaClinica.cie10 == filtro.cie10)

    return (
        consulta.options(
            joinedload(Caso.paciente).joinedload(Paciente.identidad),
            joinedload(Caso.ficha_clinica),
        )
        .order_by(Caso.creado_en, Caso.id)
        .all()
    )


def _frecuencias_cuasi_identificadores(
    filas: Iterable[Mapping[str, Any]],
) -> dict[tuple[Any, ...], int]:
    frecuencias: dict[tuple[Any, ...], int] = {}
    for fila in filas:
        clave = cuasi_identificadores(fila)
        frecuencias[clave] = frecuencias.get(clave, 0) + 1
    return frecuencias


def _k_efectivo(filas: Iterable[Mapping[str, Any]]) -> int:
    return min(_frecuencias_cuasi_identificadores(filas).values())


def _resumen(dataset: Dataset, k_efectivo: int) -> DatasetResumenOut:
    return DatasetResumenOut(
        id=str(dataset.id),
        nombre=dataset.nombre,
        descripcion=dataset.descripcion,
        total_casos=dataset.total_casos,
        k=dataset.k,
        k_efectivo=k_efectivo,
        huella=dataset.huella,
        criterios=dataset.criterios,
        creado_en=dataset.creado_en,
    )


def _fila(fila: DatasetCaso) -> CasoAnonimizadoOut:
    return CasoAnonimizadoOut.model_validate({"sujeto": fila.sujeto, **fila.datos})


def _vista(dataset: Dataset, k_efectivo: int | None = None) -> DatasetOut:
    if k_efectivo is None:
        k_efectivo = _k_efectivo(fila.datos for fila in dataset.casos)
    return DatasetOut(
        **_resumen(dataset, k_efectivo).model_dump(), items=[_fila(fila) for fila in dataset.casos]
    )


def _dataset_de(db: Session, actual: SesionActual, id_texto: str) -> Dataset | None:
    dataset_id = _uuid(id_texto)
    if dataset_id is None:
        return None
    return (
        db.query(Dataset)
        .options(joinedload(Dataset.casos))
        .filter(
            Dataset.id == dataset_id,
            Dataset.institucion_id == actual.usuario.institucion_id,
        )
        .first()
    )


@router.post(
    "/investigacion/datasets",
    status_code=status.HTTP_201_CREATED,
    response_model=DatasetOut,
)
def crear_dataset(
    request: Request,
    body: CrearDatasetRequest,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("investigacion.leer"))],
) -> DatasetOut | JSONResponse:
    """Anonimiza los casos que cumplen el filtro y guarda la versión fija."""
    if body.k < K_MINIMO:
        return _error(
            request,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "k_insuficiente",
            f"El valor de k no puede ser menor que {K_MINIMO}.",
        )
    casos = _consulta_casos(db, actual, body.filtro)
    if len(casos) < body.k:
        return _error(
            request,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "conjunto_insuficiente",
            ("El conjunto filtrado no alcanza k casos; amplía el filtro o reduce k."),
        )

    datos = [anonimizar_caso(caso) for caso in casos]
    frecuencias = _frecuencias_cuasi_identificadores(datos)
    clases_bajo_k = sum(conteo < body.k for conteo in frecuencias.values())
    if clases_bajo_k:
        mensaje = (
            f"{clases_bajo_k} clase de equivalencia no alcanza k."
            if clases_bajo_k == 1
            else f"{clases_bajo_k} clases de equivalencia no alcanzan k."
        )
        return _error(
            request,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            "k_no_alcanzado",
            mensaje,
        )
    k_efectivo = min(frecuencias.values())
    dataset = Dataset(
        institucion_id=actual.usuario.institucion_id,
        creado_por_id=actual.usuario.id,
        nombre=body.nombre,
        descripcion=body.descripcion,
        total_casos=len(casos),
        k=body.k,
        huella=huella_de(datos),
        criterios=body.filtro.model_dump(mode="json", exclude_none=True),
    )
    db.add(dataset)
    db.flush()
    for orden, (caso, fila) in enumerate(zip(casos, datos, strict=True)):
        db.add(
            DatasetCaso(
                dataset_id=dataset.id,
                caso_id=caso.id,
                orden=orden,
                sujeto=sujeto_nuevo(),
                datos=fila,
            )
        )
    db.commit()
    db.refresh(dataset)
    registrar(
        db,
        request,
        AuditAction.DATASET_CREATE,
        AuditModule.RESEARCH,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.DATASET,
        objeto_id=dataset.id,
        detalles={"resource_count": dataset.total_casos},
    )
    return _vista(dataset, k_efectivo)


@router.get("/investigacion/datasets", response_model=DatasetsListOut)
def listar_datasets(
    request: Request,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("investigacion.leer"))],
) -> DatasetsListOut:
    """Metadatos de los datasets de la institución, del más reciente al más antiguo."""
    consulta = db.query(Dataset).filter(Dataset.institucion_id == actual.usuario.institucion_id)
    total = consulta.count()
    filas = (
        consulta.options(joinedload(Dataset.casos))
        .order_by(Dataset.creado_en.desc(), Dataset.id)
        .all()
    )
    registrar(
        db,
        request,
        AuditAction.DATASET_READ,
        AuditModule.RESEARCH,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.DATASET,
        detalles={"resource_count": len(filas)},
    )
    return DatasetsListOut(
        total=total,
        items=[_resumen(fila, _k_efectivo(caso.datos for caso in fila.casos)) for fila in filas],
    )


@router.get("/investigacion/datasets/{id}", response_model=DatasetOut)
def obtener_dataset(
    request: Request,
    id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("investigacion.leer"))],
) -> DatasetOut | JSONResponse:
    """Fila anonimizada por caso; un dataset ajeno responde 404."""
    dataset = _dataset_de(db, actual, id)
    if dataset is None:
        return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")
    registrar(
        db,
        request,
        AuditAction.DATASET_READ,
        AuditModule.RESEARCH,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.DATASET,
        objeto_id=dataset.id,
        detalles={"resource_count": len(dataset.casos)},
    )
    return _vista(dataset)
