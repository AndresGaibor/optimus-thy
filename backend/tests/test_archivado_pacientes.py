"""Pruebas TES-362: archivado reversible de pacientes."""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect

from app.models.auditoria import Auditoria
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"


def _usuario(db, institucion, correo: str, rol: Rol) -> str:
    usuario = Usuario(
        email=correo,
        nombre=correo,
        institucion_id=institucion.id,
        activo=True,
        password_hash=hash_password(correo, CLAVE),
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    db.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
    db.commit()
    return correo


@pytest.fixture()
def mundo(db_session):
    espoch = Institucion(nombre="ESPOCH", codigo="ESPOCH")
    solca = Institucion(nombre="SOLCA", codigo="SOLCA")
    db_session.add_all([espoch, solca])
    db_session.commit()
    roles = {
        nombre: Rol(nombre=nombre, descripcion=nombre)
        for nombre in ("admin", "doctor", "researcher")
    }
    db_session.add_all(roles.values())
    db_session.commit()
    return {
        "medico": _usuario(db_session, espoch, "medico@t.com", roles["doctor"]),
        "otro_medico": _usuario(db_session, espoch, "otro@t.com", roles["doctor"]),
        "medico_solca": _usuario(db_session, solca, "solca@t.com", roles["doctor"]),
        "admin": _usuario(db_session, espoch, "admin@t.com", roles["admin"]),
        "investigador": _usuario(db_session, espoch, "inv@t.com", roles["researcher"]),
    }


def _entrar(client: TestClient, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def _alta(client: TestClient) -> dict:
    respuesta = client.post(
        "/pacientes",
        json={
            "nombres": "Ana",
            "apellidos": "García",
            "documento": f"DOC-{uuid.uuid4().hex[:8].upper()}",
            "fecha_nacimiento": "1990-05-10",
        },
    )
    assert respuesta.status_code == 201, respuesta.text
    return respuesta.json()


def _eventos_archivo(db_session) -> list[Auditoria]:
    db_session.expire_all()
    return (
        db_session.query(Auditoria)
        .filter(Auditoria.accion.in_(("PATIENTS.PATIENT_ARCHIVE", "PATIENTS.PATIENT_UNARCHIVE")))
        .order_by(Auditoria.id)
        .all()
    )


def test_migracion_agrega_estado_y_referencia_de_archivado(test_engine):
    inspector = inspect(test_engine)
    columnas = {columna["name"] for columna in inspector.get_columns("pacientes")}
    assert {"archivado_en", "archivado_por_id"} <= columnas
    fk_archivado = next(
        llave
        for llave in inspector.get_foreign_keys("pacientes")
        if llave["constrained_columns"] == ["archivado_por_id"]
    )
    assert fk_archivado["referred_table"] == "usuarios"
    assert fk_archivado["options"]["ondelete"] == "SET NULL"


def test_archiva_y_reactiva_sin_perder_casos_y_audita_solo_ids(client, mundo, db_session):
    _entrar(client, mundo["medico"])
    paciente = _alta(client)
    caso = client.post(f"/pacientes/{paciente['id']}/casos")
    assert caso.status_code == 201, caso.text

    archivado = client.post(f"/pacientes/{paciente['id']}/archivar")
    assert archivado.status_code == 200, archivado.text
    assert archivado.json()["archivado_en"]
    assert "archivado_por_id" not in archivado.json()

    detalle = client.get(f"/pacientes/{paciente['id']}")
    assert detalle.status_code == 200
    assert detalle.json()["archivado_en"] == archivado.json()["archivado_en"]
    assert len(detalle.json()["casos"]) == 1

    reactivado = client.post(f"/pacientes/{paciente['id']}/desarchivar")
    assert reactivado.status_code == 200, reactivado.text
    assert reactivado.json()["archivado_en"] is None
    assert len(client.get(f"/pacientes/{paciente['id']}").json()["casos"]) == 1

    eventos = _eventos_archivo(db_session)
    assert [evento.accion for evento in eventos] == [
        "PATIENTS.PATIENT_ARCHIVE",
        "PATIENTS.PATIENT_UNARCHIVE",
    ]
    assert all(evento.entidad_id == paciente["id"] for evento in eventos)
    assert all(evento.usuario_id is not None and evento.detalles is None for evento in eventos)


def test_listado_excluye_archivados_y_los_incluye_solo_a_pedido(client, mundo):
    _entrar(client, mundo["medico"])
    activo = _alta(client)
    archivado = _alta(client)
    assert client.post(f"/pacientes/{archivado['id']}/archivar").status_code == 200

    listado = client.get("/pacientes")
    assert listado.status_code == 200
    assert listado.json()["total"] == 1
    assert [item["id"] for item in listado.json()["items"]] == [activo["id"]]
    assert listado.json()["items"][0]["archivado_en"] is None

    completo = client.get("/pacientes", params={"incluir_archivados": "true"})
    assert completo.status_code == 200
    assert completo.json()["total"] == 2
    filas = {item["id"]: item for item in completo.json()["items"]}
    assert filas[activo["id"]]["archivado_en"] is None
    assert filas[archivado["id"]]["archivado_en"]


def test_no_crea_casos_para_pacientes_archivados(client, mundo, db_session):
    _entrar(client, mundo["medico"])
    paciente = _alta(client)
    assert client.post(f"/pacientes/{paciente['id']}/archivar").status_code == 200

    respuesta = client.post(f"/pacientes/{paciente['id']}/casos")
    assert respuesta.status_code == 409
    assert respuesta.json()["error"]["code"] == "paciente_archivado"
    eventos = db_session.query(Auditoria).filter(Auditoria.accion == "PATIENTS.CASE_CREATE")
    assert eventos.count() == 0


def test_rechaza_transiciones_repetidas_y_pacientes_de_otra_institucion(client, mundo, db_session):
    _entrar(client, mundo["medico"])
    propio = _alta(client)
    ajeno = _alta(client)
    _entrar(client, mundo["medico_solca"])

    fuera = client.post(f"/pacientes/{propio['id']}/archivar")
    assert fuera.status_code == 404
    assert fuera.json()["error"]["code"] == "not_found"

    _entrar(client, mundo["medico"])
    assert client.post(f"/pacientes/{ajeno['id']}/archivar").status_code == 200
    repetido = client.post(f"/pacientes/{ajeno['id']}/archivar")
    assert repetido.status_code == 409
    assert repetido.json()["error"]["code"] == "paciente_ya_archivado"
    assert client.post("/pacientes/no-es-uuid/archivar").json()["error"]["code"] == "not_found"

    assert client.post(f"/pacientes/{ajeno['id']}/desarchivar").status_code == 200
    repetido = client.post(f"/pacientes/{ajeno['id']}/desarchivar")
    assert repetido.status_code == 409
    assert repetido.json()["error"]["code"] == "paciente_no_archivado"
    assert len(_eventos_archivo(db_session)) == 2


def test_archivar_exige_el_permiso_paciente_archivar(client, mundo):
    _entrar(client, mundo["medico"])
    paciente = _alta(client)
    _entrar(client, mundo["investigador"])
    respuesta = client.post(f"/pacientes/{paciente['id']}/archivar")
    assert respuesta.status_code == 403
