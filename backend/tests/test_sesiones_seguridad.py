"""Bloqueo por intentos fallidos y expiración por inactividad (HU-004, HU-005)."""

from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.auth.sessions import generate_session_token, hash_token
from app.config import get_settings
from app.models import *  # noqa: F403
from app.models.auditoria import Auditoria
from app.models.instituciones import Institucion
from app.models.sesiones import Sesion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

CORREO = "seguridad@hospital.test"
PASSWORD = "pass1234567890"


@pytest.fixture(scope="session")
def db_url() -> str | None:
    return os.environ.get("TEST_DATABASE_URL")


def _usuario(db_session, correo: str = CORREO) -> Usuario:
    """Crea institución, rol de médico y usuario activo para las pruebas."""
    institucion = Institucion(nombre="Hospital Seguridad", codigo="hosp_seguridad")
    db_session.add(institucion)
    db_session.commit()
    db_session.refresh(institucion)

    rol = Rol(nombre="medico", descripcion="Médico")
    db_session.add(rol)
    db_session.commit()
    db_session.refresh(rol)

    usuario = Usuario(
        institucion_id=institucion.id,
        email=correo,
        password_hash=hash_password(correo, PASSWORD),
        nombre="Usuario de seguridad",
        activo=True,
    )
    db_session.add(usuario)
    db_session.commit()
    db_session.refresh(usuario)

    db_session.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
    db_session.commit()
    return usuario


def test_la_cuenta_se_bloquea_tras_los_intentos_configurados(
    db_url: str | None, db_session, client: TestClient
) -> None:
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")
    settings = get_settings()
    usuario = _usuario(db_session)

    for _ in range(settings.login_max_intentos):
        r = client.post("/auth/login", json={"correo": CORREO, "password": "clave-erronea"})
        assert r.status_code == 401

    db_session.expire_all()
    guardado = db_session.get(Usuario, usuario.id)
    assert guardado is not None
    assert guardado.intentos_fallidos == settings.login_max_intentos
    assert guardado.bloqueado_hasta is not None

    # Bloqueada: ni con la contraseña correcta entra, y el aviso lo explica.
    r = client.post("/auth/login", json={"correo": CORREO, "password": PASSWORD})
    assert r.status_code == 423
    cuerpo = r.json()
    assert cuerpo["error"]["code"] == "account_locked"
    assert "bloqueada" in cuerpo["error"]["message"]
    assert int(r.headers["Retry-After"]) == cuerpo["retry_after_seconds"] > 0


def test_el_bloqueo_se_levanta_al_cumplirse_el_tiempo(
    db_url: str | None, db_session, client: TestClient
) -> None:
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")
    usuario = _usuario(db_session, correo="desbloqueo@hospital.test")

    guardado = db_session.get(Usuario, usuario.id)
    assert guardado is not None
    guardado.intentos_fallidos = get_settings().login_max_intentos
    guardado.bloqueado_hasta = datetime.now(UTC) - timedelta(minutes=1)
    db_session.add(guardado)
    db_session.commit()

    r = client.post(
        "/auth/login", json={"correo": "desbloqueo@hospital.test", "password": PASSWORD}
    )
    assert r.status_code == 200
    db_session.expire_all()
    guardado = db_session.get(Usuario, usuario.id)
    assert guardado is not None
    assert guardado.intentos_fallidos == 0
    assert guardado.bloqueado_hasta is None


def test_cada_intento_fallido_queda_en_la_bitacora(
    db_url: str | None, db_session, client: TestClient
) -> None:
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")
    usuario = _usuario(db_session, correo="bitacora@hospital.test")

    for _ in range(3):
        client.post("/auth/login", json={"correo": "bitacora@hospital.test", "password": "mala"})

    eventos = (
        db_session.query(Auditoria)
        .filter(Auditoria.accion == "AUTH.LOGIN_FAILED", Auditoria.usuario_id == usuario.id)
        .order_by(Auditoria.id)
        .all()
    )
    assert len(eventos) == 3
    assert [e.detalles["attempt_count"] for e in eventos] == [1, 2, 3]
    assert all(e.detalles["reason_code"] == "invalid_credentials" for e in eventos)


def test_la_sesion_caduca_por_inactividad(
    db_url: str | None, db_session, client: TestClient
) -> None:
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")
    settings = get_settings()
    usuario = _usuario(db_session, correo="inactividad@hospital.test")
    rol_id = usuario.usuarios_roles[0].rol_id

    token = generate_session_token()
    sesion = Sesion(
        usuario_id=usuario.id,
        token_hash=hash_token(token),
        expira_en=datetime.now(UTC) + timedelta(hours=2),
        ultima_actividad=datetime.now(UTC)
        - timedelta(minutes=settings.session_inactividad_minutos + 1),
        rol_activo_id=rol_id,
    )
    db_session.add(sesion)
    db_session.commit()
    sesion_id = sesion.id

    client.cookies.set("optimus_session", token)
    r = client.get("/auth/me")
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "unauthorized"

    db_session.expire_all()
    guardada = db_session.get(Sesion, sesion_id)
    assert guardada is not None
    assert guardada.revocada_en is not None

    cierre = (
        db_session.query(Auditoria)
        .filter(Auditoria.accion == "AUTH.SESSION_END", Auditoria.usuario_id == usuario.id)
        .one()
    )
    assert cierre.detalles == {"reason_code": "inactivity_timeout"}


def test_la_actividad_renueva_la_sesion(db_url: str | None, db_session, client: TestClient) -> None:
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")
    settings = get_settings()
    usuario = _usuario(db_session, correo="actividad@hospital.test")
    rol_id = usuario.usuarios_roles[0].rol_id

    token = generate_session_token()
    hace_un_minuto = datetime.now(UTC) - timedelta(minutes=1)
    sesion = Sesion(
        usuario_id=usuario.id,
        token_hash=hash_token(token),
        expira_en=datetime.now(UTC) + timedelta(hours=2),
        ultima_actividad=hace_un_minuto,
        rol_activo_id=rol_id,
    )
    db_session.add(sesion)
    db_session.commit()
    sesion_id = sesion.id

    client.cookies.set("optimus_session", token)
    r = client.get("/auth/me")
    assert r.status_code == 200
    restante = r.json()["segundos_para_expirar"]
    assert 0 < restante <= settings.session_inactividad_minutos * 60

    db_session.expire_all()
    guardada = db_session.get(Sesion, sesion_id)
    assert guardada is not None
    assert guardada.ultima_actividad.astimezone(UTC) > hace_un_minuto
    assert guardada.revocada_en is None
