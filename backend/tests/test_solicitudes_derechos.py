"""Solicitudes de derechos de los titulares (RS-DER-07, HU-100)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"
RUTA = "/administrador/solicitudes-derechos"


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
        "admin": _usuario(db_session, espoch, "admin@t.com", admin),
        "medico": _usuario(db_session, espoch, "medico@t.com", doctor),
        "admin_solca": _usuario(db_session, solca, "solca@t.com", admin),
    }


def _entrar(client: TestClient, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def _cuerpo(**extra) -> dict:
    return {"tipo": "acceso", "referencia_titular": "TIT-0001", **extra}


def test_registra_solicitud_con_plazo_de_quince_dias(client, mundo) -> None:
    _entrar(client, mundo["admin"].email)

    respuesta = client.post(RUTA, json=_cuerpo(solicitada_en="2026-11-01"))

    assert respuesta.status_code == 201, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["tipo"] == "acceso"
    assert cuerpo["estado"] == "pendiente"
    assert cuerpo["plazo_dias"] == 15
    assert cuerpo["fecha_limite"] == "2026-11-16"
    assert cuerpo["responsable"]["rol"] == "admin"
    assert cuerpo["respuesta"] is None


def test_listado_muestra_plazo_restante_y_vencidas(client, mundo) -> None:
    _entrar(client, mundo["admin"].email)
    hoy = datetime.now(UTC).date()
    client.post(RUTA, json=_cuerpo(solicitada_en=str(hoy)))
    client.post(
        RUTA,
        json={
            "tipo": "cancelacion",
            "referencia_titular": "TIT-0002",
            "solicitada_en": str(hoy - timedelta(days=30)),
        },
    )

    respuesta = client.get(RUTA)

    assert respuesta.status_code == 200, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["total"] == 2
    assert cuerpo["pendientes"] == 2
    assert cuerpo["vencidas"] == 1
    vigente = next(fila for fila in cuerpo["items"] if fila["referencia_titular"] == "TIT-0001")
    vencida = next(fila for fila in cuerpo["items"] if fila["referencia_titular"] == "TIT-0002")
    assert vigente["dias_restantes"] == 15
    assert vencida["dias_restantes"] == -15
    assert vencida["vencida"] is True


def test_solicitud_duplicada_responde_409(client, mundo) -> None:
    _entrar(client, mundo["admin"].email)
    assert client.post(RUTA, json=_cuerpo(solicitada_en="2026-11-01")).status_code == 201

    repetida = client.post(RUTA, json=_cuerpo(solicitada_en="2026-11-01"))

    assert repetida.status_code == 409, repetida.text
    assert repetida.json()["error"]["code"] == "solicitud_duplicada"


def test_cierra_la_solicitud_con_respuesta(client, mundo) -> None:
    _entrar(client, mundo["admin"].email)
    creada = client.post(RUTA, json=_cuerpo(solicitada_en="2026-11-01")).json()

    respuesta = client.patch(
        f"{RUTA}/{creada['id']}",
        json={"estado": "atendida", "respuesta": "Se entregó la copia solicitada."},
    )

    assert respuesta.status_code == 200, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["estado"] == "atendida"
    assert cuerpo["respuesta"] == "Se entregó la copia solicitada."


@pytest.mark.parametrize(
    "cuerpo",
    [
        {"estado": "atendida"},
        {"estado": "rechazada", "respuesta": "corta"},
        {"estado": "pendiente", "respuesta": "No aplica a una solicitud abierta."},
    ],
)
def test_cierre_incoherente_responde_422(client, mundo, cuerpo: dict) -> None:
    _entrar(client, mundo["admin"].email)
    creada = client.post(RUTA, json=_cuerpo(solicitada_en="2026-11-01")).json()

    respuesta = client.patch(f"{RUTA}/{creada['id']}", json=cuerpo)

    assert respuesta.status_code == 422, respuesta.text


def test_otra_institucion_no_ve_ni_toca_la_solicitud(client, mundo) -> None:
    _entrar(client, mundo["admin"].email)
    creada = client.post(RUTA, json=_cuerpo(solicitada_en="2026-11-01")).json()
    client.post("/auth/logout")
    _entrar(client, mundo["admin_solca"].email)

    listado = client.get(RUTA)
    cambio = client.patch(
        f"{RUTA}/{creada['id']}",
        json={"estado": "atendida", "respuesta": "Se entregó la copia solicitada."},
    )

    assert listado.status_code == 200
    assert listado.json()["total"] == 0
    assert cambio.status_code == 404


def test_exige_permiso_de_derechos(client, mundo) -> None:
    _entrar(client, mundo["medico"].email)

    listado = client.get(RUTA)
    alta = client.post(RUTA, json=_cuerpo())

    assert listado.status_code == 403
    assert alta.status_code == 403


@pytest.mark.parametrize(
    "cuerpo",
    [
        {"tipo": "consulta", "referencia_titular": "TIT-0001"},
        {"tipo": "acceso", "referencia_titular": "con espacio"},
        {"tipo": "acceso", "referencia_titular": "TIT-0001", "plazo_dias": 0},
        {"tipo": "acceso", "referencia_titular": "TIT-0001", "plazo_dias": 61},
    ],
)
def test_cuerpo_invalido_responde_422(client, mundo, cuerpo: dict) -> None:
    _entrar(client, mundo["admin"].email)

    respuesta = client.post(RUTA, json=cuerpo)

    assert respuesta.status_code == 422, respuesta.text
