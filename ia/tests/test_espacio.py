"""Cada solicitud usa su propio espacio temporal (RIA-03)."""

from __future__ import annotations

from pathlib import Path

from app.espacio import espacio_de_trabajo


def test_dos_solicitudes_no_comparten_directorio(tmp_path: Path) -> None:
    with espacio_de_trabajo(tmp_path) as uno, espacio_de_trabajo(tmp_path) as otro:
        assert uno != otro
        (uno / "resultado.txt").write_text("primera", encoding="utf-8")
        assert not (otro / "resultado.txt").exists()


def test_el_directorio_se_elimina_al_terminar(tmp_path: Path) -> None:
    with espacio_de_trabajo(tmp_path) as espacio:
        (espacio / "temporal.bin").write_bytes(b"x")

    assert not espacio.exists()
