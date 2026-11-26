"""Segundo factor TOTP opcional y códigos de recuperación."""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0027"
down_revision: str | None = "0026"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "usuarios",
        sa.Column("totp_secreto_cifrado", postgresql.BYTEA(), nullable=True),
    )
    op.add_column(
        "usuarios",
        sa.Column("totp_activado_en", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.create_table(
        "codigos_recuperacion",
        sa.Column("id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("usuario_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("hash", sa.CHAR(length=64), nullable=False),
        sa.Column("usado_en", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "creado_en", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["usuario_id"],
            ["usuarios.id"],
            name=op.f("fk_codigos_recuperacion_usuario_id_usuarios"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_codigos_recuperacion")),
        sa.UniqueConstraint("hash", name=op.f("uq_codigos_recuperacion_hash")),
    )
    op.create_index(
        op.f("ix_codigos_recuperacion_usuario_id"),
        "codigos_recuperacion",
        ["usuario_id"],
        unique=False,
    )
    op.create_table(
        "desafios_otp",
        sa.Column("id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("token_hash", sa.CHAR(length=64), nullable=False),
        sa.Column("usuario_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("expira_en", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("intentos", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column(
            "creado_en", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(
            ["usuario_id"],
            ["usuarios.id"],
            name=op.f("fk_desafios_otp_usuario_id_usuarios"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_desafios_otp")),
        sa.UniqueConstraint("token_hash", name=op.f("uq_desafios_otp_token_hash")),
    )
    op.create_index(
        op.f("ix_desafios_otp_usuario_id"), "desafios_otp", ["usuario_id"], unique=False
    )
    op.create_index(op.f("ix_desafios_otp_expira_en"), "desafios_otp", ["expira_en"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_desafios_otp_expira_en"), table_name="desafios_otp")
    op.drop_index(op.f("ix_desafios_otp_usuario_id"), table_name="desafios_otp")
    op.drop_table("desafios_otp")
    op.drop_index(op.f("ix_codigos_recuperacion_usuario_id"), table_name="codigos_recuperacion")
    op.drop_table("codigos_recuperacion")
    op.drop_column("usuarios", "totp_activado_en")
    op.drop_column("usuarios", "totp_secreto_cifrado")
