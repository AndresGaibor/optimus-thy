"""Cohortes de investigación configurables por institución."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.instituciones import Institucion
    from app.models.usuarios import Usuario


class CohorteInvestigacion(Base):
    __tablename__ = "cohortes_investigacion"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=sa.text("gen_random_uuid()"),
    )
    institucion_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("instituciones.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    nombre: Mapped[str] = mapped_column(sa.String(120), nullable=False)
    filtros: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default=sa.text("'{}'::jsonb")
    )
    creado_por_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("usuarios.id", ondelete="SET NULL"),
        index=True,
    )
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    __table_args__ = (
        sa.Index(
            "uq_cohortes_investigacion_institucion_nombre_lower",
            institucion_id,
            sa.func.lower(nombre),
            unique=True,
        ),
    )

    institucion: Mapped[Institucion] = relationship()
    creado_por: Mapped[Usuario | None] = relationship()
