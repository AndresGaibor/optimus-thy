"""Pseudomáscara MGAC dentro de la caja detectada (paso 2 de la cadena).

Puerto de ``generate_mgac_mask`` de ``base.py``: recibe la imagen y la caja, y
devuelve la máscara del tamaño de la imagen. No escribe archivos ni usa rutas.
"""

from __future__ import annotations

import numpy as np

from app.config import ConfiguracionIA
from app.contrato import Caja
from app.geometria import recortar_caja


def generar_mascara_mgac(
    imagen: np.ndarray,
    caja: Caja,
    config: ConfiguracionIA,
) -> np.ndarray:
    """Contorno activo geodésico morfológico sobre la región de la caja.

    Devuelve una máscara ``uint8`` (0 o 255) del tamaño de la imagen. Si la
    región es vacía lanza ``ValueError``: el fallo se informa, no se sustituye
    por una máscara inventada.
    """
    import cv2
    from skimage.morphology import closing, disk
    from skimage.segmentation import morphological_geodesic_active_contour

    alto, ancho = imagen.shape[:2]
    recortada = recortar_caja(caja, ancho, alto)
    gris = cv2.cvtColor(imagen, cv2.COLOR_BGR2GRAY) if imagen.ndim == 3 else imagen
    roi = gris[recortada.ymin : recortada.ymax, recortada.xmin : recortada.xmax]

    if roi.size == 0:
        raise ValueError(f"La región de MGAC está vacía para la caja: {caja}")

    roi_float = roi.astype(np.float32) / 255.0
    roi_u8 = np.clip(roi_float * 255.0, 0, 255).astype(np.uint8)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    roi_equalized = clahe.apply(roi_u8)
    roi_median = cv2.medianBlur(roi_equalized, 5)
    roi_blurred = cv2.GaussianBlur(roi_median, (0, 0), 1.2)

    gradiente_x = cv2.Sobel(roi_blurred, cv2.CV_32F, 1, 0, ksize=3)
    gradiente_y = cv2.Sobel(roi_blurred, cv2.CV_32F, 0, 1, ksize=3)
    gradiente = cv2.magnitude(gradiente_x, gradiente_y)
    gradiente = gradiente / (gradiente.max() + 1e-6)
    gradiente_inverso = 1.0 / (1.0 + 12.0 * gradiente)

    roi_alto, roi_ancho = roi.shape
    nivel_inicial = np.zeros((roi_alto, roi_ancho), dtype=np.uint8)

    centro_x = roi_ancho // 2
    centro_y = roi_alto // 2
    eje_x = min(max(1, int(0.32 * roi_ancho * config.mgac_margen)), max(1, roi_ancho // 2 - 1))
    eje_y = min(max(1, int(0.32 * roi_alto * config.mgac_margen)), max(1, roi_alto // 2 - 1))

    cv2.ellipse(nivel_inicial, (centro_x, centro_y), (eje_x, eje_y), 0, 0, 360, 1, -1)

    contorno = morphological_geodesic_active_contour(
        gradiente_inverso,
        num_iter=config.mgac_iteraciones,
        init_level_set=nivel_inicial,
        smoothing=1,
        balloon=0,
    )
    contorno = contorno > 0

    if config.mgac_radio_cierre > 0:
        contorno = closing(contorno, disk(config.mgac_radio_cierre))

    mascara = np.zeros((alto, ancho), dtype=np.uint8)
    mascara[recortada.ymin : recortada.ymax, recortada.xmin : recortada.xmax] = (
        contorno.astype(np.uint8) * 255
    )
    return mascara
