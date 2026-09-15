"""Add authentication audit context.

Revision ID: 20260915_02
Revises: 20260915_01
Create Date: 2026-09-15
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "20260915_02"
down_revision: str | None = "20260915_01"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("events", sa.Column("actor_role", sa.Text(), nullable=True), schema="audit")
    op.add_column("events", sa.Column("active_view", sa.Text(), nullable=True), schema="audit")


def downgrade() -> None:
    op.drop_column("events", "active_view", schema="audit")
    op.drop_column("events", "actor_role", schema="audit")
