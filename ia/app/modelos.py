"""Protocolos de los tres modelos y contenedor que los agrupa.

La cadena (HT-061) no sabe cómo se cargan los pesos: recibe un ``ModelosIA`` ya
construido. La carga única y los adaptadores reales de YOLO, BGAU-Net y Swin son
parte de HT-062, y así la función se puede probar con dobles.
"""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Protocol

import numpy as np

from app.config import ConfiguracionIA
from app.contrato import Caja


@dataclass(frozen=True, slots=True)
class Deteccion:
    """Caja detectada por YOLO y su confianza."""

    caja: Caja
    confianza: float


@dataclass(frozen=True, slots=True)
class ProbabilidadesNodulo:
    """Probabilidades de la clasificación binaria del nódulo."""

    benigno: float
    maligno: float


class DetectorNodulos(Protocol):
    """YOLO11: devuelve las cajas candidatas de una imagen BGR uint8."""

    def detectar(self, imagen: np.ndarray, config: ConfiguracionIA) -> Sequence[Deteccion]: ...


class SegmentadorMascara(Protocol):
    """BGAU-Net: devuelve una máscara binaria ``uint8`` (0 o 255) del tamaño de la imagen."""

    def segmentar(self, imagen: np.ndarray, caja: Caja, config: ConfiguracionIA) -> np.ndarray: ...


class ClasificadorNodulo(Protocol):
    """Swin Transformer dual: clasifica la región de un nódulo."""

    def clasificar(
        self,
        imagen_roi: np.ndarray,
        mascara_roi: np.ndarray,
        config: ConfiguracionIA,
    ) -> ProbabilidadesNodulo: ...


@dataclass(frozen=True, slots=True)
class ModelosIA:
    """Los tres modelos ya cargados que necesita una inferencia."""

    detector: DetectorNodulos
    segmentador: SegmentadorMascara
    clasificador: ClasificadorNodulo
