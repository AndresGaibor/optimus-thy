"""Lectura ordenada y aislada de la cronología de un caso."""

# ruff: noqa: F811

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from itertools import pairwise

from fastapi.testclient import TestClient
from test_decisiones import _caso, _entrar, _inferencia, mundo  # noqa: F401

from app.models.imagenes import Imagen


def test_cronologia_orden_descendente_y_tipos(client: TestClient, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    anterior = Imagen(
        caso_id=caso_id,
        ruta_s3="s3://synthetic/one",
        hash_sha256="a" * 64,
        creado_en=datetime.now(UTC) - timedelta(days=1),
    )
    reciente = Imagen(
        caso_id=caso_id,
        ruta_s3="s3://synthetic/two",
        hash_sha256="b" * 64,
        creado_en=datetime.now(UTC),
    )
    db_session.add_all([anterior, reciente])
    db_session.commit()

    _inferencia(db_session, caso_id)
    respuesta = client.get(f"/casos/{caso_id}/cronologia")

    assert respuesta.status_code == 200, respuesta.text
    items = respuesta.json()["items"]
    assert {item["tipo"] for item in items} == {"imagen", "inferencia"}
    assert all(
        primero["ocurrido_en"] >= siguiente["ocurrido_en"] for primero, siguiente in pairwise(items)
    )


def test_caso_de_otra_institucion_responde_404(client: TestClient, mundo) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _entrar(client, mundo["medico_solca"])
    respuesta = client.get(f"/casos/{caso_id}/cronologia")
    assert respuesta.status_code == 404
    assert respuesta.json()["error"]["code"] == "not_found"


def test_sin_permiso_responde_403(client: TestClient, mundo) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _entrar(client, mundo["lector"])
    assert client.get(f"/casos/{caso_id}/cronologia").status_code == 403
