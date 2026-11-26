"""Versionado y consulta del historial de la ficha clínica."""

# ruff: noqa: F811
from __future__ import annotations

from fastapi.testclient import TestClient
from test_decisiones import _caso, _entrar, mundo  # noqa: F401

from app.models.auditoria import Auditoria
from app.models.fichas import FichaVersion
from app.models.usuarios import Usuario


def test_guardado_registra_autor_version_y_comparacion(
    client: TestClient, mundo, db_session
) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    primera = client.patch(f"/casos/{caso_id}/ficha", json={"tsh": "2.300", "tirads": "TR3"})
    segunda = client.patch(f"/casos/{caso_id}/ficha", json={"tsh": "2.500"})

    assert primera.status_code == 200, primera.text
    assert segunda.status_code == 200, segunda.text
    historial = client.get(f"/casos/{caso_id}/ficha/historial")
    assert historial.status_code == 200, historial.text
    versiones = historial.json()["items"]
    autor = db_session.query(Usuario).filter_by(email=mundo["medico"]).one()

    assert [item["version"] for item in versiones] == [2, 1]
    assert versiones[0]["autor_id"] == str(autor.id)
    assert versiones[0]["autor_nombre"] == autor.nombre
    assert versiones[0]["campos_cambiados"] == ["tsh"]
    assert versiones[0]["antes"]["tsh"] == "2.300"
    assert versiones[0]["despues"]["tsh"] == "2.500"
    assert versiones[0]["antes"]["tirads"] == "TR3"
    assert db_session.query(FichaVersion).filter_by(caso_id=caso_id).count() == 2

    eventos = db_session.query(Auditoria).filter_by(accion="PATIENTS.RECORD_UPDATE").all()
    assert len(eventos) == 2
    assert "changed_fields" in str(eventos[-1].detalles)
    assert "2.500" not in str(eventos[-1].detalles)


def test_guardado_sin_cambios_no_crea_otra_version(client: TestClient, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    datos = {"tsh": "2.300", "tirads": "TR3"}

    assert client.patch(f"/casos/{caso_id}/ficha", json=datos).status_code == 200
    assert client.patch(f"/casos/{caso_id}/ficha", json=datos).status_code == 200

    assert db_session.query(FichaVersion).filter_by(caso_id=caso_id).count() == 1


def test_historial_requiere_permiso_ficha_leer(client: TestClient, mundo) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _entrar(client, mundo["lector"])

    respuesta = client.get(f"/casos/{caso_id}/ficha/historial")

    assert respuesta.status_code == 403


def test_historial_no_revela_caso_de_otra_institucion(client: TestClient, mundo) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _entrar(client, mundo["medico_solca"])

    respuesta = client.get(f"/casos/{caso_id}/ficha/historial")

    assert respuesta.status_code == 404
    assert respuesta.json()["error"]["code"] == "not_found"


def test_guardado_exige_permiso_ficha_escribir(client: TestClient, mundo) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _entrar(client, mundo["lector"])

    respuesta = client.patch(f"/casos/{caso_id}/ficha", json={"tirads": "TR3"})

    assert respuesta.status_code == 403
