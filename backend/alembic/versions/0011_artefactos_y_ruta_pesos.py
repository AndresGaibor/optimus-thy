"""artefactos de inferencia y ruta de pesos

Restaura la evidencia por nódulo del contrato 1.1 y añade la ruta de los pesos
del modelo para que el administrador pueda reemplazarlos desde la interfaz.
El OCR sigue fuera del operativo (ADR-020).

Revision ID: 0011
Revises: 0010
Create Date: 2026-11-16 13:30:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0011"
down_revision: str | None = "0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("nodulos", sa.Column("origen_mascara", sa.String(length=32), nullable=True))
    for columna in ("mascara_ruta_s3", "mgac_ruta_s3", "xml_ruta_s3", "superposicion_ruta_s3"):
        op.add_column("nodulos", sa.Column(columna, sa.String(length=512), nullable=True))

    op.add_column("inferencias", sa.Column("ancho", sa.Integer(), nullable=True))
    op.add_column("inferencias", sa.Column("alto", sa.Integer(), nullable=True))
    op.add_column("inferencias", sa.Column("version_contrato", sa.String(length=16), nullable=True))
    op.add_column(
        "inferencias",
        sa.Column("umbrales", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column("inferencias", sa.Column("huella_modelos", sa.String(length=64), nullable=True))
    op.add_column(
        "inferencias",
        sa.Column("inmutable", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )

    op.add_column("modelos_ia", sa.Column("ruta_pesos", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column("modelos_ia", "ruta_pesos")
    for columna in (
        "inmutable",
        "huella_modelos",
        "umbrales",
        "version_contrato",
        "alto",
        "ancho",
    ):
        op.drop_column("inferencias", columna)
    for columna in (
        "superposicion_ruta_s3",
        "xml_ruta_s3",
        "mgac_ruta_s3",
        "mascara_ruta_s3",
        "origen_mascara",
    ):
        op.drop_column("nodulos", columna)
