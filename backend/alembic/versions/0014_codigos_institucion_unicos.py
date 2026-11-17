"""Códigos de institución únicos sin distinguir mayúsculas.

Consolida los duplicados existentes (misma institución con distinta caja) en el
registro con más referencias, pasa todos los códigos a minúsculas y sustituye el
índice único por uno funcional sobre `lower(codigo)`.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0014"
down_revision: str | None = "0013"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Tablas con clave foránea a instituciones; se reasignan antes de borrar el duplicado.
TABLAS_CON_INSTITUCION = ("usuarios", "pacientes", "casos", "auditoria")


def upgrade() -> None:
    conexion = op.get_bind()
    filas = conexion.execute(
        sa.text(
            """
            SELECT i.id, i.codigo, i.creado_en,
                   (SELECT count(*) FROM usuarios WHERE institucion_id = i.id)
                 + (SELECT count(*) FROM pacientes WHERE institucion_id = i.id)
                 + (SELECT count(*) FROM casos WHERE institucion_id = i.id)
                 + (SELECT count(*) FROM auditoria WHERE institucion_id = i.id) AS refs
            FROM instituciones i
            """
        )
    ).all()

    grupos: dict[str, list[sa.Row]] = {}
    for fila in filas:
        grupos.setdefault(fila.codigo.lower(), []).append(fila)

    for duplicados in grupos.values():
        if len(duplicados) < 2:
            continue
        # Se conserva el que más referencias tiene y, a igualdad, el más antiguo.
        canonica = sorted(duplicados, key=lambda f: (-f.refs, f.creado_en))[0]
        for fila in duplicados:
            if fila.id == canonica.id:
                continue
            for tabla in TABLAS_CON_INSTITUCION:
                conexion.execute(
                    sa.text(
                        f"UPDATE {tabla} SET institucion_id = :conservar "
                        "WHERE institucion_id = :descartar"
                    ),
                    {"conservar": canonica.id, "descartar": fila.id},
                )
            conexion.execute(sa.text("DELETE FROM instituciones WHERE id = :id"), {"id": fila.id})

    op.execute("UPDATE instituciones SET codigo = lower(codigo)")
    op.drop_constraint("uq_instituciones_codigo", "instituciones", type_="unique")
    op.create_index(
        "uq_instituciones_codigo_lower",
        "instituciones",
        [sa.text("lower(codigo)")],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_instituciones_codigo_lower", table_name="instituciones")
    op.create_unique_constraint("uq_instituciones_codigo", "instituciones", ["codigo"])
