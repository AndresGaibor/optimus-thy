"""Modelo de documentos del caso."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.fichas import Caso


class Documento(Base):
    __tablename__ = "documentos"
    __table_args__ = (
        sa.UniqueConstraint(
            "caso_id", "nombre_original", "version", name="uq_documentos_caso_nombre_version"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=sa.text("gen_random_uuid()"),
    )
    caso_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("casos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nombre_original: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    ruta_s3: Mapped[str] = mapped_column(sa.String(512), nullable=False)
    hash_sha256: Mapped[str] = mapped_column(sa.String(64), nullable=False)
    version: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    tipo_mime: Mapped[str | None] = mapped_column(sa.String(128))
    creado_en: Mapped[sa.DateTime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_en: Mapped[sa.DateTime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    caso: Mapped[Caso] = relationship(back_populates="documentos")
