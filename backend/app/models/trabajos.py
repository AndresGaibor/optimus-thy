"""Modelo ORM de trabajos en cola (jobs largos)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Trabajo(Base):
    __tablename__ = "trabajos"

    __table_args__ = (
        sa.Index("ix_trabajos_estado_disponible_en", "estado", "disponible_en"),
        sa.Index("ix_trabajos_creado_en", "creado_en"),
        sa.Index("ix_trabajos_creado_por", "creado_por"),
        sa.CheckConstraint(
            "estado IN ('en_cola', 'en_proceso', 'completado', 'error')", name="estado"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tipo: Mapped[str] = mapped_column(sa.String(32), nullable=False)
    estado: Mapped[str] = mapped_column(
        sa.String(32), nullable=False, server_default=sa.text("'en_cola'")
    )
    prioridad: Mapped[int] = mapped_column(sa.Integer, nullable=False, server_default=sa.text("0"))
    intentos: Mapped[int] = mapped_column(sa.Integer, nullable=False, server_default=sa.text("0"))
    max_intentos: Mapped[int] = mapped_column(
        sa.Integer, nullable=False, server_default=sa.text("3")
    )
    disponible_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    creado_por: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), sa.ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
    )
    iniciado_en: Mapped[datetime | None] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=True)
    timeout_segundos: Mapped[int] = mapped_column(
        sa.Integer, nullable=False, server_default=sa.text("300")
    )
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    resultado: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    error_detalle: Mapped[str | None] = mapped_column(sa.Text, nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )
