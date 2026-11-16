"""Pruebas del contrato de salida versionado (RIA-06)."""

from __future__ import annotations

import base64
import json
from dataclasses import replace

import numpy as np

from app.artefactos import png_bytes
from app.contrato import (
    ORIGEN_BGAUNET,
    VERSION_CONTRATO,
    ArtefactosNodulo,
    Caja,
    Nodulo,
    ResultadoInferencia,
)

FIRMA_PNG = b"\x89PNG\r\n\x1a\n"


def _png(valor: int) -> bytes:
    mascara = np.full((8, 8), valor, dtype=np.uint8)
    return png_bytes(mascara)


def _artefactos() -> ArtefactosNodulo:
    return ArtefactosNodulo(
        mascara_png=_png(255),
        mgac_png=_png(128),
        xml='<?xml version="1.0" ?>\n<annotation />\n',
        superposicion_png=_png(7),
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


def test_un_nodulo_sin_artefactos_no_incluye_esas_claves() -> None:
    diccionario = _nodulo().a_diccionario()

    assert "mascara_png" not in diccionario
    assert "mgac_png" not in diccionario
    assert "xml" not in diccionario
    assert "superposicion_png" not in diccionario


def test_el_contrato_11_serializa_los_artefactos_en_base64() -> None:
    artefactos = _artefactos()
    nodulo = replace(_nodulo(), artefactos=artefactos)
    resultado = ResultadoInferencia(ancho=100, alto=100, nodulos=(nodulo,))

    diccionario = resultado.a_diccionario()
    crudo = diccionario["nodulos"][0]

    assert diccionario["version_contrato"] == "1.1"
    assert set(crudo) >= {"mascara_png", "mgac_png", "xml", "superposicion_png"}
    for clave in ("mascara_png", "mgac_png", "superposicion_png"):
        assert base64.b64decode(crudo[clave]).startswith(FIRMA_PNG)
    assert base64.b64decode(crudo["mascara_png"]) == artefactos.mascara_png
    assert base64.b64decode(crudo["mgac_png"]) == artefactos.mgac_png
    assert base64.b64decode(crudo["superposicion_png"]) == artefactos.superposicion_png
    assert base64.b64decode(crudo["xml"]).decode("utf-8") == artefactos.xml


def test_el_diccionario_es_serializable_a_json() -> None:
    resultado = ResultadoInferencia(
        ancho=200, alto=100, nodulos=(replace(_nodulo(), artefactos=_artefactos()),)
    )

    texto = json.dumps(resultado.a_diccionario(), sort_keys=True)

    assert texto.startswith('{"alto": 100')
    assert '"sin_nodulo": false' in texto
    assert '"version_contrato": "1.1"' in texto
    assert '"mascara_png": "iVBORw0KGgo' in texto
