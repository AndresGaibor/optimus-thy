"""Pruebas del contrato de salida versionado (RIA-06)."""

from __future__ import annotations

import json

from app.contrato import (
    ORIGEN_BGAUNET,
    VERSION_CONTRATO,
    Caja,
    Nodulo,
    ResultadoInferencia,
)


def _nodulo() -> Nodulo:
    return Nodulo(
        indice=1,
        caja=Caja(10, 20, 60, 80),
        confianza_detector=0.912345678,
        origen_mascara=ORIGEN_BGAUNET,
        clase="benigno",
        probabilidad_benigno=0.873456789,
        probabilidad_maligno=0.126543211,
        region_analizada=Caja(5, 15, 65, 85),
        pixeles_mascara=1234,
    )


def test_el_contrato_declara_su_version() -> None:
    resultado = ResultadoInferencia(ancho=100, alto=100)

    assert resultado.version_contrato == VERSION_CONTRATO


def test_cada_nodulo_lleva_los_campos_del_requisito() -> None:
    diccionario = _nodulo().a_diccionario()

    assert diccionario["caja"] == {"xmin": 10, "ymin": 20, "xmax": 60, "ymax": 80}
    assert diccionario["confianza_detector"] == 0.912346
    assert diccionario["origen_mascara"] == "bgaunet"
    assert diccionario["clase"] == "benigno"
    assert diccionario["probabilidad_benigno"] == 0.873457
    assert diccionario["probabilidad_maligno"] == 0.126543
    assert diccionario["region_analizada"] == {"xmin": 5, "ymin": 15, "xmax": 65, "ymax": 85}
    assert diccionario["indice"] == 1
    assert diccionario["pixeles_mascara"] == 1234


def test_sin_nodulos_no_inventa_una_clase() -> None:
    resultado = ResultadoInferencia(ancho=640, alto=480)

    assert resultado.sin_nodulo is True
    assert resultado.nodulos == ()
    assert resultado.a_diccionario()["nodulos"] == []


def test_el_diccionario_es_serializable_a_json() -> None:
    resultado = ResultadoInferencia(ancho=200, alto=100, nodulos=(_nodulo(),))

    texto = json.dumps(resultado.a_diccionario(), sort_keys=True)

    assert texto.startswith('{"alto": 100')
    assert '"sin_nodulo": false' in texto
    assert '"version_contrato": "1.0"' in texto
