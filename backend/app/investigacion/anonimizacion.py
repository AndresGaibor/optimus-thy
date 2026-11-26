"""Anonimización de casos para datasets de investigación (HT-070).

Reglas que aplica este módulo, en este orden:

1. **Identificadores directos fuera.** Nunca se copian nombres, apellidos,
   documento, fecha de nacimiento exacta, código de paciente, código de caso,
   institución, contacto ni dirección. La consulta del endpoint ni siquiera
   los selecciona para la respuesta.
2. **Sujeto seudónimo por dataset.** Cada fila recibe un seudónimo aleatorio
   distinto en cada dataset; no se deriva del identificador del caso, así que
   dos datasets no se pueden enlazar por el seudónimo.
3. **Fechas desplazadas y truncadas a mes.** Cada caso recibe un
   desplazamiento determinista de 0 a 364 días, calculado con HMAC-SHA256 y la
   clave de la instalación, y después la fecha se expresa como ``AAAA-MM``.
   El desplazamiento depende solo del caso: la misma foto clínica produce la
   misma huella al reconstruir el dataset, pero nunca se publica el día.
4. **Edad en decenios.** La edad se calcula a la fecha del caso y se agrupa
   en ``0-9``, ``10-19``, …, ``70-79`` y ``80+``.
5. **Sin texto libre.** Los campos categóricos solo se copian si son códigos
   cortos (letras, dígitos, punto, guion, guion bajo); cualquier otro valor se
   convierte en ``null``. Los valores numéricos se publican como número.

La huella del conjunto es SHA-256 del JSON canónico de las filas sin el
seudónimo, ordenadas por fecha del caso. Es estable para los mismos casos y
datos clínicos, y cambia si cambia cualquier valor publicado.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import re
import secrets
import uuid
from collections.abc import Mapping
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any, Final

from app.config import get_settings
from app.models.fichas import Caso, FichaClinica

_FORMATO_MES: Final[str] = "%Y-%m"
_DIAS_DESPLAZAMIENTO: Final[int] = 365
_CATEGORIA_RE: Final[re.Pattern[str]] = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")
_UNIDAD_RE: Final[re.Pattern[str]] = re.compile(r"^[A-Za-z0-9µμ/%^.\- ]{1,16}$")
CAMPOS_CUASI_IDENTIFICADORES: Final[tuple[str, ...]] = (
    "edad_rango",
    "mes_caso",
    "mes_tsh",
    "mes_t3",
    "mes_t4",
    "lateralidad",
    "tirads",
    "bethesda",
    "cie10",
    "tipo_diagnostico",
    "tipo_consulta",
)


def cuasi_identificadores(fila: Mapping[str, Any]) -> tuple[Any, ...]:
    """Devuelve la clave de equivalencia publicada, sin atributos sensibles."""
    return tuple(fila.get(campo) for campo in CAMPOS_CUASI_IDENTIFICADORES)


def _clave() -> bytes:
    return get_settings().pii_encryption_key.encode("utf-8")


def _desplazamiento_dias(caso_id: uuid.UUID) -> int:
    digest = hmac.new(_clave(), f"desplazamiento:{caso_id}".encode(), hashlib.sha256).digest()
    return int.from_bytes(digest[:2], "big") % _DIAS_DESPLAZAMIENTO


def _mes(valor: object, caso_id: uuid.UUID) -> str | None:
    if valor is None:
        return None
    if isinstance(valor, datetime):
        fecha = valor.date()
    elif isinstance(valor, date):
        fecha = valor
    else:
        return None
    return (fecha + timedelta(days=_desplazamiento_dias(caso_id))).strftime(_FORMATO_MES)


def _edad_rango(fecha_nacimiento: date | None, referencia: date | None) -> str | None:
    if fecha_nacimiento is None or referencia is None:
        return None
    edad = referencia.year - fecha_nacimiento.year
    if (referencia.month, referencia.day) < (fecha_nacimiento.month, fecha_nacimiento.day):
        edad -= 1
    if edad < 0:
        return None
    if edad >= 80:
        return "80+"
    decenio = (edad // 10) * 10
    return f"{decenio}-{decenio + 9}"


def _numero(valor: Decimal | float | int | None) -> float | None:
    return None if valor is None else float(valor)


def _categoria(valor: str | None) -> str | None:
    if valor is None or not _CATEGORIA_RE.match(valor):
        return None
    return valor


def _unidad(valor: str | None) -> str | None:
    if valor is None or not _UNIDAD_RE.match(valor):
        return None
    return valor


def _fecha_nacimiento(caso: Caso) -> date | None:
    identidad = caso.paciente.identidad
    if identidad is None:
        return None
    try:
        return date.fromisoformat(identidad.fecha_nacimiento_cifrada)
    except ValueError:
        return None


def _datos_ficha(ficha: FichaClinica | None, caso_id: uuid.UUID) -> dict[str, Any]:
    if ficha is None:
        return {
            "mes_tsh": None,
            "tsh": None,
            "tsh_unidad": None,
            "mes_t3": None,
            "t3": None,
            "t3_unidad": None,
            "mes_t4": None,
            "t4": None,
            "t4_unidad": None,
            "tamano_nodulo_mm": None,
            "lateralidad": None,
            "tirads": None,
            "bethesda": None,
            "cie10": None,
            "tipo_diagnostico": None,
            "tipo_consulta": None,
        }
    return {
        "mes_tsh": _mes(ficha.tsh_fecha, caso_id),
        "tsh": _numero(ficha.tsh),
        "tsh_unidad": _unidad(ficha.tsh_unidad),
        "mes_t3": _mes(ficha.t3_fecha, caso_id),
        "t3": _numero(ficha.t3),
        "t3_unidad": _unidad(ficha.t3_unidad),
        "mes_t4": _mes(ficha.t4_fecha, caso_id),
        "t4": _numero(ficha.t4),
        "t4_unidad": _unidad(ficha.t4_unidad),
        "tamano_nodulo_mm": _numero(ficha.tamano_nodulo_mm),
        "lateralidad": _categoria(ficha.lateralidad),
        "tirads": _categoria(ficha.tirads),
        "bethesda": _categoria(ficha.bethesda),
        "cie10": _categoria(ficha.cie10),
        "tipo_diagnostico": _categoria(ficha.tipo_diagnostico),
        "tipo_consulta": _categoria(ficha.tipo_consulta),
    }


def anonimizar_caso(caso: Caso) -> dict[str, Any]:
    """Devuelve solo los campos publicables de un caso, sin identificadores."""
    creado_en = caso.creado_en
    creado: date | None = creado_en.date() if isinstance(creado_en, datetime) else None
    return {
        "edad_rango": _edad_rango(_fecha_nacimiento(caso), creado),
        "mes_caso": _mes(creado_en, caso.id),
        **_datos_ficha(caso.ficha_clinica, caso.id),
    }


def sujeto_nuevo() -> str:
    """Seudónimo aleatorio, distinto en cada dataset y no derivado del caso."""
    return f"suj-{secrets.token_hex(12)}"


def huella_de(filas: list[dict[str, Any]]) -> str:
    """SHA-256 canónico de las filas anonimizadas, sin seudónimos."""
    contenido = json.dumps(filas, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(contenido.encode("utf-8")).hexdigest()
