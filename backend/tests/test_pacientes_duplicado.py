"""TES-363: aviso de posible duplicado al registrar pacientes."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from fastapi.testclient import TestClient

from app.models import IdentidadPaciente, Institucion, Paciente, Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"
PACIENTE = {
    "nombres": "Ana María",
    "apellidos": "Pérez Quishpe",
    "documento": "0601234567",
    "fecha_nacimiento": "1980-05-17",
}


def _usuario(db_session, institucion, correo: str, rol: Rol) -> str:
    usuario = Usuario(
        email=correo,
        nombre=correo,
        institucion_id=institucion.id,
        activo=True,
        password_hash=hash_password(correo, CLAVE),
    )
    db_session.add(usuario)
    db_session.commit()
    db_session.refresh(usuario)
    db_session.add(UsuarioRol(usuario_id=usuario.id, rol_id=rol.id))
    db_session.commit()
    return correo


@pytest.fixture()
def mundo(db_session):
    espoch = Institucion(nombre="ESPOCH", codigo="ESPOCH")
    solca = Institucion(nombre="SOLCA", codigo="SOLCA")
    db_session.add_all([espoch, solca])
    db_session.commit()
    doctor = Rol(nombre="doctor", descripcion="doctor")
    db_session.add(doctor)
    db_session.commit()
    return {
        "medico": _usuario(db_session, espoch, "medico@t.com", doctor),
        "medico_solca": _usuario(db_session, solca, "solca@t.com", doctor),
    }


def _entrar(client: TestClient, correo: str) -> None:
    assert client.post("/auth/login", json={"correo": correo, "password": CLAVE}).status_code == 200


def _alta(client: TestClient, **cambios) -> dict:
    respuesta = client.post("/pacientes", json={**PACIENTE, **cambios})
    assert respuesta.status_code == 201, respuesta.text
    return respuesta.json()


def test_alta_duplicada_sin_confirmar_da_409_sin_insertar_filas(client, mundo, db_session):
    _entrar(client, mundo["medico"])
    existente = _alta(client)

    respuesta = client.post("/pacientes", json=PACIENTE)

    assert respuesta.status_code == 409
    assert respuesta.json()["error"]["code"] == "posible_duplicado"
    assert set(respuesta.json()) == {"error", "request_id"}
    assert set(respuesta.json()["error"]) == {"code", "message"}
    assert respuesta.json()["request_id"]
    assert "paciente_id" not in respuesta.json()["error"]
    assert existente["id"] not in respuesta.text
    assert "0601234567" not in respuesta.text
    assert "Ana María" not in respuesta.text
    db_session.expire_all()
    assert db_session.query(Paciente).count() == 1
    assert db_session.query(IdentidadPaciente).count() == 1


def test_alta_duplicada_confirmada_crea_el_segundo_paciente(client, mundo, db_session):
    _entrar(client, mundo["medico"])
    _alta(client)

    respuesta = client.post("/pacientes", json={**PACIENTE, "confirmar_duplicado": True})

    assert respuesta.status_code == 201, respuesta.text
    db_session.expire_all()
    assert db_session.query(Paciente).count() == 2
    assert db_session.query(IdentidadPaciente).count() == 2


def test_alta_con_documento_distinto_no_pide_confirmacion(client, mundo):
    _entrar(client, mundo["medico"])
    _alta(client)

    respuesta = client.post("/pacientes", json={**PACIENTE, "documento": "0607654321"})

    assert respuesta.status_code == 201, respuesta.text


def test_documento_repetido_en_otra_institucion_no_bloquea_el_alta(client, mundo):
    _entrar(client, mundo["medico"])
    _alta(client)
    client.post("/auth/logout")
    _entrar(client, mundo["medico_solca"])

    respuesta = client.post("/pacientes", json=PACIENTE)

    assert respuesta.status_code == 201, respuesta.text


def test_documento_equivalente_sin_separadores_da_409(client, mundo) -> None:
    _entrar(client, mundo["medico"])
    _alta(client, documento="AB12345")

    respuesta = client.post("/pacientes", json={**PACIENTE, "documento": "ab-12345"})

    assert respuesta.status_code == 409
    assert respuesta.json()["error"]["code"] == "posible_duplicado"
    assert "paciente_id" not in respuesta.json()["error"]


def test_altas_simultaneas_del_mismo_documento_crean_un_solo_paciente(client, mundo) -> None:
    _entrar(client, mundo["medico"])
    inicio = Barrier(2)

    def crear() -> int:
        inicio.wait(timeout=10)
        return client.post("/pacientes", json=PACIENTE).status_code

    with ThreadPoolExecutor(max_workers=2) as executor:
        estados = list(executor.map(lambda _: crear(), range(2)))

    assert sorted(estados) == [201, 409]
