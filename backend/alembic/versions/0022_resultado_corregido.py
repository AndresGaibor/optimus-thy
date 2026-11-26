"""Guarda el resultado clínico corregido para separar falsos positivos y negativos."""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0022"
down_revision: str | None = "0021"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "decisiones_medicas",
        sa.Column("resultado_corregido", sa.String(length=16), nullable=True),
    )
    op.create_check_constraint(
        op.f("ck_decisiones_medicas_resultado_corregido"),
        "decisiones_medicas",
        "resultado_corregido IS NULL OR "
        "resultado_corregido IN ('benigno', 'maligno', 'sin_nodulo')",
    )


def downgrade() -> None:
    op.drop_constraint(
        op.f("ck_decisiones_medicas_resultado_corregido"),
        "decisiones_medicas",
        type_="check",
    )
    op.drop_column("decisiones_medicas", "resultado_corregido")
