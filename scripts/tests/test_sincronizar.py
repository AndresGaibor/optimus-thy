"""Pruebas de `scripts/sincronizar.py` con repositorios git temporales.

No dependen de la red ni del repositorio académico real: cada prueba construye
un repositorio de origen y otro de destino con `git init`, `git add` y
`git commit` dentro de `tmp_path`.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from collections.abc import Mapping
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(RAIZ / "scripts"))

import sincronizar  # noqa: E402  (la ruta se fija arriba)

ENTORNO_GIT = {
    "GIT_AUTHOR_NAME": "Pruebas",
    "GIT_AUTHOR_EMAIL": "pruebas@ejemplo.test",
    "GIT_COMMITTER_NAME": "Pruebas",
    "GIT_COMMITTER_EMAIL": "pruebas@ejemplo.test",
}


def _git(repositorio: Path, *argumentos: str) -> None:
    """Ejecuta git sin firmar commits y sin depender de la configuración global."""
    subprocess.run(
        ["git", "-C", str(repositorio), "-c", "commit.gpgsign=false", *argumentos],
        check=True,
        capture_output=True,
        env={**os.environ, **ENTORNO_GIT},
    )


def crear_repo(base: Path, archivos: Mapping[str, str]) -> Path:
    """Crea un repositorio git con esos archivos y un commit inicial."""
    base.mkdir(parents=True, exist_ok=True)
    _git(base, "init", "-q")
    for ruta, contenido in archivos.items():
        destino = base / ruta
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(contenido, encoding="utf-8")
    _git(base, "add", "-A")
    _git(base, "commit", "-qm", "inicial")
    return base


def escribir_reglas(
    destino: Path,
    compartido: tuple[str, ...] = (),
    adaptar: tuple[str, ...] = (),
    independiente: tuple[str, ...] = (),
) -> Path:
    """Escribe una política válida con esos patrones."""
    datos = {
        "version": 1,
        "compartido": [{"patron": patron, "motivo": "prueba"} for patron in compartido],
        "adaptar": [{"patron": patron, "motivo": "prueba"} for patron in adaptar],
        "independiente": [{"patron": patron, "motivo": "prueba"} for patron in independiente],
    }
    destino.write_text(json.dumps(datos), encoding="utf-8")
    return destino


# --------------------------------------------------------------------------- #
# Clasificación
# --------------------------------------------------------------------------- #


def test_clasificar_respeta_la_precedencia_y_el_doble_asterisco(tmp_path: Path) -> None:
    reglas = sincronizar.cargar_reglas(
        escribir_reglas(
            tmp_path / "reglas.json",
            compartido=("backend/app/**", "frontend/src/design-system/**/*.tsx"),
            adaptar=("frontend/src/screens/**",),
            independiente=("frontend/src/screens/admin/*.stories.tsx", "docs/**"),
        )
    )

    # `**` alcanza cualquier profundidad, incluida cero.
    assert (
        sincronizar.clasificar_ruta("frontend/src/design-system/Boton.tsx", reglas).grupo
        == sincronizar.COPIAR
    )
    assert (
        sincronizar.clasificar_ruta("frontend/src/design-system/atoms/Boton.tsx", reglas).grupo
        == sincronizar.COPIAR
    )
    # Primera coincidencia: `frontend/src/screens/**` (adaptar) gana a la regla de
    # historias de `independiente`, que se evalúa después.
    assert (
        sincronizar.clasificar_ruta(
            "frontend/src/screens/admin/Dashboard.stories.tsx", reglas
        ).grupo
        == sincronizar.ADAPTAR
    )
    assert sincronizar.clasificar_ruta("docs/adr/ADR-001.md", reglas).grupo == (
        sincronizar.INDEPENDIENTE
    )
    # `**` cruza segmentos a cualquier profundidad.
    assert (
        sincronizar.clasificar_ruta("backend/app/servicios/agenda.py", reglas).grupo
        == sincronizar.COPIAR
    )
    assert sincronizar.clasificar_ruta("ocr/motor.py", reglas).grupo == sincronizar.SIN_REGLA


def test_orden_de_evaluacion_es_por_grupo_no_por_orden_del_json(tmp_path: Path) -> None:
    archivo = tmp_path / "reglas.json"
    archivo.write_text(
        json.dumps(
            {
                "version": 1,
                "independiente": [{"patron": "comparte/x.py", "motivo": "prueba"}],
                "adaptar": [],
                "compartido": [{"patron": "comparte/*.py", "motivo": "prueba"}],
            }
        ),
        encoding="utf-8",
    )
    reglas = sincronizar.cargar_reglas(archivo)

    # Aunque `independiente` aparezca primero en el archivo, el orden de la
    # política es compartido -> adaptar -> independiente.
    assert sincronizar.clasificar_ruta("comparte/x.py", reglas).grupo == sincronizar.COPIAR


def test_reglas_invalidas_fallan_con_error_de_entorno(tmp_path: Path) -> None:
    archivo = tmp_path / "reglas.json"
    archivo.write_text(
        json.dumps({"version": 99, "compartido": [], "adaptar": [], "independiente": []}),
        encoding="utf-8",
    )
    with pytest.raises(sincronizar.ErrorEntorno):
        sincronizar.cargar_reglas(archivo)


# --------------------------------------------------------------------------- #
# plan
# --------------------------------------------------------------------------- #


def test_plan_devuelve_3_si_queda_una_ruta_sin_regla(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    academicos = crear_repo(tmp_path / "academico", {"raro/archivo.txt": "nuevo"})
    operativo = crear_repo(tmp_path / "operativo", {"raro/archivo.txt": "viejo"})
    reglas = escribir_reglas(tmp_path / "reglas.json", compartido=("backend/app/**",))

    monkeypatch.chdir(operativo)
    codigo = sincronizar.main(["plan", "--academico", str(academicos)], ruta_reglas=reglas)
    salida = capsys.readouterr().out

    assert codigo == 3
    assert "SIN_REGLA 1" in salida
    assert "SIN_REGLA raro/archivo.txt" in salida


def test_plan_emite_json_con_la_forma_del_contrato(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    academicos = crear_repo(
        tmp_path / "academico",
        {"backend/app/comun.py": "nuevo", "docs/referencia/x.md": "tesis"},
    )
    operativo = crear_repo(
        tmp_path / "operativo",
        {"backend/app/comun.py": "viejo", "infra/propio.sh": "operativo"},
    )
    reglas = escribir_reglas(
        tmp_path / "reglas.json",
        compartido=("backend/app/**",),
        independiente=("docs/**", "infra/**"),
    )

    monkeypatch.chdir(operativo)
    codigo = sincronizar.main(
        ["plan", "--json", "--academico", str(academicos)], ruta_reglas=reglas
    )
    datos = json.loads(capsys.readouterr().out)

    assert codigo == 0
    assert set(datos) == {"academico", "operativo", "reglas", "conteos", "rutas"}
    assert set(datos["academico"]) == {"commit", "tree"}
    assert set(datos["operativo"]) == {"commit", "ref", "working_tree"}
    assert datos["reglas"] == {"version": 1}
    assert datos["conteos"] == {
        "copiar": 1,
        "adaptar": 0,
        "independiente": 2,
        "sin_regla": 0,
    }
    rutas = {ruta["ruta"]: ruta for ruta in datos["rutas"]}
    assert rutas["backend/app/comun.py"]["grupo"] == "COPIAR"
    assert rutas["backend/app/comun.py"]["lado"] == "DIFERENTE"
    assert rutas["docs/referencia/x.md"]["lado"] == "SOLO_ACADEMICO"
    assert rutas["infra/propio.sh"]["lado"] == "SOLO_OPERATIVO"


# --------------------------------------------------------------------------- #
# aplicar
# --------------------------------------------------------------------------- #


def test_aplicar_seco_no_escribe_nada(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    academicos = crear_repo(tmp_path / "academico", {"backend/app/comun.py": "nuevo"})
    operativo = crear_repo(tmp_path / "operativo", {"backend/app/comun.py": "viejo"})
    reglas = escribir_reglas(tmp_path / "reglas.json", compartido=("backend/app/**",))

    monkeypatch.chdir(operativo)
    codigo = sincronizar.main(
        ["aplicar", "--seco", "--academico", str(academicos)], ruta_reglas=reglas
    )
    salida = capsys.readouterr().out

    assert codigo == 0
    assert "APLICAR backend/app/comun.py" in salida
    assert "APLICADAS 1" in salida
    assert "seco: no se escribió nada" in salida
    assert (operativo / "backend/app/comun.py").read_text(encoding="utf-8") == "viejo"


def test_aplicar_copia_solo_compartido_y_respeta_las_exclusiones(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    academicos = crear_repo(
        tmp_path / "academico",
        {
            "backend/app/comun.py": "academico",
            "backend/app/igual.py": "igual",
            "backend/app/.env": "SECRETO=academico",
            "backend/app/pesos.pt": "pesos academicos",
            "backend/app/node_modules/paquete/index.js": "academico",
            "frontend/src/screens/Pantalla.tsx": "academico",
            "infra/despliegue.sh": "academico",
            "docs/referencia/tesis.md": "academico",
        },
    )
    operativo = crear_repo(
        tmp_path / "operativo",
        {
            "backend/app/comun.py": "operativo",
            "backend/app/igual.py": "igual",
            "backend/app/.env": "SECRETO=operativo",
            "backend/app/pesos.pt": "pesos operativos",
            "backend/app/node_modules/paquete/index.js": "operativo",
            "frontend/src/screens/Pantalla.tsx": "operativo",
            "docs/referencia/tesis.md": "operativo",
        },
    )
    reglas = escribir_reglas(
        tmp_path / "reglas.json",
        compartido=("backend/app/**",),
        adaptar=("frontend/src/screens/**",),
        independiente=("infra/**", "docs/**"),
    )

    monkeypatch.chdir(operativo)
    codigo = sincronizar.main(
        ["aplicar", "--academico", str(academicos)], ruta_reglas=reglas
    )
    salida = capsys.readouterr().out

    assert codigo == 0
    # Solo la ruta compartida y no excluida se copia.
    assert (operativo / "backend/app/comun.py").read_text(encoding="utf-8") == "academico"
    assert "APLICADAS 1" in salida
    assert "YA_IGUALES 1" in salida
    assert "OMITIDAS 3" in salida
    # Excluidos y no compartidos quedan intactos.
    assert (operativo / "backend/app/.env").read_text(encoding="utf-8") == "SECRETO=operativo"
    assert (operativo / "backend/app/pesos.pt").read_text(encoding="utf-8") == "pesos operativos"
    assert (
        operativo / "backend/app/node_modules/paquete/index.js"
    ).read_text(encoding="utf-8") == "operativo"
    assert (
        operativo / "frontend/src/screens/Pantalla.tsx"
    ).read_text(encoding="utf-8") == "operativo"
    assert (operativo / "docs/referencia/tesis.md").read_text(encoding="utf-8") == "operativo"
    # Ningún archivo nuevo fuera de lo compartido.
    assert not (operativo / "infra/despliegue.sh").exists()


def test_aplicar_con_sin_regla_sale_3_sin_escribir(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    academicos = crear_repo(
        tmp_path / "academico",
        {"backend/app/comun.py": "nuevo", "raro/archivo.txt": "nuevo"},
    )
    operativo = crear_repo(
        tmp_path / "operativo",
        {"backend/app/comun.py": "viejo", "raro/archivo.txt": "viejo"},
    )
    reglas = escribir_reglas(tmp_path / "reglas.json", compartido=("backend/app/**",))

    monkeypatch.chdir(operativo)
    codigo = sincronizar.main(
        ["aplicar", "--academico", str(academicos)], ruta_reglas=reglas
    )
    salida = capsys.readouterr()

    assert codigo == 3
    assert "SIN_REGLA raro/archivo.txt" in salida.err
    assert "APLICADAS" not in salida.out
    assert (operativo / "backend/app/comun.py").read_text(encoding="utf-8") == "viejo"
    assert (operativo / "raro/archivo.txt").read_text(encoding="utf-8") == "viejo"


# --------------------------------------------------------------------------- #
# verificar
# --------------------------------------------------------------------------- #


def test_verificar_registrar_escribe_el_lock(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    archivos = {
        "contracts/openapi.json": "{}",
        "frontend/src/api/schema.d.ts": "export type X = 1;",
        "backend/app/comun.py": "igual",
    }
    academicos = crear_repo(tmp_path / "academico", archivos)
    operativo = crear_repo(tmp_path / "operativo", archivos)
    reglas = escribir_reglas(tmp_path / "reglas.json", compartido=("backend/app/**",))

    monkeypatch.chdir(operativo)
    codigo = sincronizar.main(
        ["verificar", "--registrar", "--academico", str(academicos)], ruta_reglas=reglas
    )
    salida = capsys.readouterr().out

    assert codigo == 0
    assert "ok: no hay piezas compartidas pendientes" in salida
    registro = json.loads(
        (operativo / "docs/operacion/academico-sync-ultimo.json").read_text(encoding="utf-8")
    )
    assert set(registro) == {
        "commit_academico",
        "tree_academico",
        "commit_operativo",
        "fecha",
        "grupos",
        "version_reglas",
    }
    assert set(registro["grupos"]) == {"copiar", "adaptar", "independiente", "sin_regla"}
    assert registro["grupos"]["copiar"] == 0
    assert registro["version_reglas"] == 1
    assert registro["fecha"].endswith("Z")


def test_verificar_falla_si_queda_algo_por_copiar(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    academicos = crear_repo(
        tmp_path / "academico",
        {
            "backend/app/comun.py": "nuevo",
            "contracts/openapi.json": "{}",
            "frontend/src/api/schema.d.ts": "export type X = 1;",
        },
    )
    operativo = crear_repo(
        tmp_path / "operativo",
        {
            "backend/app/comun.py": "viejo",
            "contracts/openapi.json": "{}",
            "frontend/src/api/schema.d.ts": "export type X = 1;",
        },
    )
    reglas = escribir_reglas(
        tmp_path / "reglas.json", compartido=("backend/app/**", "frontend/src/api/**")
    )

    monkeypatch.chdir(operativo)
    codigo = sincronizar.main(
        ["verificar", "--academico", str(academicos)], ruta_reglas=reglas
    )
    salida = capsys.readouterr()

    assert codigo == 4
    assert "PENDIENTE backend/app/comun.py" in salida.out
    assert "pendientes de copiar" in salida.err
    assert not (operativo / "docs/operacion/academico-sync-ultimo.json").exists()
