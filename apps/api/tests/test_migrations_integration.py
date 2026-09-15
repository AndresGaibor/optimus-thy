import asyncio
import os
import subprocess
import sys
from collections.abc import Coroutine
from pathlib import Path
from typing import Any
from uuid import uuid4

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import create_async_engine

from optimus_thy.shared.security.pii_cipher import PiiCipher

API_ROOT = Path(__file__).resolve().parents[1]
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

pytestmark = pytest.mark.integration


def _alembic(*args: str) -> None:
    if TEST_DATABASE_URL is None:
        pytest.skip("TEST_DATABASE_URL is required for migration integration tests")
    env = os.environ.copy()
    env["DATABASE_URL"] = TEST_DATABASE_URL
    subprocess.run(
        [sys.executable, "-m", "alembic", *args],
        cwd=API_ROOT,
        env=env,
        check=True,
    )


def _run[T](coro: Coroutine[Any, Any, T]) -> T:
    return asyncio.run(coro)


async def _table_names() -> set[str]:
    assert TEST_DATABASE_URL is not None
    engine = create_async_engine(TEST_DATABASE_URL)
    try:
        async with engine.connect() as connection:
            rows = await connection.execute(
                text(
                    """
                    SELECT table_schema || '.' || table_name
                    FROM information_schema.tables
                    WHERE table_schema IN ('security', 'clinical', 'audit')
                    """
                )
            )
            return set(rows.scalars())
    finally:
        await engine.dispose()


async def _exercise_constraints_and_pii() -> None:
    assert TEST_DATABASE_URL is not None
    engine = create_async_engine(TEST_DATABASE_URL)
    role_id = uuid4()
    institution_id = uuid4()
    user_id = uuid4()
    patient_id = uuid4()
    cipher = PiiCipher(b"0" * 32)
    first_names = cipher.encrypt_text("Paciente")
    last_names = cipher.encrypt_text("Simulado")
    try:
        async with engine.begin() as connection:
            await connection.execute(
                text(
                    "INSERT INTO security.roles (id, code, name) "
                    "VALUES (:id, 'constraint_test_role', 'Rol de prueba')"
                ),
                {"id": role_id},
            )
            await connection.execute(
                text("INSERT INTO security.institutions (id, name) VALUES (:id, 'ESPOCH')"),
                {"id": institution_id},
            )
            await connection.execute(
                text(
                    """
                    INSERT INTO security.users
                        (id, institution_id, role_id, email, password_hash, display_name)
                    VALUES
                        (:id, :institution_id, :role_id,
                         'constraint-test@example.test', 'hash', 'Usuario Test')
                    """
                ),
                {"id": user_id, "institution_id": institution_id, "role_id": role_id},
            )
            await connection.execute(
                text(
                    "INSERT INTO clinical.patients (id, institution_id, public_code) "
                    "VALUES (:id, :institution_id, 'PAC-CONSTRAINT-0001')"
                ),
                {"id": patient_id, "institution_id": institution_id},
            )
            await connection.execute(
                text(
                    """
                    INSERT INTO clinical.patient_identity
                        (patient_id, first_names_ciphertext, last_names_ciphertext)
                    VALUES
                        (:patient_id, :first_names, :last_names)
                    """
                ),
                {
                    "patient_id": patient_id,
                    "first_names": first_names,
                    "last_names": last_names,
                },
            )

        async with engine.connect() as connection:
            stored = (
                await connection.execute(
                    text(
                        "SELECT first_names_ciphertext, last_names_ciphertext "
                        "FROM clinical.patient_identity WHERE patient_id = :patient_id"
                    ),
                    {"patient_id": patient_id},
                )
            ).one()
            assert stored.first_names_ciphertext != b"Paciente"
            assert stored.last_names_ciphertext != b"Simulado"
            assert cipher.decrypt_text(stored.first_names_ciphertext) == "Paciente"
            assert cipher.decrypt_text(stored.last_names_ciphertext) == "Simulado"

        with pytest.raises(IntegrityError):
            async with engine.begin() as connection:
                await connection.execute(
                    text(
                        "INSERT INTO security.roles (id, code, name) "
                        "VALUES (:id, 'constraint_test_role', 'Duplicado')"
                    ),
                    {"id": uuid4()},
                )

        with pytest.raises(IntegrityError):
            async with engine.begin() as connection:
                await connection.execute(
                    text(
                        "INSERT INTO clinical.patients (id, institution_id, public_code) "
                        "VALUES (:id, :institution_id, 'PAC-BAD-FK')"
                    ),
                    {"id": uuid4(), "institution_id": uuid4()},
                )
    finally:
        await engine.dispose()


def test_initial_migration_cycle_constraints_and_pii() -> None:
    _alembic("upgrade", "head")
    expected_tables = {
        "security.institutions",
        "security.roles",
        "security.users",
        "security.sessions",
        "clinical.patients",
        "clinical.patient_identity",
        "audit.events",
    }
    assert _run(_table_names()) == expected_tables
    _run(_exercise_constraints_and_pii())

    _alembic("downgrade", "base")
    assert _run(_table_names()) == set()

    _alembic("upgrade", "head")
    assert _run(_table_names()) == expected_tables


async def _column_names(schema: str, table: str) -> set[str]:
    assert TEST_DATABASE_URL is not None
    engine = create_async_engine(TEST_DATABASE_URL)
    try:
        async with engine.connect() as connection:
            rows = await connection.execute(
                text(
                    """
                    SELECT column_name
                    FROM information_schema.columns
                    WHERE table_schema = :schema AND table_name = :table
                    """
                ),
                {"schema": schema, "table": table},
            )
            return set(rows.scalars())
    finally:
        await engine.dispose()


def test_auth_audit_context_columns_exist_at_head() -> None:
    _alembic("upgrade", "head")

    columns = _run(_column_names("audit", "events"))

    assert {"actor_role", "active_view"} <= columns
