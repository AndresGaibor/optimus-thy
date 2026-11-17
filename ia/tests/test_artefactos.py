"""Pruebas de los artefactos por nódulo: XML Pascal-VOC, superposición y PNG.

El formato viene de ``base.py`` del modelo; aquí se compara con el XML de
referencia ``datos/0000.xml`` parseando ambos documentos, no como texto literal.
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Any

import cv2
import numpy as np
import pytest

from app.artefactos import png_bytes, superponer, xml_pascal_voc
from app.contrato import Caja

DATOS = Path(__file__).parent / "datos"

CAJA_REFERENCIA = Caja(78, 96, 218, 239)
CONFIANZA_REFERENCIA = 0.5328221917152405


def _estructura(elemento: ET.Element) -> tuple[str, str, tuple[Any, ...]]:
    """Tag, texto y descendientes, para comparar dos documentos completos."""
    return (
        elemento.tag,
        (elemento.text or "").strip(),
        tuple(_estructura(hijo) for hijo in elemento),
    )


def _xml_referencia() -> str:
    return xml_pascal_voc(
        nombre_imagen="0000.jpg",
        ancho=314,
        alto=402,
        caja=CAJA_REFERENCIA,
        confianza=CONFIANZA_REFERENCIA,
    )


def test_el_xml_es_identico_al_de_referencia() -> None:
    esperado = ET.parse(DATOS / "0000.xml").getroot()
    obtenido = ET.fromstring(_xml_referencia())

    assert _estructura(obtenido) == _estructura(esperado)


def test_el_xml_lleva_los_valores_del_nodulo() -> None:
    raiz = ET.fromstring(_xml_referencia())

    assert raiz.findtext("folder") == "images"
    assert raiz.findtext("filename") == "0000.jpg"
    assert raiz.findtext("source/database") == "OPTIMUS-THY"
    assert raiz.findtext("source/original_image") == "0000.jpg"
    assert raiz.findtext("source/detector") == "YOLO11m"
    assert raiz.findtext("source/confidence") == "0.53282219"
    assert raiz.findtext("source/fallback_full_image") == "0"
    assert raiz.findtext("size/width") == "314"
    assert raiz.findtext("size/height") == "402"
    assert raiz.findtext("size/depth") == "3"
    assert raiz.findtext("segmented") == "1"
    assert raiz.findtext("object/name") == "nodule"
    assert raiz.findtext("object/pose") == "Unspecified"
    assert raiz.findtext("object/truncated") == "0"
    assert raiz.findtext("object/difficult") == "0"
    assert raiz.findtext("object/bndbox/xmin") == "78"
    assert raiz.findtext("object/bndbox/ymin") == "96"
    assert raiz.findtext("object/bndbox/xmax") == "218"
    assert raiz.findtext("object/bndbox/ymax") == "239"


def test_el_xml_indenta_sin_declarar_encoding_y_acepta_otro_detector() -> None:
    texto = xml_pascal_voc(
        nombre_imagen="eco.png",
        ancho=160,
        alto=120,
        caja=Caja(1, 2, 3, 4),
        confianza=0.5,
        detector="YOLO11x",
    )

    cabecera, cuerpo = texto.split("\n", 1)
    assert cabecera == '<?xml version="1.0" ?>'
    assert cuerpo.startswith("<annotation>\n  <folder>images</folder>\n")
    assert ET.fromstring(texto).findtext("source/detector") == "YOLO11x"


def test_superponer_tine_la_mascara_dibuja_la_caja_y_no_muta_la_imagen() -> None:
    imagen = np.full((80, 80, 3), 10, dtype=np.uint8)
    original = imagen.copy()
    mascara = np.zeros((80, 80), dtype=np.uint8)
    mascara[30:50, 30:50] = 255

    superposicion = superponer(imagen, mascara, Caja(20, 20, 60, 60), "Benigno | B: 0.800")

    assert np.array_equal(imagen, original)
    assert superposicion.shape == imagen.shape
    assert superposicion.dtype == np.uint8
    assert not np.array_equal(superposicion[30:50, 30:50], original[30:50, 30:50])
    # Fuera de la máscara, de la caja y del texto, los píxeles siguen intactos.
    assert np.array_equal(superposicion[:8, :], original[:8, :])
    # El borde inferior de la caja se dibuja en verde BGR.
    assert tuple(superposicion[60, 40]) == (0, 255, 0)


def test_superponer_rechaza_una_mascara_de_otro_tamano() -> None:
    imagen = np.zeros((20, 20, 3), dtype=np.uint8)
    mascara = np.zeros((10, 20), dtype=np.uint8)

    with pytest.raises(ValueError, match="tamaño de la imagen"):
        superponer(imagen, mascara, Caja(2, 2, 10, 10), "Benigno")


def test_png_bytes_devuelve_un_png_uint8_relegible() -> None:
    mascara = np.zeros((20, 30), dtype=np.uint8)
    mascara[5:15, 5:25] = 255

    datos = png_bytes(mascara)

    assert datos.startswith(b"\x89PNG\r\n\x1a\n")
    leida = cv2.imdecode(np.frombuffer(datos, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
    assert leida.shape == mascara.shape
    assert np.array_equal(leida, mascara)
