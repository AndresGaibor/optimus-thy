"""Modelos de pacientes e identidades (cifradas)."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.security.types import EncryptedBytes

if TYPE_CHECKING:
    from app.models.fichas import Caso
    from app.models.instituciones import Institucion


class Paciente(Base):
    __tablename__ = "pacientes"

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
    seudonimo: Mapped[str] = mapped_column(sa.String(128), nullable=False, unique=True)
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    institucion: Mapped[Institucion] = relationship(back_populates="pacientes")
    identidad: Mapped[IdentidadPaciente | None] = relationship(
        back_populates="paciente", uselist=False, cascade="all, delete-orphan"
    )
    casos: Mapped[list[Caso]] = relationship(back_populates="paciente")


class IdentidadPaciente(Base):
    """Identidad del paciente separada y cifrada.

    El cifrado lo hace ``EncryptedBytes`` (HT-011): la aplicación ve texto
    claro y en la base solo queda el criptograma AES-256-GCM. ``clave_version``
    guarda el identificador de la clave con la que se escribió la fila.
    """

    __tablename__ = "identidades_paciente"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=sa.text("gen_random_uuid()"),
    )
    paciente_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("pacientes.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    nombres_cifrados: Mapped[str] = mapped_column(EncryptedBytes(), nullable=False)
    apellidos_cifrados: Mapped[str] = mapped_column(EncryptedBytes(), nullable=False)
    documento_cifrado: Mapped[str] = mapped_column(EncryptedBytes(), nullable=False)
    fecha_nacimiento_cifrada: Mapped[str] = mapped_column(EncryptedBytes(), nullable=False)
    clave_version: Mapped[str] = mapped_column(sa.String(32), nullable=False)
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    paciente: Mapped[Paciente] = relationship(back_populates="identidad")
