"""Bitácora de solo escritura: contexto técnico y bloqueo de UPDATE y DELETE (HT-030).

Revision ID: 0005
Revises: 0004
Create Date: 2026-11-04 01:15:00.000000

La garantía de solo escritura se aplica en PostgreSQL, que es el motor del
proyecto. En SQLite (pruebas) se omite: no tiene funciones ni disparadores
equivalentes, así que la restricción allí es la superficie del servicio.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

FUNCION = "optimus_auditoria_solo_escritura"
DISPARADOR = "auditoria_solo_escritura"
TABLA = "auditoria"


def upgrade() -> None:
    """Añade el contexto del evento e impide modificarlo o borrarlo."""
    op.add_column(TABLA, sa.Column("detalles", sa.JSON(), nullable=True))

    if op.get_bind().dialect.name != "postgresql":
        return
    op.execute(
        f"""
        CREATE OR REPLACE FUNCTION {FUNCION}() RETURNS trigger
        LANGUAGE plpgsql AS $$
        BEGIN
            RAISE EXCEPTION 'auditoria es de solo escritura';
        END;
        $$
        """
    )
    op.execute(
        f"""
        CREATE TRIGGER {DISPARADOR}
        BEFORE UPDATE OR DELETE ON {TABLA}
        FOR EACH ROW EXECUTE FUNCTION {FUNCION}()
        """
    )


def downgrade() -> None:
    """Devuelve la tabla a su estado editable."""
    if op.get_bind().dialect.name == "postgresql":
        op.execute(f"DROP TRIGGER IF EXISTS {DISPARADOR} ON {TABLA}")
        op.execute(f"DROP FUNCTION IF EXISTS {FUNCION}()")
    op.drop_column(TABLA, "detalles")
