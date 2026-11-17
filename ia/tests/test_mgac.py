"""Prueba la pseudomáscara MGAC con una imagen sintética (sin pesos)."""

from __future__ import annotations

import numpy as np
import pytest

from app.config import ConfiguracionIA
from app.contrato import Caja
from app.mgac import generar_mascara_mgac


def configuracion() -> ConfiguracionIA:
    return ConfiguracionIA(modelos_dir="modelos", mgac_iteraciones=20)


def configuracion_completa() -> ConfiguracionIA:
    """Iteraciones por defecto: la textura solo se separa con la convergencia completa."""
    return ConfiguracionIA(modelos_dir="modelos")


def imagen_ecografia_sintetica(lado: int = 120) -> np.ndarray:
    imagen = np.full((lado, lado, 3), 35, dtype=np.uint8)
    centro = lado // 2
    yy, xx = np.ogrid[:lado, :lado]
    nodulo = ((xx - centro) ** 2 + (yy - centro) ** 2) <= (lado // 6) ** 2
    imagen[nodulo] = 190
    return imagen


INTENSIDADES_TRUNCADAS = (
    33,
    37,
    41,
    45,
    49,
    53,
    57,
    61,
    66,
    74,
    82,
    90,
    98,
    106,
    114,
    122,
    132,
    148,
    164,
    180,
    196,
    212,
    228,
    244,
)
"""Valores que ``img_as_float`` trunca a ``v - 1`` al volver a ``uint8``."""


def textura(valores: tuple[int, ...], semilla: int = 7, lado: int = 120) -> np.ndarray:
    """Imagen de ruido con una textura que el contorno activo amplifica."""
    muestras = np.random.default_rng(semilla).choice(
        np.asarray(valores, dtype=np.uint8), size=(lado, lado)
    )
    return np.dstack([muestras] * 3)


def test_devuelve_una_mascara_del_tamano_de_la_imagen() -> None:
    imagen = imagen_ecografia_sintetica()

    mascara = generar_mascara_mgac(imagen, Caja(30, 30, 90, 90), configuracion())

    assert mascara.shape == imagen.shape[:2]
    assert mascara.dtype == np.uint8
    assert set(np.unique(mascara)) <= {0, 255}


def test_no_marca_pixeles_fuera_de_la_caja() -> None:
    imagen = imagen_ecografia_sintetica()

    mascara = generar_mascara_mgac(imagen, Caja(30, 30, 90, 90), configuracion())

    assert np.count_nonzero(mascara[:30, :]) == 0
    assert np.count_nonzero(mascara[:, :30]) == 0
    assert np.count_nonzero(mascara[90:, :]) == 0
    assert np.count_nonzero(mascara[:, 90:]) == 0


def test_la_imagen_de_entrada_no_se_modifica() -> None:
    imagen = imagen_ecografia_sintetica()
    original = imagen.copy()

    generar_mascara_mgac(imagen, Caja(10, 10, 100, 100), configuracion())

    assert np.array_equal(imagen, original)


def test_caja_que_no_toca_la_imagen_falla() -> None:
    imagen = np.full((20, 20, 3), 10, dtype=np.uint8)

    with pytest.raises(ValueError, match="vacía"):
        generar_mascara_mgac(imagen, Caja(500, 500, 600, 600), configuracion())


def test_recupera_el_roi_con_la_precision_de_base_py() -> None:
    """``base.py`` pasa el ROI por ``img_as_float`` (float64), que trunca 33 a 32.

    Con ``float32`` el ida y vuelta conserva la intensidad y la máscara MGAC se
    separa de la referencia: en ``0000.jpg`` son 127 píxeles en la caja
    78/96/218/239.
    """
    caja = Caja(10, 10, 110, 110)
    imagen = textura(INTENSIDADES_TRUNCADAS)
    truncada = textura(tuple(valor - 1 for valor in INTENSIDADES_TRUNCADAS))

    assert np.array_equal(
        generar_mascara_mgac(imagen, caja, configuracion_completa()),
        generar_mascara_mgac(truncada, caja, configuracion_completa()),
    )


def test_la_textura_distingue_un_paso_de_intensidad() -> None:
    """Control de la prueba anterior: un nivel de gris sí cambia la máscara."""
    caja = Caja(10, 10, 110, 110)
    imagen = textura(tuple(valor + 1 for valor in INTENSIDADES_TRUNCADAS))
    siguiente = textura(tuple(valor + 2 for valor in INTENSIDADES_TRUNCADAS))

    assert not np.array_equal(
        generar_mascara_mgac(imagen, caja, configuracion_completa()),
        generar_mascara_mgac(siguiente, caja, configuracion_completa()),
    )
