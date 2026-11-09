"""Cifrado de datos personales en reposo con AES-256-GCM (HT-011).

La clave se lee de ``PII_ENCRYPTION_KEY`` (variable de entorno, nunca del
repositorio) y se deriva a 32 bytes con SHA-256, como indica el ADR-003.

El criptograma se guarda como ``bytes`` (``BYTEA``): el nonce de 12 bytes va
delante del texto cifrado con su etiqueta de autenticación, así que cada valor
se abre exactamente como se escribió y cualquier alteración lo invalida.
"""

from __future__ import annotations

import hashlib
import os
from functools import lru_cache

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import get_settings

__all__ = ["PiiCipher", "PiiDecryptionError", "get_cipher"]

NONCE_BYTES = 12
"""Tamaño del nonce de GCM; uno nuevo por cada operación."""

_KEY_BYTES = 32
"""AES-256: la clave derivada siempre mide 32 bytes."""


class PiiDecryptionError(Exception):
    """El criptograma no se puede abrir con la clave configurada.

    El mensaje nunca incluye el contenido ni la clave.
    """


class PiiCipher:
    """Cifra y descifra datos personales con AES-256-GCM."""

    def __init__(self, raw_key: str) -> None:
        if not raw_key.strip():
            raise ValueError("La clave de cifrado no puede estar vacía")
        self._key = hashlib.sha256(raw_key.encode("utf-8")).digest()
        if len(self._key) != _KEY_BYTES:  # pragma: no cover - invariante de SHA-256
            raise ValueError("La clave derivada no mide 32 bytes")
        self._aesgcm = AESGCM(self._key)

    def key_id(self) -> str:
        """Identificador corto de la clave, seguro para logs y auditoría.

        Es el valor que se guarda en ``identidades_paciente.clave_version``:
        permite saber con qué clave se escribió cada fila sin exponerla, y
        sostener la rotación sin adivinar.
        """
        return hashlib.sha256(self._key).hexdigest()[:16]

    def encrypt(self, plaintext: str) -> bytes:
        """Devuelve ``nonce || cifrado`` listo para guardar en ``BYTEA``."""
        nonce = os.urandom(NONCE_BYTES)
        return nonce + self._aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)

    def decrypt(self, payload: bytes) -> str:
        """Abre un criptograma producido por este cifrador."""
        if not isinstance(payload, (bytes, bytearray, memoryview)):
            raise PiiDecryptionError("El dato cifrado no es binario")
        crudo = bytes(payload)
        nonce, token = crudo[:NONCE_BYTES], crudo[NONCE_BYTES:]
        if len(nonce) != NONCE_BYTES or not token:
            raise PiiDecryptionError("Dato cifrado incompleto")
        try:
            return self._aesgcm.decrypt(nonce, token, None).decode("utf-8")
        except (InvalidTag, UnicodeDecodeError) as exc:
            raise PiiDecryptionError("No se pudo descifrar el dato") from exc


@lru_cache(maxsize=1)
def get_cipher() -> PiiCipher:
    """Cifrador por defecto, construido con la clave de la configuración."""
    return PiiCipher(get_settings().pii_encryption_key)
