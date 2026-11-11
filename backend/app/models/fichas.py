"""Modelos de casos y fichas clínicas."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

if TYPE_CHECKING:
    from app.models.consentimientos import Consentimiento
    from app.models.documentos import Documento
    from app.models.imagenes import Imagen
    from app.models.instituciones import Institucion
    from app.models.pacientes import Paciente
    from app.models.usuarios import Usuario


class Caso(Base):
    __tablename__ = "casos"

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
    paciente_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("pacientes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    codigo_caso: Mapped[str] = mapped_column(sa.String(64), nullable=False)
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    institucion: Mapped[Institucion] = relationship(back_populates="casos")
    paciente: Mapped[Paciente] = relationship(back_populates="casos")
    ficha_clinica: Mapped[FichaClinica | None] = relationship(
        back_populates="caso", uselist=False, cascade="all, delete-orphan"
    )
    fichas_versiones: Mapped[list[FichaVersion]] = relationship(
        back_populates="caso", cascade="all, delete-orphan"
    )
    documentos: Mapped[list[Documento]] = relationship(
        back_populates="caso", cascade="all, delete-orphan"
    )
    imagenes: Mapped[list[Imagen]] = relationship(
        back_populates="caso", cascade="all, delete-orphan"
    )
    consentimientos: Mapped[list[Consentimiento]] = relationship(
        back_populates="caso", cascade="all, delete-orphan"
    )


class FichaClinica(Base):
    __tablename__ = "fichas_clinicas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=sa.text("gen_random_uuid()"),
    )
    caso_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("casos.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    tsh: Mapped[Decimal | None] = mapped_column(sa.Numeric(10, 3))
    tsh_unidad: Mapped[str | None] = mapped_column(sa.String(16))
    tsh_fecha: Mapped[date | None] = mapped_column(sa.Date)
    t3: Mapped[Decimal | None] = mapped_column(sa.Numeric(10, 3))
    t3_unidad: Mapped[str | None] = mapped_column(sa.String(16))
    t3_fecha: Mapped[date | None] = mapped_column(sa.Date)
    t4: Mapped[Decimal | None] = mapped_column(sa.Numeric(10, 3))
    t4_unidad: Mapped[str | None] = mapped_column(sa.String(16))
    t4_fecha: Mapped[date | None] = mapped_column(sa.Date)
    tamano_nodulo_mm: Mapped[Decimal | None] = mapped_column(sa.Numeric(8, 2))
    lateralidad: Mapped[str | None] = mapped_column(sa.String(32))
    tirads: Mapped[str | None] = mapped_column(sa.String(16))
    bethesda: Mapped[str | None] = mapped_column(sa.String(16))
    cie10: Mapped[str | None] = mapped_column(sa.String(16))
    tipo_diagnostico: Mapped[str | None] = mapped_column(sa.String(64))
    tipo_consulta: Mapped[str | None] = mapped_column(sa.String(64))
    origen_datos: Mapped[dict[str, str] | None] = mapped_column(JSONB)
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    caso: Mapped[Caso] = relationship(back_populates="ficha_clinica")


class FichaVersion(Base):
    __tablename__ = "fichas_versiones"

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
    ficha_clinica_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("fichas_clinicas.id", ondelete="SET NULL"),
        index=True,
    )
    version: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    snapshot: Mapped[dict[str, object]] = mapped_column(JSONB, nullable=False)
    autor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("usuarios.id", ondelete="SET NULL"),
        index=True,
    )
    motivo_cambio: Mapped[str | None] = mapped_column(sa.String(255))
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )

    caso: Mapped[Caso] = relationship(back_populates="fichas_versiones")
    ficha_clinica: Mapped[FichaClinica | None] = relationship()
    autor: Mapped[Usuario | None] = relationship(back_populates="fichas_versiones")
