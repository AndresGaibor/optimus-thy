"""Modo de edición de las plantillas de correo: campos guiados o HTML.

Las plantillas guardadas antes de esta migración son HTML escrito a mano, así
que se quedan en modo HTML; los campos se rellenan con los de fábrica al abrir
la pantalla y el administrador puede volver al modo Diseño cuando quiera.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from alembic import op

revision: str = "0016"
down_revision: str | None = "0015"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "plantillas_correo",
        sa.Column("modo", sa.String(10), nullable=False, server_default="visual"),
    )
    op.add_column("plantillas_correo", sa.Column("campos", JSONB, nullable=True))
    op.execute("UPDATE plantillas_correo SET modo = 'html'")


def downgrade() -> None:
    op.drop_column("plantillas_correo", "campos")
    op.drop_column("plantillas_correo", "modo")
