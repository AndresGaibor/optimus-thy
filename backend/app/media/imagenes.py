"""Saneado y codificación de imágenes para las cargas del caso (HU-050, HU-060).

La copia que se guarda siempre se reconstruye píxel a píxel: ni EXIF, ni perfil
ICC, ni texto PNG, ni bloques de fabricante sobreviven al trasvase.
"""

from __future__ import annotations

import io

from PIL import Image

__all__ = ["codificar", "sin_metadatos"]


def sin_metadatos(original: Image.Image) -> Image.Image:
    """Copia limpia: una imagen nueva sobre la que se pega solo el píxel.

    Ni ``info``, ni EXIF, ni perfil ICC, ni texto PNG sobreviven al trasvase.
    """
    limpia = Image.new("RGB", original.size)
    limpia.paste(original.convert("RGB"))
    return limpia


def codificar(imagen: Image.Image, formato: str) -> bytes:
    """Codifica la imagen limpia en el formato original admitido."""
    salida = io.BytesIO()
    if formato == "JPEG":
        imagen.save(salida, format="JPEG", quality=95)
    else:
        imagen.save(salida, format="PNG")
    return salida.getvalue()
