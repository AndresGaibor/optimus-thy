"""Inferencia en cola: persistencia del contrato 1.1 y fallos del servicio IA."""

from __future__ import annotations

import base64
import io
import json
import uuid
from typing import Any

import httpx
import pytest
from sqlalchemy.orm import Session, sessionmaker

from app.ia.cliente import ClienteIA
from app.jobs import manejadores
from app.jobs.queue import encolar
from app.jobs.worker import MANEJADORES, procesar_una
from app.models.fichas import Caso
from app.models.imagenes import Imagen, Inferencia, Nodulo
from app.models.instituciones import Institucion
from app.models.pacientes import Paciente
from app.models.trabajos import Trabajo
from app.storage.s3 import ObjectStorage

HUELLA = "a" * 64
PNG = b"\x89PNG\r\n\x1a\nmock-png"
XML = b"<resultado/>"
CONTRATO: dict[str, Any] = {
    "version_contrato": "1.1",
    "ancho": 640,
    "alto": 480,
    "sin_nodulo": False,
    "huella_modelos": HUELLA,
    "umbrales": {"max_nodulos": 3},
    "nodulos": [
        {
            "indice": 1,
            "caja": {"xmin": 10, "ymin": 20, "xmax": 50, "ymax": 80},
            "confianza_detector": 0.91,
            "origen_mascara": "bgaunet",
            "clase": "maligno",
            "probabilidad_benigno": 0.12,
            "probabilidad_maligno": 0.88,
            "region_analizada": {"xmin": 0, "ymin": 0, "xmax": 96, "ymax": 96},
            "pixeles_mascara": 1234,
            "mascara_png": base64.b64encode(PNG).decode("ascii"),
            "mgac_png": None,
            "xml": base64.b64encode(XML).decode("ascii"),
            "superposicion_png": None,
        }
    ],
}


class ClienteS3Falso:
    """Almacenamiento S3 en memoria."""

    def __init__(self) -> None:
        self.objetos: dict[str, dict[str, Any]] = {}

    def put_object(self, **kwargs: Any) -> dict[str, Any]:
        self.objetos[kwargs["Key"]] = {"Body": kwargs["Body"], "ContentType": kwargs["ContentType"]}
        return {}

    def get_object(self, **kwargs: Any) -> dict[str, Any]:
        contenido = self.objetos[kwargs["Key"]]["Body"]
        return {"Body": io.BytesIO(contenido), "ContentLength": len(contenido)}


@pytest.fixture()
def mundo(db_session: Session) -> dict[str, Any]:
    institucion = Institucion(nombre="ESPOCH", codigo="ESPOCH")
    db_session.add(institucion)
    db_session.commit()
    paciente = Paciente(institucion_id=institucion.id, seudonimo="seudonimo-0001")
    db_session.add(paciente)
    db_session.commit()
    caso = Caso(institucion_id=institucion.id, paciente_id=paciente.id, codigo_caso="CASO-0001")
    db_session.add(caso)
    db_session.commit()
    imagen = Imagen(caso_id=caso.id, ruta_s3="casos/abc/imagenes/eco.png", hash_sha256="b" * 64)
    db_session.add(imagen)
    db_session.commit()
    return {"db": db_session, "imagen": imagen}


@pytest.fixture()
def almacen(monkeypatch: pytest.MonkeyPatch) -> ClienteS3Falso:
    doble = ClienteS3Falso()
    monkeypatch.setattr(
        manejadores,
        "get_storage",
        lambda: ObjectStorage(doble, bucket="pruebas", presigned_seconds=600),
    )
    return doble


@pytest.fixture()
def sesiones(monkeypatch: pytest.MonkeyPatch, test_engine: Any) -> None:
    monkeypatch.setattr(manejadores, "get_session_factory", lambda: sessionmaker(bind=test_engine))


def _ejecutar(
    db: Session,
    imagen: Imagen,
    doble: ClienteS3Falso,
    monkeypatch: pytest.MonkeyPatch,
    status: int = 200,
    contrato: dict[str, Any] | None = None,
) -> Trabajo:
    doble.put_object(
        Bucket="pruebas", Key=imagen.ruta_s3, Body=b"image-bytes", ContentType="image/png"
    )
    cuerpo = contrato if contrato is not None else CONTRATO
    contrato = cuerpo if status == 200 else {"detail": "service unavailable"}
    transporte = httpx.MockTransport(lambda _: httpx.Response(status, json=contrato))
    cliente = ClienteIA("http://ia:8002", transporte=transporte)
    monkeypatch.setattr(manejadores, "get_cliente_ia", lambda: cliente)
    encolar(db, "inferencia", {"imagen_id": str(imagen.id)})
    trabajo = procesar_una(db, MANEJADORES)
    assert trabajo is not None
    return trabajo


def test_inferencia_en_colas_persiste_contrato_11_nodulo_y_artefactos(
    mundo: dict[str, Any],
    almacen: ClienteS3Falso,
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db: Session = mundo["db"]
    trabajo = _ejecutar(db, mundo["imagen"], almacen, monkeypatch)

    assert trabajo.estado == "completado"
    assert trabajo.resultado is not None
    inferencia = db.get(Inferencia, uuid.UUID(trabajo.resultado["inferencia_id"]))
    assert inferencia is not None and inferencia.version_contrato == "1.1"
    nodulo = db.query(Nodulo).filter(Nodulo.inferencia_id == inferencia.id).one()
    assert nodulo.indice == 1
    assert nodulo.origen_mascara == "bgaunet"
    assert nodulo.clase == "maligno"
    assert nodulo.probabilidad_benigno == pytest.approx(0.12)
    assert nodulo.probabilidad_maligno == pytest.approx(0.88)
    assert nodulo.region_analizada == CONTRATO["nodulos"][0]["region_analizada"]
    assert nodulo.pixeles_mascara == 1234
    assert nodulo.mascara_ruta_s3 in almacen.objetos
    assert almacen.objetos[nodulo.mascara_ruta_s3]["Body"] == PNG
    assert nodulo.xml_ruta_s3 in almacen.objetos
    assert almacen.objetos[nodulo.xml_ruta_s3]["Body"] == XML
    ruta = trabajo.resultado["contrato_ruta_s3"]
    assert json.loads(almacen.objetos[ruta]["Body"]) == CONTRATO


def test_fallo_del_servicio_ia_deja_trabajo_en_error_sin_resultado(
    mundo: dict[str, Any],
    almacen: ClienteS3Falso,
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db: Session = mundo["db"]
    trabajo = _ejecutar(db, mundo["imagen"], almacen, monkeypatch, status=503)

    assert trabajo.estado == "error"
    assert trabajo.error_detalle == "modelo_no_disponible"
    assert trabajo.resultado is None
    assert db.query(Inferencia).count() == 0
    assert db.query(Nodulo).count() == 0
    assert not any(clave.startswith("inferencias/") for clave in almacen.objetos)


def test_inferencia_sin_nodulos_persiste_resultado_normal(
    mundo: dict[str, Any],
    almacen: ClienteS3Falso,
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db: Session = mundo["db"]
    sin_nodulos = {**CONTRATO, "nodulos": [], "sin_nodulo": True}
    trabajo = _ejecutar(db, mundo["imagen"], almacen, monkeypatch, contrato=sin_nodulos)

    assert trabajo.estado == "completado"
    assert trabajo.resultado is not None
    inferencia = db.get(Inferencia, uuid.UUID(trabajo.resultado["inferencia_id"]))
    assert inferencia is not None
    assert inferencia.resultado == "sin_nodulo"
    assert inferencia.confianza is None
    assert db.query(Nodulo).count() == 0
    ruta = trabajo.resultado["contrato_ruta_s3"]
    assert json.loads(almacen.objetos[ruta]["Body"]) == sin_nodulos
