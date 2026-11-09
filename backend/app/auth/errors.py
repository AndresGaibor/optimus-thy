"""Errores de autenticación y autorización.

Se lanzan en vez de devolverse como valor: una ruta nueva no puede olvidar
comprobarlos (antes cada ruta repetía ``isinstance(actual, JSONResponse)``).
"""

from __future__ import annotations


class NoAutenticado(Exception):
    """No hay sesión válida (401)."""


class Prohibido(Exception):
    """Hay sesión, pero el rol activo no tiene el permiso (403)."""
