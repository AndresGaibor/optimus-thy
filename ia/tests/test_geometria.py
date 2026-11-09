"""Pruebas de la geometría de cajas."""

from __future__ import annotations

from app.contrato import Caja
from app.geometria import area_caja, es_caja_util, expandir_caja, recortar_caja


def test_recortar_caja_limita_a_la_imagen() -> None:
    recortada = recortar_caja(Caja(-20, -5, 500, 400), ancho=100, alto=80)

    assert recortada == Caja(0, 0, 100, 80)


def test_area_caja() -> None:
    assert area_caja(Caja(10, 10, 30, 25)) == 20 * 15


def test_es_caja_util_descarta_detecciones_diminutas() -> None:
    assert es_caja_util(Caja(0, 0, 5, 5)) is True
    assert es_caja_util(Caja(0, 0, 4, 50)) is False
    assert es_caja_util(Caja(0, 0, 50, 4)) is False


def test_expandir_caja_aplica_margen_proporcional() -> None:
    expandida = expandir_caja(Caja(50, 50, 100, 100), ancho=200, alto=200, margen=0.10)

    assert expandida == Caja(45, 45, 105, 105)


def test_expandir_caja_no_sale_de_la_imagen() -> None:
    expandida = expandir_caja(Caja(0, 0, 10, 10), ancho=20, alto=20, margen=0.5)

    assert expandida == Caja(0, 0, 15, 15)
