"""Historial y cierre de las fichas clínicas (TES-328, TES-366)."""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0025"
down_revision: str | None = "0024"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "fichas_versiones",
        sa.Column(
            "snapshot_anterior",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )
    op.add_column(
        "fichas_clinicas",
        sa.Column("cerrada_en", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.add_column(
        "fichas_clinicas",
        sa.Column("cerrada_por_id", sa.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        op.f("fk_fichas_clinicas_cerrada_por_id_usuarios"),
        "fichas_clinicas",
        "usuarios",
        ["cerrada_por_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        op.f("fk_fichas_clinicas_cerrada_por_id_usuarios"),
        "fichas_clinicas",
        type_="foreignkey",
    )
    op.drop_column("fichas_clinicas", "cerrada_por_id")
    op.drop_column("fichas_clinicas", "cerrada_en")
    op.drop_column("fichas_versiones", "snapshot_anterior")
