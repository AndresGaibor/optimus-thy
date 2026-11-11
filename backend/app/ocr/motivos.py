"""Estados y motivos del OCR de un documento (HU-051).

El estado vive en ``documentos.estado_ocr`` y el motivo en
``documentos.ocr_motivo``. El motivo es un texto corto para quien revisa la
ficha: nunca incluye el mensaje interno del motor, rutas, SQL ni trazas.
"""

from __future__ import annotations

from typing import Final

NO_SOLICITADO: Final[str] = "no_solicitado"
EN_COLA: Final[str] = "en_cola"
PROCESANDO: Final[str] = "procesando"
LISTO: Final[str] = "listo"
ERROR: Final[str] = "error"

#: Estados admitidos por el ``CHECK`` de la tabla, en orden de avance.
ESTADOS: Final[tuple[str, ...]] = (NO_SOLICITADO, EN_COLA, PROCESANDO, LISTO, ERROR)

#: Códigos internos de un OCR que no pudo completarse.
DOCUMENTO_DANADO: Final[str] = "documento_danado"
SERVICIO_NO_DISPONIBLE: Final[str] = "servicio_ocr_no_disponible"
TIEMPO_EXCEDIDO: Final[str] = "tiempo_excedido"
FORMATO_NO_ADMITIDO: Final[str] = "formato_no_admitido"
SIN_ENCOLAR: Final[str] = "no_se_pudo_encolar"

#: Tabla de motivos conocidos: el único texto que llega al cliente.
MOTIVOS: Final[dict[str, str]] = {
    DOCUMENTO_DANADO: "El documento está dañado y el OCR no pudo leerlo.",
    SERVICIO_NO_DISPONIBLE: "El servicio de OCR no está disponible; intenta de nuevo más tarde.",
    TIEMPO_EXCEDIDO: "El OCR superó el tiempo máximo de espera.",
    FORMATO_NO_ADMITIDO: "El formato del documento no se puede reconocer.",
    SIN_ENCOLAR: "no se pudo encolar el OCR",
}


def motivo_de(codigo: str) -> str:
    """Texto corto del motivo; un código desconocido no filtra nada interno."""
    return MOTIVOS.get(codigo, MOTIVOS[SERVICIO_NO_DISPONIBLE])
