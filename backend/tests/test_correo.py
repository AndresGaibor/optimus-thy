"""Correo saliente y recuperación de contraseña (TES-377)."""

from __future__ import annotations

import hashlib
import os
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.correo.servicio import render, variables_no_permitidas
from app.models.correo import TokenRecuperacion
from app.models.instituciones import Institucion
from app.models.sesiones import Sesion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password, verify_password

CLAVE = "claveSegura-123"
CLAVE_NUEVA = "nuevaClave-987"
CLAVE_OTRA = "otraClave-987"


def _skip_if_no_db():
    if not os.environ.get("TEST_DATABASE_URL"):
        pytest.skip("TEST_DATABASE_URL no definida")


@pytest.fixture()
def mundo(db_session):
    institucion = Institucion(nombre="ESPOCH", codigo="ESPOCH")
    db_session.add(institucion)
    db_session.commit()
    admin_rol = Rol(nombre="admin", descripcion="admin")
    db_session.add(admin_rol)
    db_session.commit()
    admin = Usuario(
        email="admin@t.com",
        nombre="Admin",
        institucion_id=institucion.id,
        activo=True,
        password_hash=hash_password("admin@t.com", CLAVE),
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    db_session.add(UsuarioRol(usuario_id=admin.id, rol_id=admin_rol.id))
    db_session.commit()
    return {"institucion": institucion, "admin": admin, "rol": admin_rol}


def _entrar(client: TestClient) -> None:
    respuesta = client.post("/auth/login", json={"correo": "admin@t.com", "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def _configurar(client: TestClient, *, password: str = "abcd efgh ijkl mnop") -> None:
    respuesta = client.put(
        "/configuracion-correo",
        json={
            "host": "smtp.gmail.com",
            "puerto": 587,
            "seguridad": "starttls",
            "usuario": "cuenta@gmail.com",
            "remitente": "cuenta@gmail.com",
            "remitente_nombre": "OPTIMUS-THY",
            "activo": True,
            "password": password,
        },
    )
    assert respuesta.status_code == 200, respuesta.text


def test_render_escapa_los_valores_y_solo_admite_variables_conocidas():
    salida = render("<p>Hola {{nombre}} · {{enlace}}</p>", {"nombre": "<Ada>", "enlace": "x"})
    assert "&lt;Ada&gt;" in salida
    assert "<Ada>" not in salida
    assert variables_no_permitidas("{{nombre}} {{telefono}}") == {"telefono"}


def test_la_configuracion_cifra_la_contrasena_y_no_la_devuelve(db_session, client, mundo):
    _skip_if_no_db()
    _entrar(client)
    _configurar(client)

    leida = client.get("/configuracion-correo")
    assert leida.status_code == 200
    cuerpo = leida.json()
    assert cuerpo["tiene_password"] is True
    assert cuerpo["host"] == "smtp.gmail.com"
    assert "password" not in cuerpo

    from app.models.correo import ConfiguracionCorreo
    from app.security.encryption import get_cipher

    fila = db_session.get(ConfiguracionCorreo, 1)
    assert fila is not None
    assert fila.password_cifrado is not None
    assert b"abcd efgh" not in fila.password_cifrado
    assert get_cipher().decrypt(fila.password_cifrado) == "abcd efgh ijkl mnop"


def test_activar_sin_contrasena_se_rechaza(client, mundo):
    _skip_if_no_db()
    _entrar(client)
    respuesta = client.put(
        "/configuracion-correo",
        json={
            "host": "smtp.gmail.com",
            "puerto": 587,
            "seguridad": "starttls",
            "usuario": "cuenta@gmail.com",
            "remitente": "cuenta@gmail.com",
            "activo": True,
        },
    )
    assert respuesta.status_code == 422
    assert respuesta.json()["error"]["code"] == "password_requerida"


def test_remitente_invalido_se_rechaza(client, mundo):
    _skip_if_no_db()
    _entrar(client)
    respuesta = client.put(
        "/configuracion-correo",
        json={
            "host": "smtp.gmail.com",
            "puerto": 587,
            "seguridad": "starttls",
            "usuario": "cuenta@gmail.com",
            "remitente": "no-es-correo",
            "activo": False,
        },
    )
    assert respuesta.status_code == 422
    assert respuesta.json()["error"]["code"] == "remitente_invalido"


def test_probar_sin_configuracion_devuelve_conflicto(client, mundo):
    _skip_if_no_db()
    _entrar(client)
    respuesta = client.post("/configuracion-correo/probar")
    assert respuesta.status_code == 409
    assert respuesta.json()["error"]["code"] == "correo_no_configurado"


def test_probar_con_servidor_caido_no_filtra_detalles(client, mundo, monkeypatch):
    _skip_if_no_db()
    _entrar(client)
    _configurar(client)

    def _falla(*_args, **_kwargs):
        raise OSError("connection refused to internal-host:587")

    monkeypatch.setattr("app.correo.servicio.smtplib.SMTP", _falla)
    respuesta = client.post("/configuracion-correo/probar")
    assert respuesta.status_code == 502
    mensaje = respuesta.json()["error"]["message"]
    assert "internal-host" not in mensaje
    assert "587" not in mensaje


def test_la_prueba_envia_la_plantilla_guardada(client, mundo, monkeypatch):
    _skip_if_no_db()
    _entrar(client)
    _configurar(client)
    client.put(
        "/plantillas-correo/recuperacion",
        json={
            "asunto": "Prueba para {{nombre}}",
            "modo": "visual",
            "campos": {
                "titulo": "Prueba de plantilla",
                "mensaje": "Hola {{nombre}}, esto es una prueba.",
                "boton": "Elegir clave",
                "nota": "Caduca en {{expira_en}}.",
                "pie": "Si no fuiste tú, ignora este mensaje.",
            },
        },
    )
    capturado: dict[str, str] = {}

    def _captura(_db, *, destinatario, asunto, html):
        capturado.update(destinatario=destinatario, asunto=asunto, html=html)

    monkeypatch.setattr("app.api.correo.enviar", _captura)
    respuesta = client.post("/configuracion-correo/probar")
    assert respuesta.status_code == 200, respuesta.text
    assert "{{nombre}}" not in capturado["html"]
    assert "Hola" in capturado["html"]
    assert "/login/recuperar" in capturado["html"]
    assert "{{nombre}}" not in capturado["asunto"]


def test_la_configuracion_guarda_el_resultado_de_la_ultima_prueba(client, mundo, monkeypatch):
    _skip_if_no_db()
    _entrar(client)
    _configurar(client)
    monkeypatch.setattr("app.api.correo.enviar", lambda *_a, **_k: None)

    client.post("/configuracion-correo/probar")
    config = client.get("/configuracion-correo").json()
    assert config["ultima_prueba_ok"] is True
    assert config["ultima_prueba_en"] is not None


def test_plantilla_guarda_variables_y_se_puede_restaurar(client, mundo):
    _skip_if_no_db()
    _entrar(client)

    guardada = client.put(
        "/plantillas-correo/recuperacion",
        json={"asunto": "Hola {{nombre}}", "html": "<p>{{enlace}} · {{expira_en}}</p>"},
    )
    assert guardada.status_code == 200
    assert guardada.json()["de_fabrica"] is False

    invalida = client.put(
        "/plantillas-correo/recuperacion",
        json={"asunto": "Hola", "html": "<p>{{telefono}}</p>"},
    )
    assert invalida.status_code == 422
    assert "telefono" in invalida.json()["error"]["message"]

    restaurada = client.post("/plantillas-correo/recuperacion/restaurar")
    assert restaurada.status_code == 200
    assert restaurada.json()["de_fabrica"] is True


def test_plantilla_por_campos_compone_el_html_y_escapa(client, mundo):
    _skip_if_no_db()
    _entrar(client)

    fabrica = client.get("/plantillas-correo/recuperacion").json()
    assert fabrica["modo"] == "visual"
    assert set(fabrica["campos"]) == {"titulo", "mensaje", "boton", "nota", "pie"}

    respuesta = client.put(
        "/plantillas-correo/recuperacion",
        json={
            "asunto": "Hola {{nombre}}",
            "modo": "visual",
            "campos": {
                "titulo": "Hola <mundo>",
                "mensaje": "Pulsa el botón & listo.",
                "boton": "Cambiar clave",
                "nota": "Caduca en {{expira_en}}.",
                "pie": "Si no fuiste tú, ignóralo.",
            },
        },
    )
    assert respuesta.status_code == 200, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["modo"] == "visual"
    assert cuerpo["campos"]["boton"] == "Cambiar clave"
    assert "Hola &lt;mundo&gt;" in cuerpo["html"]
    assert "<mundo>" not in cuerpo["html"]
    assert "{{enlace}}" in cuerpo["html"]

    faltan = client.put(
        "/plantillas-correo/recuperacion",
        json={"asunto": "Hola", "modo": "visual", "campos": {"titulo": "Solo esto"}},
    )
    assert faltan.status_code == 422
    assert faltan.json()["error"]["code"] == "campos_incompletos"

    sin_html = client.put("/plantillas-correo/recuperacion", json={"asunto": "Hola"})
    assert sin_html.status_code == 422
    assert sin_html.json()["error"]["code"] == "html_requerido"


def test_previsualizacion_usa_datos_de_ejemplo_y_no_guarda(client, mundo):
    _skip_if_no_db()
    _entrar(client)
    antes = client.get("/plantillas-correo/recuperacion").json()

    vista = client.post(
        "/plantillas-correo/recuperacion/preview",
        json={
            "asunto": "Hola {{nombre}}",
            "modo": "visual",
            "campos": {
                "titulo": "Restablece tu contraseña",
                "mensaje": "Te enviamos un enlace.",
                "boton": "Elegir una contraseña nueva",
                "nota": "Caduca en {{expira_en}}.",
                "pie": "Si no fuiste tú, ignóralo.",
            },
        },
    )
    assert vista.status_code == 200, vista.text
    assert vista.json()["asunto"] == "Hola Ana Pérez"
    assert "Ana Pérez" in vista.json()["html"]
    assert "{{" not in vista.json()["html"]
    assert "restablecer/ejemplo" in vista.json()["html"]

    despues = client.get("/plantillas-correo/recuperacion").json()
    assert antes == despues


def test_solicitud_de_recuperacion_no_revela_si_el_correo_existe(
    db_session, client, mundo, monkeypatch
):
    _skip_if_no_db()
    monkeypatch.setattr("app.auth.routes._enviar_enlace", lambda *a, **k: None)

    existe = client.post("/auth/recuperacion", json={"correo": "admin@t.com"})
    no_existe = client.post("/auth/recuperacion", json={"correo": "nadie@t.com"})
    assert existe.status_code == 202
    assert no_existe.status_code == 202

    filas = db_session.query(TokenRecuperacion).all()
    assert len(filas) == 1
    assert filas[0].usuario_id == mundo["admin"].id
    assert len(filas[0].token_hash) == 64
    assert filas[0].usado_en is None


def test_el_token_solo_vale_una_vez_y_cierra_las_sesiones(db_session, client, mundo, monkeypatch):
    _skip_if_no_db()
    monkeypatch.setattr("app.auth.routes._enviar_enlace", lambda *a, **k: None)
    _entrar(client)

    client.post("/auth/recuperacion", json={"correo": "admin@t.com"})
    fila = db_session.query(TokenRecuperacion).one()
    token = "x" * 20  # el real no se guarda; se sustituye por uno conocido
    fila.token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    fila.expira_en = datetime.now(UTC) + timedelta(minutes=10)
    db_session.add(fila)
    db_session.commit()

    cambio = client.post(
        "/auth/recuperacion/confirmar", json={"token": token, "password": CLAVE_NUEVA}
    )
    assert cambio.status_code == 204

    db_session.expire_all()
    usuario = db_session.get(Usuario, mundo["admin"].id)
    assert usuario is not None
    assert verify_password(CLAVE_NUEVA, usuario.password_hash)[0]
    assert db_session.query(Sesion).filter(Sesion.revocada_en.is_(None)).count() == 0

    reuso = client.post(
        "/auth/recuperacion/confirmar", json={"token": token, "password": CLAVE_OTRA}
    )
    assert reuso.status_code == 400
    assert reuso.json()["error"]["code"] == "token_invalido"


def test_token_expirado_se_rechaza(db_session, client, mundo, monkeypatch):
    _skip_if_no_db()
    monkeypatch.setattr("app.auth.routes._enviar_enlace", lambda *a, **k: None)
    client.post("/auth/recuperacion", json={"correo": "admin@t.com"})

    token = "y" * 20
    fila = db_session.query(TokenRecuperacion).one()
    fila.token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    fila.expira_en = datetime.now(UTC) - timedelta(minutes=1)
    db_session.add(fila)
    db_session.commit()

    respuesta = client.post(
        "/auth/recuperacion/confirmar", json={"token": token, "password": CLAVE_NUEVA}
    )
    assert respuesta.status_code == 400
