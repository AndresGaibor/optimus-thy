"""clasificación y región de los nódulos inferidos

Revision ID: 0012
Revises: 0011
Create Date: 2026-11-16 00:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0012"
down_revision: str | None = "0011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("nodulos", sa.Column("clase", sa.String(length=32), nullable=True))
    op.add_column("nodulos", sa.Column("probabilidad_benigno", sa.Float(), nullable=True))
    op.add_column("nodulos", sa.Column("probabilidad_maligno", sa.Float(), nullable=True))
    op.add_column(
        "nodulos",
        sa.Column("region_analizada", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column("nodulos", sa.Column("pixeles_mascara", sa.Integer(), nullable=True))


def downgrade() -> None:
    for columna in (
        "pixeles_mascara",
        "region_analizada",
        "probabilidad_maligno",
        "probabilidad_benigno",
        "clase",
    ):
        op.drop_column("nodulos", columna)
