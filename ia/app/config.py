"""Configuración del servicio de IA tomada del entorno (RIA-02, HT-061).

No hay rutas fijas ni variables globales mutables: cada solicitud recibe su
``ConfiguracionIA`` y el proceso la construye una sola vez con
``ConfiguracionIA.desde_entorno()``.
"""

from __future__ import annotations

import os
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path

MAX_NODULOS_POR_IMAGEN = 3
"""El modelo de datos admite como máximo tres nódulos por imagen (RF-INF-13/14)."""


class ErrorConfiguracion(ValueError):
    """La configuración recibida no permite procesar imágenes."""


def _texto(environ: Mapping[str, str], nombre: str, defecto: str | None) -> str:
    valor = environ.get(nombre, "").strip()
    if valor:
        return valor
    if defecto is None:
        raise ErrorConfiguracion(f"Falta la variable de entorno {nombre}.")
    return defecto


def _flotante(environ: Mapping[str, str], nombre: str, defecto: float) -> float:
    crudo = environ.get(nombre, "").strip()
    if not crudo:
        return defecto
    try:
        valor = float(crudo)
    except ValueError as error:
        raise ErrorConfiguracion(f"{nombre} debe ser un número: {crudo!r}") from error
    if not 0.0 <= valor <= 1.0:
        raise ErrorConfiguracion(f"{nombre} debe estar entre 0 y 1: {valor}")
    return valor


def _flotante_positivo(environ: Mapping[str, str], nombre: str, defecto: float) -> float:
    crudo = environ.get(nombre, "").strip()
    if not crudo:
        return defecto
    try:
        valor = float(crudo)
    except ValueError as error:
        raise ErrorConfiguracion(f"{nombre} debe ser un número: {crudo!r}") from error
    if valor <= 0.0:
        raise ErrorConfiguracion(f"{nombre} debe ser mayor que cero: {valor}")
    return valor


def _entero(environ: Mapping[str, str], nombre: str, defecto: int, minimo: int) -> int:
    crudo = environ.get(nombre, "").strip()
    if not crudo:
        return defecto
    try:
        valor = int(crudo)
    except ValueError as error:
        raise ErrorConfiguracion(f"{nombre} debe ser un entero: {crudo!r}") from error
    if valor < minimo:
        raise ErrorConfiguracion(f"{nombre} debe ser al menos {minimo}: {valor}")
    return valor


@dataclass(frozen=True, slots=True)
class ConfiguracionIA:
    """Parámetros de una inferencia. Inmutable: nada se comparte entre solicitudes."""

    modelos_dir: Path
    yolo_pesos: str = "best_yolo.pt"
    bgaunet_pesos: str = "best_bgaunet.keras"
    swin_pesos: str = "best_swin.pth"
    dispositivo: str = "auto"
    yolo_tamano: int = 768
    yolo_confianza: float = 0.25
    yolo_iou: float = 0.60
    max_nodulos: int = MAX_NODULOS_POR_IMAGEN
    min_pixeles_mascara: int = 20
    margen_roi: float = 0.10
    mgac_iteraciones: int = 380
    mgac_margen: float = 1.15
    mgac_radio_cierre: int = 2

    @property
    def ruta_yolo(self) -> Path:
        return self.modelos_dir / self.yolo_pesos

    @property
    def ruta_bgaunet(self) -> Path:
        return self.modelos_dir / self.bgaunet_pesos

    @property
    def ruta_swin(self) -> Path:
        return self.modelos_dir / self.swin_pesos

    @classmethod
    def desde_entorno(cls, environ: Mapping[str, str] | None = None) -> ConfiguracionIA:
        """Construye la configuración a partir de las variables ``IA_*``."""
        entorno = os.environ if environ is None else environ

        modelos_dir = _texto(entorno, "IA_MODELOS_DIR", None)
        max_nodulos = _entero(entorno, "IA_MAX_NODULOS", MAX_NODULOS_POR_IMAGEN, minimo=1)
        if max_nodulos > MAX_NODULOS_POR_IMAGEN:
            raise ErrorConfiguracion(
                f"IA_MAX_NODULOS no puede pasar de {MAX_NODULOS_POR_IMAGEN}: {max_nodulos}"
            )

        return cls(
            modelos_dir=Path(modelos_dir),
            yolo_pesos=_texto(entorno, "IA_YOLO_PESOS", "best_yolo.pt"),
            bgaunet_pesos=_texto(entorno, "IA_BGAUNET_PESOS", "best_bgaunet.keras"),
            swin_pesos=_texto(entorno, "IA_SWIN_PESOS", "best_swin.pth"),
            dispositivo=_texto(entorno, "IA_DISPOSITIVO", "auto"),
            yolo_tamano=_entero(entorno, "IA_YOLO_TAMANO", 768, minimo=32),
            yolo_confianza=_flotante(entorno, "IA_YOLO_CONFIANZA", 0.25),
            yolo_iou=_flotante(entorno, "IA_YOLO_IOU", 0.60),
            max_nodulos=max_nodulos,
            min_pixeles_mascara=_entero(entorno, "IA_MIN_PIXELES_MASCARA", 20, minimo=0),
            margen_roi=_flotante(entorno, "IA_MARGEN_ROI", 0.10),
            mgac_iteraciones=_entero(entorno, "IA_MGAC_ITERACIONES", 380, minimo=1),
            mgac_margen=_flotante_positivo(entorno, "IA_MGAC_MARGEN", 1.15),
            mgac_radio_cierre=_entero(entorno, "IA_MGAC_RADIO_CIERRE", 2, minimo=0),
        )

    def verificar_pesos(self) -> None:
        """Comprueba que los tres archivos de pesos existen antes de cargarlos."""
        faltantes = [
            f"{nombre}: {ruta}"
            for nombre, ruta in (
                ("YOLO", self.ruta_yolo),
                ("BGAU-Net", self.ruta_bgaunet),
                ("Swin Transformer", self.ruta_swin),
            )
            if not ruta.is_file()
        ]
        if faltantes:
            raise FileNotFoundError(
                "No se encontraron los pesos del modelo:\n" + "\n".join(faltantes)
            )
