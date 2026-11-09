"""Trabajos: dueño, plazo máximo y estados cerrados (HT-010).

Revision ID: 0007
Revises: 0006
Create Date: 2026-11-05 10:10:00.000000

- ``creado_por``: quién encoló el trabajo; solo él (o un admin) lo consulta.
- ``iniciado_en`` y ``timeout_segundos``: tiempo máximo por trabajo.
- ``ck_trabajos_estado``: solo los estados que el worker conoce.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ESTADOS = "('en_cola', 'en_proceso', 'completado', 'error')"


def upgrade() -> None:
    op.add_column(
        "trabajos",
        sa.Column("creado_por", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_trabajos_creado_por_usuarios",
        "trabajos",
        "usuarios",
        ["creado_por"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_trabajos_creado_por", "trabajos", ["creado_por"])
    op.add_column("trabajos", sa.Column("iniciado_en", sa.TIMESTAMP(timezone=True), nullable=True))
    op.add_column(
        "trabajos",
        sa.Column("timeout_segundos", sa.Integer(), nullable=False, server_default=sa.text("300")),
    )
    op.create_check_constraint("estado", "trabajos", f"estado IN {ESTADOS}")


def downgrade() -> None:
    op.drop_constraint("estado", "trabajos", type_="check")
    op.drop_column("trabajos", "timeout_segundos")
    op.drop_column("trabajos", "iniciado_en")
    op.drop_index("ix_trabajos_creado_por", table_name="trabajos")
    op.drop_constraint("fk_trabajos_creado_por_usuarios", "trabajos", type_="foreignkey")
    op.drop_column("trabajos", "creado_por")
