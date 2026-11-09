"""Modelo ORM de sesiones de usuario."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.usuarios import Rol, Usuario
else:
    from app.models.usuarios import Rol, Usuario

    Rol = Rol  # type: ignore[assignment]
    Usuario = Usuario  # type: ignore[assignment]


class Sesion(Base):
    __tablename__ = "sesiones"

    __table_args__ = (sa.Index("ix_sesiones_expira_en", "expira_en"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("usuarios.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(sa.String(64), nullable=False, unique=True)
    creada_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    expira_en: Mapped[datetime] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=False)
    ultima_actividad: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    revocada_en: Mapped[datetime | None] = mapped_column(sa.TIMESTAMP(timezone=True), nullable=True)
    rol_activo_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), sa.ForeignKey("roles.id"), nullable=True
    )
    ip_origen: Mapped[str | None] = mapped_column(sa.String(45), nullable=True)
    agente_usuario: Mapped[str | None] = mapped_column(sa.String(200), nullable=True)

    usuario: Mapped[Usuario] = relationship()
    rol_activo: Mapped[Rol | None] = relationship()
