"""Pruebas de integridad criptográfica de la bitácora (TES-343)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule
from app.audit.service import AuditService
from app.models.auditoria import Auditoria
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"


@pytest.fixture()
def mundo(db_session: Session) -> dict[str, Usuario]:
    institucion = Institucion(nombre="Institución sintética", codigo="SINTETICA")
    admin_role = Rol(nombre="admin", descripcion="admin")
    doctor_role = Rol(nombre="doctor", descripcion="doctor")
    db_session.add_all([institucion, admin_role, doctor_role])
    db_session.flush()

    admin = Usuario(
        email="admin-integridad@example.test",
        nombre="Admin sintético",
        institucion_id=institucion.id,
        password_hash=hash_password("admin-integridad@example.test", CLAVE),
    )
    doctor = Usuario(
        email="doctor-integridad@example.test",
        nombre="Médico sintético",
        institucion_id=institucion.id,
        password_hash=hash_password("doctor-integridad@example.test", CLAVE),
    )
    db_session.add_all([admin, doctor])
    db_session.flush()
    db_session.add_all(
        [
            UsuarioRol(usuario_id=admin.id, rol_id=admin_role.id),
            UsuarioRol(usuario_id=doctor.id, rol_id=doctor_role.id),
        ]
    )
    db_session.commit()
    return {"admin": admin, "doctor": doctor}


def _entrar(client: TestClient, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def test_integridad_verifica_una_cadena_valida(client, mundo, db_session: Session) -> None:
    _entrar(client, mundo["admin"].email)
    servicio = AuditService(db_session)
    servicio.record(AuditAction.SESSION_START, AuditModule.AUTH, usuario=mundo["admin"])
    servicio.record(AuditAction.SESSION_END, AuditModule.AUTH, usuario=mundo["admin"])
    db_session.commit()
    total = db_session.query(Auditoria).count()

    respuesta = client.get("/auditoria/integridad")

    assert respuesta.status_code == 200
    assert respuesta.json() == {"valida": True, "registros": total, "primer_fallo": None}


def test_integridad_detecta_un_registro_alterado(client, mundo, db_session: Session) -> None:
    _entrar(client, mundo["admin"].email)
    evento = AuditService(db_session).record(
        AuditAction.SESSION_START, AuditModule.AUTH, usuario=mundo["admin"]
    )
    db_session.commit()
    evento_id = evento.id

    db_session.execute(text("ALTER TABLE auditoria DISABLE TRIGGER auditoria_solo_escritura"))
    try:
        db_session.execute(
            text("UPDATE auditoria SET accion = 'AUTH.TAMPERED' WHERE id = :id"),
            {"id": evento_id},
        )
    finally:
        db_session.execute(text("ALTER TABLE auditoria ENABLE TRIGGER auditoria_solo_escritura"))
    db_session.commit()

    respuesta = client.get("/auditoria/integridad")

    assert respuesta.status_code == 200
    assert respuesta.json()["valida"] is False
    assert respuesta.json()["primer_fallo"] == evento_id


def test_integridad_exige_permiso_de_lectura_de_auditoria(client, mundo) -> None:
    _entrar(client, mundo["doctor"].email)

    respuesta = client.get("/auditoria/integridad")

    assert respuesta.status_code == 403


def test_integridad_detecta_la_eliminacion_de_la_cola(client, mundo, db_session: Session) -> None:
    _entrar(client, mundo["admin"].email)
    servicio = AuditService(db_session)
    servicio.record(AuditAction.SESSION_START, AuditModule.AUTH, usuario=mundo["admin"])
    ultimo = servicio.record(AuditAction.SESSION_END, AuditModule.AUTH, usuario=mundo["admin"])
    db_session.commit()

    db_session.execute(text("ALTER TABLE auditoria DISABLE TRIGGER auditoria_solo_escritura"))
    try:
        db_session.execute(text("DELETE FROM auditoria WHERE id = :id"), {"id": ultimo.id})
    finally:
        db_session.execute(text("ALTER TABLE auditoria ENABLE TRIGGER auditoria_solo_escritura"))
    db_session.commit()

    respuesta = client.get("/auditoria/integridad")

    assert respuesta.status_code == 200
    registros = db_session.query(Auditoria).count()
    assert respuesta.json() == {"valida": False, "registros": registros, "primer_fallo": None}
