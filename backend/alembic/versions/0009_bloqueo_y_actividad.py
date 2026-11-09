"""Bloqueo por intentos fallidos y actividad de la sesión (HU-004, HU-005).

Añade el contador de intentos fallidos y la marca de bloqueo temporal en
``usuarios``, y la última actividad en ``sesiones`` (las sesiones existentes
arrancan con la hora de la migración, así no quedan caducadas de golpe).

Revision ID: 0009
Revises: 0008
Create Date: 2026-11-05 18:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0009"
down_revision: str | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "usuarios",
        sa.Column(
            "intentos_fallidos",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
    op.add_column(
        "usuarios",
        sa.Column("bloqueado_hasta", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.add_column(
        "sesiones",
        sa.Column(
            "ultima_actividad",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_column("sesiones", "ultima_actividad")
    op.drop_column("usuarios", "bloqueado_hasta")
    op.drop_column("usuarios", "intentos_fallidos")
