"""Desafíos OTP y códigos de recuperación de un solo uso."""

from __future__ import annotations

import uuid
from datetime import datetime

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class CodigoRecuperacion(Base):
    __tablename__ = "codigos_recuperacion"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    hash: Mapped[str] = mapped_column(sa.CHAR(64), nullable=False, unique=True)
    usado_en: Mapped[datetime | None] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )


class DesafioOtp(Base):
    __tablename__ = "desafios_otp"
    __table_args__ = (sa.Index("ix_desafios_otp_expira_en", "expira_en"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token_hash: Mapped[str] = mapped_column(sa.CHAR(64), nullable=False, unique=True)
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    expira_en: Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False)
    intentos: Mapped[int] = mapped_column(sa.Integer, nullable=False, server_default=sa.text("0"))
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
