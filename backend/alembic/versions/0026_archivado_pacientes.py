"""Archivado reversible de pacientes (TES-362, HU-037)."""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0026"
down_revision: str | None = "0025"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


_CODIGO_PERMISO = "paciente.archivar"


def upgrade() -> None:
    op.add_column(
        "pacientes",
        sa.Column("archivado_en", sa.TIMESTAMP(timezone=True), nullable=True),
    )
    op.add_column("pacientes", sa.Column("archivado_por_id", sa.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        op.f("fk_pacientes_archivado_por_id_usuarios"),
        "pacientes",
        "usuarios",
        ["archivado_por_id"],
        ["id"],
        ondelete="SET NULL",
    )

    conexion = op.get_bind()
    conexion.execute(
        sa.text(
            "INSERT INTO permisos (codigo, descripcion) "
            "VALUES (:codigo, :descripcion) ON CONFLICT (codigo) DO NOTHING"
        ),
        {
            "codigo": _CODIGO_PERMISO,
            "descripcion": "Archivar y reactivar pacientes",
        },
    )
    conexion.execute(
        sa.text(
            "INSERT INTO roles_permisos (rol_id, permiso_id) "
            "SELECT escritura.rol_id, archivo.id "
            "FROM roles_permisos AS escritura "
            "JOIN permisos AS permiso_escritura "
            "ON permiso_escritura.id = escritura.permiso_id "
            "CROSS JOIN permisos AS archivo "
            "WHERE permiso_escritura.codigo = 'paciente.escribir' "
            "AND archivo.codigo = :codigo "
            "ON CONFLICT DO NOTHING"
        ),
        {"codigo": _CODIGO_PERMISO},
    )


def downgrade() -> None:
    conexion = op.get_bind()
    conexion.execute(
        sa.text(
            "DELETE FROM roles_permisos WHERE permiso_id = "
            "(SELECT id FROM permisos WHERE codigo = :codigo)"
        ),
        {"codigo": _CODIGO_PERMISO},
    )
    conexion.execute(
        sa.text("DELETE FROM permisos WHERE codigo = :codigo"),
        {"codigo": _CODIGO_PERMISO},
    )
    op.drop_constraint(
        op.f("fk_pacientes_archivado_por_id_usuarios"),
        "pacientes",
        type_="foreignkey",
    )
    op.drop_column("pacientes", "archivado_por_id")
    op.drop_column("pacientes", "archivado_en")
