"""Solicitudes de derechos de los titulares de datos (RS-DER-07).

El registro guarda solo la referencia interna del titular y los metadatos de la
solicitud; el contenido de la respuesta se anota sin datos clínicos ni
identificadores directos, porque la bitácora y el listado son consultables.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.instituciones import Institucion
    from app.models.usuarios import Usuario

TIPOS = ("acceso", "rectificacion", "cancelacion", "oposicion")
ESTADOS = ("pendiente", "atendida", "rechazada")
PLAZO_POR_DEFECTO = 15


class SolicitudDerecho(Base):
    __tablename__ = "solicitudes_derechos"

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
    tipo: Mapped[str] = mapped_column(sa.String(16), nullable=False)
    referencia_titular: Mapped[str] = mapped_column(sa.String(64), nullable=False)
    solicitada_en: Mapped[date] = mapped_column(sa.Date(), nullable=False)
    plazo_dias: Mapped[int] = mapped_column(
        sa.SmallInteger(), nullable=False, server_default=sa.text(str(PLAZO_POR_DEFECTO))
    )
    estado: Mapped[str] = mapped_column(
        sa.String(16), nullable=False, server_default=sa.text("'pendiente'")
    )
    responsable_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("usuarios.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    respuesta: Mapped[str | None] = mapped_column(sa.Text)
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
        sa.CheckConstraint(
            "tipo IN ('acceso', 'rectificacion', 'cancelacion', 'oposicion')",
            name="ck_solicitudes_derechos_tipo",
        ),
        sa.CheckConstraint(
            "estado IN ('pendiente', 'atendida', 'rechazada')",
            name="ck_solicitudes_derechos_estado",
        ),
        sa.CheckConstraint(
            "plazo_dias BETWEEN 1 AND 60",
            name="ck_solicitudes_derechos_plazo",
        ),
        sa.UniqueConstraint(
            "institucion_id",
            "referencia_titular",
            "tipo",
            "solicitada_en",
            name="uq_solicitudes_derechos_titular_tipo_fecha",
        ),
    )

    institucion: Mapped[Institucion] = relationship()
    responsable: Mapped[Usuario] = relationship()
