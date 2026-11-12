"""Contrato versionado del servicio de OCR (versión 1.1).

Describe lo que devuelve ``POST /reconocer``. Los dos motores (GLM-OCR y
Tesseract) producen este mismo documento, así que quien consume el servicio no
cambia de formato al cambiar de motor.

Reglas que impone el contrato y que este módulo hace cumplir al construir los
objetos:

- ``bbox`` va normalizada en 0..1 (o ``None`` si el motor no la reporta).
- ``confianza`` va en 0..1 por bloque/campo, o ``None`` si el motor no la
  reporta.
- ``etiqueta`` es una de ``ETIQUETAS``.
- ``campos`` son valores extraídos por reglas; solo aparecen los encontrados.
- Los objetos son inmutables: un resultado no se edita, se reemplaza.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

VERSION_CONTRATO = "1.1"

# Etiquetas de bloque admitidas; son las que reporta GLM-OCR en
# `layout_details[].label`. Tesseract solo produce `text`.
ETIQUETAS = ("text", "table", "formula", "image")


def _validar_numero(valor: object, nombre: str) -> float:
    """Devuelve el valor como número real dentro de 0..1 o falla."""
    if isinstance(valor, bool) or not isinstance(valor, int | float):
        raise ValueError(f"{nombre} necesita números")
    if not 0.0 <= valor <= 1.0:
        raise ValueError(f"{nombre} fuera de 0..1")
    return float(valor)


@dataclass(frozen=True, slots=True)
class BloqueOcr:
    """Un bloque de contenido reconocido dentro de una página.

    ``pagina`` empieza en 1 y ``orden`` en 0, en el orden de lectura que el
    motor propone. ``bbox`` es ``(x1, y1, x2, y2)`` en coordenadas relativas al
    tamaño de la página, de 0 a 1.
    """

    pagina: int
    orden: int
    etiqueta: str
    texto: str
    bbox: tuple[float, float, float, float] | None = None
    confianza: float | None = None

    def __post_init__(self) -> None:
        if self.pagina < 1:
            raise ValueError("la página empieza en 1")
        if self.orden < 0:
            raise ValueError("el orden no puede ser negativo")
        if self.etiqueta not in ETIQUETAS:
            raise ValueError(f"etiqueta no admitida: {self.etiqueta!r}")
        if self.bbox is not None:
            if len(self.bbox) != 4:
                raise ValueError("bbox necesita cuatro valores")
            x1, y1, x2, y2 = (_validar_numero(valor, "bbox") for valor in self.bbox)
            if x1 > x2 or y1 > y2:
                raise ValueError("bbox invertida")
        if self.confianza is not None:
            _validar_numero(self.confianza, "confianza")

    def a_diccionario(self) -> dict[str, Any]:
        """Forma JSON del bloque, en el orden de campos del contrato."""
        return {
            "pagina": self.pagina,
            "orden": self.orden,
            "etiqueta": self.etiqueta,
            "texto": self.texto,
            "bbox": list(self.bbox) if self.bbox is not None else None,
            "confianza": self.confianza,
        }


@dataclass(frozen=True, slots=True)
class CampoExtraido:
    """Valor clínico extraído del texto reconocido.

    ``confianza`` es la del bloque de donde salió (o ``None`` si el motor no la
    reporta). ``revisar`` marca los campos que conviene confirmar: confianza por
    debajo del mínimo, valor fuera del rango clínico sensato o lectura dudosa
    (valor suelto sin etiqueta, fecha imposible, código CIE-10 fuera de los
    rangos tiroideos conocidos).
    """

    nombre: str
    valor: str
    texto_origen: str
    confianza: float | None
    revisar: bool

    def __post_init__(self) -> None:
        if self.confianza is not None:
            _validar_numero(self.confianza, "confianza")

    def a_diccionario(self) -> dict[str, Any]:
        """Forma JSON del campo, en el orden de claves del contrato."""
        return {
            "nombre": self.nombre,
            "valor": self.valor,
            "texto_origen": self.texto_origen,
            "confianza": self.confianza,
            "revisar": self.revisar,
        }


@dataclass(frozen=True, slots=True)
class DocumentoOcr:
    """Resultado completo del reconocimiento de un documento.

    ``huella_modelo`` identifica los pesos usados (``None`` si el motor no los
    expone). ``campos`` son los valores extraídos por reglas. ``avisos`` son
    mensajes para quien consume el resultado, no errores: por ejemplo que el
    motor no reporta confianza o que se usó un servicio externo.
    """

    motor: str
    modelo: str
    huella_modelo: str | None
    paginas: int
    texto_markdown: str
    bloques: tuple[BloqueOcr, ...] = ()
    campos: tuple[CampoExtraido, ...] = ()
    avisos: tuple[str, ...] = ()
    version_contrato: str = VERSION_CONTRATO

    def __post_init__(self) -> None:
        if self.paginas < 1:
            raise ValueError("el documento necesita al menos una página")

    def a_diccionario(self) -> dict[str, Any]:
        """Forma JSON del documento, en el orden de campos del contrato."""
        return {
            "version_contrato": self.version_contrato,
            "motor": self.motor,
            "modelo": self.modelo,
            "huella_modelo": self.huella_modelo,
            "paginas": self.paginas,
            "texto_markdown": self.texto_markdown,
            "bloques": [bloque.a_diccionario() for bloque in self.bloques],
            "campos": [campo.a_diccionario() for campo in self.campos],
            "avisos": list(self.avisos),
        }
