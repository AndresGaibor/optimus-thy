import base64
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

_NONCE_SIZE = 12
_AAD = b"optimus-thy:pii:v1"


class PiiCipher:
    """Authenticated encryption for patient PII persisted as bytes."""

    def __init__(self, key: bytes) -> None:
        if len(key) != 32:
            raise ValueError("PII encryption key must decode to exactly 32 bytes")
        self._cipher = AESGCM(key)

    @classmethod
    def from_base64_key(cls, encoded_key: str) -> "PiiCipher":
        try:
            key = base64.urlsafe_b64decode(encoded_key.encode())
        except (ValueError, TypeError) as exc:
            raise ValueError("PII encryption key must be valid Base64") from exc
        return cls(key)

    def encrypt_text(self, plaintext: str) -> bytes:
        nonce = os.urandom(_NONCE_SIZE)
        ciphertext = self._cipher.encrypt(nonce, plaintext.encode("utf-8"), _AAD)
        return nonce + ciphertext

    def decrypt_text(self, payload: bytes) -> str:
        if len(payload) <= _NONCE_SIZE:
            raise ValueError("Encrypted PII payload is too short")
        nonce = payload[:_NONCE_SIZE]
        ciphertext = payload[_NONCE_SIZE:]
        return self._cipher.decrypt(nonce, ciphertext, _AAD).decode("utf-8")
