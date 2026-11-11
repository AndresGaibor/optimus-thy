"""Modelos de documentos, extracciones OCR y campos OCR."""

from __future__ import annotations

import uuid
from datetime import datetime
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
        sa.CheckConstraint(
            "estado_ocr IN ('no_solicitado','en_cola','procesando','listo','error')",
            name="ck_documentos_estado_ocr",
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
    tamano_bytes: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    # Estado del OCR (HU-051). ``ocr_motivo`` solo lleva texto cuando falla.
    estado_ocr: Mapped[str] = mapped_column(
        sa.String(16), nullable=False, server_default=sa.text("'no_solicitado'")
    )
    ocr_motivo: Mapped[str | None] = mapped_column(sa.String(255))
    ocr_actualizado_en: Mapped[datetime | None] = mapped_column(sa.TIMESTAMP(timezone=True))
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    caso: Mapped[Caso] = relationship(back_populates="documentos")
    extracciones_ocr: Mapped[list[ExtraccionOCR]] = relationship(
        back_populates="documento", cascade="all, delete-orphan"
    )


class ExtraccionOCR(Base):
    __tablename__ = "extracciones_ocr"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=sa.text("gen_random_uuid()"),
    )
    documento_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("documentos.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    estado: Mapped[str] = mapped_column(sa.String(32), nullable=False)
    modelo_ocr: Mapped[str | None] = mapped_column(sa.String(128))
    version_modelo: Mapped[str | None] = mapped_column(sa.String(64))
    iniciado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    finalizado_en: Mapped[datetime | None] = mapped_column(sa.TIMESTAMP(timezone=True))
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
            "estado IN ('cola','procesando','listo','con_error')",
            name="ck_extracciones_ocr_estado",
        ),
    )

    documento: Mapped[Documento] = relationship(back_populates="extracciones_ocr")
    campos_ocr: Mapped[list[CampoOCR]] = relationship(
        back_populates="extraccion_ocr", cascade="all, delete-orphan"
    )


class CampoOCR(Base):
    __tablename__ = "campos_ocr"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=sa.text("gen_random_uuid()"),
    )
    extraccion_ocr_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("extracciones_ocr.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nombre_campo: Mapped[str] = mapped_column(sa.String(128), nullable=False)
    valor_extraido: Mapped[str | None] = mapped_column(sa.Text)
    confianza: Mapped[float] = mapped_column(sa.Float, nullable=False)
    confirmado_por_humano: Mapped[bool] = mapped_column(
        sa.Boolean, nullable=False, server_default=sa.text("false")
    )
    confirmado_en: Mapped[datetime | None] = mapped_column(sa.TIMESTAMP(timezone=True))
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
        sa.CheckConstraint("confianza >= 0 AND confianza <= 1", name="ck_campos_ocr_confianza"),
    )

    extraccion_ocr: Mapped[ExtraccionOCR] = relationship(back_populates="campos_ocr")
