"""Consentimiento por caso y bloqueo de la inferencia sin consentimiento (HU-034/035)."""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient

from app.models.consentimientos import Consentimiento
from app.models.imagenes import Imagen
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"
PACIENTE = {
    "nombres": "Ana María",
    "apellidos": "Pérez Quishpe",
    "documento": "0601234567",
    "fecha_nacimiento": "1980-05-17",
}


def _usuario(db, institucion, correo: str, rol: Rol) -> str:
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
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def _caso(client: TestClient) -> str:
    paciente = client.post("/pacientes", json=PACIENTE)
    assert paciente.status_code == 201, paciente.text
    caso = client.post(f"/pacientes/{paciente.json()['id']}/casos")
    assert caso.status_code == 201, caso.text
    return caso.json()["id"]


def _imagen(db, caso_id: str) -> str:
    imagen = Imagen(
        caso_id=uuid.UUID(caso_id),
        ruta_s3="casos/prueba/imagenes/eco.png",
        hash_sha256="c" * 64,
    )
    db.add(imagen)
    db.commit()
    return str(imagen.id)


def _consentir(client: TestClient, caso_id: str, base_legal: str = "atencion_de_salud") -> dict:
    respuesta = client.post(
        f"/casos/{caso_id}/consentimientos",
        json={"base_legal": base_legal, "version_texto": "v1"},
    )
    assert respuesta.status_code == 201, respuesta.text
    return respuesta.json()


def test_registrar_y_listar_consentimiento(client, mundo) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    creado = _consentir(client, caso_id)

    assert creado["vigente"] is True
    assert creado["version_texto"] == "v1"
    listado = client.get(f"/casos/{caso_id}/consentimientos").json()
    assert listado["total"] == 1
    assert listado["items"][0]["base_legal"] == "atencion_de_salud"


def test_revocar_tiene_efecto_inmediato(client, mundo) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    creado = _consentir(client, caso_id)

    revocado = client.post(f"/casos/{caso_id}/consentimientos/{creado['id']}/revocar")
    assert revocado.status_code == 200
    assert revocado.json()["vigente"] is False

    repetido = client.post(f"/casos/{caso_id}/consentimientos/{creado['id']}/revocar")
    assert repetido.status_code == 409


def test_caso_de_otra_institucion_responde_404(client, mundo) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    client.post("/auth/logout")
    _entrar(client, mundo["medico_solca"])

    assert client.get(f"/casos/{caso_id}/consentimientos").status_code == 404
    assert (
        client.post(
            f"/casos/{caso_id}/consentimientos",
            json={"base_legal": "atencion_de_salud", "version_texto": "v1"},
        ).status_code
        == 404
    )


def test_inferencia_bloqueada_sin_consentimiento(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    imagen_id = _imagen(db_session, caso_id)

    bloqueada = client.post(
        "/trabajos", json={"tipo": "inferencia", "payload": {"imagen_id": imagen_id}}
    )
    assert bloqueada.status_code == 409
    assert bloqueada.json()["error"]["code"] == "sin_consentimiento"

    consentimiento = _consentir(client, caso_id)
    permitida = client.post(
        "/trabajos", json={"tipo": "inferencia", "payload": {"imagen_id": imagen_id}}
    )
    assert permitida.status_code == 202

    client.post(f"/casos/{caso_id}/consentimientos/{consentimiento['id']}/revocar")
    otra_vez = client.post(
        "/trabajos", json={"tipo": "inferencia", "payload": {"imagen_id": imagen_id}}
    )
    assert otra_vez.status_code == 409


def test_consentimiento_de_investigacion_no_habilita_inferencia(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    imagen_id = _imagen(db_session, caso_id)
    _consentir(client, caso_id, base_legal="investigacion_con_anonimizacion")

    respuesta = client.post(
        "/trabajos", json={"tipo": "inferencia", "payload": {"imagen_id": imagen_id}}
    )

    assert respuesta.status_code == 409


def test_version_del_texto_se_valida(client, mundo) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    respuesta = client.post(
        f"/casos/{caso_id}/consentimientos",
        json={"base_legal": "atencion_de_salud", "version_texto": "v 1"},
    )

    assert respuesta.status_code == 422


def test_caso_inexistente_no_crea_consentimiento(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])

    respuesta = client.post(
        f"/casos/{uuid.uuid4()}/consentimientos",
        json={"base_legal": "atencion_de_salud", "version_texto": "v1"},
    )

    assert respuesta.status_code == 404
    assert db_session.query(Consentimiento).count() == 0
