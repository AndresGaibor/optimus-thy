"""trabajos

Revision ID: 0004
Revises: 0003
Create Date: 2026-11-04 00:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "trabajos",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tipo", sa.String(length=32), nullable=False),
        sa.Column(
            "estado", sa.String(length=32), nullable=False, server_default=sa.text("'en_cola'")
        ),
        sa.Column("prioridad", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("intentos", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("max_intentos", sa.Integer(), nullable=False, server_default=sa.text("3")),
        sa.Column(
            "disponible_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("resultado", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_detalle", sa.Text(), nullable=True),
        sa.Column(
            "creado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "actualizado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_trabajos")),
    )
    op.create_index(
        "ix_trabajos_estado_disponible_en", "trabajos", ["estado", "disponible_en"], unique=False
    )
    op.create_index("ix_trabajos_creado_en", "trabajos", ["creado_en"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_trabajos_creado_en", table_name="trabajos")
    op.drop_index("ix_trabajos_estado_disponible_en", table_name="trabajos")
    op.drop_table("trabajos")
