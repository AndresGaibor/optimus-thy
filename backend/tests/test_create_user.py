"""Prueba del script create_user."""

from __future__ import annotations

import os
import sys

import pytest

from app import models  # noqa: F401
from app.security.passwords import verify_password


def test_create_user_crea_usuario_con_contrasena_verificable(db_session, monkeypatch):
    db_url = os.environ.get("TEST_DATABASE_URL")
    if not db_url:
        pytest.skip("TEST_DATABASE_URL no definida")

    from app.models.instituciones import Institucion
    from app.models.usuarios import Rol, Usuario, UsuarioRol

    inst = Institucion(nombre="Instituto Demo", codigo="inst_demo")
    db_session.add(inst)
    db_session.commit()
    db_session.refresh(inst)

    rol = Rol(nombre="doctor", descripcion="Doctor")
    db_session.add(rol)
    db_session.commit()
    db_session.refresh(rol)

    # Simular entrada de contraseña
    import getpass

    monkeypatch.setattr(getpass, "getpass", lambda prompt="": "MiPass123!")

    # Importar y ejecutar
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    import scripts.create_user as cu

    rc = cu.main(
        ["--correo", "demo@demo.com", "--rol", "doctor", "--institucion", "Instituto Demo"]
    )
    assert rc == 0

    usuario = db_session.query(Usuario).filter(Usuario.email == "demo@demo.com").first()
    assert usuario is not None
    pwd_hash = getattr(usuario, "password_hash", None)
    assert pwd_hash is not None
    ok, _ = verify_password("MiPass123!", pwd_hash)
    assert ok is True
    ur = db_session.query(UsuarioRol).filter(UsuarioRol.usuario_id == usuario.id).first()
    assert ur is not None
