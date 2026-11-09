"""Utilidades de hashing de contraseñas con Argon2."""

from __future__ import annotations

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHash, VerifyMismatchError

_ph = PasswordHasher()


# Hash válido calculado al importar: verificar contra él cuesta lo mismo que un
# hash real, así el tiempo de respuesta no revela si el correo existe.
_DUMMY_HASH = _ph.hash("contraseña-ficticia-no-usar")


def hash_password(correo: str, password: str) -> str:
    """Genera un hash Argon2 para la contraseña proporcionada."""
    _ = correo
    return _ph.hash(password)


def verify_password(password: str, hash: str) -> tuple[bool, str | None]:
    """Verifica la contraseña frente al hash.

    Retorna (ok, new_hash) donde new_hash es None si no requiere rehash,
    o un nuevo hash si los parámetros han quedado obsoletos.
    """
    try:
        _ph.verify(hash, password)
    except VerifyMismatchError:
        return False, None
    except InvalidHash:
        return False, None

    if _ph.check_needs_rehash(hash):
        return True, _ph.hash(password)
    return True, None


def verify_dummy(password: str) -> None:
    """Gasta el mismo tiempo que una verificación real (usuario inexistente)."""
    verify_password(password, _DUMMY_HASH)
