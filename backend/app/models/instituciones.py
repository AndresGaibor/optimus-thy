"""Modelo de instituciones."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.auditoria import Auditoria
    from app.models.fichas import Caso
    from app.models.pacientes import Paciente
    from app.models.usuarios import Usuario


class Institucion(Base):
    __tablename__ = "instituciones"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=sa.text("gen_random_uuid()"),
    )
    nombre: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    codigo: Mapped[str] = mapped_column(sa.String(64), nullable=False, unique=True)
    activa: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("true"))
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    usuarios: Mapped[list[Usuario]] = relationship(back_populates="institucion")
    pacientes: Mapped[list[Paciente]] = relationship(back_populates="institucion")
    casos: Mapped[list[Caso]] = relationship(back_populates="institucion")
    auditoria: Mapped[list[Auditoria]] = relationship(back_populates="institucion")
