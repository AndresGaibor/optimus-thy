"""tamaño del documento cargado

Añade ``documentos.tamano_bytes``: el tamaño del contenido realmente guardado.
Las filas existentes arrancan en 0, porque su tamaño no se conservó.

Revision ID: 0014
Revises: 0013
Create Date: 2026-11-11 00:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0014"
down_revision: str | None = "0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "documentos",
        sa.Column("tamano_bytes", sa.Integer(), nullable=False, server_default=sa.text("0")),
    )
    op.alter_column("documentos", "tamano_bytes", server_default=None)


def downgrade() -> None:
    op.drop_column("documentos", "tamano_bytes")
