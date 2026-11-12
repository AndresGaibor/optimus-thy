"""Pruebas de la CLI de usuarios (``scripts/usuarios.py``)."""

from __future__ import annotations

import getpass
import os
import sys
from datetime import UTC, datetime, timedelta
from types import ModuleType

import pytest

from app import models  # noqa: F401
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import verify_password

pytestmark = pytest.mark.skipif(
    not os.environ.get("TEST_DATABASE_URL"), reason="TEST_DATABASE_URL no definida"
)

CLAVE_INICIAL = "ClaveInicial123"
CLAVE_NUEVA = "ClaveNueva456"


def _cli() -> ModuleType:
    raiz = os.path.join(os.path.dirname(__file__), "..")
    if raiz not in sys.path:
        sys.path.insert(0, raiz)
    import scripts.usuarios

    return scripts.usuarios


def _preparar_base(db_session) -> None:
    institucion = Institucion(nombre="Instituto Demo", codigo="inst_demo")
    rol = Rol(nombre="doctor", descripcion="Doctor")
    db_session.add_all([institucion, rol])
    db_session.commit()


def _crear_demo(db_session, monkeypatch, clave: str = CLAVE_INICIAL) -> int:
    monkeypatch.setattr(getpass, "getpass", lambda prompt="": clave)
    return _cli().main(
        ["--correo", "demo@demo.com", "--rol", "doctor", "--institucion", "Instituto Demo"]
    )


def test_crear_usuario_con_contrasena_verificable(db_session, monkeypatch):
    _preparar_base(db_session)

    assert _crear_demo(db_session, monkeypatch) == 0

    db_session.expire_all()
    usuario = db_session.query(Usuario).filter(Usuario.email == "demo@demo.com").one_or_none()
    assert usuario is not None
    assert usuario.password_hash is not None
    ok, _ = verify_password(CLAVE_INICIAL, usuario.password_hash)
    assert ok is True
    enlace = db_session.query(UsuarioRol).filter(UsuarioRol.usuario_id == usuario.id).first()
    assert enlace is not None


def test_contrasena_corta_no_crea_usuario(db_session, monkeypatch):
    _preparar_base(db_session)

    assert _crear_demo(db_session, monkeypatch, clave="Corta1") != 0

    db_session.expire_all()
    assert db_session.query(Usuario).filter(Usuario.email == "demo@demo.com").first() is None


def test_restablecer_desbloquea_y_cambia_la_contrasena(db_session, monkeypatch):
    _preparar_base(db_session)
    assert _crear_demo(db_session, monkeypatch) == 0

    db_session.expire_all()
    usuario = db_session.query(Usuario).filter(Usuario.email == "demo@demo.com").one()
    usuario.intentos_fallidos = 3
    usuario.bloqueado_hasta = datetime.now(UTC) + timedelta(minutes=15)
    db_session.commit()

    monkeypatch.setattr(getpass, "getpass", lambda prompt="": CLAVE_NUEVA)
    assert _cli().main(["--restablecer", "demo@demo.com"]) == 0

    db_session.expire_all()
    usuario = db_session.query(Usuario).filter(Usuario.email == "demo@demo.com").one()
    assert usuario.password_hash is not None
    assert usuario.intentos_fallidos == 0
    assert usuario.bloqueado_hasta is None
    vieja_ok, _ = verify_password(CLAVE_INICIAL, usuario.password_hash)
    nueva_ok, _ = verify_password(CLAVE_NUEVA, usuario.password_hash)
    assert vieja_ok is False
    assert nueva_ok is True
