"""Pruebas del contrato 1.1: forma de la salida, campos y validación."""

from __future__ import annotations

import dataclasses

import pytest

from app.contrato import VERSION_CONTRATO, BloqueOcr, CampoExtraido, DocumentoOcr


def _documento() -> DocumentoOcr:
    return DocumentoOcr(
        motor="tesseract",
        modelo="tesseract-ocr-spa",
        huella_modelo="abc123",
        paginas=1,
        texto_markdown="TSH 2,5 mU/L",
        bloques=(
            BloqueOcr(
                pagina=1,
                orden=0,
                etiqueta="text",
                texto="TSH 2,5 mU/L",
                bbox=(0.1, 0.2, 0.5, 0.25),
                confianza=0.98,
            ),
        ),
        campos=(CampoExtraido("tsh", "2.5", "TSH 2,5 mU/L", 0.98, False),),
        avisos=("el motor no reporta confianza por bloque",),
    )


def test_version_del_contrato() -> None:
    assert VERSION_CONTRATO == "1.1"
    assert _documento().version_contrato == "1.1"


def test_documento_en_json_respeta_el_contrato() -> None:
    cuerpo = _documento().a_diccionario()
    # El orden de claves es parte del contrato: quien lo consume lo espera así.
    assert list(cuerpo) == [
        "version_contrato",
        "motor",
        "modelo",
        "huella_modelo",
        "paginas",
        "texto_markdown",
        "bloques",
        "campos",
        "avisos",
    ]
    assert cuerpo["bloques"] == [
        {
            "pagina": 1,
            "orden": 0,
            "etiqueta": "text",
            "texto": "TSH 2,5 mU/L",
            "bbox": [0.1, 0.2, 0.5, 0.25],
            "confianza": 0.98,
        }
    ]
    assert cuerpo["campos"] == [
        {
            "nombre": "tsh",
            "valor": "2.5",
            "texto_origen": "TSH 2,5 mU/L",
            "confianza": 0.98,
            "revisar": False,
        }
    ]
    assert cuerpo["avisos"] == ["el motor no reporta confianza por bloque"]


def test_bloque_sin_bbox_devuelve_null() -> None:
    bloque = BloqueOcr(pagina=1, orden=0, etiqueta="text", texto="hola")
    assert bloque.a_diccionario()["bbox"] is None
    assert bloque.a_diccionario()["confianza"] is None


def test_campo_sin_confianza() -> None:
    campo = CampoExtraido("tsh", "2.5", "TSH 2,5", None, False)
    assert campo.a_diccionario() == {
        "nombre": "tsh",
        "valor": "2.5",
        "texto_origen": "TSH 2,5",
        "confianza": None,
        "revisar": False,
    }


def test_confianza_de_campo_fuera_de_rango_falla() -> None:
    with pytest.raises(ValueError):
        CampoExtraido("tsh", "2.5", "TSH 2,5", 1.5, False)


@pytest.mark.parametrize(
    "bbox",
    [
        (0.0, 0.0, 1.5, 1.0),
        (-0.1, 0.0, 0.5, 0.5),
        (0.5, 0.5, 0.2, 0.9),
        (0.1, 0.1, 0.2),
        ("0.1", 0.1, 0.2, 0.3),
        (True, 0.1, 0.2, 0.3),
    ],
)
def test_bbox_invalida_falla(bbox: tuple[object, ...]) -> None:
    with pytest.raises(ValueError):
        BloqueOcr(pagina=1, orden=0, etiqueta="text", texto="x", bbox=bbox)


@pytest.mark.parametrize("confianza", [-0.01, 1.01, True])
def test_confianza_fuera_de_rango_falla(confianza: object) -> None:
    with pytest.raises(ValueError):
        BloqueOcr(pagina=1, orden=0, etiqueta="text", texto="x", confianza=confianza)


def test_etiqueta_no_admitida_falla() -> None:
    with pytest.raises(ValueError):
        BloqueOcr(pagina=1, orden=0, etiqueta="titulo", texto="x")


def test_pagina_y_orden_invalidos_fallan() -> None:
    with pytest.raises(ValueError):
        BloqueOcr(pagina=0, orden=0, etiqueta="text", texto="x")
    with pytest.raises(ValueError):
        BloqueOcr(pagina=1, orden=-1, etiqueta="text", texto="x")


def test_documento_sin_paginas_falla() -> None:
    with pytest.raises(ValueError):
        DocumentoOcr(
            motor="glm-ocr",
            modelo="zai-org/GLM-OCR",
            huella_modelo=None,
            paginas=0,
            texto_markdown="",
        )


def test_los_resultados_son_inmutables() -> None:
    bloque = BloqueOcr(pagina=1, orden=0, etiqueta="text", texto="x")
    with pytest.raises(dataclasses.FrozenInstanceError):
        bloque.texto = "y"  # type: ignore[misc]
    with pytest.raises(dataclasses.FrozenInstanceError):
        _documento().paginas = 3  # type: ignore[misc]
