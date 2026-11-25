"""Datasets anonimizados de investigación (HT-070, HU-090).

Un dataset es una versión fija y reproducible de un conjunto de casos. La
fila de ``datasets_casos`` conserva el vínculo interno con el caso para poder
demostrar procedencia y excluir retiros futuros, pero ese vínculo nunca se
serializa: la API solo devuelve la fila anonimizada y un seudónimo propio del
dataset.
"""

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
    from app.models.instituciones import Institucion
    from app.models.usuarios import Usuario


class Dataset(Base):
    __tablename__ = "datasets"

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
    creado_por_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("usuarios.id", ondelete="SET NULL"),
        index=True,
    )
    nombre: Mapped[str] = mapped_column(sa.String(128), nullable=False)
    descripcion: Mapped[str | None] = mapped_column(sa.Text)
    total_casos: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    k: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    huella: Mapped[str] = mapped_column(sa.String(64), nullable=False)
    criterios: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    creado_en: Mapped[datetime] = mapped_column(
        sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.func.now()
    )

    __table_args__ = (
        sa.CheckConstraint("k >= 5", name="k_minimo"),
        sa.CheckConstraint("total_casos >= k", name="total_casos_k"),
    )

    institucion: Mapped[Institucion] = relationship()
    creado_por: Mapped[Usuario | None] = relationship()
    casos: Mapped[list[DatasetCaso]] = relationship(
        back_populates="dataset", cascade="all, delete-orphan", order_by="DatasetCaso.orden"
    )


class DatasetCaso(Base):
    __tablename__ = "datasets_casos"

    dataset_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("datasets.id", ondelete="CASCADE"),
        primary_key=True,
    )
    caso_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        sa.ForeignKey("casos.id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    )
    orden: Mapped[int] = mapped_column(sa.Integer, nullable=False)
    sujeto: Mapped[str] = mapped_column(sa.String(32), nullable=False)
    datos: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)

    __table_args__ = (
        sa.UniqueConstraint("dataset_id", "sujeto", name="uq_datasets_casos_dataset_sujeto"),
        sa.UniqueConstraint("dataset_id", "orden", name="uq_datasets_casos_dataset_orden"),
    )

    dataset: Mapped[Dataset] = relationship(back_populates="casos")
    caso: Mapped[Caso] = relationship()
