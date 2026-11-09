"""Invariantes del modelo de datos (sin base de datos)."""

from __future__ import annotations

from pathlib import Path

from app import models  # noqa: F401
from app.db import Base
from app.models import TABLAS as TABLAS_MODELO


def test_toda_tabla_tiene_pk() -> None:
    for table in Base.metadata.tables.values():
        assert table.primary_key.columns, f"{table.name} sin PK"


def test_toda_fk_apunta_a_tabla_existente() -> None:
    for table in Base.metadata.tables.values():
        for fk in table.foreign_keys:
            assert fk.column.table.name in Base.metadata.tables, (
                f"{table.name}.{fk.parent.name} -> {fk.column.table.name} inexistente"
            )


def test_auditoria_e_inferencias_sin_actualizado_en() -> None:
    assert "actualizado_en" not in Base.metadata.tables["auditoria"].columns
    assert "actualizado_en" not in Base.metadata.tables["inferencias"].columns


def test_pacientes_sin_columnas_de_identidad() -> None:
    cols = set(Base.metadata.tables["pacientes"].columns.keys())
    for prohibida in ("nombres", "apellidos", "documento", "fecha_nacimiento"):
        assert prohibida not in cols


def test_auditoria_sin_columnas_clinicas() -> None:
    cols = set(Base.metadata.tables["auditoria"].columns.keys())
    clinicas = {"tsh", "tirads", "bethesda", "cie10", "resultado", "diagnostico"}
    assert cols.isdisjoint(clinicas)


def test_unique_nodulos() -> None:
    table = Base.metadata.tables["nodulos"]
    uniques = [c for c in table.constraints if c.__class__.__name__ == "UniqueConstraint"]
    assert any({col.name for col in uc.columns} == {"inferencia_id", "indice"} for uc in uniques)


def test_unique_documentos() -> None:
    table = Base.metadata.tables["documentos"]
    uniques = [c for c in table.constraints if c.__class__.__name__ == "UniqueConstraint"]
    assert any(
        {col.name for col in uc.columns} == {"caso_id", "nombre_original", "version"}
        for uc in uniques
    )


def test_check_confianza_campos_ocr() -> None:
    table = Base.metadata.tables["campos_ocr"]
    checks = [
        str(c.sqltext) for c in table.constraints if c.__class__.__name__ == "CheckConstraint"
    ]
    assert any("confianza" in c and ">=" in c and "<=" in c for c in checks)


def test_tablas_modelo_coinciden_con_metadata() -> None:
    assert set(TABLAS_MODELO) == set(Base.metadata.tables.keys())
    assert len(TABLAS_MODELO) == len(set(TABLAS_MODELO))


def test_revision_sin_create_all() -> None:
    versions_dir = Path(__file__).resolve().parents[1] / "alembic" / "versions"
    scripts = list(versions_dir.glob("*.py"))
    assert scripts, "sin revisión de Alembic"
    contenido = "\n".join(p.read_text() for p in scripts)
    assert "create_all" not in contenido
