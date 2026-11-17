"""Consulta de resultados guardados con filtros combinables (HU-081)."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.models.imagenes import Imagen, Inferencia, ModeloIA
from app.models.instituciones import Institucion
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.security.passwords import hash_password
from app.storage.s3 import ObjectStorage, get_storage

CLAVE = "claveSegura-123"
PACIENTE = {
    "nombres": "Ana María",
    "apellidos": "Pérez Quishpe",
    "documento": "0601234567",
    "fecha_nacimiento": "1980-05-17",
}


class ClienteS3Falso:
    def __init__(self) -> None:
        self.objetos: dict[str, Any] = {}

    def put_object(self, **kwargs: Any) -> dict[str, Any]:
        self.objetos[kwargs["Key"]] = kwargs
        return {}

    def generate_presigned_url(
        self, ClientMethod: str, Params: dict[str, Any], ExpiresIn: int
    ) -> str:
        return f"https://storage.local/{Params['Bucket']}/{Params['Key']}?firma=abc"


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


@pytest.fixture()
def almacen(client: TestClient) -> ClienteS3Falso:
    cliente = ClienteS3Falso()
    storage = ObjectStorage(cliente, bucket="pruebas", presigned_seconds=600)
    client.app.dependency_overrides[get_storage] = lambda: storage
    return cliente


def _entrar(client: TestClient, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def _caso(client: TestClient, paciente: dict[str, Any] | None = None) -> tuple[str, str]:
    """Crea paciente y caso; devuelve (paciente_id, caso_id)."""
    creado = client.post("/pacientes", json=paciente or PACIENTE)
    assert creado.status_code == 201, creado.text
    caso = client.post(f"/pacientes/{creado.json()['id']}/casos")
    assert caso.status_code == 201, caso.text
    return creado.json()["id"], caso.json()["id"]


def _inferencia(
    db,
    caso_id: str,
    *,
    resultado: str = "benigno",
    creado_en: datetime | None = None,
) -> Inferencia:
    imagen = Imagen(
        caso_id=uuid.UUID(caso_id), ruta_s3="casos/x/imagenes/eco.png", hash_sha256="c" * 64
    )
    db.add(imagen)
    db.commit()
    modelo = ModeloIA(nombre="Swin", version="1.0", hash_pesos="b" * 64, activo=True)
    db.add(modelo)
    db.commit()
    inferencia = Inferencia(
        imagen_id=imagen.id,
        modelo_ia_id=modelo.id,
        resultado=resultado,
        confianza=0.8,
        creado_en=creado_en or datetime.now(UTC),
    )
    db.add(inferencia)
    db.commit()
    return inferencia


def test_filtra_por_clase_y_paciente(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico"])
    paciente_a, caso_a = _caso(client)
    _, caso_b = _caso(client, {**PACIENTE, "documento": "0601234568"})
    _inferencia(db_session, caso_a, resultado="benigno")
    _inferencia(db_session, caso_b, resultado="maligno")

    por_clase = client.get("/resultados", params={"clase": "maligno"})
    assert por_clase.status_code == 200, por_clase.text
    assert por_clase.json()["total"] == 1
    assert por_clase.json()["items"][0]["caso_id"] == caso_b

    por_paciente = client.get("/resultados", params={"paciente": paciente_a})
    assert por_paciente.status_code == 200, por_paciente.text
    assert por_paciente.json()["total"] == 1
    item = por_paciente.json()["items"][0]
    assert item["caso_id"] == caso_a
    assert item["caso_codigo"].startswith("CASO-")
    assert item["paciente_codigo"].startswith("PAC-")


def test_filtra_por_fechas_y_pagina(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico"])
    _, caso_id = _caso(client)
    _inferencia(db_session, caso_id, creado_en=datetime(2026, 1, 10, 12, tzinfo=UTC))
    _inferencia(db_session, caso_id, creado_en=datetime(2026, 2, 10, 12, tzinfo=UTC))

    solo_enero = client.get("/resultados", params={"desde": "2026-01-01", "hasta": "2026-01-31"})
    assert solo_enero.status_code == 200, solo_enero.text
    assert solo_enero.json()["total"] == 1

    pagina = client.get("/resultados", params={"limite": 1, "desplazamiento": 1})
    assert pagina.status_code == 200, pagina.text
    assert pagina.json()["total"] == 2
    assert len(pagina.json()["items"]) == 1
    primero = client.get("/resultados", params={"limite": 1}).json()["items"][0]
    assert primero["id"] != pagina.json()["items"][0]["id"]


def test_caso_de_otra_institucion_no_aparece(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico_solca"])
    _, caso_solca = _caso(client)
    _inferencia(db_session, caso_solca, resultado="maligno")
    client.post("/auth/logout")
    _entrar(client, mundo["medico"])

    respuesta = client.get("/resultados")

    assert respuesta.status_code == 200
    assert respuesta.json() == {"total": 0, "items": []}


def test_parametros_invalidos_dan_422(client, mundo, almacen) -> None:
    _entrar(client, mundo["medico"])

    paciente = client.get("/resultados", params={"paciente": "no-es-uuid"})
    assert paciente.status_code == 422
    assert paciente.json()["error"]["code"] == "validation_error"

    fechas = client.get("/resultados", params={"desde": "2026-02-01", "hasta": "2026-01-01"})
    assert fechas.status_code == 422
    assert fechas.json()["error"]["code"] == "validation_error"

    clase = client.get("/resultados", params={"clase": "inventada"})
    assert clase.status_code == 422


def test_orden_descendente_por_fecha(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico"])
    _, caso_id = _caso(client)
    vieja = _inferencia(db_session, caso_id, creado_en=datetime.now(UTC) - timedelta(days=2))
    nueva = _inferencia(db_session, caso_id, creado_en=datetime.now(UTC))

    items = client.get("/resultados").json()["items"]

    assert [item["id"] for item in items] == [str(nueva.id), str(vieja.id)]
