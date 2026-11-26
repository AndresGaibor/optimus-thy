"""Aplicación de filtros guardados de cohortes sobre casos autorizados."""

from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy.orm import Session

from app.api.datasets import FiltroCasos, _consulta_casos
from app.auth.deps import SesionActual
from app.models.fichas import Caso


class FiltrosCohorte(BaseModel):
    """Filtros clínicos permitidos en una cohorte reutilizable."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    edad_min: int | None = Field(default=None, strict=True, ge=0, le=120)
    edad_max: int | None = Field(default=None, strict=True, ge=0, le=120)
    tirads: str | None = Field(default=None, strict=True, max_length=16)
    bethesda: str | None = Field(default=None, strict=True, max_length=16)
    tipo_diagnostico: str | None = Field(
        default=None,
        strict=True,
        max_length=64,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$",
    )
    desde: date | None = None
    hasta: date | None = None

    @model_validator(mode="after")
    def validar_rangos(self) -> FiltrosCohorte:
        if (
            self.edad_min is not None
            and self.edad_max is not None
            and self.edad_min > self.edad_max
        ):
            raise ValueError("la edad mínima no puede superar la edad máxima")
        if self.desde is not None and self.hasta is not None and self.desde > self.hasta:
            raise ValueError("la fecha inicial no puede superar la final")
        return self


def normalizar_filtros(filtros: dict[str, Any]) -> dict[str, Any]:
    """Valida y normaliza el objeto de filtros que se persiste en JSONB."""
    valores = FiltrosCohorte.model_validate(filtros)
    return valores.model_dump(mode="json", exclude_none=True)


def casos_de_cohorte(db: Session, actual: SesionActual, filtros: dict[str, Any]) -> list[Caso]:
    """Aplica filtros SQL compartidos con datasets y edad sobre la identidad descifrada."""
    criterios = FiltrosCohorte.model_validate(filtros)
    criterios_sql = criterios.model_dump(exclude_none=True, exclude={"edad_min", "edad_max"})
    casos = _consulta_casos(db, actual, FiltroCasos.model_validate(criterios_sql))
    if criterios.edad_min is None and criterios.edad_max is None:
        return casos

    hoy = datetime.now(UTC).date()
    resultado: list[Caso] = []
    for caso in casos:
        identidad = caso.paciente.identidad
        if identidad is None:
            continue
        try:
            nacimiento = date.fromisoformat(identidad.fecha_nacimiento_cifrada)
        except ValueError:
            continue
        edad = (
            hoy.year - nacimiento.year - ((hoy.month, hoy.day) < (nacimiento.month, nacimiento.day))
        )
        if criterios.edad_min is not None and edad < criterios.edad_min:
            continue
        if criterios.edad_max is not None and edad > criterios.edad_max:
            continue
        resultado.append(caso)
    return resultado
