"""contrato de inferencia

Revision ID: 0011
Revises: 0010
Create Date: 2026-11-10 00:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0011"
down_revision: str | None = "0010"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

COLUMNAS_INFERENCIA = (
    sa.Column("ancho", sa.Integer(), nullable=True),
    sa.Column("alto", sa.Integer(), nullable=True),
    sa.Column("version_contrato", sa.String(length=16), nullable=True),
    sa.Column("umbrales", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column("huella_modelos", sa.String(length=64), nullable=True),
)

COLUMNAS_NODULO = (
    sa.Column("origen_mascara", sa.String(length=32), nullable=True),
    sa.Column("clase", sa.String(length=32), nullable=True),
    sa.Column("probabilidad_benigno", sa.Float(), nullable=True),
    sa.Column("probabilidad_maligno", sa.Float(), nullable=True),
    sa.Column("region_analizada", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column("pixeles_mascara", sa.Integer(), nullable=True),
)


def upgrade() -> None:
    # Nulas para no invalidar las inferencias que ya existían: el manejador
    # siempre las escribe en las nuevas (HT-063).
    for columna in COLUMNAS_INFERENCIA:
        op.add_column("inferencias", columna)
    for columna in COLUMNAS_NODULO:
        op.add_column("nodulos", columna)


def downgrade() -> None:
    for columna in reversed(COLUMNAS_NODULO):
        op.drop_column("nodulos", columna.name)
    for columna in reversed(COLUMNAS_INFERENCIA):
        op.drop_column("inferencias", columna.name)
