import asyncio
import base64
import os
import subprocess
import sys
from collections.abc import Coroutine
from pathlib import Path
from typing import Any

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from optimus_thy.shared.security.pii_cipher import PiiCipher

API_ROOT = Path(__file__).resolve().parents[1]
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")
TEST_KEY = b"1" * 32
TEST_KEY_B64 = base64.urlsafe_b64encode(TEST_KEY).decode()

pytestmark = pytest.mark.integration


def _run[T](coro: Coroutine[Any, Any, T]) -> T:
    return asyncio.run(coro)


def _command(module_or_alembic: list[str], *, pii_key: bool = False) -> None:
    if TEST_DATABASE_URL is None:
        pytest.skip("TEST_DATABASE_URL is required for seed integration tests")
    env = os.environ.copy()
    env["DATABASE_URL"] = TEST_DATABASE_URL
    if pii_key:
        env["PII_ENCRYPTION_KEY_B64"] = TEST_KEY_B64
    subprocess.run(module_or_alembic, cwd=API_ROOT, env=env, check=True)


async def _assert_seeded_data() -> None:
    assert TEST_DATABASE_URL is not None
    engine = create_async_engine(TEST_DATABASE_URL)
    cipher = PiiCipher(TEST_KEY)
    try:
        async with engine.connect() as connection:
            roles = await connection.scalar(
                text(
                    "SELECT count(*) FROM security.roles "
                    "WHERE code IN ('medico', 'investigador', 'administrador')"
                )
            )
            users = await connection.scalar(
                text(
                    "SELECT count(*) FROM security.users "
                    "WHERE email LIKE '%@optimus-thy.example.test'"
                )
            )
            patients = await connection.scalar(
                text("SELECT count(*) FROM clinical.patients WHERE public_code = 'DEMO-0001'")
            )
            identity = (
                await connection.execute(
                    text(
                        """
                        SELECT i.first_names_ciphertext, i.last_names_ciphertext
                        FROM clinical.patient_identity i
                        JOIN clinical.patients p ON p.id = i.patient_id
                        WHERE p.public_code = 'DEMO-0001'
                        """
                    )
                )
            ).one()

            assert roles == 3
            assert users == 3
            assert patients == 1
            assert identity.first_names_ciphertext != b"Paciente"
            assert identity.last_names_ciphertext != b"Simulado"
            assert cipher.decrypt_text(identity.first_names_ciphertext) == "Paciente"
            assert cipher.decrypt_text(identity.last_names_ciphertext) == "Simulado"
    finally:
        await engine.dispose()


def test_development_seed_is_idempotent_and_uses_encrypted_pii() -> None:
    _command([sys.executable, "-m", "alembic", "upgrade", "head"])
    seed_command = [sys.executable, "-m", "optimus_thy.shared.database.seed_dev"]
    _command(seed_command, pii_key=True)
    _command(seed_command, pii_key=True)
    _run(_assert_seeded_data())
