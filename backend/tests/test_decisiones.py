"""Registro y lectura de la decisión médica de una inferencia (TES-337)."""

from __future__ import annotations

import uuid

import pytest
from fastapi.testclient import TestClient

from app.models.auditoria import Auditoria
from app.models.imagenes import DecisionMedica, Imagen, Inferencia, ModeloIA
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
OBSERVACIONES = "Se acepta el resultado del modelo."


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
    lector = Rol(nombre="lector", descripcion="sin permisos clínicos")
    db_session.add_all([doctor, lector])
    db_session.commit()
    return {
        "medico": _usuario(db_session, espoch, "medico@t.com", doctor),
        "medico_solca": _usuario(db_session, solca, "solca@t.com", doctor),
        "lector": _usuario(db_session, espoch, "lector@t.com", lector),
    }


def _entrar(client: TestClient, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def _caso(client: TestClient, documento: str = PACIENTE["documento"]) -> str:
    paciente = client.post("/pacientes", json={**PACIENTE, "documento": documento})
    assert paciente.status_code == 201, paciente.text
    caso = client.post(f"/pacientes/{paciente.json()['id']}/casos")
    assert caso.status_code == 201, caso.text
    return caso.json()["id"]


def _inferencia(db, caso_id: str) -> Inferencia:
    imagen = Imagen(
        caso_id=uuid.UUID(caso_id),
        ruta_s3="casos/prueba/imagenes/eco.png",
        hash_sha256="c" * 64,
    )
    db.add(imagen)
    db.commit()
    modelo = ModeloIA(nombre="Nodo", version="1.0", hash_pesos="b" * 64, activo=True)
    db.add(modelo)
    db.commit()
    inferencia = Inferencia(
        imagen_id=imagen.id,
        modelo_ia_id=modelo.id,
        resultado="benigno",
        confianza=0.93,
        tiempo_ms=11800,
        ancho=128,
        alto=128,
        version_contrato="1.1",
        huella_modelos="a" * 64,
        umbrales={"max_nodulos": 3},
    )
    db.add(inferencia)
    db.commit()
    db.refresh(inferencia)
    return inferencia


def _url(caso_id: str, inferencia_id: uuid.UUID) -> str:
    return f"/casos/{caso_id}/inferencias/{inferencia_id}/decision"


def _autor(db, correo: str) -> Usuario:
    return db.query(Usuario).filter(Usuario.email == correo).one()


def test_registra_decision_con_autor(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id)

    respuesta = client.post(
        _url(caso_id, inferencia.id),
        json={"decision": "acepta", "observaciones": OBSERVACIONES},
    )

    assert respuesta.status_code == 201, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["decision"] == "acepta"
    assert cuerpo["observaciones"] == OBSERVACIONES
    assert cuerpo["autor"]["rol"] == "doctor"
    autor = _autor(db_session, mundo["medico"])
    assert cuerpo["autor"]["id"] == str(autor.id)
    fila = (
        db_session.query(DecisionMedica).filter(DecisionMedica.inferencia_id == inferencia.id).one()
    )
    assert fila.usuario_id == autor.id
    assert fila.decision == "acepta"
    db_session.refresh(inferencia)
    assert inferencia.resultado == "benigno"
    assert inferencia.confianza == 0.93


def test_segunda_decision_responde_409(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id)
    url = _url(caso_id, inferencia.id)
    assert client.post(url, json={"decision": "acepta"}).status_code == 201

    respuesta = client.post(url, json={"decision": "descarta", "observaciones": OBSERVACIONES})

    assert respuesta.status_code == 409, respuesta.text
    assert respuesta.json()["error"]["code"] == "decision_existente"
    filas = (
        db_session.query(DecisionMedica).filter(DecisionMedica.inferencia_id == inferencia.id).all()
    )
    assert len(filas) == 1
    assert filas[0].decision == "acepta"


@pytest.mark.parametrize("observaciones", ["corta", "x" * 2001])
def test_observaciones_fuera_de_rango_responde_422(
    client, mundo, db_session, observaciones: str
) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id)

    respuesta = client.post(
        _url(caso_id, inferencia.id),
        json={"decision": "acepta", "observaciones": observaciones},
    )

    assert respuesta.status_code == 422, respuesta.text
    assert respuesta.json()["error"]["code"] == "validation_error"
    assert (
        db_session.query(DecisionMedica)
        .filter(DecisionMedica.inferencia_id == inferencia.id)
        .count()
        == 0
    )


def test_inferencia_de_otro_caso_responde_404(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_propio = _caso(client)
    caso_ajeno = _caso(client, documento="0607654321")
    inferencia_ajena = _inferencia(db_session, caso_ajeno)

    respuesta = client.post(
        _url(caso_propio, inferencia_ajena.id),
        json={"decision": "acepta", "observaciones": OBSERVACIONES},
    )

    assert respuesta.status_code == 404, respuesta.text
    assert (
        db_session.query(DecisionMedica)
        .filter(DecisionMedica.inferencia_id == inferencia_ajena.id)
        .count()
        == 0
    )


def test_sin_permiso_responde_403(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id)
    client.post("/auth/logout")
    _entrar(client, mundo["lector"])

    respuesta = client.post(
        _url(caso_id, inferencia.id),
        json={"decision": "acepta", "observaciones": OBSERVACIONES},
    )

    assert respuesta.status_code == 403, respuesta.text


def test_lectura_posterior_de_la_decision(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id)
    url = _url(caso_id, inferencia.id)

    sin_decision = client.get(url)
    assert sin_decision.status_code == 404
    assert sin_decision.json()["error"]["code"] == "decision_no_encontrada"

    creada = client.post(
        url,
        json={
            "decision": "corrige",
            "resultado_corregido": "maligno",
            "observaciones": OBSERVACIONES,
        },
    )
    assert creada.status_code == 201, creada.text

    respuesta = client.get(url)

    assert respuesta.status_code == 200, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["decision"] == "corrige"
    assert cuerpo["resultado"] == "benigno"
    assert cuerpo["resultado_corregido"] == "maligno"
    assert cuerpo["observaciones"] == OBSERVACIONES
    assert cuerpo["creado_en"] == creada.json()["creado_en"]
    assert cuerpo["autor"] == {
        "id": str(_autor(db_session, mundo["medico"]).id),
        "rol": "doctor",
    }


def test_lectura_de_otra_institucion_responde_404(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id)
    assert (
        client.post(
            _url(caso_id, inferencia.id),
            json={"decision": "acepta", "observaciones": OBSERVACIONES},
        ).status_code
        == 201
    )
    client.post("/auth/logout")
    _entrar(client, mundo["medico_solca"])

    assert client.get(_url(caso_id, inferencia.id)).status_code == 404


def test_auditoria_registra_decision_sin_observaciones(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id)

    respuesta = client.post(
        _url(caso_id, inferencia.id),
        json={"decision": "descarta", "observaciones": OBSERVACIONES},
    )
    assert respuesta.status_code == 201, respuesta.text

    evento = (
        db_session.query(Auditoria).filter(Auditoria.accion == "INFERENCE.INFERENCE_DECISION").one()
    )
    assert evento.entidad == "INFERENCE"
    assert evento.entidad_id == str(inferencia.id)
    assert evento.usuario_id == _autor(db_session, mundo["medico"]).id
    assert evento.detalles is not None
    assert evento.detalles["decision_code"] == "descarta"
    assert OBSERVACIONES not in str(evento.detalles)


def test_corregir_sin_resultado_corregido_es_422(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id)

    respuesta = client.post(_url(caso_id, inferencia.id), json={"decision": "corrige"})

    assert respuesta.status_code == 422, respuesta.text
    assert (
        db_session.query(DecisionMedica)
        .filter(DecisionMedica.inferencia_id == inferencia.id)
        .count()
        == 0
    )


def test_aceptar_con_resultado_corregido_es_422(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id)

    respuesta = client.post(
        _url(caso_id, inferencia.id),
        json={"decision": "acepta", "resultado_corregido": "maligno"},
    )

    assert respuesta.status_code == 422, respuesta.text


def test_correccion_igual_al_modelo_es_422(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id)

    respuesta = client.post(
        _url(caso_id, inferencia.id),
        json={"decision": "corrige", "resultado_corregido": "benigno"},
    )

    assert respuesta.status_code == 422, respuesta.text
    assert respuesta.json()["error"]["code"] == "correccion_sin_cambio"


def test_correccion_guarda_el_resultado_clinico(client, mundo, db_session) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id)

    respuesta = client.post(
        _url(caso_id, inferencia.id),
        json={
            "decision": "corrige",
            "resultado_corregido": "maligno",
            "observaciones": OBSERVACIONES,
        },
    )

    assert respuesta.status_code == 201, respuesta.text
    assert respuesta.json()["resultado_corregido"] == "maligno"
    fila = (
        db_session.query(DecisionMedica).filter(DecisionMedica.inferencia_id == inferencia.id).one()
    )
    assert fila.resultado_corregido == "maligno"
