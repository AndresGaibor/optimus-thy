"""Contrato de salida versionado del servicio de IA (RIA-06).

Una inferencia devuelve, como mucho, tres nódulos. Cada nódulo lleva su caja, la
confianza del detector, el origen de la máscara, las probabilidades, la clase y
la región que se analizó para clasificar. El diccionario que produce
``ResultadoInferencia.a_diccionario`` es el contrato que consume la API.

El contrato 1.1 añade, por nódulo y de forma opcional, los artefactos derivados
en base64 (``mascara_png``, ``mgac_png``, ``xml`` y ``superposicion_png``); un
nódulo sin artefactos sigue siendo válido y no incluye esas claves.
"""

from __future__ import annotations

import base64
from dataclasses import dataclass
from typing import Any

VERSION_CONTRATO = "1.1"
"""Versión del contrato de salida; se sube cuando cambia algún campo."""

ORIGEN_BGAUNET = "bgaunet"
ORIGEN_MGAC = "mgac"

CLASE_BENIGNO = "benigno"
CLASE_MALIGNO = "maligno"


@dataclass(frozen=True, slots=True)
class Caja:
    """Rectángulo en píxeles de la imagen original."""

    xmin: int
    ymin: int
    xmax: int
    ymax: int

    def a_diccionario(self) -> dict[str, int]:
        return {"xmin": self.xmin, "ymin": self.ymin, "xmax": self.xmax, "ymax": self.ymax}


def _base64(datos: bytes) -> str:
    return base64.b64encode(datos).decode("ascii")


@dataclass(frozen=True, slots=True)
class ArtefactosNodulo:
    """Evidencia derivada de un nódulo, tal cual sale de la cadena de IA.

    El XML es texto UTF-8 en memoria; al serializar el contrato se convierte a
    base64 igual que las tres imágenes PNG.
    """

    mascara_png: bytes
    mgac_png: bytes
    xml: str
    superposicion_png: bytes

    def a_diccionario(self) -> dict[str, str]:
        return {
            "mascara_png": _base64(self.mascara_png),
            "mgac_png": _base64(self.mgac_png),
            "xml": _base64(self.xml.encode("utf-8")),
            "superposicion_png": _base64(self.superposicion_png),
        }


@dataclass(frozen=True, slots=True)
class Nodulo:
    """Resultado de un nódulo detectado y clasificado."""

    indice: int
    caja: Caja
    confianza_detector: float
    origen_mascara: str
    clase: str
    probabilidad_benigno: float
    probabilidad_maligno: float
    region_analizada: Caja
    pixeles_mascara: int
    artefactos: ArtefactosNodulo | None = None

    def a_diccionario(self) -> dict[str, Any]:
        diccionario: dict[str, Any] = {
            "indice": self.indice,
            "caja": self.caja.a_diccionario(),
            "confianza_detector": round(self.confianza_detector, 6),
            "origen_mascara": self.origen_mascara,
            "clase": self.clase,
            "probabilidad_benigno": round(self.probabilidad_benigno, 6),
            "probabilidad_maligno": round(self.probabilidad_maligno, 6),
            "region_analizada": self.region_analizada.a_diccionario(),
            "pixeles_mascara": self.pixeles_mascara,
        }
        if self.artefactos is not None:
            diccionario.update(self.artefactos.a_diccionario())
        return diccionario


@dataclass(frozen=True, slots=True)
class ResultadoInferencia:
    """Salida completa de una imagen.

    Sin nódulos no se clasifica (RF-INF-13/14): ``nodulos`` queda vacío y
    ``sin_nodulo`` lo indica sin inventar una clase.
    """

    ancho: int
    alto: int
    nodulos: tuple[Nodulo, ...] = ()
    version_contrato: str = VERSION_CONTRATO

    @property
    def sin_nodulo(self) -> bool:
        return len(self.nodulos) == 0

    def a_diccionario(self) -> dict[str, Any]:
        return {
            "version_contrato": self.version_contrato,
            "ancho": self.ancho,
            "alto": self.alto,
            "sin_nodulo": self.sin_nodulo,
            "nodulos": [nodulo.a_diccionario() for nodulo in self.nodulos],
        }
