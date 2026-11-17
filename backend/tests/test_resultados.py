"""Consulta de resultados de inferencia por caso (HU-071)."""

from __future__ import annotations

import uuid
from typing import Any

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.models.imagenes import Imagen, Inferencia, ModeloIA, Nodulo
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
    """Cliente S3 en memoria con enlaces firmados predecibles."""

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
    lector = Rol(nombre="lector", descripcion="sin permisos clínicos")
    db_session.add_all([doctor, lector])
    db_session.commit()
    return {
        "medico": _usuario(db_session, espoch, "medico@t.com", doctor),
        "medico_solca": _usuario(db_session, solca, "solca@t.com", doctor),
        "lector": _usuario(db_session, espoch, "lector@t.com", lector),
    }


@pytest.fixture()
def almacen(client: TestClient) -> tuple[ObjectStorage, ClienteS3Falso]:
    cliente = ClienteS3Falso()
    storage = ObjectStorage(cliente, bucket="pruebas", presigned_seconds=600)
    client.app.dependency_overrides[get_storage] = lambda: storage
    return storage, cliente


def _entrar(client: TestClient, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def _caso(client: TestClient) -> str:
    paciente = client.post("/pacientes", json=PACIENTE)
    assert paciente.status_code == 201, paciente.text
    caso = client.post(f"/pacientes/{paciente.json()['id']}/casos")
    assert caso.status_code == 201, caso.text
    return caso.json()["id"]


def _png() -> bytes:
    import io

    salida = io.BytesIO()
    Image.new("RGB", (128, 128), "white").save(salida, format="PNG")
    return salida.getvalue()


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
    db.add(
        Nodulo(
            inferencia_id=inferencia.id,
            indice=1,
            caja_x=1.0,
            caja_y=2.0,
            caja_w=3.0,
            caja_h=4.0,
            confianza=0.56,
            clase="benigno",
            probabilidad_benigno=1.0,
            probabilidad_maligno=0.0,
            region_analizada={"xmin": 0, "ymin": 0, "xmax": 10, "ymax": 10},
            pixeles_mascara=8178,
            mascara_ruta_s3="casos/prueba/nodulos/1/mascara.png",
            xml_ruta_s3="casos/prueba/nodulos/1/resultado.xml",
        )
    )
    db.commit()
    return inferencia


def test_lista_inferencias_con_artefactos(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id)

    respuesta = client.get(f"/casos/{caso_id}/inferencias")

    assert respuesta.status_code == 200, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["total"] == 1
    item = cuerpo["items"][0]
    assert item["id"] == str(inferencia.id)
    assert item["modelo"] == {"id": item["modelo"]["id"], "nombre": "Nodo", "version": "1.0"}
    assert item["resultado"] == "benigno"
    assert item["version_contrato"] == "1.1"
    nodulo = item["nodulos"][0]
    assert nodulo["clase"] == "benigno"
    assert nodulo["caja"] == {"x": 1.0, "y": 2.0, "w": 3.0, "h": 4.0}
    assert nodulo["artefactos"]["mascara_url"].startswith("https://storage.local/")
    assert nodulo["artefactos"]["xml_url"].startswith("https://storage.local/")
    assert nodulo["artefactos"]["mgac_url"] is None


def test_sin_inferencias_devuelve_lista_vacia(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    respuesta = client.get(f"/casos/{caso_id}/inferencias")

    assert respuesta.status_code == 200
    assert respuesta.json() == {"total": 0, "items": []}


def test_caso_de_otra_institucion_responde_404(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    client.post("/auth/logout")
    _entrar(client, mundo["medico_solca"])

    assert client.get(f"/casos/{caso_id}/inferencias").status_code == 404


def test_sin_permiso_responde_403(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    client.post("/auth/logout")
    _entrar(client, mundo["lector"])

    assert client.get(f"/casos/{caso_id}/inferencias").status_code == 403
