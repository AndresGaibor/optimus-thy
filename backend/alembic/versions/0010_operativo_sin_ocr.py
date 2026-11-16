"""operativo sin OCR: recorta el esquema a lo que producción usa

Elimina las tablas de extracción OCR y las columnas que el modelo de IA
entregado no produce. El repo académico conserva el modelo completo
(ver ADR-020).

Revision ID: 0010
Revises: 0009
Create Date: 2026-11-16 12:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0010"
down_revision: str | None = "0009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index(op.f("ix_campos_ocr_extraccion_ocr_id"), table_name="campos_ocr")
    op.drop_table("campos_ocr")
    op.drop_index(op.f("ix_extracciones_ocr_documento_id"), table_name="extracciones_ocr")
    op.drop_table("extracciones_ocr")

    op.drop_column("nodulos", "mascara_ruta_s3")
    op.drop_column("inferencias", "inmutable")
    op.drop_column("fichas_clinicas", "origen_datos")


def downgrade() -> None:
    op.add_column(
        "fichas_clinicas",
        sa.Column("origen_datos", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        "inferencias",
        sa.Column("inmutable", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )
    op.add_column("nodulos", sa.Column("mascara_ruta_s3", sa.String(length=512), nullable=True))

    op.create_table(
        "extracciones_ocr",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("documento_id", sa.UUID(), nullable=False),
        sa.Column("estado", sa.String(length=32), nullable=False),
        sa.Column("modelo_ocr", sa.String(length=128), nullable=True),
        sa.Column("version_modelo", sa.String(length=64), nullable=True),
        sa.Column(
            "iniciado_en",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("finalizado_en", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "creado_en",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "actualizado_en",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "estado IN ('cola','procesando','listo','con_error')",
            name=op.f("ck_extracciones_ocr_ck_extracciones_ocr_estado"),
        ),
        sa.ForeignKeyConstraint(
            ["documento_id"],
            ["documentos.id"],
            name=op.f("fk_extracciones_ocr_documento_id_documentos"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_extracciones_ocr")),
    )
    op.create_index(
        op.f("ix_extracciones_ocr_documento_id"), "extracciones_ocr", ["documento_id"], unique=False
    )
    op.create_table(
        "campos_ocr",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("extraccion_ocr_id", sa.UUID(), nullable=False),
        sa.Column("nombre_campo", sa.String(length=128), nullable=False),
        sa.Column("valor_extraido", sa.Text(), nullable=True),
        sa.Column("confianza", sa.Float(), nullable=False),
        sa.Column(
            "confirmado_por_humano", sa.Boolean(), server_default=sa.text("false"), nullable=False
        ),
        sa.Column("confirmado_en", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column(
            "creado_en",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "actualizado_en",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "confianza >= 0 AND confianza <= 1", name=op.f("ck_campos_ocr_ck_campos_ocr_confianza")
        ),
        sa.ForeignKeyConstraint(
            ["extraccion_ocr_id"],
            ["extracciones_ocr.id"],
            name=op.f("fk_campos_ocr_extraccion_ocr_id_extracciones_ocr"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_campos_ocr")),
    )
    op.create_index(
        op.f("ix_campos_ocr_extraccion_ocr_id"), "campos_ocr", ["extraccion_ocr_id"], unique=False
    )
