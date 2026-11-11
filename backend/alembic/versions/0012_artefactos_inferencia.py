"""artefactos por nódulo de la inferencia

Revision ID: 0012
Revises: 0011
Create Date: 2026-11-10 00:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0012"
down_revision: str | None = "0011"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

#: Rutas de los artefactos de cada nódulo (contrato 1.1 de la inferencia).
COLUMNAS_NODULO = (
    sa.Column("mgac_ruta_s3", sa.String(length=512), nullable=True),
    sa.Column("xml_ruta_s3", sa.String(length=512), nullable=True),
    sa.Column("superposicion_ruta_s3", sa.String(length=512), nullable=True),
)


def upgrade() -> None:
    # Nulas: las inferencias anteriores (y los contratos 1.0) no traen artefactos.
    for columna in COLUMNAS_NODULO:
        op.add_column("nodulos", columna)


def downgrade() -> None:
    for columna in reversed(COLUMNAS_NODULO):
        op.drop_column("nodulos", columna.name)
