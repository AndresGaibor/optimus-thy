"""Modelos de imágenes, modelos IA, inferencias, nódulos y decisiones médicas."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.fichas import Caso


class Imagen(Base):
    __tablename__ = "imagenes"

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
    ruta_s3: Mapped[str] = mapped_column(sa.String(512), nullable=False)
    hash_sha256: Mapped[str] = mapped_column(sa.String(64), nullable=False)
    sin_metadatos_exif_dicom: Mapped[bool] = mapped_column(
        sa.Boolean, nullable=False, server_default=sa.text("true")
    )
    texto_incrustado_detectado: Mapped[bool | None] = mapped_column(sa.Boolean, nullable=True)
    necesita_revision_texto: Mapped[bool] = mapped_column(
        sa.Boolean, nullable=False, server_default=sa.text("false")
    )
    texto_incrustado_motivo: Mapped[str | None] = mapped_column(sa.String(255), nullable=True)
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    caso: Mapped[Caso] = relationship(back_populates="imagenes")
    inferencias: Mapped[list[Inferencia]] = relationship(
        back_populates="imagen", cascade="all, delete-orphan"
    )


class ModeloIA(Base):
    __tablename__ = "modelos_ia"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=sa.text("gen_random_uuid()"),
    )
    nombre: Mapped[str] = mapped_column(sa.String(128), nullable=False)
    version: Mapped[str] = mapped_column(sa.String(64), nullable=False)
    hash_pesos: Mapped[str] = mapped_column(sa.String(64), nullable=False)
    parametros: Mapped[str | None] = mapped_column(sa.Text)
    activo: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("true"))
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    inferencias: Mapped[list[Inferencia]] = relationship(back_populates="modelo_ia")


class Inferencia(Base):
    __tablename__ = "inferencias"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=sa.text("gen_random_uuid()"),
    )
    imagen_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("imagenes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    modelo_ia_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("modelos_ia.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    resultado: Mapped[str] = mapped_column(sa.String(32), nullable=False)
    confianza: Mapped[float | None] = mapped_column(sa.Float)
    tiempo_ms: Mapped[int | None] = mapped_column(sa.Integer)
    ancho: Mapped[int | None] = mapped_column(sa.Integer)
    alto: Mapped[int | None] = mapped_column(sa.Integer)
    version_contrato: Mapped[str | None] = mapped_column(sa.String(16))
    umbrales: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    huella_modelos: Mapped[str | None] = mapped_column(sa.String(64))
    inmutable: Mapped[bool] = mapped_column(
        sa.Boolean, nullable=False, server_default=sa.text("true")
    )
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )

    __table_args__ = (
        sa.CheckConstraint(
            "resultado IN ('benigno','maligno','sin_nodulo')",
            name="ck_inferencias_resultado",
        ),
    )

    imagen: Mapped[Imagen] = relationship(back_populates="inferencias")
    modelo_ia: Mapped[ModeloIA] = relationship(back_populates="inferencias")
    nodulos: Mapped[list[Nodulo]] = relationship(
        back_populates="inferencia", cascade="all, delete-orphan"
    )
    decision_medica: Mapped[DecisionMedica | None] = relationship(
        back_populates="inferencia", uselist=False, cascade="all, delete-orphan"
    )


class Nodulo(Base):
    __tablename__ = "nodulos"
    __table_args__ = (
        sa.UniqueConstraint("inferencia_id", "indice", name="uq_nodulos_inferencia_indice"),
        sa.CheckConstraint("indice >= 1 AND indice <= 3", name="ck_nodulos_indice"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=sa.text("gen_random_uuid()"),
    )
    inferencia_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("inferencias.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    indice: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    caja_x: Mapped[float | None] = mapped_column(sa.Float)
    caja_y: Mapped[float | None] = mapped_column(sa.Float)
    caja_w: Mapped[float | None] = mapped_column(sa.Float)
    caja_h: Mapped[float | None] = mapped_column(sa.Float)
    confianza: Mapped[float | None] = mapped_column(sa.Float)
    origen_mascara: Mapped[str | None] = mapped_column(sa.String(32))
    clase: Mapped[str | None] = mapped_column(sa.String(32))
    probabilidad_benigno: Mapped[float | None] = mapped_column(sa.Float)
    probabilidad_maligno: Mapped[float | None] = mapped_column(sa.Float)
    region_analizada: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    pixeles_mascara: Mapped[int | None] = mapped_column(sa.Integer)
    mascara_ruta_s3: Mapped[str | None] = mapped_column(sa.String(512))
    mgac_ruta_s3: Mapped[str | None] = mapped_column(sa.String(512))
    xml_ruta_s3: Mapped[str | None] = mapped_column(sa.String(512))
    superposicion_ruta_s3: Mapped[str | None] = mapped_column(sa.String(512))
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )

    inferencia: Mapped[Inferencia] = relationship(back_populates="nodulos")


class DecisionMedica(Base):
    __tablename__ = "decisiones_medicas"
    __table_args__ = (
        sa.UniqueConstraint("inferencia_id", name="uq_decisiones_medicas_inferencia"),
        sa.CheckConstraint(
            "decision IN ('acepta','corrige','descarta')", name="ck_decisiones_medicas_decision"
        ),
    )
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=sa.text("gen_random_uuid()"),
    )
    inferencia_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("inferencias.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    decision: Mapped[str] = mapped_column(sa.String(32), nullable=False)
    observaciones: Mapped[str | None] = mapped_column(sa.Text)
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )
    inferencia: Mapped[Inferencia] = relationship(back_populates="decision_medica")
