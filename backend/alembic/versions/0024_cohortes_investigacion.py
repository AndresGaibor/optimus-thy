"""Cohortes de investigación institucionales."""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0024"
down_revision: str | None = "0023"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "cohortes_investigacion",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("institucion_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("nombre", sa.String(length=120), nullable=False),
        sa.Column(
            "filtros",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("creado_por_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column(
            "creado_en", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "actualizado_en",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["institucion_id"], ["instituciones.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["creado_por_id"], ["usuarios.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_cohortes_investigacion_institucion_id",
        "cohortes_investigacion",
        ["institucion_id"],
    )
    op.create_index(
        "ix_cohortes_investigacion_creado_por_id",
        "cohortes_investigacion",
        ["creado_por_id"],
    )
    op.create_index(
        "uq_cohortes_investigacion_institucion_nombre_lower",
        "cohortes_investigacion",
        ["institucion_id", sa.text("lower(nombre)")],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "uq_cohortes_investigacion_institucion_nombre_lower",
        table_name="cohortes_investigacion",
    )
    op.drop_index("ix_cohortes_investigacion_creado_por_id", table_name="cohortes_investigacion")
    op.drop_index("ix_cohortes_investigacion_institucion_id", table_name="cohortes_investigacion")
    op.drop_table("cohortes_investigacion")
