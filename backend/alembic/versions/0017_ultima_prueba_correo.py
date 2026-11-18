"""Resultado de la última prueba de envío del correo.

Guarda cuándo se intentó el último envío y si salió bien, para que el
administrador vea si el servidor sigue funcionando sin abrir el correo.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0017"
down_revision: str | None = "0016"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "configuracion_correo",
        sa.Column("ultima_prueba_en", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.add_column(
        "configuracion_correo",
        sa.Column("ultima_prueba_ok", sa.Boolean(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("configuracion_correo", "ultima_prueba_ok")
    op.drop_column("configuracion_correo", "ultima_prueba_en")
