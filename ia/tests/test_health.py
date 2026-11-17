"""El servicio arranca sin pesos y /health lo informa sin lanzar (HT-062)."""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(autouse=True)
def sin_modelos(monkeypatch: pytest.MonkeyPatch, tmp_path: Any) -> Iterator[None]:
    """Sin IA_MODELOS_DIR no hay pesos: el arranque debe ser degradado, no fatal."""
    monkeypatch.delenv("IA_MODELOS_DIR", raising=False)
    monkeypatch.chdir(tmp_path)
    yield


def test_health_degradado_sin_pesos() -> None:
    with TestClient(app) as cliente:
        respuesta = cliente.get("/health")

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["status"] == "degradado"
    assert cuerpo["servicio"] == "ia"
    assert cuerpo["version_contrato"] == "1.1"
    assert cuerpo["huella_modelos"] == ""
    assert [
        cuerpo["modelos"][nombre]["cargado"]
        for nombre in ("detector", "segmentador", "clasificador")
    ] == [
        False,
        False,
        False,
    ]


def test_inferir_sin_modelos_responde_503() -> None:
    with TestClient(app) as cliente:
        respuesta = cliente.post(
            "/inferir", files={"imagen": ("eco.png", b"cualquier cosa", "image/png")}
        )

    assert respuesta.status_code == 503
    assert respuesta.json()["code"] == "modelo_no_disponible"
