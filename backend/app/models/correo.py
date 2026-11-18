"""Modelos del correo saliente y de la recuperación de contraseña."""

from __future__ import annotations

import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base

CLAVE_RECUPERACION = "recuperacion"
"""Identificador de la plantilla del enlace de recuperación."""

SEGURIDADES = ("starttls", "ssl")
"""Formas de cifrar la conexión SMTP admitidas."""


class ConfiguracionCorreo(Base):
    """Fila única con el servidor SMTP y el remitente."""

    __tablename__ = "configuracion_correo"

    __table_args__ = (sa.CheckConstraint("id = 1", name="singleton"),)

    id: Mapped[int] = mapped_column(sa.SmallInteger, primary_key=True)
    host: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    puerto: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    seguridad: Mapped[str] = mapped_column(sa.String(10), nullable=False)
    usuario: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    password_cifrado: Mapped[bytes | None] = mapped_column(sa.LargeBinary, nullable=True)
    remitente: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    remitente_nombre: Mapped[str | None] = mapped_column(sa.String(120), nullable=True)
    activo: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.true())
    actualizado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_por: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
    )


class PlantillaCorreo(Base):
    """Asunto y HTML de un correo, editables desde la aplicación."""

    __tablename__ = "plantillas_correo"

    clave: Mapped[str] = mapped_column(sa.String(40), primary_key=True)
    asunto: Mapped[str] = mapped_column(sa.String(200), nullable=False)
    html: Mapped[str] = mapped_column(sa.Text, nullable=False)
    modo: Mapped[str] = mapped_column(sa.String(10), nullable=False, server_default="visual")
    campos: Mapped[dict[str, str] | None] = mapped_column(JSONB, nullable=True)
    actualizado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_por: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
    )


class TokenRecuperacion(Base):
    """Enlace de un solo uso para restablecer la contraseña.

    Solo se guarda el SHA-256 del token: quien lea la base no puede usarlo.
    """

    __tablename__ = "tokens_recuperacion"

    __table_args__ = (
        sa.Index("ix_tokens_recuperacion_usuario_creado", "usuario_id", "creado_en"),
        sa.Index("ix_tokens_recuperacion_expira", "expira_en"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(sa.String(64), nullable=False, unique=True)
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    expira_en: Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False)
    usado_en: Mapped[datetime | None] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=True)
    ip_origen: Mapped[str | None] = mapped_column(sa.String(45), nullable=True)
