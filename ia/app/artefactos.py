"""Artefactos derivados de cada nódulo (contrato 1.1).

El contrato 1.1 viaja con la evidencia de cada nódulo: la máscara final, la
máscara de MGAC, su XML Pascal-VOC y una superposición legible. Todo se genera
en memoria con el mismo formato que usaba ``base.py``, para que un revisor
pueda abrir el XML o mirar la imagen sin volver a ejecutar la cadena y sin
depender de archivos intermedios.
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from xml.dom import minidom

import cv2
import numpy as np

from app.contrato import Caja

CARPETA_IMAGENES = "images"
"""Carpeta de imágenes del dataset de origen, igual que en los XML de referencia."""

PROFUNDIDAD_IMAGEN = 3
"""Canales del BGR que produce el servicio."""

BASE_DATOS = "OPTIMUS-THY"
NOMBRE_OBJETO = "nodule"
SIN_FALLBACK = "0"

CANAL_ROJO = 2
"""Índice del rojo en un arreglo BGR."""

OPACIDAD_MASCARA = 0.40
COLOR_CAJA = (0, 255, 0)
COLOR_TEXTO = (0, 255, 255)
GROSOR_CAJA = 2
ESCALA_TEXTO = 0.65
GROSOR_TEXTO = 2
ALTURA_MINIMA_TEXTO = 24
SEPARACION_TEXTO = 10


def xml_pascal_voc(
    *,
    nombre_imagen: str,
    ancho: int,
    alto: int,
    caja: Caja,
    confianza: float,
    detector: str = "YOLO11m",
) -> str:
    """XML Pascal-VOC de un nódulo, con el formato de ``create_pascal_voc_xml``.

    ``fallback_full_image`` queda en 0: el nódulo vino de una detección real y
    no de una caja que cubre la imagen entera.
    """
    anotacion = ET.Element("annotation")

    ET.SubElement(anotacion, "folder").text = CARPETA_IMAGENES
    ET.SubElement(anotacion, "filename").text = nombre_imagen

    fuente = ET.SubElement(anotacion, "source")
    ET.SubElement(fuente, "database").text = BASE_DATOS
    ET.SubElement(fuente, "original_image").text = nombre_imagen
    ET.SubElement(fuente, "detector").text = detector
    ET.SubElement(fuente, "confidence").text = f"{confianza:.8f}"
    ET.SubElement(fuente, "fallback_full_image").text = SIN_FALLBACK

    tamano = ET.SubElement(anotacion, "size")
    ET.SubElement(tamano, "width").text = str(ancho)
    ET.SubElement(tamano, "height").text = str(alto)
    ET.SubElement(tamano, "depth").text = str(PROFUNDIDAD_IMAGEN)

    ET.SubElement(anotacion, "segmented").text = "1"

    objeto = ET.SubElement(anotacion, "object")
    ET.SubElement(objeto, "name").text = NOMBRE_OBJETO
    ET.SubElement(objeto, "pose").text = "Unspecified"
    ET.SubElement(objeto, "truncated").text = "0"
    ET.SubElement(objeto, "difficult").text = "0"

    caja_xml = ET.SubElement(objeto, "bndbox")
    ET.SubElement(caja_xml, "xmin").text = str(caja.xmin)
    ET.SubElement(caja_xml, "ymin").text = str(caja.ymin)
    ET.SubElement(caja_xml, "xmax").text = str(caja.xmax)
    ET.SubElement(caja_xml, "ymax").text = str(caja.ymax)

    return _embellecer(anotacion)


def _embellecer(anotacion: ET.Element) -> str:
    """Indenta el XML con minidom, sin declarar ``encoding``."""
    crudo = ET.tostring(anotacion, encoding="utf-8")
    return minidom.parseString(crudo).toprettyxml(indent="  ")


def superponer(imagen_bgr: np.ndarray, mascara: np.ndarray, caja: Caja, texto: str) -> np.ndarray:
    """Copia con la máscara teñida de rojo, la caja y el texto de predicción.

    Devuelve un arreglo nuevo: la imagen recibida nunca se modifica.
    """
    alto, ancho = imagen_bgr.shape[:2]
    if mascara.shape[:2] != (alto, ancho):
        raise ValueError(
            f"La máscara debe tener el tamaño de la imagen: {mascara.shape[:2]} != {(alto, ancho)}"
        )

    superposicion = imagen_bgr.copy()
    if superposicion.ndim == 2:
        superposicion = cv2.cvtColor(superposicion, cv2.COLOR_GRAY2BGR)

    con_mascara = mascara > 0
    capa_roja = np.zeros_like(superposicion)
    capa_roja[:, :, CANAL_ROJO] = 255
    superposicion[con_mascara] = cv2.addWeighted(
        superposicion[con_mascara],
        1.0 - OPACIDAD_MASCARA,
        capa_roja[con_mascara],
        OPACIDAD_MASCARA,
        0,
    )

    cv2.rectangle(
        superposicion,
        (caja.xmin, caja.ymin),
        (caja.xmax, caja.ymax),
        COLOR_CAJA,
        GROSOR_CAJA,
    )
    cv2.putText(
        superposicion,
        texto,
        (caja.xmin, max(ALTURA_MINIMA_TEXTO, caja.ymin - SEPARACION_TEXTO)),
        cv2.FONT_HERSHEY_SIMPLEX,
        ESCALA_TEXTO,
        COLOR_TEXTO,
        GROSOR_TEXTO,
        cv2.LINE_AA,
    )
    return superposicion


def png_bytes(mascara: np.ndarray) -> bytes:
    """PNG de una máscara ``uint8``; sirve también para la superposición."""
    arreglo = np.ascontiguousarray(mascara)
    correcto, codificada = cv2.imencode(".png", arreglo)
    if not correcto:
        raise ValueError("No se pudo codificar la máscara como PNG.")
    return codificada.tobytes()
