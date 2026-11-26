"""Solicitudes de derechos de los titulares (RS-DER-07, HU-100)."""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0023"
down_revision: str | None = "0022"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "solicitudes_derechos",
        sa.Column(
            "id",
            sa.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("institucion_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("tipo", sa.String(length=16), nullable=False),
        sa.Column("referencia_titular", sa.String(length=64), nullable=False),
        sa.Column("solicitada_en", sa.Date(), nullable=False),
        sa.Column("plazo_dias", sa.SmallInteger(), server_default=sa.text("15"), nullable=False),
        sa.Column(
            "estado", sa.String(length=16), server_default=sa.text("'pendiente'"), nullable=False
        ),
        sa.Column("responsable_id", sa.UUID(as_uuid=True), nullable=False),
        sa.Column("respuesta", sa.Text(), nullable=True),
        sa.Column(
            "creado_en",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "actualizado_en",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "tipo IN ('acceso', 'rectificacion', 'cancelacion', 'oposicion')",
            name=op.f("ck_solicitudes_derechos_tipo"),
        ),
        sa.CheckConstraint(
            "estado IN ('pendiente', 'atendida', 'rechazada')",
            name=op.f("ck_solicitudes_derechos_estado"),
        ),
        sa.CheckConstraint(
            "plazo_dias BETWEEN 1 AND 60",
            name=op.f("ck_solicitudes_derechos_plazo"),
        ),
        sa.ForeignKeyConstraint(
            ["institucion_id"],
            ["instituciones.id"],
            name=op.f("fk_solicitudes_derechos_institucion_id_instituciones"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["responsable_id"],
            ["usuarios.id"],
            name=op.f("fk_solicitudes_derechos_responsable_id_usuarios"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_solicitudes_derechos")),
        sa.UniqueConstraint(
            "institucion_id",
            "referencia_titular",
            "tipo",
            "solicitada_en",
            name=op.f("uq_solicitudes_derechos_titular_tipo_fecha"),
        ),
    )
    op.create_index(
        op.f("ix_solicitudes_derechos_institucion_id"),
        "solicitudes_derechos",
        ["institucion_id"],
    )
    op.create_index(
        op.f("ix_solicitudes_derechos_responsable_id"),
        "solicitudes_derechos",
        ["responsable_id"],
    )

    # Permiso propio: registrar solicitudes no es «cambiar ajustes».
    conexion = op.get_bind()
    conexion.execute(
        sa.text(
            "INSERT INTO permisos (codigo, descripcion) "
            "VALUES (:codigo, :descripcion) ON CONFLICT (codigo) DO NOTHING"
        ),
        {
            "codigo": "derechos.gestionar",
            "descripcion": "Registrar y atender solicitudes de derechos de titulares",
        },
    )
    conexion.execute(
        sa.text(
            "INSERT INTO roles_permisos (rol_id, permiso_id) "
            "SELECT r.id, p.id FROM roles r, permisos p "
            "WHERE r.nombre = 'admin' AND p.codigo = 'derechos.gestionar' "
            "ON CONFLICT DO NOTHING"
        )
    )


def downgrade() -> None:
    conexion = op.get_bind()
    conexion.execute(
        sa.text(
            "DELETE FROM roles_permisos WHERE permiso_id IN "
            "(SELECT id FROM permisos WHERE codigo = 'derechos.gestionar')"
        )
    )
    conexion.execute(sa.text("DELETE FROM permisos WHERE codigo = 'derechos.gestionar'"))
    op.drop_index(op.f("ix_solicitudes_derechos_responsable_id"), table_name="solicitudes_derechos")
    op.drop_index(op.f("ix_solicitudes_derechos_institucion_id"), table_name="solicitudes_derechos")
    op.drop_table("solicitudes_derechos")
