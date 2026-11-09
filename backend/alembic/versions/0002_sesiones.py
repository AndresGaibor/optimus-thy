"""sesiones

Revision ID: 0002
Revises: 0001
Create Date: 2026-11-03 23:30:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "sesiones",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column(
            "creada_en",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expira_en", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("revocada_en", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("rol_activo_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("ip_origen", sa.String(length=45), nullable=True),
        sa.Column("agente_usuario", sa.String(length=200), nullable=True),
        sa.ForeignKeyConstraint(
            ["usuario_id"],
            ["usuarios.id"],
            name=op.f("fk_sesiones_usuario_id_usuarios"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["rol_activo_id"], ["roles.id"], name=op.f("fk_sesiones_rol_activo_id_roles")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_sesiones")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_sesiones_token_hash")),
    )
    op.create_index(op.f("ix_sesiones_usuario_id"), "sesiones", ["usuario_id"], unique=False)
    op.create_index(op.f("ix_sesiones_expira_en"), "sesiones", ["expira_en"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_sesiones_expira_en"), table_name="sesiones")
    op.drop_index(op.f("ix_sesiones_usuario_id"), table_name="sesiones")
    op.drop_table("sesiones")
