"""Correo saliente: configuración SMTP, plantillas y envío."""

from __future__ import annotations

from app.correo.servicio import (
    CorreoNoConfigurado,
    EnvioError,
    enviar,
    enviar_recuperacion,
    plantilla,
    render,
    variables_no_permitidas,
)

__all__ = [
    "CorreoNoConfigurado",
    "EnvioError",
    "enviar",
    "enviar_recuperacion",
    "plantilla",
    "render",
    "variables_no_permitidas",
]
