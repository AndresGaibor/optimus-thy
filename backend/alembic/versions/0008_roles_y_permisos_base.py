"""Catálogo de permisos y matriz por rol (HU-011).

Los tres roles base los crea la migración ``0006_seed_base``; aquí se siembran
el catálogo de permisos y la matriz por defecto. Es idempotente
(``ON CONFLICT DO NOTHING``), así que convive con bases ya sembradas.

Revision ID: 0008
Revises: 0007
Create Date: 2026-11-05 12:00:00.000000
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

PERMISOS: tuple[tuple[str, str], ...] = (
    ("paciente.leer", "Consultar el listado y el detalle de pacientes"),
    ("paciente.escribir", "Registrar y actualizar pacientes y casos"),
    ("ficha.leer", "Consultar la ficha clínica del caso"),
    ("ficha.escribir", "Registrar y versionar la ficha clínica"),
    ("documento.leer", "Ver y descargar los documentos del caso"),
    ("documento.cargar", "Cargar documentos del caso"),
    ("imagen.leer", "Ver las imágenes del caso"),
    ("imagen.cargar", "Cargar imágenes del caso"),
    ("inferencia.ejecutar", "Ejecutar la inferencia de IA sobre una imagen"),
    ("inferencia.leer", "Consultar los resultados de inferencia"),
    ("reporte.generar", "Generar el reporte PDF de una inferencia"),
    ("investigacion.leer", "Consultar cohortes y métricas agregadas"),
    ("investigacion.exportar", "Exportar conjuntos de datos anonimizados"),
    ("auditoria.leer", "Consultar la bitácora de auditoría"),
    ("usuario.gestionar", "Crear, editar y desactivar usuarios"),
    ("rol.gestionar", "Editar la matriz de roles y permisos"),
    ("ajustes.gestionar", "Cambiar los ajustes del sistema"),
)

MATRIZ: dict[str, tuple[str, ...]] = {
    "admin": ("ajustes.gestionar", "auditoria.leer", "rol.gestionar", "usuario.gestionar"),
    "doctor": (
        "documento.cargar",
        "documento.leer",
        "ficha.escribir",
        "ficha.leer",
        "imagen.cargar",
        "imagen.leer",
        "inferencia.ejecutar",
        "inferencia.leer",
        "paciente.escribir",
        "paciente.leer",
        "reporte.generar",
    ),
    "researcher": ("inferencia.leer", "investigacion.exportar", "investigacion.leer"),
}


def upgrade() -> None:
    conexion = op.get_bind()
    for codigo, descripcion in PERMISOS:
        conexion.execute(
            sa.text(
                "INSERT INTO permisos (codigo, descripcion) VALUES (:codigo, :descripcion) "
                "ON CONFLICT (codigo) DO NOTHING"
            ),
            {"codigo": codigo, "descripcion": descripcion},
        )
    for nombre, codigos in MATRIZ.items():
        for codigo in codigos:
            conexion.execute(
                sa.text(
                    "INSERT INTO roles_permisos (rol_id, permiso_id) "
                    "SELECT r.id, p.id FROM roles r, permisos p "
                    "WHERE r.nombre = :nombre AND p.codigo = :codigo "
                    "ON CONFLICT DO NOTHING"
                ),
                {"nombre": nombre, "codigo": codigo},
            )


def downgrade() -> None:
    """Retira lo sembrado por esta migración.

    Los roles no se borran: pueden estar asignados a usuarios y borrarlos
    arrastraría sus asignaciones. La matriz y el catálogo sí se retiran.
    """
    conexion = op.get_bind()
    for nombre, codigos in MATRIZ.items():
        for codigo in codigos:
            conexion.execute(
                sa.text(
                    "DELETE FROM roles_permisos rp USING roles r, permisos p "
                    "WHERE rp.rol_id = r.id AND rp.permiso_id = p.id "
                    "AND r.nombre = :nombre AND p.codigo = :codigo"
                ),
                {"nombre": nombre, "codigo": codigo},
            )
    for codigo, _ in PERMISOS:
        conexion.execute(sa.text("DELETE FROM permisos WHERE codigo = :codigo"), {"codigo": codigo})
