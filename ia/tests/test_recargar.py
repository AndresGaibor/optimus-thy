"""``/recargar`` relee los pesos sin reiniciar el proceso (HT-062)."""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(autouse=True)
def sin_modelos(monkeypatch: pytest.MonkeyPatch, tmp_path: Any) -> None:
    """Sin pesos: la recarga debe quedar degradada, no fallar."""
    monkeypatch.delenv("IA_MODELOS_DIR", raising=False)
    monkeypatch.chdir(tmp_path)


def test_recargar_sin_pesos_responde_degradado() -> None:
    with TestClient(app) as cliente:
        respuesta = cliente.post("/recargar")

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["status"] == "degradado"
    assert cuerpo["huella_modelos"] == ""
    assert cuerpo["faltantes"] == ["detector", "segmentador", "clasificador"]
    assert [cuerpo["estados"][nombre]["cargado"] for nombre in cuerpo["estados"]] == [
        False,
        False,
        False,
    ]


def test_recargar_cambia_la_huella_cuando_cambian_los_pesos(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Any
) -> None:
    monkeypatch.setenv("IA_MODELOS_DIR", str(tmp_path))
    peso = tmp_path / "best_yolo.pt"
    peso.write_bytes(b"uno")

    with TestClient(app) as cliente:
        primera = cliente.post("/recargar").json()
        peso.write_bytes(b"dos")
        segunda = cliente.post("/recargar").json()

    assert primera["status"] == "degradado"
    assert primera["huella_modelos"]
    assert primera["huella_modelos"] != segunda["huella_modelos"]


def test_recargar_con_version_carga_esa_carpeta(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Any
) -> None:
    monkeypatch.setenv("IA_MODELOS_DIR", str(tmp_path))
    carpeta = tmp_path / "modelo" / "v1"
    carpeta.mkdir(parents=True)
    (carpeta / "best_yolo.pt").write_bytes(b"peso")

    with TestClient(app) as cliente:
        raiz = cliente.post("/recargar").json()
        version = cliente.post("/recargar", params={"version": "modelo/v1"}).json()
        invalida = cliente.post("/recargar", params={"version": "../otra"})

    assert raiz["huella_modelos"] != version["huella_modelos"]
    assert version["huella_modelos"]
    assert version["estados"]["detector"]["sha256"]
    assert "modelo/v1" in version["estados"]["detector"]["detalle"] or (
        version["estados"]["detector"]["sha256"] is not None
    )
    assert invalida.status_code == 400
