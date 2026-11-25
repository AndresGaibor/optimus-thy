"""Datasets anonimizados de investigación (HT-070, HU-090).

Crea la versión fija del conjunto (``datasets``) y sus filas anonimizadas
(``datasets_casos``). El vínculo con el caso queda solo en la base para
demostrar procedencia; la API nunca lo devuelve.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0019"
down_revision: str | None = "0018"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "datasets",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("institucion_id", sa.UUID(), nullable=False),
        sa.Column("creado_por_id", sa.UUID(), nullable=True),
        sa.Column("nombre", sa.String(length=128), nullable=False),
        sa.Column("descripcion", sa.Text(), nullable=True),
        sa.Column("total_casos", sa.Integer(), nullable=False),
        sa.Column("k", sa.Integer(), nullable=False),
        sa.Column("huella", sa.String(length=64), nullable=False),
        sa.Column("criterios", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "creado_en",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("k >= 5", name=op.f("ck_datasets_k_minimo")),
        sa.CheckConstraint("total_casos >= k", name=op.f("ck_datasets_total_casos_k")),
        sa.ForeignKeyConstraint(
            ["creado_por_id"],
            ["usuarios.id"],
            name=op.f("fk_datasets_creado_por_id_usuarios"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["institucion_id"],
            ["instituciones.id"],
            name=op.f("fk_datasets_institucion_id_instituciones"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_datasets")),
    )
    op.create_index(
        op.f("ix_datasets_creado_por_id"),
        "datasets",
        ["creado_por_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_datasets_institucion_id"),
        "datasets",
        ["institucion_id"],
        unique=False,
    )

    op.create_table(
        "datasets_casos",
        sa.Column("dataset_id", sa.UUID(), nullable=False),
        sa.Column("caso_id", sa.UUID(), nullable=False),
        sa.Column("orden", sa.Integer(), nullable=False),
        sa.Column("sujeto", sa.String(length=32), nullable=False),
        sa.Column("datos", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(
            ["caso_id"],
            ["casos.id"],
            name=op.f("fk_datasets_casos_caso_id_casos"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["dataset_id"],
            ["datasets.id"],
            name=op.f("fk_datasets_casos_dataset_id_datasets"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("dataset_id", "caso_id", name=op.f("pk_datasets_casos")),
        sa.UniqueConstraint(
            "dataset_id",
            "orden",
            name="uq_datasets_casos_dataset_orden",
        ),
        sa.UniqueConstraint(
            "dataset_id",
            "sujeto",
            name="uq_datasets_casos_dataset_sujeto",
        ),
    )
    op.create_index(
        op.f("ix_datasets_casos_caso_id"),
        "datasets_casos",
        ["caso_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_datasets_casos_caso_id"), table_name="datasets_casos")
    op.drop_table("datasets_casos")
    op.drop_index(op.f("ix_datasets_institucion_id"), table_name="datasets")
    op.drop_index(op.f("ix_datasets_creado_por_id"), table_name="datasets")
    op.drop_table("datasets")
