"""Operaciones de cajas sobre imágenes: sin estado y sin acceso a disco."""

from __future__ import annotations

from app.contrato import Caja

ANCHO_MINIMO_CAJA = 5
ALTO_MINIMO_CAJA = 5


def recortar_caja(caja: Caja, ancho: int, alto: int) -> Caja:
    """Limita la caja a píxeles que existen en la imagen.

    Una caja que no toca la imagen queda con área cero, para que quien la
    reciba sepa que no hay región que analizar.
    """
    xmin = max(0, min(int(round(caja.xmin)), ancho))
    ymin = max(0, min(int(round(caja.ymin)), alto))
    xmax = max(0, min(int(round(caja.xmax)), ancho))
    ymax = max(0, min(int(round(caja.ymax)), alto))
    return Caja(xmin=xmin, ymin=ymin, xmax=xmax, ymax=ymax)


def area_caja(caja: Caja) -> int:
    return max(0, caja.xmax - caja.xmin) * max(0, caja.ymax - caja.ymin)


def es_caja_util(caja: Caja) -> bool:
    """Descarta detecciones más pequeñas que el mínimo del detector."""
    return caja.xmax - caja.xmin >= ANCHO_MINIMO_CAJA and caja.ymax - caja.ymin >= ALTO_MINIMO_CAJA


def expandir_caja(caja: Caja, ancho: int, alto: int, margen: float) -> Caja:
    """Añade un margen proporcional a la caja, sin salir de la imagen."""
    delta_x = int(round((caja.xmax - caja.xmin) * margen))
    delta_y = int(round((caja.ymax - caja.ymin) * margen))
    return Caja(
        xmin=max(0, caja.xmin - delta_x),
        ymin=max(0, caja.ymin - delta_y),
        xmax=min(ancho, caja.xmax + delta_x),
        ymax=min(alto, caja.ymax + delta_y),
    )
