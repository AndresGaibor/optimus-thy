"""Reporte PDF de una inferencia y descarga registrada (HU-080, HU-082)."""

from __future__ import annotations

import io
import uuid
from typing import Any

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.models.auditoria import Auditoria
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
    """S3 en memoria; el reporte lee la imagen con ``get_object``."""

    def __init__(self, objetos: dict[str, bytes] | None = None) -> None:
        self.objetos = objetos or {}

    def put_object(self, **kwargs: Any) -> dict[str, Any]:
        self.objetos[kwargs["Key"]] = kwargs["Body"]
        return {}

    def get_object(self, **kwargs: Any) -> dict[str, Any]:
        datos = self.objetos[kwargs["Key"]]
        return {"Body": io.BytesIO(datos), "ContentLength": len(datos)}


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


def _png() -> bytes:
    salida = io.BytesIO()
    Image.new("RGB", (128, 128), "white").save(salida, format="PNG")
    return salida.getvalue()


@pytest.fixture()
def almacen(client: TestClient) -> ClienteS3Falso:
    cliente = ClienteS3Falso()
    storage = ObjectStorage(cliente, bucket="pruebas", presigned_seconds=600)
    client.app.dependency_overrides[get_storage] = lambda: storage
    return cliente


def _entrar(client: TestClient, correo: str) -> None:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text


def _caso(client: TestClient) -> str:
    paciente = client.post("/pacientes", json=PACIENTE)
    assert paciente.status_code == 201, paciente.text
    caso = client.post(f"/pacientes/{paciente.json()['id']}/casos")
    assert caso.status_code == 201, caso.text
    return caso.json()["id"]


def _inferencia(db, caso_id: str, ruta: str = "casos/prueba/imagenes/eco.png") -> Inferencia:
    imagen = Imagen(caso_id=uuid.UUID(caso_id), ruta_s3=ruta, hash_sha256="c" * 64)
    db.add(imagen)
    db.commit()
    modelo = ModeloIA(nombre="Swin", version="1.0", hash_pesos="b" * 64, activo=True)
    db.add(modelo)
    db.commit()
    inferencia = Inferencia(
        imagen_id=imagen.id,
        modelo_ia_id=modelo.id,
        resultado="maligno",
        confianza=0.87,
        tiempo_ms=9400,
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
            confianza=0.87,
            clase="maligno",
            probabilidad_benigno=0.13,
            probabilidad_maligno=0.87,
            pixeles_mascara=1200,
        )
    )
    db.commit()
    return inferencia


def test_descarga_pdf_y_registra_evento(client, mundo, db_session, almacen) -> None:
    almacen.objetos["casos/prueba/imagenes/eco.png"] = _png()
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id)

    respuesta = client.get(f"/casos/{caso_id}/inferencias/{inferencia.id}/reporte.pdf")

    assert respuesta.status_code == 200, respuesta.text
    assert respuesta.headers["content-type"] == "application/pdf"
    assert respuesta.content.startswith(b"%PDF")
    assert "reporte-CASO-" in respuesta.headers["content-disposition"]
    fila = db_session.query(Auditoria).filter(Auditoria.accion == "INFERENCE.REPORT_DOWNLOAD").one()
    assert fila.entidad == "REPORT"
    assert fila.entidad_id == str(inferencia.id)
    assert fila.usuario_id is not None


def test_sin_imagen_legible_el_reporte_sigue_siendo_pdf(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id, ruta="casos/prueba/imagenes/falta.png")

    respuesta = client.get(f"/casos/{caso_id}/inferencias/{inferencia.id}/reporte.pdf")

    assert respuesta.status_code == 200, respuesta.text
    assert respuesta.content.startswith(b"%PDF")


def test_caso_de_otra_institucion_responde_404(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id)
    client.post("/auth/logout")
    _entrar(client, mundo["medico_solca"])

    respuesta = client.get(f"/casos/{caso_id}/inferencias/{inferencia.id}/reporte.pdf")

    assert respuesta.status_code == 404


def test_inferencia_de_otro_caso_responde_404(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    otro_caso = _caso(client)
    inferencia = _inferencia(db_session, otro_caso)

    respuesta = client.get(f"/casos/{caso_id}/inferencias/{inferencia.id}/reporte.pdf")

    assert respuesta.status_code == 404


def test_rol_sin_permiso_de_reporte_da_403(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    inferencia = _inferencia(db_session, caso_id)
    client.post("/auth/logout")
    _entrar(client, mundo["lector"])

    respuesta = client.get(f"/casos/{caso_id}/inferencias/{inferencia.id}/reporte.pdf")

    assert respuesta.status_code == 403
