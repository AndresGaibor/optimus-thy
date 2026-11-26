"""Pruebas de los flujos TOTP y recuperación de acceso."""

from __future__ import annotations

import hashlib
import os
from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, text

from app.models.auditoria import Auditoria
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password
from app.security.totp import codigo_para, generar_secreto


@pytest.fixture(scope="session")
def db_url() -> str | None:
    return os.environ.get("TEST_DATABASE_URL")


def _crear_usuario(db_session, correo: str, protegido: bool = False) -> tuple[Usuario, str]:
    contrasena = "SecretoFuerte123!"
    secreto = generar_secreto()
    institucion = Institucion(nombre="Hospital TOTP", codigo=f"h-{correo[:8]}")
    db_session.add(institucion)
    db_session.flush()
    rol = Rol(nombre="doctor", descripcion="Doctor")
    db_session.add(rol)
    db_session.flush()
    usuario = Usuario(
        institucion_id=institucion.id,
        email=correo,
        password_hash=hash_password(correo, contrasena),
        nombre="Médica de prueba",
        activo=True,
    )
    if protegido:
        usuario.totp_secreto_cifrado = secreto
        usuario.totp_activado_en = datetime.now(UTC)
    db_session.add(usuario)
    db_session.flush()
    db_session.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
    db_session.commit()
    return usuario, contrasena


def _iniciar_sesion(client: TestClient, correo: str, contrasena: str):
    return client.post("/auth/login", json={"correo": correo, "password": contrasena})


def test_login_con_totp_no_crea_cookie_hasta_validar_codigo(
    db_url: str | None, db_session, client: TestClient
) -> None:
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")
    usuario, contrasena = _crear_usuario(db_session, "totp-login@example.test", protegido=True)

    desafio = _iniciar_sesion(client, usuario.email, contrasena)

    assert desafio.status_code == 202
    assert desafio.json()["requiere_otp"] is True
    assert desafio.json()["segundos_para_expirar"] == 300
    assert "desafio" in desafio.json()
    assert "set-cookie" not in desafio.headers

    codigo = codigo_para(usuario.totp_secreto_cifrado, datetime.now(UTC))
    respuesta = client.post(
        "/auth/login/otp", json={"desafio": desafio.json()["desafio"], "codigo": codigo}
    )

    assert respuesta.status_code == 200
    assert "set-cookie" in respuesta.headers
    assert client.get("/auth/me").json()["segundo_factor_activo"] is True


def test_desafio_otp_agota_al_quinto_intento(
    db_url: str | None, db_session, client: TestClient
) -> None:
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")
    usuario, contrasena = _crear_usuario(db_session, "totp-intentos@example.test", protegido=True)
    inicio = _iniciar_sesion(client, usuario.email, contrasena)
    assert inicio.status_code == 202
    desafio = inicio.json()["desafio"]

    for _ in range(5):
        respuesta = client.post("/auth/login/otp", json={"desafio": desafio, "codigo": "000000"})
        assert respuesta.status_code == 401
        assert respuesta.json()["error"]["code"] == "codigo_invalido"

    vencido = client.post("/auth/login/otp", json={"desafio": desafio, "codigo": "000000"})
    assert vencido.status_code == 410
    assert vencido.json()["error"]["code"] == "desafio_expirado"


def test_desafio_otp_expirado_responde_410(
    db_url: str | None, db_session, client: TestClient
) -> None:
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")
    usuario, contrasena = _crear_usuario(db_session, "totp-expira@example.test", protegido=True)
    inicio = _iniciar_sesion(client, usuario.email, contrasena)
    assert inicio.status_code == 202
    token = inicio.json()["desafio"]
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    db_session.execute(
        text(
            "UPDATE desafios_otp SET expira_en = now() - interval '1 minute' "
            "WHERE token_hash = :hash"
        ),
        {"hash": token_hash},
    )
    db_session.commit()

    respuesta = client.post("/auth/login/otp", json={"desafio": token, "codigo": "000000"})

    assert respuesta.status_code == 410
    assert respuesta.json()["error"]["code"] == "desafio_expirado"


def test_codigo_de_recuperacion_solo_se_usa_una_vez(
    db_url: str | None, db_session, client: TestClient
) -> None:
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")
    usuario, contrasena = _crear_usuario(db_session, "totp-recuperacion@example.test")
    assert _iniciar_sesion(client, usuario.email, contrasena).status_code == 200

    inicio = client.post("/auth/2fa/iniciar")
    assert inicio.status_code == 200
    codigo = codigo_para(inicio.json()["secreto"], datetime.now(UTC))
    confirmado = client.post("/auth/2fa/confirmar", json={"codigo": codigo})
    assert confirmado.status_code == 200
    codigos = confirmado.json()["codigos_recuperacion"]
    assert len(codigos) == 10
    assert client.get("/auth/me").json()["segundo_factor_activo"] is True
    assert client.post("/auth/logout").status_code == 204

    inicio = _iniciar_sesion(client, usuario.email, contrasena)
    assert inicio.status_code == 202
    desafio = inicio.json()["desafio"]
    primer_uso = client.post("/auth/login/otp", json={"desafio": desafio, "codigo": codigos[0]})
    assert primer_uso.status_code == 200
    assert client.post("/auth/logout").status_code == 204

    segundo_inicio = _iniciar_sesion(client, usuario.email, contrasena)
    assert segundo_inicio.status_code == 202
    segundo_desafio = segundo_inicio.json()["desafio"]
    segundo_uso = client.post(
        "/auth/login/otp", json={"desafio": segundo_desafio, "codigo": codigos[0]}
    )
    assert segundo_uso.status_code == 401
    assert segundo_uso.json()["error"]["code"] == "codigo_invalido"


def test_desactivar_2fa_exige_contrasena_y_audita_sin_secretos(
    db_url: str | None, db_session, client: TestClient
) -> None:
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")
    usuario, contrasena = _crear_usuario(db_session, "totp-desactivar@example.test", protegido=True)
    inicio = _iniciar_sesion(client, usuario.email, contrasena)
    assert inicio.status_code == 202
    token = inicio.json()["desafio"]
    codigo = codigo_para(usuario.totp_secreto_cifrado, datetime.now(UTC))
    assert (
        client.post("/auth/login/otp", json={"desafio": token, "codigo": codigo}).status_code == 200
    )

    fallo = client.post("/auth/2fa/desactivar", json={"password": "incorrecta"})
    assert fallo.status_code == 400
    assert client.get("/auth/me").json()["segundo_factor_activo"] is True

    respuesta = client.post("/auth/2fa/desactivar", json={"password": contrasena})
    assert respuesta.status_code == 204
    assert client.get("/auth/me").json()["segundo_factor_activo"] is False

    eventos = db_session.scalars(select(Auditoria).order_by(Auditoria.id)).all()
    acciones = {evento.accion for evento in eventos}
    assert "AUTH.AUTH_2FA_DISABLED" in acciones
    assert all("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ" not in str(evento.detalles) for evento in eventos)
