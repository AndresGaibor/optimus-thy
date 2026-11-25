"""Cambio de contraseña autenticado (HU-006, RS-ACC-01)."""

from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.auth.sessions import create_session
from app.models.auditoria import Auditoria
from app.models.instituciones import Institucion
from app.models.sesiones import Sesion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password, verify_password

CLAVE_ACTUAL = "ClaveActual-2026"
CLAVE_NUEVA = "ClaveNueva-2026!"
# Valor que el servidor rechaza: no es la contraseña de la cuenta.
CLAVE_ERRONEA = "no-es-la-actual"
CORREO = "perfil@hospital.test"


@pytest.fixture(scope="session")
def db_url() -> str | None:
    return os.environ.get("TEST_DATABASE_URL")


def _crear_usuario(db_session) -> tuple[Usuario, Rol]:
    institucion = Institucion(nombre="Hospital Perfil", codigo="hosp_perfil")
    db_session.add(institucion)
    db_session.commit()
    db_session.refresh(institucion)

    rol = Rol(nombre="doctor", descripcion="Doctor")
    db_session.add(rol)
    db_session.commit()
    db_session.refresh(rol)

    usuario = Usuario(
        institucion_id=institucion.id,
        email=CORREO,
        password_hash=hash_password(CORREO, CLAVE_ACTUAL),
        nombre="Perfil",
        activo=True,
    )
    db_session.add(usuario)
    db_session.commit()
    db_session.refresh(usuario)
    db_session.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
    db_session.commit()
    return usuario, rol


def _sesion(db_session, usuario: Usuario, rol: Rol) -> str:
    _, token = create_session(db_session, usuario.id, rol_activo_id=rol.id)
    return token


def test_cambio_password_sin_sesion_401(db_url: str | None, client: TestClient):
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")

    respuesta = client.put(
        "/auth/password",
        json={"password_actual": CLAVE_ACTUAL, "password_nueva": CLAVE_NUEVA},
    )
    assert respuesta.status_code == 401


def test_cambio_password_exige_la_actual(db_url: str | None, db_session, client: TestClient):
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")

    usuario, rol = _crear_usuario(db_session)
    client.cookies.set("optimus_session", _sesion(db_session, usuario, rol))

    respuesta = client.put(
        "/auth/password",
        json={"password_actual": CLAVE_ERRONEA, "password_nueva": CLAVE_NUEVA},
    )

    assert respuesta.status_code == 400
    assert respuesta.json()["error"]["code"] == "password_actual_incorrecta"
    db_session.expire_all()
    guardado = db_session.get(Usuario, usuario.id)
    assert guardado is not None
    assert verify_password(CLAVE_ACTUAL, guardado.password_hash or "")[0]


def test_cambio_password_valida_politica(db_url: str | None, db_session, client: TestClient):
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")

    usuario, rol = _crear_usuario(db_session)
    client.cookies.set("optimus_session", _sesion(db_session, usuario, rol))

    corta = client.put(
        "/auth/password",
        json={"password_actual": CLAVE_ACTUAL, "password_nueva": "Corta-2026"},
    )
    assert corta.status_code == 400
    assert corta.json()["error"]["code"] == "password_corta"

    filtrada = client.put(
        "/auth/password",
        json={"password_actual": CLAVE_ACTUAL, "password_nueva": "password1234"},
    )
    assert filtrada.status_code == 400
    assert filtrada.json()["error"]["code"] == "password_filtrada"

    db_session.expire_all()
    guardado = db_session.get(Usuario, usuario.id)
    assert guardado is not None
    assert verify_password(CLAVE_ACTUAL, guardado.password_hash or "")[0]


def test_cambio_password_rechaza_la_misma(db_url: str | None, db_session, client: TestClient):
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")

    usuario, rol = _crear_usuario(db_session)
    client.cookies.set("optimus_session", _sesion(db_session, usuario, rol))

    respuesta = client.put(
        "/auth/password",
        json={"password_actual": CLAVE_ACTUAL, "password_nueva": CLAVE_ACTUAL},
    )

    assert respuesta.status_code == 400
    assert respuesta.json()["error"]["code"] == "password_repetida"


def test_cambio_password_guarda_hash_revoca_las_demas_y_audita(
    db_url: str | None, db_session, client: TestClient
):
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")

    usuario, rol = _crear_usuario(db_session)
    token_actual = _sesion(db_session, usuario, rol)
    token_otra = _sesion(db_session, usuario, rol)
    client.cookies.set("optimus_session", token_actual)

    respuesta = client.put(
        "/auth/password",
        json={"password_actual": CLAVE_ACTUAL, "password_nueva": CLAVE_NUEVA},
    )
    assert respuesta.status_code == 204

    db_session.expire_all()
    guardado = db_session.get(Usuario, usuario.id)
    assert guardado is not None
    assert guardado.password_hash is not None
    assert verify_password(CLAVE_NUEVA, guardado.password_hash)[0]
    assert not verify_password(CLAVE_ACTUAL, guardado.password_hash)[0]

    # La sesión que hizo el cambio sigue viva; la otra queda revocada.
    assert client.get("/auth/me").status_code == 200
    assert client.get("/auth/me", cookies={"optimus_session": token_otra}).status_code == 401

    sesiones = (
        db_session.query(Sesion)
        .filter(Sesion.usuario_id == usuario.id)
        .order_by(Sesion.creada_en)
        .all()
    )
    revocadas = [sesion for sesion in sesiones if sesion.revocada_en is not None]
    assert len(revocadas) == 1
    assert len(sesiones) == 2

    evento = db_session.query(Auditoria).filter(Auditoria.accion == "AUTH.PASSWORD_CHANGE").one()
    assert evento.detalles is not None
    assert evento.detalles["reason_code"] == "password_change"
    assert evento.detalles["resource_count"] == 1
    serializado = repr(
        {columna.name: getattr(evento, columna.name) for columna in Auditoria.__table__.columns}
    )
    assert CLAVE_ACTUAL not in serializado
    assert CLAVE_NUEVA not in serializado


def test_cambio_password_renueva_la_sesion_actual(
    db_url: str | None, db_session, client: TestClient
):
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")

    usuario, rol = _crear_usuario(db_session)
    token = _sesion(db_session, usuario, rol)
    client.cookies.set("optimus_session", token)
    sesion = db_session.query(Sesion).filter(Sesion.usuario_id == usuario.id).one()
    antes = datetime.now(UTC) - timedelta(minutes=10)
    sesion.ultima_actividad = antes
    db_session.add(sesion)
    db_session.commit()

    respuesta = client.put(
        "/auth/password",
        json={"password_actual": CLAVE_ACTUAL, "password_nueva": CLAVE_NUEVA},
    )
    assert respuesta.status_code == 204

    db_session.expire_all()
    renovada = db_session.get(Sesion, sesion.id)
    assert renovada is not None
    assert renovada.revocada_en is None
    assert renovada.ultima_actividad > antes
