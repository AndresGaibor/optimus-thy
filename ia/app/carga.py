"""Carga única de los tres modelos y huella de sus pesos (HT-062, RIA-04/05).

``cargar_modelos`` se memoiza con ``lru_cache``: el proceso carga los pesos una
sola vez y cada solicitud comparte adaptadores de solo lectura. Un modelo
ausente no lanza excepción en el arranque: queda marcado como no cargado con el
motivo, para que ``/health`` lo informe y ``/inferir`` responda 503 sin inventar
un resultado.

La huella combina nombre, tamaño y contenido de los archivos de pesos presentes
en ``IA_MODELOS_DIR`` en orden de nombre, de modo que un byte distinto cambia el
SHA-256 y un cambio de pesos se puede registrar con la inferencia.
"""

from __future__ import annotations

import hashlib
from collections.abc import Mapping
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from types import MappingProxyType
from typing import Any

from app.config import (
    PESO_BGAUNET_POR_DEFECTO,
    PESO_SWIN_POR_DEFECTO,
    PESO_YOLO_POR_DEFECTO,
    ConfiguracionIA,
)
from app.modelos import ModeloNoDisponible, ModelosIA

EXTENSIONES_PESOS = frozenset({".pt", ".pth", ".keras", ".h5", ".onnx", ".bin", ".safetensors"})
TAMANO_BLOQUE = 1024 * 1024

NOMBRES_MODELOS = ("detector", "segmentador", "clasificador")


@dataclass(frozen=True, slots=True)
class EstadoModelo:
    """Resultado de intentar cargar uno de los tres modelos."""

    nombre: str
    archivo: str
    ruta: Path | None
    sha256: str | None
    cargado: bool
    detalle: str | None = None

    def a_diccionario(self) -> dict[str, Any]:
        datos: dict[str, Any] = {
            "cargado": self.cargado,
            "archivo": self.archivo,
            "sha256": self.sha256,
        }
        if not self.cargado and self.detalle:
            datos["detalle"] = self.detalle
        return datos


@dataclass(frozen=True, slots=True)
class CargaModelos:
    """Adaptadores listos (o ``None``) y el estado de cada peso."""

    modelos: ModelosIA | None
    estados: tuple[EstadoModelo, ...]
    huella: str
    umbrales: Mapping[str, float | int]

    @property
    def disponible(self) -> bool:
        return self.modelos is not None

    @property
    def ausentes(self) -> tuple[EstadoModelo, ...]:
        return tuple(estado for estado in self.estados if not estado.cargado)

    def estado(self, nombre: str) -> EstadoModelo:
        for estado in self.estados:
            if estado.nombre == nombre:
                return estado
        raise KeyError(f"Modelo desconocido: {nombre}")

    def modelos_a_diccionario(self) -> dict[str, dict[str, Any]]:
        return {estado.nombre: estado.a_diccionario() for estado in self.estados}

    @classmethod
    def sin_configuracion(cls, detalle: str) -> CargaModelos:
        """Estado honesto cuando el entorno no permite construir la configuración."""
        por_defecto = (
            ("detector", PESO_YOLO_POR_DEFECTO),
            ("segmentador", PESO_BGAUNET_POR_DEFECTO),
            ("clasificador", PESO_SWIN_POR_DEFECTO),
        )
        estados = tuple(
            EstadoModelo(
                nombre=nombre,
                archivo=archivo,
                ruta=None,
                sha256=None,
                cargado=False,
                detalle=detalle,
            )
            for nombre, archivo in por_defecto
        )
        return cls(modelos=None, estados=estados, huella="", umbrales=MappingProxyType({}))


def archivos_de_pesos(directorio: Path) -> tuple[Path, ...]:
    """Archivos de pesos del directorio, en orden estable por nombre."""
    if not directorio.is_dir():
        return ()
    candidatos = (
        ruta
        for ruta in directorio.iterdir()
        if ruta.is_file() and ruta.suffix.lower() in EXTENSIONES_PESOS
    )
    return tuple(sorted(candidatos, key=lambda ruta: ruta.name))


def sha256_archivo(ruta: Path) -> str | None:
    """SHA-256 del contenido de un peso, o ``None`` si no existe."""
    if not ruta.is_file():
        return None
    digest = hashlib.sha256()
    with ruta.open("rb") as archivo:
        for bloque in iter(lambda: archivo.read(TAMANO_BLOQUE), b""):
            digest.update(bloque)
    return digest.hexdigest()


def huella_pesos(directorio: Path) -> str:
    """SHA-256 del manifiesto nombre+tamaño+contenido de los pesos presentes."""
    digest = hashlib.sha256()
    for ruta in archivos_de_pesos(directorio):
        contenido = sha256_archivo(ruta)
        if contenido is None:
            continue
        digest.update(ruta.name.encode("utf-8"))
        digest.update(b"\0")
        digest.update(str(ruta.stat().st_size).encode("ascii"))
        digest.update(b"\0")
        digest.update(bytes.fromhex(contenido))
        digest.update(b"\0")
    return digest.hexdigest()


def umbrales_de(config: ConfiguracionIA) -> Mapping[str, float | int]:
    """Umbrales con los que se ejecutó una inferencia (RIA-05)."""
    return MappingProxyType(
        {
            "yolo_confianza": config.yolo_confianza,
            "yolo_iou": config.yolo_iou,
            "yolo_tamano": config.yolo_tamano,
            "max_nodulos": config.max_nodulos,
            "min_pixeles_mascara": config.min_pixeles_mascara,
            "margen_roi": config.margen_roi,
            "mgac_iteraciones": config.mgac_iteraciones,
            "mgac_margen": config.mgac_margen,
            "mgac_radio_cierre": config.mgac_radio_cierre,
        }
    )


def _crear_detector(config: ConfiguracionIA, ruta: Path) -> Any:
    from app.adaptadores import DetectorYolo

    return DetectorYolo(ruta, config.dispositivo)


def _crear_segmentador(config: ConfiguracionIA, ruta: Path) -> Any:
    from app.adaptadores import SegmentadorBgauNet

    return SegmentadorBgauNet(ruta, config.dispositivo)


def _crear_clasificador(config: ConfiguracionIA, ruta: Path) -> Any:
    from app.adaptadores import ClasificadorSwin

    return ClasificadorSwin(ruta, config.dispositivo)


_FABRICAS = {
    "detector": _crear_detector,
    "segmentador": _crear_segmentador,
    "clasificador": _crear_clasificador,
}


@lru_cache(maxsize=1)
def cargar_modelos(config: ConfiguracionIA) -> CargaModelos:
    """Carga los tres modelos una vez por proceso y describe lo que falta.

    Cada peso se intenta de forma independiente: si uno falla, los otros dos
    siguen cargándose y el fallo queda en ``estados`` con su detalle. Solo hay
    ``ModelosIA`` cuando los tres están listos, porque la cadena los necesita a
    la vez.
    """
    estados: list[EstadoModelo] = []
    componentes: dict[str, Any] = {}
    archivos = (
        ("detector", config.yolo_pesos, config.ruta_yolo),
        ("segmentador", config.bgaunet_pesos, config.ruta_bgaunet),
        ("clasificador", config.swin_pesos, config.ruta_swin),
    )

    for nombre, archivo, ruta in archivos:
        sha256 = sha256_archivo(ruta)
        if sha256 is None:
            estados.append(
                EstadoModelo(
                    nombre=nombre,
                    archivo=archivo,
                    ruta=ruta,
                    sha256=None,
                    cargado=False,
                    detalle=f"Falta el archivo de pesos {ruta}.",
                )
            )
            continue
        try:
            componentes[nombre] = _FABRICAS[nombre](config, ruta)
        except ModeloNoDisponible as error:
            estados.append(EstadoModelo(nombre, archivo, ruta, sha256, False, error.detalle))
            continue
        except Exception as error:  # noqa: BLE001 - un peso corrupto no debe tumbar el arranque
            estados.append(
                EstadoModelo(
                    nombre,
                    archivo,
                    ruta,
                    sha256,
                    False,
                    f"No se pudo cargar {archivo}: {error}",
                )
            )
            continue
        estados.append(EstadoModelo(nombre, archivo, ruta, sha256, True))

    modelos = (
        ModelosIA(
            detector=componentes["detector"],
            segmentador=componentes["segmentador"],
            clasificador=componentes["clasificador"],
        )
        if len(componentes) == len(NOMBRES_MODELOS)
        else None
    )
    return CargaModelos(
        modelos=modelos,
        estados=tuple(estados),
        huella=huella_pesos(config.modelos_dir),
        umbrales=umbrales_de(config),
    )
