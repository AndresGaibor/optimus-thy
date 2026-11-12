"""Tests del generador de fichas sintéticas (HT-091, HT-092 y HT-093)."""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import pytest
from PIL import Image, ImageChops

from scripts.generar_fixtures_fichas import (
    CAMPOS_MEDIDOS,
    DISENOS,
    FICHAS,
    NOMBRE_REFERENCIA,
    VERSION_REFERENCIA,
    generar,
    pagina,
    texto_ficha,
)

RAIZ_BACKEND = Path(__file__).resolve().parents[1]

ARCHIVOS_ESPERADOS = {
    *(diseno.archivo_pdf for diseno in DISENOS),
    *(diseno.archivo_escaneado for diseno in DISENOS),
    NOMBRE_REFERENCIA,
}
CAMPOS_ESPERADOS = set(CAMPOS_MEDIDOS)
CAMPOS_NUMERICOS = {"tsh", "t3", "t4", "tamano_nodulo_mm"}


# Estas pruebas no tocan la base: se anulan los fixtures autouse de conftest.py
# para que la suite no dependa de Postgres ni vacíe tablas mientras otro proceso
# de pruebas la usa.
@pytest.fixture(autouse=True)
def _clean_db() -> None:
    yield


@pytest.fixture(scope="session")
def _apply_migrations_once() -> None:
    yield


def _hashes(directorio: Path) -> dict[str, str]:
    return {
        ruta.name: hashlib.sha256(ruta.read_bytes()).hexdigest()
        for ruta in sorted(directorio.iterdir())
    }


def _leer_referencia(directorio: Path) -> dict:
    return json.loads((directorio / NOMBRE_REFERENCIA).read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def generadas(tmp_path_factory) -> Path:
    destino = tmp_path_factory.mktemp("fixtures-fichas")
    generar(destino)
    return destino


def test_dos_ejecuciones_producen_los_mismos_bytes(tmp_path):
    generar(tmp_path / "primera")
    generar(tmp_path / "segunda")

    primera = _hashes(tmp_path / "primera")
    segunda = _hashes(tmp_path / "segunda")

    assert primera.keys() == ARCHIVOS_ESPERADOS
    assert primera == segunda


def test_el_cli_reproduce_los_mismos_bytes_en_otro_proceso(tmp_path, generadas):
    destino = tmp_path / "desde-cli"
    resultado = subprocess.run(
        [
            sys.executable,
            "-m",
            "scripts.generar_fixtures_fichas",
            "--destino",
            str(destino),
        ],
        cwd=RAIZ_BACKEND,
        env={**os.environ, "PYTHONPATH": str(RAIZ_BACKEND)},
        capture_output=True,
        text=True,
        check=False,
    )

    assert resultado.returncode == 0, resultado.stderr
    assert str(destino) in resultado.stdout
    assert _hashes(destino) == _hashes(generadas)


def test_hay_tres_pdf_validos(generadas):
    pdfs = sorted(generadas.glob("*.pdf"))

    assert len(pdfs) == 3
    assert {pdf.name for pdf in pdfs} == {diseno.archivo_pdf for diseno in DISENOS}
    for pdf in pdfs:
        contenido = pdf.read_bytes()
        assert contenido.startswith(b"%PDF")
        assert len(contenido) > 20_000


def test_cada_pdf_tiene_su_version_escaneada(generadas):
    referencia = _leer_referencia(generadas)

    for ficha in referencia["fichas"]:
        assert (generadas / ficha["archivo_pdf"]).is_file()
        escaneado = generadas / ficha["archivo_escaneado"]
        assert escaneado.is_file()
        assert escaneado.read_bytes().startswith(b"\x89PNG\r\n\x1a\n")


def test_el_escaneado_es_el_mismo_contenido_con_ruido_e_inclinacion(generadas):
    for ficha in FICHAS:
        digital = pagina(ficha).convert("L")
        escaneado = Image.open(generadas / ficha.diseno.archivo_escaneado).convert("L")

        assert escaneado.size == digital.size
        diferencia = ImageChops.difference(digital, escaneado).histogram()
        pixeles_distintos = sum(diferencia[8:])
        assert pixeles_distintos > digital.width * digital.height * 0.03

        # Ruido sobre zonas que en el PDF están en blanco: eso no lo produce el texto.
        blanco = digital.point(lambda valor: 255 if valor >= 250 else 0)
        manchado = escaneado.point(lambda valor: 255 if valor < 247 else 0)
        sobre_blanco = ImageChops.multiply(blanco, manchado).histogram()[255]
        assert sobre_blanco > 1_000


def test_la_referencia_trae_todos_los_campos(generadas):
    referencia = _leer_referencia(generadas)

    assert referencia["version"] == VERSION_REFERENCIA
    assert set(referencia["campos_medidos"]) == CAMPOS_ESPERADOS
    assert len(referencia["fichas"]) == len(DISENOS) == 3

    for ficha in referencia["fichas"]:
        assert set(ficha["campos"]) == CAMPOS_ESPERADOS
        identificacion = ficha["identificacion"]
        assert identificacion["sintetica"] is True
        assert re.fullmatch(r"SINT-\d{4}", identificacion["codigo"])
        assert identificacion["nombre"].startswith("Paciente Sintético")
        assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", ficha["fecha_laboratorio"])

        for nombre, campo in ficha["campos"].items():
            assert campo["tipo"] in {"numero", "texto"}
            assert campo["valor"], nombre
            assert campo["texto"], nombre
        for nombre in ("tsh", "t3", "t4"):
            assert ficha["campos"][nombre]["fecha"] == ficha["fecha_laboratorio"]


def test_el_formato_de_cada_ficha_coincide_con_su_diseno(generadas):
    referencia = _leer_referencia(generadas)

    for ficha in referencia["fichas"]:
        diseno = ficha["diseno"]
        separador = diseno["separador_decimal"]
        otro = "." if separador == "," else ","

        for nombre in CAMPOS_NUMERICOS:
            campo = ficha["campos"][nombre]
            assert "." in campo["valor"], "el valor canónico se escribe con punto"
            assert separador in campo["texto"], nombre
            assert otro not in campo["texto"], nombre

            if nombre == "tamano_nodulo_mm":
                assert campo["texto"].endswith(" mm")
                continue
            if diseno["con_unidad"]:
                assert campo["texto"].endswith(f" {campo['unidad']}")
            else:
                assert "unidad" not in campo
                assert campo["texto"].replace(separador, "").isdigit()


def test_los_tres_disenos_cubren_coma_punto_y_unidad(generadas):
    referencia = _leer_referencia(generadas)

    assert {ficha["diseno"]["id"] for ficha in referencia["fichas"]} == {
        diseno.id for diseno in DISENOS
    }
    assert {ficha["diseno"]["separador_decimal"] for ficha in referencia["fichas"]} == {
        ",",
        ".",
    }
    assert {ficha["diseno"]["con_unidad"] for ficha in referencia["fichas"]} == {True, False}
    assert len({ficha["diseno"]["estilo"] for ficha in referencia["fichas"]}) >= 2


def test_las_fichas_se_declaran_sinteticas(generadas):
    referencia = _leer_referencia(generadas)
    assert "sintético" in referencia["aviso"].lower()

    for ficha in FICHAS:
        texto = texto_ficha(ficha)
        assert "FICHA CLÍNICA SINTÉTICA" in texto
        assert "no corresponde a una persona real" in texto
        assert "Paciente Sintético" in texto
        assert ficha.codigo in texto
        assert "@" not in texto


def test_solo_escribe_en_el_destino(tmp_path):
    destino = tmp_path / "salida" / "fichas"

    generar(destino)

    escritos = {ruta.relative_to(tmp_path) for ruta in tmp_path.rglob("*") if ruta.is_file()}
    assert escritos == {Path("salida", "fichas", nombre) for nombre in ARCHIVOS_ESPERADOS}
