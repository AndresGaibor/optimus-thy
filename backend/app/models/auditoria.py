"""Modelo de auditoría (solo inserción)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.instituciones import Institucion
    from app.models.usuarios import Usuario


class Auditoria(Base):
    __tablename__ = "auditoria"
    __table_args__ = (sa.Index("uq_auditoria_hash_actual", "hash_actual", unique=True),)

    id: Mapped[int] = mapped_column(
        sa.BigInteger,
        sa.Identity(always=True),
        primary_key=True,
    )
    ocurrido_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("usuarios.id", ondelete="RESTRICT"),
        index=True,
    )
    institucion_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("instituciones.id", ondelete="RESTRICT"),
        index=True,
    )
    accion: Mapped[str] = mapped_column(sa.String(128), nullable=False)
    entidad: Mapped[str] = mapped_column(sa.String(128), nullable=False)
    entidad_id: Mapped[str | None] = mapped_column(sa.String(64))
    direccion_ip: Mapped[str | None] = mapped_column(sa.String(64))
    user_agent: Mapped[str | None] = mapped_column(sa.String(255))
    # Contexto técnico del evento: solo códigos y números, nunca texto libre ni
    # datos clínicos. Lo valida ``app.audit.AuditService`` (HT-030).
    detalles: Mapped[dict[str, Any] | None] = mapped_column(sa.JSON)
    hash_anterior: Mapped[str | None] = mapped_column(sa.String(64))
    hash_actual: Mapped[str | None] = mapped_column(sa.String(64))

    usuario: Mapped[Usuario | None] = relationship(back_populates="auditoria")
    institucion: Mapped[Institucion | None] = relationship(back_populates="auditoria")


class AuditoriaAncla(Base):
    """Estado final confirmado de la cadena de auditoría."""

    __tablename__ = "auditoria_ancla"
    __table_args__ = (sa.CheckConstraint("id = 1", name="singleton"),)

    id: Mapped[int] = mapped_column(sa.SmallInteger, primary_key=True)
    registros: Mapped[int] = mapped_column(sa.BigInteger, nullable=False)
    hash_actual: Mapped[str | None] = mapped_column(sa.String(64))
