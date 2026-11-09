"""Pruebas de autenticación por sesiones."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

from app.models import *  # noqa: F403
from app.security.passwords import hash_password, verify_password


@pytest.fixture(scope="session")
def db_url() -> str | None:
    return os.environ.get("TEST_DATABASE_URL")


def test_hash_y_verificacion_password():
    h = hash_password("test@ejemplo.com", "Secreto123!")
    ok, newh = verify_password("Secreto123!", h)
    assert ok is True
    assert newh is None or isinstance(newh, str)


def test_verify_password_invalido():
    h = hash_password("test@ejemplo.com", "Secreto123!")
    ok, newh = verify_password("incorrecta", h)
    assert ok is False
    assert newh is None


def test_login_correcto_e_incorrecto_con_db(db_url: str | None, db_session, client: TestClient):
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")
    from app.models.instituciones import Institucion
    from app.models.usuarios import Rol, Usuario, UsuarioRol

    # Crear datos
    inst = Institucion(nombre="Hospital X", codigo="hosp_x")
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)

    rol = Rol(nombre="doctor", descripcion="Doctor")
    db_session.add(rol)
    db_session.commit()
    db_session.refresh(rol)

    user = Usuario(
        institucion_id=inst.id,
        email="doc@hosp.com",
        password_hash=hash_password("doc@hosp.com", "passw0rd!"),
        nombre="Doc",
        activo=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    ur = UsuarioRol(usuario_id=user.id, rol_id=rol.id)
    db_session.add(ur)
    db_session.commit()

    # Login correcto
    r = client.post("/auth/login", json={"correo": "doc@hosp.com", "password": "passw0rd!"})
    assert r.status_code == 200
    data = r.json()
    assert data["usuario"]["correo"] == "doc@hosp.com"
    assert "doctor" in data["roles"]
    # Cookie
    cookies_header = ""
    if hasattr(r.headers, "get_list"):
        cookies_header = ";".join(r.headers.get_list("set-cookie"))
    else:
        cookies_header = r.headers.get("set-cookie", "") or ""
    if not cookies_header:
        cookies_header = str(r.cookies.get("optimus_session", ""))
    assert "HttpOnly" in cookies_header
    assert "samesite=strict" in cookies_header.lower()
    # Login incorrecto
    r2 = client.post("/auth/login", json={"correo": "doc@hosp.com", "password": "mal"})
    assert r2.status_code == 401
    assert r2.json().get("error", {}).get("code") == "invalid_credentials"

    # Usuario inexistente mismo mensaje
    r3 = client.post("/auth/login", json={"correo": "noexiste@hosp.com", "password": "x"})
    assert r3.status_code == 401
    assert r3.json().get("error", {}).get("code") == "invalid_credentials"


def test_me_sin_sesion_401(db_url: str | None, client: TestClient):
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")

    r = client.get("/auth/me")
    assert r.status_code == 401


def test_logout_invalida_sesion(db_url: str | None, db_session, client: TestClient):
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")
    from app.models.instituciones import Institucion
    from app.models.usuarios import Rol, Usuario, UsuarioRol

    inst = Institucion(nombre="Hospital Y", codigo="hosp_y")
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    rol = Rol(nombre="admin", descripcion="Admin")
    db_session.add(rol)
    db_session.commit()
    db_session.refresh(rol)
    user = Usuario(
        institucion_id=inst.id,
        email="admin@hosp.com",
        password_hash=hash_password("admin@hosp.com", "pass1234!"),
        nombre="Admin",
        activo=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    ur = UsuarioRol(usuario_id=user.id, rol_id=rol.id)
    db_session.add(ur)
    db_session.commit()

    r = client.post("/auth/login", json={"correo": "admin@hosp.com", "password": "pass1234!"})
    assert r.status_code == 200
    cookies = client.cookies
    rme = client.get("/auth/me", cookies=cookies)
    assert rme.status_code == 200
    rlo = client.post("/auth/logout", cookies=cookies)
    assert rlo.status_code == 204
    # tras logout, con misma cookie no debe validar
    rme2 = client.get("/auth/me", cookies=cookies)
    assert rme2.status_code == 401


def test_rol_activo_no_asignado_403(db_url: str | None, db_session, client: TestClient):
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")
    from app.models.instituciones import Institucion
    from app.models.usuarios import Rol, Usuario, UsuarioRol

    inst = Institucion(nombre="Hospital Z", codigo="hosp_z")
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    rol_doc = Rol(nombre="doctor", descripcion="Doctor")
    rol_inv = Rol(nombre="investigador", descripcion="Investigador")
    db_session.add_all([rol_doc, rol_inv])
    db_session.commit()
    db_session.refresh(rol_doc)
    db_session.refresh(rol_inv)
    user = Usuario(
        institucion_id=inst.id,
        email="d2@hosp.com",
        password_hash=hash_password("d2@hosp.com", "pass1234!"),
        nombre="D2",
        activo=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    ur = UsuarioRol(usuario_id=user.id, rol_id=rol_doc.id)
    db_session.add(ur)
    db_session.commit()

    r = client.post("/auth/login", json={"correo": "d2@hosp.com", "password": "pass1234!"})
    assert r.status_code == 200
    cookies = client.cookies
    rput = client.put("/auth/rol-activo", json={"rol": "investigador"}, cookies=cookies)
    assert rput.status_code == 403
    assert rput.json().get("error", {}).get("code") == "forbidden"


def test_expiracion_venida(db_url: str | None, db_session, client: TestClient):
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")
    from datetime import UTC, datetime, timedelta

    from app.auth.sessions import generate_session_token, hash_token
    from app.models.instituciones import Institucion
    from app.models.sesiones import Sesion
    from app.models.usuarios import Rol, Usuario, UsuarioRol

    inst = Institucion(nombre="Hospital W", codigo="hosp_w")
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)
    rol = Rol(nombre="doctor", descripcion="Doctor")
    db_session.add(rol)
    db_session.commit()
    db_session.refresh(rol)
    user = Usuario(
        institucion_id=inst.id,
        email="d3@hosp.com",
        password_hash=hash_password("d3@hosp.com", "pass1234!"),
        nombre="D3",
        activo=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    ur = UsuarioRol(usuario_id=user.id, rol_id=rol.id)
    db_session.add(ur)
    db_session.commit()

    token = generate_session_token()
    ses = Sesion(
        usuario_id=user.id,
        token_hash=hash_token(token),
        expira_en=datetime.now(UTC) - timedelta(minutes=1),
        rol_activo_id=rol.id,
    )
    db_session.add(ses)
    db_session.commit()

    client.cookies.set("optimus_session", token)
    r = client.get("/auth/me")
    assert r.status_code == 401
