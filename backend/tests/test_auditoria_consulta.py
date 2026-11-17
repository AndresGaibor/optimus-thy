"""Consulta filtrable de la bitácora (HU-020)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.models.auditoria import Auditoria
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"


def _usuario(db, institucion, correo: str, rol: Rol) -> Usuario:
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
    return usuario


@pytest.fixture()
def mundo(db_session):
    espoch = Institucion(nombre="ESPOCH", codigo="ESPOCH")
    solca = Institucion(nombre="SOLCA", codigo="SOLCA")
    db_session.add_all([espoch, solca])
    db_session.commit()
    admin = Rol(nombre="admin", descripcion="admin")
    doctor = Rol(nombre="doctor", descripcion="doctor")
    db_session.add_all([admin, doctor])
    db_session.commit()
    return {
        "institucion": espoch,
        "otra": solca,
        "admin": _usuario(db_session, espoch, "admin@t.com", admin),
        "medico": _usuario(db_session, espoch, "medico@t.com", doctor),
        "admin_solca": _usuario(db_session, solca, "admin-solca@t.com", admin),
    }


def _entrar(client: TestClient, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def _evento(
    db,
    mundo,
    *,
    accion: str = "PATIENTS.CASE_CREATE",
    entidad: str = "CASE",
    usuario=None,
    institucion=None,
    ocurrido_en: datetime | None = None,
) -> Auditoria:
    fila = Auditoria(
        usuario_id=(usuario or mundo["admin"]).id,
        institucion_id=(institucion or mundo["institucion"]).id,
        accion=accion,
        entidad=entidad,
        entidad_id="00000000-0000-0000-0000-000000000001",
        ocurrido_en=ocurrido_en or datetime.now(UTC),
    )
    db.add(fila)
    db.commit()
    return fila


def test_admin_consulta_bitacora_de_su_institucion(client, mundo, db_session) -> None:
    _evento(db_session, mundo, accion="PATIENTS.CASE_CREATE", entidad="CASE")
    _evento(
        db_session,
        mundo,
        usuario=mundo["medico"],
        accion="INFERENCE.INFERENCE_READ",
        entidad="INFERENCE",
    )
    _evento(
        db_session,
        mundo,
        institucion=mundo["otra"],
        usuario=mundo["admin_solca"],
        accion="PATIENTS.CASE_CREATE",
    )
    _entrar(client, mundo["admin"].email)

    respuesta = client.get("/auditoria", params={"accion": "PATIENTS"})

    assert respuesta.status_code == 200, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["total"] == 1
    assert cuerpo["items"][0]["accion"] == "PATIENTS.CASE_CREATE"
    assert cuerpo["items"][0]["usuario_id"] == str(mundo["admin"].id)


def test_filtros_combinables(client, mundo, db_session) -> None:
    _evento(db_session, mundo, accion="AUTH.LOGIN_FAILED", entidad="USER")
    _evento(
        db_session,
        mundo,
        accion="AUTH.SESSION_START",
        entidad="USER",
        usuario=mundo["medico"],
        ocurrido_en=datetime(2026, 1, 15, 10, tzinfo=UTC),
    )
    _entrar(client, mundo["admin"].email)

    por_usuario = client.get("/auditoria", params={"usuario": str(mundo["medico"].id)})
    assert por_usuario.status_code == 200, por_usuario.text
    assert por_usuario.json()["total"] == 1
    assert por_usuario.json()["items"][0]["accion"] == "AUTH.SESSION_START"

    por_accion = client.get("/auditoria", params={"accion": "AUTH.LOGIN"})
    assert por_accion.json()["total"] == 1

    por_fecha = client.get("/auditoria", params={"desde": "2026-01-01", "hasta": "2026-01-31"})
    assert por_fecha.json()["total"] == 1

    por_recurso = client.get("/auditoria", params={"recurso": "CASE"})
    assert por_recurso.json()["total"] == 0


def test_paginacion(client, mundo, db_session) -> None:
    for indice in range(3):
        _evento(
            db_session,
            mundo,
            accion="INFERENCE.INFERENCE_READ",
            entidad="INFERENCE",
            ocurrido_en=datetime.now(UTC) - timedelta(minutes=indice),
        )
    _entrar(client, mundo["admin"].email)

    respuesta = client.get("/auditoria", params={"accion": "INFERENCE", "limite": 2})

    assert respuesta.status_code == 200, respuesta.text
    assert respuesta.json()["total"] == 3
    assert len(respuesta.json()["items"]) == 2


def test_la_consulta_queda_registrada(client, mundo, db_session) -> None:
    _entrar(client, mundo["admin"].email)

    client.get("/auditoria")

    fila = db_session.query(Auditoria).filter(Auditoria.accion == "AUDIT.AUDIT_READ").one()
    assert fila.usuario_id == mundo["admin"].id


def test_rol_sin_permiso_da_403(client, mundo) -> None:
    _entrar(client, mundo["medico"].email)

    respuesta = client.get("/auditoria")

    assert respuesta.status_code == 403


def test_parametros_invalidos_dan_422(client, mundo) -> None:
    _entrar(client, mundo["admin"].email)

    usuario = client.get("/auditoria", params={"usuario": "no-es-uuid"})
    assert usuario.status_code == 422
    assert usuario.json()["error"]["code"] == "validation_error"

    fechas = client.get("/auditoria", params={"desde": "2026-02-01", "hasta": "2026-01-01"})
    assert fechas.status_code == 422

    recurso = client.get("/auditoria", params={"recurso": "INVENTADO"})
    assert recurso.status_code == 422
