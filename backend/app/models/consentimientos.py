"""Modelo de consentimientos."""

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
    from app.models.usuarios import Usuario


class Consentimiento(Base):
    __tablename__ = "consentimientos"

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
    base_legal: Mapped[str] = mapped_column(sa.String(64), nullable=False)
    version_texto: Mapped[str] = mapped_column(
        sa.String(32), nullable=False, server_default=sa.text("'1.0'")
    )
    otorgado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )
    revocado_en: Mapped[datetime | None] = mapped_column(sa.TIMESTAMP(timezone=True))
    otorgado_por_id: Mapped[uuid.UUID | None] = mapped_column(
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
        sa.CheckConstraint(
            "revocado_en IS NULL OR revocado_en >= otorgado_en",
            name="ck_consentimientos_vigencia",
        ),
        sa.CheckConstraint(
            "base_legal IN ('consentimiento','atencion_de_salud',"
            " 'investigacion_con_anonimizacion')",
            name="ck_consentimientos_base_legal",
        ),
    )

    caso: Mapped[Caso] = relationship(back_populates="consentimientos")
    otorgado_por: Mapped[Usuario | None] = relationship(back_populates="consentimientos_otorgados")
