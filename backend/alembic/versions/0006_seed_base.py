"""Datos base: roles del sistema e instituciones (HU-001, HU-010).

Revision ID: 0006
Revises: 0005
Create Date: 2026-11-05 10:00:00.000000

Sin estos datos una base nueva no deja crear usuarios («Rol desconocido»).
Es idempotente: no pisa filas que ya existan.
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

ROLES = (
    ("admin", "Administrador: gestiona usuarios, roles y auditoría"),
    ("doctor", "Médico: pacientes, fichas e inferencia"),
    ("researcher", "Investigador: cohortes y métricas sobre datos anonimizados"),
)
INSTITUCIONES = (
    ("ESPOCH", "Escuela Superior Politécnica de Chimborazo"),
    ("SOLCA", "SOLCA"),
)


def upgrade() -> None:
    for nombre, descripcion in ROLES:
        op.execute(
            f"INSERT INTO roles (nombre, descripcion) VALUES ('{nombre}', '{descripcion}') "
            "ON CONFLICT (nombre) DO NOTHING"
        )
    for codigo, nombre in INSTITUCIONES:
        op.execute(
            f"INSERT INTO instituciones (codigo, nombre) VALUES ('{codigo}', '{nombre}') "
            "ON CONFLICT (codigo) DO NOTHING"
        )


def downgrade() -> None:
    """Quita solo lo que nadie usa: nunca borra un rol o institución en uso."""
    roles = ", ".join(f"'{n}'" for n, _ in ROLES)
    op.execute(
        f"DELETE FROM roles WHERE nombre IN ({roles}) "
        "AND NOT EXISTS (SELECT 1 FROM usuarios_roles ur WHERE ur.rol_id = roles.id) "
        "AND NOT EXISTS (SELECT 1 FROM sesiones s WHERE s.rol_activo_id = roles.id)"
    )
    codigos = ", ".join(f"'{c}'" for c, _ in INSTITUCIONES)
    usos = " ".join(
        f"AND NOT EXISTS (SELECT 1 FROM {t} x WHERE x.institucion_id = instituciones.id)"
        for t in ("usuarios", "pacientes", "casos", "auditoria")
    )
    op.execute(f"DELETE FROM instituciones WHERE codigo IN ({codigos}) {usos}")
