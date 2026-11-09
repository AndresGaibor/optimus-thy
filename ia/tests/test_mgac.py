"""Prueba la pseudomáscara MGAC con una imagen sintética (sin pesos)."""

from __future__ import annotations

import numpy as np
import pytest

from app.config import ConfiguracionIA
from app.contrato import Caja
from app.mgac import generar_mascara_mgac


def configuracion() -> ConfiguracionIA:
    return ConfiguracionIA(modelos_dir="modelos", mgac_iteraciones=20)


def imagen_ecografia_sintetica(lado: int = 120) -> np.ndarray:
    imagen = np.full((lado, lado, 3), 35, dtype=np.uint8)
    centro = lado // 2
    yy, xx = np.ogrid[:lado, :lado]
    nodulo = ((xx - centro) ** 2 + (yy - centro) ** 2) <= (lado // 6) ** 2
    imagen[nodulo] = 190
    return imagen


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
