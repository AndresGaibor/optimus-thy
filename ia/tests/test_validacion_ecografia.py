"""Pruebas del filtro visual preliminar para imágenes de ecografía."""

from __future__ import annotations

import numpy as np

from app.validacion_ecografia import parece_ecografia_tiroidea


def test_imagen_en_escala_de_grises_parece_ecografia() -> None:
    imagen = np.zeros((20, 20, 3), dtype=np.uint8)
    imagen[3:17, 4:16] = np.arange(14, dtype=np.uint8)[:, None, None]

    assert parece_ecografia_tiroidea(imagen)


def test_imagen_colorida_no_parece_ecografia() -> None:
    imagen = np.empty((10, 10, 3), dtype=np.uint8)
    imagen[:] = (0, 80, 255)

    assert not parece_ecografia_tiroidea(imagen)


def test_acepta_exactamente_el_noventa_por_ciento_acromatico() -> None:
    imagen = np.zeros((10, 10, 3), dtype=np.uint8)
    imagen[:9] = (30, 30, 30)
    imagen[9] = (0, 80, 255)

    assert parece_ecografia_tiroidea(imagen)


def test_rechaza_por_debajo_del_umbral_acromatico() -> None:
    imagen = np.zeros((100, 100, 3), dtype=np.uint8)
    imagen[:11] = (0, 80, 255)

    assert not parece_ecografia_tiroidea(imagen)
