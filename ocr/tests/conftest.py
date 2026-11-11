"""Utilidades compartidas por las pruebas del servicio de OCR."""

from __future__ import annotations

from typing import Any

import pytest

from app.contrato import BloqueOcr, DocumentoOcr
from app.motores import VARIABLES_SIN_RED

VARIABLES_OCR = (
    "OCR_MOTOR",
    "OCR_MODELO_DIR",
    "OCR_MODELO_LAYOUT_DIR",
    "OCR_MAX_BYTES",
    "OCR_PERMITIR_API_EXTERNA",
    "OCR_GLM_API_KEY",
    "OCR_GLM_API_URL",
    "OCR_GLM_API_HOST",
    "OCR_GLM_API_PORT",
)


@pytest.fixture(autouse=True)
def entorno_limpio(monkeypatch: pytest.MonkeyPatch) -> None:
    """Ninguna prueba hereda la configuración del entorno de la máquina."""
    for nombre in (*VARIABLES_OCR, *VARIABLES_SIN_RED):
        monkeypatch.delenv(nombre, raising=False)


def documento_de_prueba() -> DocumentoOcr:
    return DocumentoOcr(
        motor="falso",
        modelo="modelo-de-prueba",
        huella_modelo=None,
        paginas=1,
        texto_markdown="# Ficha\n\nTSH 2,5 mU/L",
        bloques=(
            BloqueOcr(
                pagina=1,
                orden=0,
                etiqueta="text",
                texto="TSH 2,5 mU/L",
                bbox=(0.1, 0.2, 0.5, 0.25),
                confianza=None,
            ),
        ),
        avisos=("aviso de prueba",),
    )


class MotorFalso:
    """Motor de prueba: registra lo que recibe y devuelve un documento fijo."""

    nombre = "falso"
    modelo = "modelo-de-prueba"

    def __init__(
        self,
        documento: DocumentoOcr | None = None,
        motivo: str | None = None,
        error: Exception | None = None,
    ) -> None:
        self.documento = documento or documento_de_prueba()
        self.motivo = motivo
        self.error = error
        self.llamadas: list[tuple[bytes, str]] = []
        self.texto_incrustado: list[bool] = []

    def disponible(self) -> str | None:
        return self.motivo

    def reconocer(
        self, contenido: bytes, tipo: str, *, texto_incrustado: bool = False
    ) -> DocumentoOcr:
        self.llamadas.append((contenido, tipo))
        self.texto_incrustado.append(texto_incrustado)
        if self.error is not None:
            raise self.error
        return self.documento


def motor_fijo(motor: MotorFalso) -> Any:
    """Fábrica de motor para ``crear_app``."""

    def fabrica(configuracion: Any) -> MotorFalso:
        return motor

    return fabrica
