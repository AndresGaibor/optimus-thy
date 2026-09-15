import base64

import pytest

from optimus_thy.shared.security.pii_cipher import PiiCipher


def _key_b64() -> str:
    return base64.urlsafe_b64encode(bytes(range(32))).decode()


def test_encrypt_decrypt_roundtrip() -> None:
    cipher = PiiCipher.from_base64_key(_key_b64())

    encrypted = cipher.encrypt_text("Paciente Simulado")

    assert encrypted != b"Paciente Simulado"
    assert cipher.decrypt_text(encrypted) == "Paciente Simulado"


def test_same_plaintext_uses_distinct_nonces() -> None:
    cipher = PiiCipher.from_base64_key(_key_b64())

    first = cipher.encrypt_text("Andres")
    second = cipher.encrypt_text("Andres")

    assert first != second
    assert cipher.decrypt_text(first) == cipher.decrypt_text(second) == "Andres"


def test_rejects_wrong_key_length() -> None:
    short_key = base64.urlsafe_b64encode(b"short").decode()

    with pytest.raises(ValueError, match="32 bytes"):
        PiiCipher.from_base64_key(short_key)
