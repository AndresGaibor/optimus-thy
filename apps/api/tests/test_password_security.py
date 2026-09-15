import pytest

from optimus_thy.config.settings import Settings
from optimus_thy.shared.security.passwords import PasswordService


def test_password_service_hashes_and_verifies_argon2_password() -> None:
    service = PasswordService()
    password = "correct-horse-battery-staple"

    password_hash = service.hash_password(password)

    assert password_hash != password
    assert password_hash.startswith("$argon2")
    assert service.verify_and_update(password, password_hash)[0] is True
    assert service.verify_and_update("wrong-password-value", password_hash)[0] is False


def test_password_service_rejects_new_password_shorter_than_15_characters() -> None:
    service = PasswordService()

    with pytest.raises(ValueError, match="at least 15 characters"):
        service.hash_password("too-short")


def test_auth_cookie_security_depends_on_environment() -> None:
    assert Settings(environment="development").auth_cookie_secure is False
    assert Settings(environment="production").auth_cookie_secure is True
    assert Settings().auth_session_ttl_seconds == 8 * 60 * 60
    assert Settings().auth_cookie_name == "optimus_thy_session"
