"""Filtro visual preliminar para imágenes que parecen ecografías tiroideas."""

from __future__ import annotations

import numpy as np

UMBRAL_PROPORCION_ACROMATICA = 0.90
"""Proporción mínima de píxeles casi acromáticos para aceptar la apariencia."""

MAXIMA_DIFERENCIA_CANALES = 24
"""Diferencia máxima entre canales BGR para considerar un píxel acromático."""


def parece_ecografia_tiroidea(imagen: np.ndarray) -> bool:
    """Acepta imágenes BGR cuya mayoría de píxeles es casi acromática."""
    if imagen.ndim != 3 or imagen.shape[2] != 3 or imagen.size == 0:
        return False

    acromaticos = np.count_nonzero(np.ptp(imagen, axis=2) <= MAXIMA_DIFERENCIA_CANALES)
    pixeles = imagen.shape[0] * imagen.shape[1]
    return acromaticos / pixeles >= UMBRAL_PROPORCION_ACROMATICA
