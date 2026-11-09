"""usuarios auth fields

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-03 23:40:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("usuarios", sa.Column("password_hash", sa.String(length=255), nullable=True))
    op.add_column("usuarios", sa.Column("nombre", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("usuarios", "nombre")
    op.drop_column("usuarios", "password_hash")
