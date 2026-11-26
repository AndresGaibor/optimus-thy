"""Retención explícita de datos operativos."""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import NotRequired, TypedDict

import sqlalchemy as sa
from sqlalchemy.orm import Session
from sqlalchemy.sql.elements import ColumnElement

from app.config import get_settings
from app.db import get_session_factory
from app.models.trabajos import Trabajo

TAMANO_LOTE = 1000


@dataclass(frozen=True, slots=True)
class PoliticaRetencion:
    """Plazos operativos y activación de la purga."""

    trabajos_dias: int
    alertas_dias: int
    purga_habilitada: bool


class ResultadoPurga(TypedDict):
    trabajos: int
    alertas: int
    omitido: NotRequired[dict[str, str]]


def politica_desde_settings() -> PoliticaRetencion:
    """Construye la política con la configuración vigente."""
    settings = get_settings()
    return PoliticaRetencion(
        trabajos_dias=settings.retencion_trabajos_dias,
        alertas_dias=settings.retencion_alertas_dias,
        purga_habilitada=settings.purga_habilitada,
    )


def _condicion_trabajos(corte: datetime) -> ColumnElement[bool]:
    tabla = Trabajo.__table__
    return sa.and_(
        tabla.c.estado.in_(("completado", "error")),
        tabla.c.actualizado_en < corte,
    )


def _tabla_alertas(db: Session) -> sa.Table | None:
    bind = db.get_bind()
    if not sa.inspect(bind).has_table("alertas"):
        return None
    tabla = sa.Table("alertas", sa.MetaData(), autoload_with=bind)
    if not all(columna in tabla.c for columna in ("id", "creado_en", "revisada_en")):
        raise RuntimeError("La tabla alertas no tiene columnas de retención compatibles")
    return tabla


def _condicion_alertas(tabla: sa.Table, corte: datetime) -> ColumnElement[bool]:
    return sa.and_(tabla.c.revisada_en.is_not(None), tabla.c.creado_en < corte)


def _contar(db: Session, tabla: sa.Table, condicion: ColumnElement[bool]) -> int:
    cuenta = db.scalar(sa.select(sa.func.count()).select_from(tabla).where(condicion))
    return int(cuenta or 0)


def _borrar_en_lotes(db: Session, tabla: sa.Table, condicion: ColumnElement[bool]) -> int:
    total = 0
    identificador = tabla.c.id
    while True:
        ids = db.scalars(
            sa.select(identificador).where(condicion).order_by(identificador).limit(TAMANO_LOTE)
        ).all()
        if not ids:
            return total
        resultado = db.execute(sa.delete(tabla).where(identificador.in_(ids), condicion))
        borrados = resultado.rowcount
        total += len(ids) if borrados is None or borrados < 0 else borrados


def _contar_candidatos(db: Session, ahora: datetime, politica: PoliticaRetencion) -> ResultadoPurga:
    corte_trabajos = ahora - timedelta(days=politica.trabajos_dias)
    trabajos = _contar(db, Trabajo.__table__, _condicion_trabajos(corte_trabajos))
    resultado: ResultadoPurga = {"trabajos": trabajos, "alertas": 0}

    tabla_alertas = _tabla_alertas(db)
    if tabla_alertas is None:
        resultado["omitido"] = {"alertas": "tabla ausente"}
    else:
        corte_alertas = ahora - timedelta(days=politica.alertas_dias)
        resultado["alertas"] = _contar(
            db, tabla_alertas, _condicion_alertas(tabla_alertas, corte_alertas)
        )
    return resultado


def purgar(db: Session, ahora: datetime, politica: PoliticaRetencion) -> ResultadoPurga:
    """Cuenta o elimina datos operativos elegibles, según la activación."""
    if not politica.purga_habilitada:
        return _contar_candidatos(db, ahora, politica)

    corte_trabajos = ahora - timedelta(days=politica.trabajos_dias)
    resultado: ResultadoPurga = {
        "trabajos": _borrar_en_lotes(db, Trabajo.__table__, _condicion_trabajos(corte_trabajos)),
        "alertas": 0,
    }

    tabla_alertas = _tabla_alertas(db)
    if tabla_alertas is None:
        resultado["omitido"] = {"alertas": "tabla ausente"}
    else:
        corte_alertas = ahora - timedelta(days=politica.alertas_dias)
        resultado["alertas"] = _borrar_en_lotes(
            db, tabla_alertas, _condicion_alertas(tabla_alertas, corte_alertas)
        )
    return resultado


def _imprimir(resultado: ResultadoPurga, estado: str) -> None:
    print(
        f"{estado}: trabajos={resultado['trabajos']} alertas={resultado['alertas']}; "
        "auditoria: no se purga (append-only con cadena y ancla)"
    )
    if "omitido" in resultado:
        print("alertas omitidas: tabla ausente")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Retención segura de datos operativos")
    parser.add_argument("--si", action="store_true", help="autoriza la purga configurada")
    args = parser.parse_args(argv)

    politica = politica_desde_settings()
    with get_session_factory()() as db:
        ahora = datetime.now(UTC)
        if not args.si:
            resultado = _contar_candidatos(db, ahora, politica)
            estado = "simulación"
            if not politica.purga_habilitada:
                estado += "; purga deshabilitada"
        else:
            resultado = purgar(db, ahora, politica)
            if politica.purga_habilitada:
                db.commit()
                estado = "purga ejecutada"
            else:
                estado = "purga deshabilitada"
        _imprimir(resultado, estado)
    return 0


if __name__ == "__main__":
    sys.exit(main())
