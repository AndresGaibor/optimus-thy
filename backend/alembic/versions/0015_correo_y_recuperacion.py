"""Correo saliente (SMTP y plantillas) y tokens de recuperación de contraseña.

`configuracion_correo` es una fila única: el servidor lo configura un
administrador desde la aplicación, no el repositorio. La contraseña se guarda
cifrada con la misma clave AES-GCM que el resto de datos sensibles.
`tokens_recuperacion` guarda solo el SHA-256 del enlace.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op

revision: str = "0015"
down_revision: str | None = "0014"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "configuracion_correo",
        sa.Column("id", sa.SmallInteger, primary_key=True),
        sa.Column("host", sa.String(255), nullable=False),
        sa.Column("puerto", sa.Integer, nullable=False),
        sa.Column("seguridad", sa.String(10), nullable=False),
        sa.Column("usuario", sa.String(255), nullable=False),
        sa.Column("password_cifrado", sa.LargeBinary, nullable=True),
        sa.Column("remitente", sa.String(255), nullable=False),
        sa.Column("remitente_nombre", sa.String(120), nullable=True),
        sa.Column("activo", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column(
            "actualizado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "actualizado_por",
            UUID(as_uuid=True),
            sa.ForeignKey("usuarios.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.CheckConstraint("id = 1", name="singleton"),
    )

    op.create_table(
        "plantillas_correo",
        sa.Column("clave", sa.String(40), primary_key=True),
        sa.Column("asunto", sa.String(200), nullable=False),
        sa.Column("html", sa.Text, nullable=False),
        sa.Column(
            "actualizado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "actualizado_por",
            UUID(as_uuid=True),
            sa.ForeignKey("usuarios.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    op.create_table(
        "tokens_recuperacion",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "usuario_id",
            UUID(as_uuid=True),
            sa.ForeignKey("usuarios.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column(
            "creado_en",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("expira_en", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("usado_en", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("ip_origen", sa.String(45), nullable=True),
    )
    op.create_index(
        "ix_tokens_recuperacion_usuario_creado", "tokens_recuperacion", ["usuario_id", "creado_en"]
    )
    op.create_index("ix_tokens_recuperacion_expira", "tokens_recuperacion", ["expira_en"])


def downgrade() -> None:
    op.drop_index("ix_tokens_recuperacion_expira", table_name="tokens_recuperacion")
    op.drop_index("ix_tokens_recuperacion_usuario_creado", table_name="tokens_recuperacion")
    op.drop_table("tokens_recuperacion")
    op.drop_table("plantillas_correo")
    op.drop_table("configuracion_correo")
