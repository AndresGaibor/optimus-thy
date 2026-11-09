"""Tipos de SQLAlchemy que cifran al escribir y descifran al leer (HT-011)."""

from __future__ import annotations

from typing import Any

from sqlalchemy import LargeBinary
from sqlalchemy.engine import Dialect
from sqlalchemy.types import TypeDecorator

from app.security.encryption import get_cipher

__all__ = ["EncryptedBytes"]


class EncryptedBytes(TypeDecorator[str]):
    """Columna ``BYTEA`` cuyo valor viaja cifrado en la base.

    El código de la aplicación trabaja con el texto claro (``str``); el cifrado
    y el descifrado ocurren en la frontera con la base de datos, así que ningún
    repositorio puede olvidarse de cifrar ni de descifrar.
    """

    impl = LargeBinary
    cache_ok = True

    def process_bind_param(self, value: Any, dialect: Dialect) -> bytes | None:
        if value is None:
            return None
        if not isinstance(value, str):
            raise TypeError("La columna cifrada solo acepta texto; úsala como str")
        return get_cipher().encrypt(value)

    def process_result_value(self, value: Any, dialect: Dialect) -> str | None:
        if value is None:
            return None
        return get_cipher().decrypt(bytes(value))
