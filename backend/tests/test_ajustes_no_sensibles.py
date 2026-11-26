"""Ajustes no sensibles: sin secretos en la respuesta y con bitácora (TES-359)."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

from app.models.auditoria import Auditoria
from app.models.correo import ConfiguracionCorreo
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.encryption import get_cipher
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"
SECRETO = "abcd efgh ijkl mnop"


def _skip_if_no_db() -> None:
    if not os.environ.get("TEST_DATABASE_URL"):
        pytest.skip("TEST_DATABASE_URL no definida")


@pytest.fixture()
def mundo(db_session):
    institucion = Institucion(nombre="ESPOCH", codigo="ESPOCH")
    db_session.add(institucion)
    db_session.commit()
    admin_rol = Rol(nombre="admin", descripcion="admin")
    doctor_rol = Rol(nombre="doctor", descripcion="doctor")
    db_session.add_all([admin_rol, doctor_rol])
    db_session.commit()
    admin = Usuario(
        email="admin@t.com",
        nombre="Admin",
        institucion_id=institucion.id,
        activo=True,
        password_hash=hash_password("admin@t.com", CLAVE),
    )
    doctor = Usuario(
        email="doctor@t.com",
        nombre="Doctor",
        institucion_id=institucion.id,
        activo=True,
        password_hash=hash_password("doctor@t.com", CLAVE),
    )
    db_session.add_all([admin, doctor])
    db_session.commit()
    db_session.add(UsuarioRol(usuario_id=admin.id, rol_id=admin_rol.id))
    db_session.add(UsuarioRol(usuario_id=doctor.id, rol_id=doctor_rol.id))
    db_session.commit()
    return {"admin": admin, "doctor": doctor}


def _entrar(client: TestClient, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def _cuerpo(password: str | None = SECRETO) -> dict[str, object]:
    datos: dict[str, object] = {
        "host": "smtp.gmail.com",
        "puerto": 587,
        "seguridad": "starttls",
        "usuario": "cuenta@gmail.com",
        "remitente": "cuenta@gmail.com",
        "remitente_nombre": "OPTIMUS-THY",
        "activo": True,
    }
    if password is not None:
        datos["password"] = password
    return datos


def test_consultar_ajustes_no_devuelve_el_secreto(db_session, client, mundo):
    _skip_if_no_db()
    _entrar(client, "admin@t.com")
    guardado = client.put("/configuracion-correo", json=_cuerpo())
    assert guardado.status_code == 200, guardado.text

    leido = client.get("/configuracion-correo")
    assert leido.status_code == 200, leido.text
    cuerpo = leido.json()
    assert cuerpo["tiene_password"] is True
    assert SECRETO not in leido.text
    assert "password" not in cuerpo
    assert "password_cifrado" not in cuerpo

    fila = db_session.get(ConfiguracionCorreo, 1)
    assert fila is not None
    assert get_cipher().decrypt(fila.password_cifrado) == SECRETO


def test_cambiar_un_ajuste_queda_en_la_bitacora_sin_el_secreto(db_session, client, mundo):
    _skip_if_no_db()
    _entrar(client, "admin@t.com")
    respuesta = client.put("/configuracion-correo", json=_cuerpo())
    assert respuesta.status_code == 200, respuesta.text

    evento = (
        db_session.query(Auditoria)
        .filter(Auditoria.accion == "ADMIN.SETTINGS_CHANGE")
        .order_by(Auditoria.id.desc())
        .first()
    )
    assert evento is not None
    assert evento.detalles == {"setting_key": "smtp", "to_status": "activo"}
    assert SECRETO not in str(evento.detalles)
    assert SECRETO not in (evento.user_agent or "")


def test_los_ajustes_exigen_permiso_de_gestion(client, mundo):
    _skip_if_no_db()
    _entrar(client, "doctor@t.com")

    assert client.get("/configuracion-correo").status_code == 403
    assert client.put("/configuracion-correo", json=_cuerpo()).status_code == 403
