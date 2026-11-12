"""detección de texto incrustado en imágenes

Revision ID: 0013
Revises: 0012
Create Date: 2026-11-10 00:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0013"
down_revision: str | None = "0012"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None

COLUMNAS = (
    sa.Column("texto_incrustado_detectado", sa.Boolean(), nullable=True),
    sa.Column(
        "necesita_revision_texto",
        sa.Boolean(),
        nullable=False,
        server_default=sa.text("false"),
    ),
    sa.Column("texto_incrustado_motivo", sa.String(length=255), nullable=True),
)


def upgrade() -> None:
    for columna in COLUMNAS:
        op.add_column("imagenes", columna)


def downgrade() -> None:
    for columna in reversed(COLUMNAS):
        op.drop_column("imagenes", columna.name)
