"""Cierre, reapertura y bloqueo de cambios de la ficha clínica."""

# ruff: noqa: F811
from __future__ import annotations

from fastapi.testclient import TestClient
from test_decisiones import _caso, _entrar, mundo  # noqa: F401

from app.models.auditoria import Auditoria
from app.models.fichas import FichaVersion


def test_cerrar_bloquea_guardados_y_reabrir_los_habilita(
    client: TestClient, mundo, db_session
) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    guardado = client.patch(f"/casos/{caso_id}/ficha", json={"tirads": "TR3"})
    assert guardado.status_code == 200, guardado.text

    cierre = client.post(f"/casos/{caso_id}/ficha/cerrar")
    assert cierre.status_code == 200, cierre.text
    assert cierre.json()["cerrada_en"] is not None
    assert cierre.json()["cerrada_por_id"] is not None

    bloqueado = client.patch(f"/casos/{caso_id}/ficha", json={"tirads": "TR4"})
    assert bloqueado.status_code == 409
    assert bloqueado.json()["error"]["code"] == "ficha_cerrada"
    assert db_session.query(FichaVersion).filter_by(caso_id=caso_id).count() == 1

    reapertura = client.post(f"/casos/{caso_id}/ficha/reabrir")
    assert reapertura.status_code == 200, reapertura.text
    assert reapertura.json()["cerrada_en"] is None
    assert reapertura.json()["cerrada_por_id"] is None
    actualizado = client.patch(f"/casos/{caso_id}/ficha", json={"tirads": "TR4"})
    assert actualizado.status_code == 200, actualizado.text
    assert db_session.query(FichaVersion).filter_by(caso_id=caso_id).count() == 2


def test_cierre_y_reapertura_quedan_en_bitacora(client: TestClient, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    assert client.patch(f"/casos/{caso_id}/ficha", json={"tirads": "TR3"}).status_code == 200

    assert client.post(f"/casos/{caso_id}/ficha/cerrar").status_code == 200
    assert client.post(f"/casos/{caso_id}/ficha/reabrir").status_code == 200

    acciones = [
        accion
        for (accion,) in db_session.query(Auditoria.accion)
        .filter(Auditoria.entidad_id == caso_id)
        .all()
    ]
    assert "PATIENTS.RECORD_CLOSE" in acciones
    assert "PATIENTS.RECORD_REOPEN" in acciones


def test_cerrar_ficha_no_registrada_no_la_crea(client: TestClient, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    respuesta = client.post(f"/casos/{caso_id}/ficha/cerrar")

    assert respuesta.status_code == 404
    assert respuesta.json()["error"]["code"] == "ficha_no_encontrada"
    assert db_session.query(FichaVersion).filter_by(caso_id=caso_id).count() == 0


def test_cerrar_y_reabrir_exigen_permiso_ficha_escribir(client: TestClient, mundo) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    assert client.patch(f"/casos/{caso_id}/ficha", json={"tirads": "TR3"}).status_code == 200
    _entrar(client, mundo["lector"])

    assert client.post(f"/casos/{caso_id}/ficha/cerrar").status_code == 403
    assert client.post(f"/casos/{caso_id}/ficha/reabrir").status_code == 403
