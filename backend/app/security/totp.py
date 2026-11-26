"""Funciones TOTP RFC 6238 para secretos Base32."""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from datetime import UTC, datetime

__all__ = ["codigo_para", "generar_secreto", "verificar_codigo"]

_PERIOD_SECONDS = 30
_DIGITS = 6
_SECRET_BYTES = 20


def generar_secreto() -> str:
    """Crea un secreto aleatorio Base32 para una aplicación TOTP."""
    return base64.b32encode(secrets.token_bytes(_SECRET_BYTES)).decode("ascii").rstrip("=")


def _contador(momento: datetime) -> int:
    if momento.tzinfo is None:
        momento = momento.replace(tzinfo=UTC)
    return int(momento.timestamp()) // _PERIOD_SECONDS


def _codigo_para_contador(secreto: str, contador: int) -> str:
    relleno = "=" * ((8 - len(secreto) % 8) % 8)
    clave = base64.b32decode(secreto + relleno, casefold=True)
    mensaje = contador.to_bytes(8, byteorder="big")
    digest = hmac.new(clave, mensaje, hashlib.sha1).digest()
    desplazamiento = digest[-1] & 0x0F
    truncado = int.from_bytes(digest[desplazamiento : desplazamiento + 4], "big") & 0x7FFF_FFFF
    return f"{truncado % (10**_DIGITS):0{_DIGITS}d}"


def codigo_para(secreto: str, momento: datetime) -> str:
    """Calcula el código de seis dígitos correspondiente al instante indicado."""
    return _codigo_para_contador(secreto, _contador(momento))


def verificar_codigo(secreto: str, codigo: str, momento: datetime, ventana: int = 1) -> bool:
    """Compara el código en tiempo constante en la ventana de pasos permitida."""
    if len(codigo) != _DIGITS or not codigo.isascii() or not codigo.isdigit():
        return False

    centro = _contador(momento)
    valido = False
    for desplazamiento in range(-ventana, ventana + 1):
        esperado = _codigo_para_contador(secreto, centro + desplazamiento)
        valido = secrets.compare_digest(esperado, codigo) or valido
    return valido
