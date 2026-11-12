"""HU-034 y HU-035: consentimiento informado y su efecto sobre la inferencia.

El registro separa finalidad (``base_legal``) y versión del texto firmado; el
retiro es inmediato y deja el caso sin consentimiento vigente, de modo que la
inferencia se bloquea hasta que se registre uno nuevo.
"""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient

from app.models.auditoria import Auditoria
from app.models.consentimientos import Consentimiento
from app.models.imagenes import Imagen
from app.models.instituciones import Institucion
from app.models.trabajos import Trabajo
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password

CLAVE = "claveSegura-123"
PACIENTE = {
    "nombres": "Ana María",
    "apellidos": "Pérez Quishpe",
    "documento": "0601234567",
    "fecha_nacimiento": "1980-05-17",
}


def _usuario(db, inst, correo, rol):
    usuario = Usuario(
        email=correo,
        nombre=correo,
        institucion_id=inst.id,
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
    roles = {n: Rol(nombre=n, descripcion=n) for n in ("admin", "doctor", "researcher")}
    db_session.add_all(roles.values())
    db_session.commit()
    return {
        "medico": _usuario(db_session, espoch, "medico@t.com", roles["doctor"]),
        "medico_solca": _usuario(db_session, solca, "solca@t.com", roles["doctor"]),
        "admin": _usuario(db_session, espoch, "admin@t.com", roles["admin"]),
    }


def _entrar(client: TestClient, correo: str) -> TestClient:
    assert client.post("/auth/login", json={"correo": correo, "password": CLAVE}).status_code == 200
    return client


def _caso(client: TestClient) -> str:
    paciente = client.post("/pacientes", json=PACIENTE)
    assert paciente.status_code == 201, paciente.text
    caso = client.post(f"/pacientes/{paciente.json()['id']}/casos")
    assert caso.status_code == 201, caso.text
    return caso.json()["id"]


def _consentir(client: TestClient, caso_id: str, **cambios) -> dict:
    cuerpo = {"base_legal": "atencion_de_salud", "version_texto": "2.0", **cambios}
    respuesta = client.post(f"/casos/{caso_id}/consentimientos", json=cuerpo)
    assert respuesta.status_code == 201, respuesta.text
    return respuesta.json()


def _inferir(client: TestClient, payload: dict) -> TestClient:
    return client.post("/trabajos", json={"tipo": "inferencia", "payload": payload})


def _acciones(db_session) -> list[str]:
    db_session.expire_all()
    return [a for (a,) in db_session.query(Auditoria.accion).order_by(Auditoria.id).all()]


# ------------------------------------------------------------- HU-034 ----


def test_registro_guarda_version_y_finalidad_separadas(client, mundo, db_session):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    atencion = _consentir(client, caso_id, base_legal="atencion_de_salud", version_texto="2.0")
    investigacion = _consentir(
        client,
        caso_id,
        base_legal="investigacion_con_anonimizacion",
        version_texto="3.1",
    )
    assert atencion["base_legal"] == "atencion_de_salud"
    assert atencion["version_texto"] == "2.0"
    assert investigacion["base_legal"] == "investigacion_con_anonimizacion"
    assert investigacion["version_texto"] == "3.1"
    assert atencion["revocado_en"] is None and atencion["vigente"] is True

    lista = client.get(f"/casos/{caso_id}/consentimientos").json()
    assert lista["total"] == 2
    assert {(i["base_legal"], i["version_texto"]) for i in lista["items"]} == {
        ("atencion_de_salud", "2.0"),
        ("investigacion_con_anonimizacion", "3.1"),
    }

    fila = db_session.get(Consentimiento, uuid.UUID(atencion["id"]))
    medico = db_session.query(Usuario).filter(Usuario.email == mundo["medico"]).one()
    assert fila is not None and fila.otorgado_por_id == medico.id
    assert fila.version_texto == "2.0"


@pytest.mark.parametrize(
    "cambios",
    [
        {"base_legal": "marketing"},
        {"base_legal": None},
        {"version_texto": ""},
        {"version_texto": "x" * 33},
        {"version_texto": "1.0 con espacios"},
        {"version_texto": "1.0; DROP TABLE consentimientos"},
        {"otorgado_en": "2999-01-01T00:00:00Z"},
    ],
)
def test_registro_rechaza_finalidad_o_version_no_validas(client, mundo, cambios):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    cuerpo = {"base_legal": "atencion_de_salud", "version_texto": "1.0", **cambios}
    assert client.post(f"/casos/{caso_id}/consentimientos", json=cuerpo).status_code == 422


def test_retiro_tiene_efecto_inmediato(client, mundo, db_session):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    consentimiento = _consentir(client, caso_id)
    retiro = client.post(f"/casos/{caso_id}/consentimientos/{consentimiento['id']}/revocar")
    assert retiro.status_code == 200, retiro.text
    assert retiro.json()["revocado_en"] is not None
    assert retiro.json()["vigente"] is False

    lista = client.get(f"/casos/{caso_id}/consentimientos").json()
    assert lista["total"] == 1
    assert lista["items"][0]["revocado_en"] is not None
    fila = db_session.get(Consentimiento, uuid.UUID(consentimiento["id"]))
    assert fila is not None and fila.revocado_en is not None


def test_retiro_repetido_da_409(client, mundo):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    consentimiento = _consentir(client, caso_id)
    url = f"/casos/{caso_id}/consentimientos/{consentimiento['id']}/revocar"
    assert client.post(url).status_code == 200
    segundo = client.post(url)
    assert segundo.status_code == 409
    assert segundo.json()["error"]["code"] == "ya_revocado"
    assert "ya estaba revocado" in segundo.json()["error"]["message"]


def test_consentimiento_inexistente_da_404(client, mundo):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    assert (
        client.post(f"/casos/{caso_id}/consentimientos/{uuid.uuid4()}/revocar").status_code == 404
    )
    assert client.post(f"/casos/{caso_id}/consentimientos/no-es-uuid/revocar").status_code == 404


def test_caso_de_otra_institucion_da_404(client, mundo):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    consentimiento = _consentir(client, caso_id)
    _entrar(client, mundo["medico_solca"])
    assert client.get(f"/casos/{caso_id}/consentimientos").status_code == 404
    cuerpo = {"base_legal": "atencion_de_salud", "version_texto": "1.0"}
    assert client.post(f"/casos/{caso_id}/consentimientos", json=cuerpo).status_code == 404
    assert (
        client.post(f"/casos/{caso_id}/consentimientos/{consentimiento['id']}/revocar").status_code
        == 404
    )


def test_el_registro_queda_en_la_bitacora_sin_datos_personales(client, mundo, db_session):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    consentimiento = _consentir(client, caso_id)
    client.post(f"/casos/{caso_id}/consentimientos/{consentimiento['id']}/revocar")
    acciones = _acciones(db_session)
    assert "CLINICAL.CONSENT_CREATE" in acciones
    assert "CLINICAL.CONSENT_REVOKE" in acciones
    detalles = str(
        db_session.query(Auditoria.detalles)
        .filter(Auditoria.accion.in_(["CLINICAL.CONSENT_CREATE", "CLINICAL.CONSENT_REVOKE"]))
        .all()
    )
    for dato in PACIENTE.values():
        assert dato not in detalles


# ------------------------------------------------------------- HU-035 ----


def test_inferencia_sin_consentimiento_da_409(client, mundo, db_session):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    respuesta = _inferir(client, {"caso_id": caso_id})
    assert respuesta.status_code == 409, respuesta.text
    error = respuesta.json()["error"]
    assert error["code"] == "sin_consentimiento"
    assert "consentimiento" in error["message"].lower()
    assert db_session.query(Trabajo).count() == 0


def test_consentimiento_de_investigacion_no_habilita_la_inferencia(client, mundo):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _consentir(client, caso_id, base_legal="investigacion_con_anonimizacion")
    assert _inferir(client, {"caso_id": caso_id}).json()["error"]["code"] == "sin_consentimiento"


def test_inferencia_con_consentimiento_vigente_encola(client, mundo):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _consentir(client, caso_id)
    respuesta = _inferir(client, {"caso_id": caso_id})
    assert respuesta.status_code == 202, respuesta.text
    datos = respuesta.json()
    assert datos["estado"] == "en_cola"
    assert client.get(f"/trabajos/{datos['id']}").json()["estado"] == "en_cola"


def test_inferencia_por_imagen_resuelve_el_caso(client, mundo, db_session):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    _consentir(client, caso_id)
    imagen = Imagen(caso_id=uuid.UUID(caso_id), ruta_s3="s3://imagenes/1.png", hash_sha256="a" * 64)
    db_session.add(imagen)
    db_session.commit()
    respuesta = _inferir(client, {"imagen_id": str(imagen.id)})
    assert respuesta.status_code == 202, respuesta.text


def test_consentimiento_revocado_bloquea_la_inferencia(client, mundo):
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    consentimiento = _consentir(client, caso_id)
    assert _inferir(client, {"caso_id": caso_id}).status_code == 202
    client.post(f"/casos/{caso_id}/consentimientos/{consentimiento['id']}/revocar")
    bloqueado = _inferir(client, {"caso_id": caso_id})
    assert bloqueado.status_code == 409
    assert bloqueado.json()["error"]["code"] == "sin_consentimiento"


@pytest.mark.parametrize("payload", [{}, {"otro": "dato"}, {"caso_id": "no-es-uuid"}])
def test_payload_sin_caso_resoluble_da_422(client, mundo, payload):
    _entrar(client, mundo["medico"])
    respuesta = _inferir(client, payload)
    assert respuesta.status_code == 422, respuesta.text
    error = respuesta.json()["error"]
    assert error["code"] == "payload_invalido"
    assert "caso_id" in error["message"] and "imagen_id" in error["message"]


def test_caso_inexistente_da_404(client, mundo):
    _entrar(client, mundo["medico"])
    assert _inferir(client, {"caso_id": str(uuid.uuid4())}).status_code == 404


def test_ocr_no_exige_consentimiento(client, mundo):
    _entrar(client, mundo["medico"])
    respuesta = client.post("/trabajos", json={"tipo": "ocr", "payload": {"documento_id": "x"}})
    assert respuesta.status_code == 202, respuesta.text
