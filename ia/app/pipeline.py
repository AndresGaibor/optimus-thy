"""Cadena de inferencia como función (HT-061).

``analizar_imagen`` recibe una imagen BGR ``uint8`` y devuelve el contrato de
salida: detecciones de YOLO (hasta tres), máscara de BGAU-Net con MGAC como
respaldo y clasificación de Swin Transformer. Sin rutas fijas, sin variables
globales y sin archivos intermedios: la caja viaja en memoria en lugar del XML
que usaba ``base.py``.

Con ``con_artefactos=True`` cada nódulo viaja además con su evidencia (las dos
máscaras en PNG, su XML Pascal-VOC y la superposición), generada en memoria.
"""

from __future__ import annotations

from collections.abc import Sequence

import numpy as np

from app.artefactos import png_bytes, superponer, xml_pascal_voc
from app.config import ConfiguracionIA
from app.contrato import (
    CLASE_BENIGNO,
    CLASE_MALIGNO,
    ORIGEN_BGAUNET,
    ORIGEN_MGAC,
    ArtefactosNodulo,
    Caja,
    Nodulo,
    ResultadoInferencia,
)
from app.geometria import es_caja_util, expandir_caja, recortar_caja
from app.mgac import generar_mascara_mgac
from app.modelos import Deteccion, ModelosIA

RADIO_CIERRE_MASCARA = 5
"""Núcleo del cierre morfológico aplicado a la máscara de BGAU-Net."""


def validar_imagen(imagen: np.ndarray) -> tuple[int, int]:
    """Comprueba la imagen de entrada y devuelve ``(alto, ancho)``."""
    if not isinstance(imagen, np.ndarray):
        raise TypeError("La imagen debe ser un arreglo numpy en formato BGR.")
    if imagen.ndim not in (2, 3):
        raise ValueError("La imagen debe tener dos o tres dimensiones (alto, ancho[, color]).")
    if imagen.dtype != np.uint8:
        raise ValueError(f"La imagen debe ser uint8; se recibió {imagen.dtype}.")
    alto, ancho = imagen.shape[:2]
    if alto == 0 or ancho == 0:
        raise ValueError("La imagen no tiene píxeles.")
    return alto, ancho


def seleccionar_detecciones(
    detecciones: Sequence[Deteccion],
    ancho: int,
    alto: int,
    max_nodulos: int,
) -> tuple[Deteccion, ...]:
    """Recorta, descarta cajas diminutas y deja como mucho ``max_nodulos``.

    Se conservan las de mayor confianza y se devuelven ordenadas por posición
    para que el índice del nódulo sea estable entre ejecuciones.
    """
    utiles: list[Deteccion] = []
    for deteccion in detecciones:
        caja = recortar_caja(deteccion.caja, ancho, alto)
        if not es_caja_util(caja):
            continue
        utiles.append(Deteccion(caja=caja, confianza=float(deteccion.confianza)))

    utiles.sort(key=lambda item: item.confianza, reverse=True)
    principales = utiles[:max_nodulos]
    principales.sort(key=lambda item: (item.caja.xmin, item.caja.ymin))
    return tuple(principales)


def conservar_componente_mayor(mascara: np.ndarray) -> np.ndarray:
    """Deja solo el componente conectado de mayor área de una máscara binaria."""
    import cv2

    binaria = (mascara > 0).astype(np.uint8)
    numero, etiquetas, estadisticas, _ = cv2.connectedComponentsWithStats(binaria, connectivity=8)
    if numero <= 1:
        return mascara

    areas = estadisticas[1:, cv2.CC_STAT_AREA]
    mayor = 1 + int(np.argmax(areas))
    return (etiquetas == mayor).astype(np.uint8) * 255


def postprocesar_mascara(mascara: np.ndarray, caja: Caja) -> np.ndarray:
    """Cierre morfológico, componente mayor y recorte a la caja de BGAU-Net."""
    import cv2

    procesada = (mascara > 127).astype(np.uint8) * 255

    nucleo = RADIO_CIERRE_MASCARA if RADIO_CIERRE_MASCARA % 2 == 1 else RADIO_CIERRE_MASCARA + 1
    elemento = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (nucleo, nucleo))
    procesada = cv2.morphologyEx(procesada, cv2.MORPH_CLOSE, elemento)
    procesada = conservar_componente_mayor(procesada)

    alto, ancho = procesada.shape[:2]
    dentro = recortar_caja(caja, ancho, alto)
    limite = np.zeros((alto, ancho), dtype=np.uint8)
    limite[dentro.ymin : dentro.ymax, dentro.xmin : dentro.xmax] = 255
    return cv2.bitwise_and(procesada, limite)


def analizar_imagen(
    imagen: np.ndarray,
    *,
    modelos: ModelosIA,
    config: ConfiguracionIA,
    con_artefactos: bool = False,
    nombre_imagen: str = "imagen",
) -> ResultadoInferencia:
    """Ejecuta YOLO → MGAC → BGAU-Net → Swin sobre una imagen.

    No modifica la imagen recibida ni escribe en disco. Cada llamada usa solo
    las dependencias que recibe, así que dos solicitudes no comparten estado.
    ``nombre_imagen`` es la clave opaca con la que se firman el XML y la
    superposición de cada nódulo.
    """
    alto, ancho = validar_imagen(imagen)

    candidatas = modelos.detector.detectar(imagen, config)
    detecciones = seleccionar_detecciones(candidatas, ancho, alto, config.max_nodulos)
    if not detecciones:
        return ResultadoInferencia(ancho=ancho, alto=alto)

    nodulos: list[Nodulo] = []
    for indice, deteccion in enumerate(detecciones, start=1):
        caja = deteccion.caja
        mascara_mgac = generar_mascara_mgac(imagen, caja, config)
        mascara = np.asarray(modelos.segmentador.segmentar(imagen, caja, config))
        if mascara.shape != imagen.shape[:2]:
            raise ValueError(
                "La máscara del segmentador debe tener el tamaño de la imagen: "
                f"{mascara.shape} != {imagen.shape[:2]}"
            )
        mascara = postprocesar_mascara(mascara, caja)

        origen = ORIGEN_BGAUNET
        pixeles = int(np.count_nonzero(mascara))
        if pixeles < config.min_pixeles_mascara:
            mascara = mascara_mgac
            origen = ORIGEN_MGAC
            pixeles = int(np.count_nonzero(mascara))

        region = expandir_caja(caja, ancho, alto, config.margen_roi)
        recorte_imagen = imagen[region.ymin : region.ymax, region.xmin : region.xmax]
        recorte_mascara = mascara[region.ymin : region.ymax, region.xmin : region.xmax]
        probabilidades = modelos.clasificador.clasificar(recorte_imagen, recorte_mascara, config)

        benigno = float(probabilidades.benigno)
        maligno = float(probabilidades.maligno)
        clase = CLASE_BENIGNO if benigno >= maligno else CLASE_MALIGNO

        artefactos = None
        if con_artefactos:
            etiqueta = "Benigno" if clase == CLASE_BENIGNO else "Maligno"
            artefactos = ArtefactosNodulo(
                mascara_png=png_bytes(mascara),
                mgac_png=png_bytes(mascara_mgac),
                xml=xml_pascal_voc(
                    nombre_imagen=nombre_imagen,
                    ancho=ancho,
                    alto=alto,
                    caja=caja,
                    confianza=deteccion.confianza,
                ),
                superposicion_png=png_bytes(
                    superponer(
                        imagen,
                        mascara,
                        caja,
                        f"{etiqueta} | B: {benigno:.3f} | M: {maligno:.3f}",
                    )
                ),
            )

        nodulos.append(
            Nodulo(
                indice=indice,
                caja=caja,
                confianza_detector=deteccion.confianza,
                origen_mascara=origen,
                clase=clase,
                probabilidad_benigno=benigno,
                probabilidad_maligno=maligno,
                region_analizada=region,
                pixeles_mascara=pixeles,
                artefactos=artefactos,
            )
        )

    return ResultadoInferencia(ancho=ancho, alto=alto, nodulos=tuple(nodulos))
