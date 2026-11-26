"""Carga de ecografías: saneo de metadatos y aislamiento institucional."""

from __future__ import annotations

import hashlib
import io
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient
from PIL import Image, PngImagePlugin

from app.models.imagenes import Imagen
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
    """Cliente S3 en memoria."""

    def __init__(self) -> None:
        self.objetos: dict[str, dict[str, Any]] = {}

    def put_object(self, **kwargs: Any) -> dict[str, Any]:
        self.objetos[kwargs["Key"]] = kwargs
        return {}

    def generate_presigned_url(
        self, ClientMethod: str, Params: dict[str, Any], ExpiresIn: int
    ) -> str:
        return f"https://storage.local/{Params['Bucket']}/{Params['Key']}?firma=abc"


def _png(color: str | tuple[int, int, int] = "white") -> bytes:
    imagen = Image.new("RGB", (128, 128), color)
    info = PngImagePlugin.PngInfo()
    info.add_text("PatientName", "dato de prueba")
    salida = io.BytesIO()
    imagen.save(salida, format="PNG", pnginfo=info)
    return salida.getvalue()


def _jpeg_con_exif() -> bytes:
    imagen = Image.new("RGB", (128, 128), (30, 90, 140))
    exif = Image.Exif()
    exif[0x010F] = "CamaraDePrueba"
    exif[0x0112] = 1
    salida = io.BytesIO()
    imagen.save(salida, format="JPEG", exif=exif)
    return salida.getvalue()


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


def _subir(
    client: TestClient, caso_id: str, contenido: bytes, nombre: str, tipo: str = "image/png"
):
    return client.post(f"/casos/{caso_id}/imagenes", files={"archivo": (nombre, contenido, tipo)})


def test_carga_png_y_jpeg_elimina_exif_y_guarda_sha256(client, mundo, db_session, almacen) -> None:
    _, s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    contenido_png = _png()
    contenido_jpeg = _jpeg_con_exif()
    png = _subir(client, caso_id, contenido_png, "eco.png")
    jpeg = _subir(client, caso_id, contenido_jpeg, "eco.jpg", "image/jpeg")

    assert png.status_code == jpeg.status_code == 201
    for respuesta in (png, jpeg):
        cuerpo = respuesta.json()
        fila = db_session.get(Imagen, uuid.UUID(cuerpo["id"]))
        assert fila is not None
        guardado = s3.objetos[fila.ruta_s3]["Body"]
        assert cuerpo["sha256"] == hashlib.sha256(guardado).hexdigest()
        assert fila.hash_sha256 == cuerpo["sha256"]
        with Image.open(io.BytesIO(guardado)) as copia:
            assert copia.getexif() == {}
            assert "exif" not in copia.info and "icc_profile" not in copia.info
            if copia.format == "PNG":
                assert getattr(copia, "text", {}) == {}



def test_rechaza_duplicado_solo_dentro_del_mismo_caso(client, mundo, db_session, almacen) -> None:
    _, s3 = almacen
    _entrar(client, mundo["medico"])
    primer_caso = _caso(client)
    paciente = client.post("/pacientes", json={**PACIENTE, "documento": "0601234568"})
    assert paciente.status_code == 201, paciente.text
    caso = client.post(f"/pacientes/{paciente.json()['id']}/casos")
    assert caso.status_code == 201, caso.text
    segundo_caso = caso.json()["id"]
    contenido = _png()

    assert _subir(client, primer_caso, contenido, "primera.png").status_code == 201
    duplicada = _subir(client, primer_caso, contenido, "copia.png")
    assert duplicada.status_code == 409
    assert len(s3.objetos) == 1
    assert duplicada.json()["error"] == {
        "code": "imagen_duplicada",
        "message": "Esta imagen ya está cargada en el caso.",
    }
    assert _subir(client, segundo_caso, contenido, "otro-caso.png").status_code == 201
    assert _subir(client, primer_caso, _jpeg_con_exif(), "distinta.jpg").status_code == 201
    assert db_session.query(Imagen).count() == 3


def test_rechaza_la_misma_imagen_con_metadatos_distintos(client, mundo, db_session, almacen) -> None:
    _, s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    assert _subir(client, caso_id, _png(), "con-texto.png").status_code == 201
    sin_texto = io.BytesIO()
    Image.new("RGB", (128, 128), "white").save(sin_texto, format="PNG")

    repetida = _subir(client, caso_id, sin_texto.getvalue(), "sin-texto.png")

    assert repetida.status_code == 409
    assert repetida.json()["error"]["code"] == "imagen_duplicada"
    assert len(s3.objetos) == 1


def test_rechaza_archivo_que_no_es_imagen(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    respuesta = _subir(client, caso_id, b"esto no es una imagen", "eco.png")

    assert respuesta.status_code == 422
    assert db_session.query(Imagen).count() == 0


def test_listado_ordena_la_mas_reciente_primero(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    ids: list[str] = []
    for indice, nombre in enumerate(("uno.png", "dos.png", "tres.png")):
        respuesta = _subir(client, caso_id, _png((indice, 0, 0)), nombre)
        assert respuesta.status_code == 201, respuesta.text
        ids.append(respuesta.json()["id"])

    base = datetime(2026, 1, 1, tzinfo=UTC)
    for posicion, imagen_id in enumerate(ids):
        fila = db_session.get(Imagen, uuid.UUID(imagen_id))
        assert fila is not None
        fila.creado_en = base + timedelta(minutes=posicion)
    db_session.commit()

    listado = client.get(f"/casos/{caso_id}/imagenes")

    assert listado.status_code == 200, listado.text
    cuerpo = listado.json()
    assert cuerpo["total"] == 3
    assert [item["id"] for item in cuerpo["items"]] == list(reversed(ids))


def test_caso_de_otra_institucion_responde_404(client, mundo, almacen) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    client.post("/auth/logout")
    _entrar(client, mundo["medico_solca"])

    assert _subir(client, caso_id, _png(), "eco.png").status_code == 404
    assert client.get(f"/casos/{caso_id}/imagenes").status_code == 404
