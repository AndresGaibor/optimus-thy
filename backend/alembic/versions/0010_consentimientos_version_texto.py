"""Versión del texto del consentimiento (HU-034).

Cada consentimiento guarda qué versión del documento se firmó, junto con la
finalidad (``base_legal``). Los registros que ya existían se marcan con la
versión ``1.0`` para no dejarlos sin trazabilidad.

Revision ID: 0010
Revises: 0009
Create Date: 2026-11-10 10:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "consentimientos",
        sa.Column(
            "version_texto",
            sa.String(length=32),
            nullable=False,
            server_default=sa.text("'1.0'"),
        ),
    )


def downgrade() -> None:
    op.drop_column("consentimientos", "version_texto")
