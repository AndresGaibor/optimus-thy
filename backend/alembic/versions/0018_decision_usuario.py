"""Autor de la decisión médica (TES-337).

La tabla nació con el primer esquema, pero ninguna ruta la escribía, así que
está vacía: la columna puede entrar como obligatoria sin relleno.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0018"
down_revision: str | None = "0017"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "decisiones_medicas",
        sa.Column("usuario_id", sa.UUID(), nullable=False),
    )
    op.create_foreign_key(
        op.f("fk_decisiones_medicas_usuario_id_usuarios"),
        "decisiones_medicas",
        "usuarios",
        ["usuario_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.create_index(
        op.f("ix_decisiones_medicas_usuario_id"),
        "decisiones_medicas",
        ["usuario_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_decisiones_medicas_usuario_id"), table_name="decisiones_medicas")
    op.drop_constraint(
        op.f("fk_decisiones_medicas_usuario_id_usuarios"),
        "decisiones_medicas",
        type_="foreignkey",
    )
    op.drop_column("decisiones_medicas", "usuario_id")
