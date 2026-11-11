"""estado del OCR del documento

Añade a ``documentos`` el estado del OCR (``estado_ocr``), el motivo del fallo
(``ocr_motivo``) y cuándo cambió (``ocr_actualizado_en``), HU-051. Las filas
existentes quedan en ``no_solicitado``: su OCR nunca se pidió.

Revision ID: 0015
Revises: 0014
Create Date: 2026-11-11 00:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0015"
down_revision: str | None = "0014"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "documentos",
        sa.Column(
            "estado_ocr",
            sa.String(length=16),
            nullable=False,
            server_default=sa.text("'no_solicitado'"),
        ),
    )
    op.add_column("documentos", sa.Column("ocr_motivo", sa.String(length=255), nullable=True))
    op.add_column(
        "documentos", sa.Column("ocr_actualizado_en", sa.TIMESTAMP(timezone=True), nullable=True)
    )
    op.create_check_constraint(
        "ck_documentos_estado_ocr",
        "documentos",
        "estado_ocr IN ('no_solicitado','en_cola','procesando','listo','error')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_documentos_estado_ocr", "documentos", type_="check")
    op.drop_column("documentos", "ocr_actualizado_en")
    op.drop_column("documentos", "ocr_motivo")
    op.drop_column("documentos", "estado_ocr")
