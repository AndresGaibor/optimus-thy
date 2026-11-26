"""Guardas de separación entre producción y desarrollo."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.config import Settings

CLAVE_SINTETICA = "clave-sintetica-segura-para-pruebas"
URL_REMOTA = "postgresql+psycopg://usuario:clave@db.interno.example/optimus"


def test_produccion_exige_clave_pii_configurada() -> None:
    with pytest.raises(ValidationError, match="PII_ENCRYPTION_KEY"):
        Settings(
            _env_file=None,
            environment="production",
            database_url=URL_REMOTA,
            session_cookie_secure=True,
        )


def test_produccion_exige_cookie_segura_y_no_revela_la_clave() -> None:
    with pytest.raises(ValidationError) as error:
        Settings(
            _env_file=None,
            environment="production",
            database_url=URL_REMOTA,
            pii_encryption_key=CLAVE_SINTETICA,
            session_cookie_secure=False,
        )

    assert "SESSION_COOKIE_SECURE" in str(error.value)
    assert CLAVE_SINTETICA not in str(error.value)


def test_produccion_rechaza_una_base_de_datos_local() -> None:
    with pytest.raises(ValidationError, match="DATABASE_URL"):
        Settings(
            _env_file=None,
            environment="production",
            database_url="postgresql+psycopg://usuario:clave@127.0.0.1/optimus",
            pii_encryption_key=CLAVE_SINTETICA,
            session_cookie_secure=True,
        )


def test_desarrollo_avisa_si_la_base_parece_de_produccion() -> None:
    with pytest.warns(UserWarning, match="base de producción"):
        Settings(
            _env_file=None,
            environment="development",
            database_url="postgresql+psycopg://usuario:clave@db.prod.example/optimus_prod",
            pii_encryption_key=CLAVE_SINTETICA,
        )
