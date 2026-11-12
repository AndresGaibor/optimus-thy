"""Modelos de usuarios, roles y permisos."""

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
    from app.models.consentimientos import Consentimiento
    from app.models.fichas import FichaVersion
    from app.models.instituciones import Institucion


class Usuario(Base):
    __tablename__ = "usuarios"

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
    email: Mapped[str] = mapped_column(sa.String(255), nullable=False, unique=True)
    password_hash: Mapped[str | None] = mapped_column(sa.String(255), nullable=True)
    nombre: Mapped[str | None] = mapped_column(sa.String(255), nullable=True)
    activo: Mapped[bool] = mapped_column(sa.Boolean, nullable=False, server_default=sa.text("true"))
    intentos_fallidos: Mapped[int] = mapped_column(
        sa.Integer, nullable=False, server_default=sa.text("0")
    )
    bloqueado_hasta: Mapped[datetime | None] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=True
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
    institucion: Mapped[Institucion] = relationship(back_populates="usuarios")
    usuarios_roles: Mapped[list[UsuarioRol]] = relationship(
        back_populates="usuario", cascade="all, delete-orphan"
    )
    fichas_versiones: Mapped[list[FichaVersion]] = relationship(back_populates="autor")
    consentimientos_otorgados: Mapped[list[Consentimiento]] = relationship(
        back_populates="otorgado_por"
    )
    auditoria: Mapped[list[Auditoria]] = relationship(back_populates="usuario")


class Rol(Base):
    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=sa.text("gen_random_uuid()"),
    )
    nombre: Mapped[str] = mapped_column(sa.String(64), nullable=False, unique=True)
    descripcion: Mapped[str | None] = mapped_column(sa.String(255))
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    usuarios_roles: Mapped[list[UsuarioRol]] = relationship(
        back_populates="rol", cascade="all, delete-orphan"
    )
    roles_permisos: Mapped[list[RolPermiso]] = relationship(
        back_populates="rol", cascade="all, delete-orphan"
    )


class Permiso(Base):
    __tablename__ = "permisos"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=sa.text("gen_random_uuid()"),
    )
    codigo: Mapped[str] = mapped_column(sa.String(128), nullable=False, unique=True)
    descripcion: Mapped[str | None] = mapped_column(sa.String(255))
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    actualizado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True),
        nullable=False,
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
    )

    roles_permisos: Mapped[list[RolPermiso]] = relationship(
        back_populates="permiso", cascade="all, delete-orphan"
    )


class UsuarioRol(Base):
    __tablename__ = "usuarios_roles"

    usuario_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("usuarios.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    rol_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    asignado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )

    usuario: Mapped[Usuario] = relationship(back_populates="usuarios_roles")
    rol: Mapped[Rol] = relationship(back_populates="usuarios_roles")


class RolPermiso(Base):
    __tablename__ = "roles_permisos"

    rol_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    permiso_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("permisos.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    asignado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )

    rol: Mapped[Rol] = relationship(back_populates="roles_permisos")
    permiso: Mapped[Permiso] = relationship(back_populates="roles_permisos")
