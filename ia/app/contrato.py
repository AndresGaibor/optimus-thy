"""Contrato de salida versionado del servicio de IA (RIA-06).

Una inferencia devuelve, como mucho, tres nódulos. Cada nódulo lleva su caja, la
confianza del detector, el origen de la máscara, las probabilidades, la clase y
la región que se analizó para clasificar. El diccionario que produce
``ResultadoInferencia.a_diccionario`` es el contrato que consume la API.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

VERSION_CONTRATO = "1.0"
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

    def a_diccionario(self) -> dict[str, Any]:
        return {
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
