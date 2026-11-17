"""Pruebas de administración de instituciones."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient


def _skip_if_no_db():
    if not os.environ.get("TEST_DATABASE_URL"):
        pytest.skip("TEST_DATABASE_URL no definida")


def _crear_usuario(db_session, institucion, rol, correo: str):
    from app.models.usuarios import Usuario, UsuarioRol
    from app.security.passwords import hash_password

    usuario = Usuario(
        institucion_id=institucion.id,
        email=correo,
        password_hash=hash_password(correo, "adminpass123"),
        nombre=correo,
        activo=True,
    )
    db_session.add(usuario)
    db_session.commit()
    db_session.refresh(usuario)
    db_session.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
    db_session.commit()
    return usuario


@pytest.fixture()
def admin_client(db_session, client: TestClient):
    _skip_if_no_db()
    from app.models.instituciones import Institucion
    from app.models.usuarios import Rol

    institucion = Institucion(nombre="Hospital Central", codigo="HOSP_CENTRAL")
    rol = Rol(nombre="admin", descripcion="Admin")
    db_session.add_all([institucion, rol])
    db_session.commit()
    db_session.refresh(institucion)
    db_session.refresh(rol)
    _crear_usuario(db_session, institucion, rol, "admin@test.com")

    respuesta = client.post(
        "/auth/login", json={"correo": "admin@test.com", "password": "adminpass123"}
    )
    assert respuesta.status_code == 200
    return client, institucion


def test_crea_institucion_y_normaliza_el_codigo(admin_client):
    client, _ = admin_client
    respuesta = client.post("/instituciones", json={"nombre": "SOLCA Quito", "codigo": "solca_q"})

    assert respuesta.status_code == 201
    cuerpo = respuesta.json()
    assert cuerpo["codigo"] == "SOLCA_Q"
    assert cuerpo["activa"] is True
    assert cuerpo["usuarios_activos"] == 0


def test_codigo_duplicado_devuelve_409(admin_client):
    client, _ = admin_client
    respuesta = client.post("/instituciones", json={"nombre": "Otra", "codigo": "hosp_central"})

    assert respuesta.status_code == 409
    assert respuesta.json()["error"]["code"] == "conflict"


def test_no_desactiva_una_institucion_con_usuarios_activos(admin_client):
    client, institucion = admin_client
    respuesta = client.patch(f"/instituciones/{institucion.id}", json={"activa": False})

    assert respuesta.status_code == 409
    assert "usuarios activos" in respuesta.json()["error"]["message"]


def test_desactiva_sin_usuarios_y_respeta_incluir_inactivas(admin_client):
    client, _ = admin_client
    creada = client.post("/instituciones", json={"nombre": "Temporal", "codigo": "tmp"}).json()

    respuesta = client.patch(f"/instituciones/{creada['id']}", json={"activa": False})
    assert respuesta.status_code == 200
    assert respuesta.json()["activa"] is False

    solo_activas = client.get("/instituciones").json()
    assert all(institucion["activa"] for institucion in solo_activas)
    assert creada["id"] not in [institucion["id"] for institucion in solo_activas]

    todas = client.get("/instituciones", params={"incluir_inactivas": True}).json()
    desactivada = next(item for item in todas if item["id"] == creada["id"])
    assert desactivada["activa"] is False


def test_sin_permiso_no_puede_crear(db_session, client: TestClient):
    _skip_if_no_db()
    from app.models.instituciones import Institucion
    from app.models.usuarios import Rol

    institucion = Institucion(nombre="Hospital Central", codigo="HOSP_CENTRAL")
    rol = Rol(nombre="doctor", descripcion="Doctor")
    db_session.add_all([institucion, rol])
    db_session.commit()
    db_session.refresh(institucion)
    db_session.refresh(rol)
    _crear_usuario(db_session, institucion, rol, "medico@test.com")

    assert (
        client.post(
            "/auth/login", json={"correo": "medico@test.com", "password": "adminpass123"}
        ).status_code
        == 200
    )
    respuesta = client.post("/instituciones", json={"nombre": "X", "codigo": "X1"})
    assert respuesta.status_code == 403
