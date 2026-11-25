"""Exportación CSV de la bitácora (HU-022)."""

from __future__ import annotations

import csv
import io
import re
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.api import auditoria as auditoria_api
from app.models.auditoria import Auditoria
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"
COLUMNAS = [
    "id",
    "ocurrido_en",
    "usuario_id",
    "accion",
    "entidad",
    "entidad_id",
    "detalles",
]


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
    accion: str = "INFERENCE.INFERENCE_READ",
    entidad: str = "INFERENCE",
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
        direccion_ip="10.0.0.9",
        detalles={"resource_count": 2},
        ocurrido_en=ocurrido_en or datetime.now(UTC),
    )
    db.add(fila)
    db.commit()
    return fila


def _filas(respuesta) -> list[list[str]]:
    return list(csv.reader(io.StringIO(respuesta.text.lstrip("\ufeff"))))


def test_exporta_un_csv_valido_de_la_institucion(client, mundo, db_session) -> None:
    _evento(
        db_session,
        mundo,
        accion="INFERENCE.INFERENCE_READ",
        ocurrido_en=datetime(2026, 6, 10, 14, 30, tzinfo=UTC),
    )
    reciente = _evento(
        db_session,
        mundo,
        accion="INFERENCE.INFERENCE_DECISION",
        ocurrido_en=datetime(2026, 6, 10, 14, 32, tzinfo=UTC),
    )
    _evento(
        db_session,
        mundo,
        usuario=mundo["medico"],
        accion="INFERENCE.INFERENCE_READ",
        ocurrido_en=datetime(2026, 6, 10, 14, 29, tzinfo=UTC),
    )
    _evento(
        db_session,
        mundo,
        usuario=mundo["admin_solca"],
        institucion=mundo["otra"],
        ocurrido_en=datetime(2026, 6, 12, 9, 0, tzinfo=UTC),
    )
    _entrar(client, mundo["admin"].email)

    respuesta = client.get("/auditoria/exportar", params={"recurso": "INFERENCE"})

    assert respuesta.status_code == 200, respuesta.text
    assert respuesta.headers["content-type"] == "text/csv; charset=utf-8"
    disposicion = respuesta.headers["content-disposition"]
    assert re.fullmatch(r'attachment; filename="bitacora-\d{8}-\d{6}\.csv"', disposicion)
    filas = _filas(respuesta)
    assert filas[0] == COLUMNAS
    assert "direccion_ip" not in respuesta.text
    assert len(filas) == 4  # cabecera + tres filas de la institución
    assert filas[1][0] == str(reciente.id)
    assert filas[1][3] == "INFERENCE.INFERENCE_DECISION"
    assert filas[1][2] == str(mundo["admin"].id)
    assert filas[2][3] == "INFERENCE.INFERENCE_READ"


def test_los_filtros_se_aplican_a_la_exportacion(client, mundo, db_session) -> None:
    _evento(
        db_session,
        mundo,
        accion="AUTH.SESSION_START",
        entidad="USER",
        ocurrido_en=datetime(2026, 1, 10, 10, tzinfo=UTC),
    )
    _evento(
        db_session,
        mundo,
        usuario=mundo["medico"],
        accion="AUTH.LOGIN_FAILED",
        entidad="USER",
        ocurrido_en=datetime(2026, 1, 15, 10, tzinfo=UTC),
    )
    _evento(
        db_session,
        mundo,
        accion="PATIENTS.CASE_CREATE",
        entidad="CASE",
        ocurrido_en=datetime(2026, 2, 1, 10, tzinfo=UTC),
    )
    _entrar(client, mundo["admin"].email)

    por_usuario = client.get("/auditoria/exportar", params={"usuario": str(mundo["medico"].id)})
    assert por_usuario.status_code == 200, por_usuario.text
    filas_usuario = _filas(por_usuario)
    assert len(filas_usuario) == 2
    assert filas_usuario[1][3] == "AUTH.LOGIN_FAILED"

    por_accion = client.get("/auditoria/exportar", params={"accion": "AUTH.LOGIN"})
    filas_accion = _filas(por_accion)
    assert len(filas_accion) == 2
    assert filas_accion[1][3] == "AUTH.LOGIN_FAILED"

    por_fecha = client.get(
        "/auditoria/exportar", params={"desde": "2026-01-01", "hasta": "2026-01-31"}
    )
    acciones = {fila[3] for fila in _filas(por_fecha)[1:]}
    assert acciones == {"AUTH.SESSION_START", "AUTH.LOGIN_FAILED"}

    por_recurso = client.get("/auditoria/exportar", params={"recurso": "CASE"})
    filas_recurso = _filas(por_recurso)
    assert len(filas_recurso) == 2
    assert filas_recurso[1][4] == "CASE"


def test_la_exportacion_respeta_el_tope_de_filas(client, mundo, db_session, monkeypatch) -> None:
    monkeypatch.setattr(auditoria_api, "_LIMITE_EXPORTACION", 2)
    for indice in range(3):
        _evento(
            db_session,
            mundo,
            ocurrido_en=datetime.now(UTC) - timedelta(minutes=indice),
        )
    _entrar(client, mundo["admin"].email)

    respuesta = client.get("/auditoria/exportar", params={"recurso": "INFERENCE"})

    assert respuesta.status_code == 200, respuesta.text
    assert len(_filas(respuesta)) == 3  # cabecera + dos filas
    evento = db_session.query(Auditoria).filter(Auditoria.accion == "EXPORT.EXPORT").one()
    assert evento.detalles is not None
    assert evento.detalles["resource_count"] == 2


def test_sin_permiso_da_403_y_no_registra_exportacion(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"].email)

    respuesta = client.get("/auditoria/exportar")

    assert respuesta.status_code == 403
    assert db_session.query(Auditoria).filter(Auditoria.accion == "EXPORT.EXPORT").count() == 0


def test_la_exportacion_genera_su_propio_evento(client, mundo, db_session) -> None:
    _evento(db_session, mundo)
    _evento(db_session, mundo)
    _entrar(client, mundo["admin"].email)

    respuesta = client.get("/auditoria/exportar", params={"recurso": "INFERENCE"})

    assert respuesta.status_code == 200, respuesta.text
    evento = db_session.query(Auditoria).filter(Auditoria.accion == "EXPORT.EXPORT").one()
    assert evento.usuario_id == mundo["admin"].id
    assert evento.institucion_id == mundo["institucion"].id
    assert evento.entidad == "AUDIT"
    assert set(evento.detalles or {}) <= {"resource_count", "role_code"}
    assert (evento.detalles or {})["resource_count"] == 2
