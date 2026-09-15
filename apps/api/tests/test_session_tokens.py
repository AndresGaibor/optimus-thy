import base64
import hashlib

from optimus_thy.shared.security.session_tokens import generate_session_token, hash_session_token


def test_generated_session_token_contains_at_least_256_bits_of_entropy() -> None:
    token = generate_session_token()
    padded = token + "=" * (-len(token) % 4)
    decoded = base64.urlsafe_b64decode(padded)

    assert len(decoded) >= 32


def test_session_token_hash_is_deterministic_sha256_and_hides_raw_token() -> None:
    token = "session-token-value"

    token_hash = hash_session_token(token)

    assert token_hash == hashlib.sha256(token.encode("utf-8")).hexdigest()
    assert token not in token_hash
    assert len(token_hash) == 64


def test_generated_session_tokens_are_unique() -> None:
    assert generate_session_token() != generate_session_token()
