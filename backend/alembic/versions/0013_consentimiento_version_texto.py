"""versión del texto firmado en los consentimientos

Revision ID: 0013
Revises: 0012
Create Date: 2026-11-16 00:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0013"
down_revision: str | None = "0012"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "consentimientos",
        sa.Column("version_texto", sa.String(length=32), nullable=True),
    )
    op.execute("UPDATE consentimientos SET version_texto = 'v1' WHERE version_texto IS NULL")
    op.alter_column("consentimientos", "version_texto", nullable=False)


def downgrade() -> None:
    op.drop_column("consentimientos", "version_texto")
