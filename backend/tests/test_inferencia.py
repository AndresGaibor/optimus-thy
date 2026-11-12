"""HT-063: la API ejecuta la inferencia contra el servicio de IA.

Ninguna prueba hace red real: el cliente ``httpx`` se sustituye por un
``MockTransport`` y el almacenamiento por un doble en memoria. Tampoco se
inventa un resultado cuando el servicio falla: el trabajo queda en ``error`` con
un código estable y sin fila de inferencia.
"""

from __future__ import annotations

import base64
import io
import json
import uuid
from typing import Any

import httpx
import pytest
from sqlalchemy.orm import Session, sessionmaker

from app.config import get_settings
from app.ia.cliente import ClienteIA
from app.jobs import manejadores
from app.jobs.queue import encolar
from app.jobs.worker import MANEJADORES, procesar_una
from app.models.fichas import Caso
from app.models.imagenes import Imagen, Inferencia, ModeloIA, Nodulo
from app.models.instituciones import Institucion
from app.models.pacientes import Paciente
from app.models.trabajos import Trabajo
from app.storage.s3 import ObjectStorage

HUELLA = "a" * 64
CONTRATO: dict[str, Any] = {
    "version_contrato": "1.0",
    "ancho": 640,
    "alto": 480,
    "sin_nodulo": False,
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
        }
    ],
    "huella_modelos": HUELLA,
    "umbrales": {"yolo_confianza": 0.25, "max_nodulos": 3},
}

CONTENIDO_IMAGEN = b"png-sintetico-de-prueba"

FIRMA_PNG = b"\x89PNG\r\n\x1a\n"
MASCARA = FIRMA_PNG + b"mascara-final"
MGAC = FIRMA_PNG + b"mascara-mgac"
SUPERPOSICION = FIRMA_PNG + b"superposicion"
XML = b'<?xml version="1.0"?><annotation><object><name>nodulo-1</name></object></annotation>'

#: Base64 válido de 8 MB + 1 byte decodificados: supera el tope de seguridad.
BASE64_SOBRE_TOPE = "A" * (((8 * 1024 * 1024) // 3 + 1) * 4)


def _b64(datos: bytes) -> str:
    return base64.b64encode(datos).decode("ascii")


def _contrato_11(artefactos: bool = True) -> dict[str, Any]:
    """Contrato 1.1: los cuatro artefactos del nódulo, opcionales por separado."""
    nodulo = dict(CONTRATO["nodulos"][0])
    if artefactos:
        nodulo.update(
            mascara_png=_b64(MASCARA),
            mgac_png=_b64(MGAC),
            xml=_b64(XML),
            superposicion_png=_b64(SUPERPOSICION),
        )
    return {**CONTRATO, "version_contrato": "1.1", "nodulos": [nodulo]}


class ClienteS3Falso:
    """Cliente S3 en memoria: guarda bytes y nunca abre una conexión."""

    def __init__(self) -> None:
        self.objetos: dict[str, dict[str, Any]] = {}

    def put_object(self, **kwargs: Any) -> dict[str, Any]:
        self.objetos[kwargs["Key"]] = {
            "Body": kwargs["Body"],
            "ContentType": kwargs["ContentType"],
        }
        return {}

    def get_object(self, **kwargs: Any) -> dict[str, Any]:
        if kwargs["Key"] not in self.objetos:
            raise RuntimeError("objeto inexistente")
        datos = self.objetos[kwargs["Key"]]["Body"]
        return {"Body": io.BytesIO(datos), "ContentLength": len(datos)}


@pytest.fixture()
def mundo(db_session: Session) -> dict[str, Any]:
    institucion = Institucion(nombre="ESPOCH", codigo="ESPOCH")
    db_session.add(institucion)
    db_session.commit()
    paciente = Paciente(institucion_id=institucion.id, seudonimo="seudonimo-0001")
    db_session.add(paciente)
    db_session.commit()
    caso = Caso(
        institucion_id=institucion.id,
        paciente_id=paciente.id,
        codigo_caso="CASO-0001",
    )
    db_session.add(caso)
    db_session.commit()
    imagen = Imagen(
        caso_id=caso.id,
        ruta_s3="casos/abc/imagenes/eco.png",
        hash_sha256="b" * 64,
    )
    db_session.add(imagen)
    db_session.commit()
    return {"db": db_session, "imagen": imagen}


@pytest.fixture()
def almacen(monkeypatch: pytest.MonkeyPatch) -> tuple[ClienteS3Falso, ObjectStorage]:
    """Sustituye el almacenamiento del manejador por uno en memoria."""
    doble = ClienteS3Falso()
    storage = ObjectStorage(doble, bucket="pruebas", presigned_seconds=600)
    monkeypatch.setattr(manejadores, "get_storage", lambda: storage)
    return doble, storage


@pytest.fixture()
def sesiones(monkeypatch: pytest.MonkeyPatch, test_engine: Any) -> None:
    """El manejador abre su sesión contra la base de pruebas."""
    monkeypatch.setattr(manejadores, "get_session_factory", lambda: sessionmaker(bind=test_engine))


def _cliente(
    monkeypatch: pytest.MonkeyPatch, manejador_http: Any, timeout: float | None = None
) -> type:
    """Cliente IA con transporte simulado; devuelve la clase para espiar peticiones."""
    pedidos: list[httpx.Request] = []

    def _registrar(peticion: httpx.Request) -> httpx.Response:
        pedidos.append(peticion)
        return manejador_http(peticion)

    cliente = ClienteIA(
        "http://ia:8002",
        timeout or get_settings().ia_timeout_segundos,
        transporte=httpx.MockTransport(_registrar),
    )
    monkeypatch.setattr(manejadores, "get_cliente_ia", lambda: cliente)

    class Espia:
        peticiones = pedidos

    return Espia


def _guardar_imagen(doble: ClienteS3Falso, imagen: Imagen) -> None:
    """Deja la ecografía sintética en el almacenamiento doble."""
    doble.put_object(
        Bucket="pruebas",
        Key=imagen.ruta_s3,
        Body=CONTENIDO_IMAGEN,
        ContentType="image/png",
    )


def _procesar(db_session: Session, imagen: Imagen) -> Trabajo:
    encolar(db_session, "inferencia", {"imagen_id": str(imagen.id)})
    trabajo = procesar_una(db_session, MANEJADORES)
    assert trabajo is not None
    return trabajo


def _respuesta(contrato: dict[str, Any]) -> Any:
    return lambda peticion: httpx.Response(200, json=contrato)


def test_el_manejador_de_inferencia_esta_registrado() -> None:
    assert MANEJADORES["inferencia"] is manejadores.manejar_inferencia


def test_camino_feliz_persiste_inferencia_nodulos_y_contrato(
    mundo: dict[str, Any],
    almacen: tuple[ClienteS3Falso, ObjectStorage],
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db: Session = mundo["db"]
    imagen: Imagen = mundo["imagen"]
    doble, _storage = almacen
    _guardar_imagen(doble, imagen)
    espia = _cliente(monkeypatch, _respuesta(CONTRATO))

    trabajo = _procesar(db, imagen)

    assert trabajo.estado == "completado"
    assert trabajo.error_detalle is None
    resumen = trabajo.resultado
    assert resumen is not None
    assert set(resumen) == {"inferencia_id", "modelo_ia_id", "nodulos", "contrato_ruta_s3"}
    assert resumen["nodulos"] == 1

    inferencia = db.get(Inferencia, uuid.UUID(resumen["inferencia_id"]))
    assert inferencia is not None
    assert inferencia.imagen_id == imagen.id
    assert (inferencia.ancho, inferencia.alto) == (640, 480)
    assert inferencia.version_contrato == "1.0"
    assert inferencia.huella_modelos == HUELLA
    assert inferencia.umbrales == CONTRATO["umbrales"]
    assert inferencia.resultado == "maligno"
    assert inferencia.confianza == pytest.approx(0.88)
    assert inferencia.tiempo_ms is not None and inferencia.tiempo_ms >= 0

    modelo = db.get(ModeloIA, inferencia.modelo_ia_id)
    assert modelo is not None
    assert modelo.hash_pesos == HUELLA
    assert modelo.version == "1.0"

    nodulos = db.query(Nodulo).filter(Nodulo.inferencia_id == inferencia.id).all()
    assert len(nodulos) == 1
    nodulo = nodulos[0]
    assert (nodulo.caja_x, nodulo.caja_y, nodulo.caja_w, nodulo.caja_h) == (10.0, 20.0, 40.0, 60.0)
    assert nodulo.confianza == pytest.approx(0.91)
    assert nodulo.origen_mascara == "bgaunet"
    assert nodulo.clase == "maligno"
    assert nodulo.probabilidad_benigno == pytest.approx(0.12)
    assert nodulo.probabilidad_maligno == pytest.approx(0.88)
    assert nodulo.region_analizada == {"xmin": 0, "ymin": 0, "xmax": 96, "ymax": 96}
    assert nodulo.pixeles_mascara == 1234
    # Contrato 1.0: sin artefactos derivados, todas las rutas quedan nulas.
    assert nodulo.mascara_ruta_s3 is None
    assert nodulo.mgac_ruta_s3 is None
    assert nodulo.xml_ruta_s3 is None
    assert nodulo.superposicion_ruta_s3 is None

    ruta = resumen["contrato_ruta_s3"]
    assert ruta == f"inferencias/{inferencia.id}/contrato.json"
    assert ruta in doble.objetos
    assert json.loads(doble.objetos[ruta]["Body"]) == CONTRATO
    assert doble.objetos[ruta]["ContentType"] == "application/json"

    assert len(espia.peticiones) == 1
    pedido = espia.peticiones[0]
    assert pedido.url.path == "/inferir"
    assert b'name="imagen"' in pedido.content
    assert b"eco.png" in pedido.content
    assert CONTENIDO_IMAGEN in pedido.content


def test_cero_nodulos_guarda_inferencia_sin_filas_de_nodulo(
    mundo: dict[str, Any],
    almacen: tuple[ClienteS3Falso, ObjectStorage],
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db: Session = mundo["db"]
    imagen: Imagen = mundo["imagen"]
    doble, _storage = almacen
    _guardar_imagen(doble, imagen)
    sin_nodulo = {**CONTRATO, "sin_nodulo": True, "nodulos": []}
    _cliente(monkeypatch, _respuesta(sin_nodulo))

    trabajo = _procesar(db, imagen)

    assert trabajo.estado == "completado"
    inferencia = db.query(Inferencia).one()
    assert inferencia.resultado == "sin_nodulo"
    assert inferencia.confianza is None
    assert db.query(Nodulo).count() == 0


def test_503_deja_el_trabajo_en_error_sin_inventar_resultado(
    mundo: dict[str, Any],
    almacen: tuple[ClienteS3Falso, ObjectStorage],
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db: Session = mundo["db"]
    imagen: Imagen = mundo["imagen"]
    doble, _storage = almacen
    _guardar_imagen(doble, imagen)
    _cliente(
        monkeypatch,
        lambda peticion: httpx.Response(503, json={"code": "modelo_no_disponible"}),
    )

    trabajo = _procesar(db, imagen)

    assert trabajo.estado == "error"
    assert trabajo.error_detalle == "modelo_no_disponible"
    assert trabajo.resultado is None
    assert db.query(Inferencia).count() == 0
    assert db.query(Nodulo).count() == 0
    assert not [k for k in doble.objetos if k.startswith("inferencias/")]


def test_timeout_deja_el_trabajo_en_error(
    mundo: dict[str, Any],
    almacen: tuple[ClienteS3Falso, ObjectStorage],
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db: Session = mundo["db"]
    imagen: Imagen = mundo["imagen"]
    doble, _storage = almacen
    _guardar_imagen(doble, imagen)

    def _tarda(_peticion: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("el servicio no respondió", request=_peticion)

    _cliente(monkeypatch, _tarda, timeout=0.01)

    trabajo = _procesar(db, imagen)

    assert trabajo.estado == "error"
    assert trabajo.error_detalle == "servicio_ia_no_disponible"
    assert trabajo.resultado is None
    assert db.query(Inferencia).count() == 0


def test_contrato_incompleto_deja_el_trabajo_en_error(
    mundo: dict[str, Any],
    almacen: tuple[ClienteS3Falso, ObjectStorage],
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db: Session = mundo["db"]
    imagen: Imagen = mundo["imagen"]
    doble, _storage = almacen
    _guardar_imagen(doble, imagen)
    incompleto = {k: v for k, v in CONTRATO.items() if k != "huella_modelos"}
    _cliente(monkeypatch, _respuesta(incompleto))

    trabajo = _procesar(db, imagen)

    assert trabajo.estado == "error"
    assert trabajo.error_detalle == "contrato_invalido"
    assert trabajo.resultado is None
    assert db.query(Inferencia).count() == 0
    assert db.query(ModeloIA).count() == 0
    assert not [k for k in doble.objetos if k.startswith("inferencias/")]


def test_el_resumen_no_arrastra_datos_clinicos(
    mundo: dict[str, Any],
    almacen: tuple[ClienteS3Falso, ObjectStorage],
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db: Session = mundo["db"]
    imagen: Imagen = mundo["imagen"]
    doble, _storage = almacen
    _guardar_imagen(doble, imagen)
    _cliente(monkeypatch, _respuesta(CONTRATO))

    trabajo = _procesar(db, imagen)

    assert trabajo.estado == "completado"
    resumen = trabajo.resultado
    assert resumen is not None
    # Solo identificadores, conteo y ruta del artefacto: nada por nódulo.
    assert all(not isinstance(valor, (dict, list)) for valor in resumen.values())
    serializado = json.dumps(resumen)
    for prohibido in (
        "caja",
        "confianza",
        "probabilidad",
        "region_analizada",
        "pixeles_mascara",
        "huella_modelos",
        "umbrales",
        "ancho",
        "alto",
        "clase",
        "maligno",
        "benigno",
    ):
        assert f'"{prohibido}' not in serializado


def _guardar_contrato_11(
    mundo: dict[str, Any],
    almacen: tuple[ClienteS3Falso, ObjectStorage],
    monkeypatch: pytest.MonkeyPatch,
    contrato: dict[str, Any],
) -> None:
    """Deja la imagen en el almacenamiento y el servicio respondiendo ``contrato``."""
    doble, _storage = almacen
    _guardar_imagen(doble, mundo["imagen"])
    _cliente(monkeypatch, _respuesta(contrato))


def test_contrato_1_1_guarda_los_cuatro_artefactos_de_cada_nodulo(
    mundo: dict[str, Any],
    almacen: tuple[ClienteS3Falso, ObjectStorage],
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db: Session = mundo["db"]
    doble, _storage = almacen
    _guardar_contrato_11(mundo, almacen, monkeypatch, _contrato_11())

    trabajo = _procesar(db, mundo["imagen"])

    assert trabajo.estado == "completado"
    inferencia = db.query(Inferencia).one()
    assert inferencia.version_contrato == "1.1"
    nodulo = db.query(Nodulo).one()
    base = f"inferencias/{inferencia.id}/nodulos/{nodulo.indice}"
    assert nodulo.mascara_ruta_s3 == f"{base}/mascara.png"
    assert nodulo.mgac_ruta_s3 == f"{base}/mgac.png"
    assert nodulo.xml_ruta_s3 == f"{base}/resultado.xml"
    assert nodulo.superposicion_ruta_s3 == f"{base}/superposicion.png"

    guardados = {
        nodulo.mascara_ruta_s3: (MASCARA, "image/png"),
        nodulo.mgac_ruta_s3: (MGAC, "image/png"),
        nodulo.xml_ruta_s3: (XML, "application/xml"),
        nodulo.superposicion_ruta_s3: (SUPERPOSICION, "image/png"),
    }
    for ruta, (contenido, tipo) in guardados.items():
        assert ruta in doble.objetos
        assert doble.objetos[ruta]["Body"] == contenido
        assert doble.objetos[ruta]["ContentType"] == tipo


def test_contrato_1_1_sin_artefactos_deja_las_rutas_en_nulo(
    mundo: dict[str, Any],
    almacen: tuple[ClienteS3Falso, ObjectStorage],
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db: Session = mundo["db"]
    _guardar_contrato_11(mundo, almacen, monkeypatch, _contrato_11(artefactos=False))

    trabajo = _procesar(db, mundo["imagen"])

    assert trabajo.estado == "completado"
    inferencia = db.query(Inferencia).one()
    assert inferencia.version_contrato == "1.1"
    nodulo = db.query(Nodulo).one()
    assert nodulo.mascara_ruta_s3 is None
    assert nodulo.mgac_ruta_s3 is None
    assert nodulo.xml_ruta_s3 is None
    assert nodulo.superposicion_ruta_s3 is None


def test_contrato_1_1_con_un_solo_artefacto_guarda_solo_ese(
    mundo: dict[str, Any],
    almacen: tuple[ClienteS3Falso, ObjectStorage],
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db: Session = mundo["db"]
    doble, _storage = almacen
    contrato = _contrato_11(artefactos=False)
    nodulo_crudo = {**contrato["nodulos"][0], "mascara_png": _b64(MASCARA)}
    _guardar_contrato_11(mundo, almacen, monkeypatch, {**contrato, "nodulos": [nodulo_crudo]})

    trabajo = _procesar(db, mundo["imagen"])

    assert trabajo.estado == "completado"
    nodulo = db.query(Nodulo).one()
    assert nodulo.mascara_ruta_s3 is not None
    assert nodulo.mgac_ruta_s3 is None
    assert nodulo.xml_ruta_s3 is None
    assert nodulo.superposicion_ruta_s3 is None
    artefactos = [clave for clave in doble.objetos if "/nodulos/" in clave]
    assert artefactos == [nodulo.mascara_ruta_s3]


def test_base64_invalido_deja_el_trabajo_en_error_sin_guardar_nada(
    mundo: dict[str, Any],
    almacen: tuple[ClienteS3Falso, ObjectStorage],
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db: Session = mundo["db"]
    doble, _storage = almacen
    contrato = _contrato_11(artefactos=False)
    nodulo_crudo = {**contrato["nodulos"][0], "xml": "esto no es base64!!"}
    _guardar_contrato_11(mundo, almacen, monkeypatch, {**contrato, "nodulos": [nodulo_crudo]})

    trabajo = _procesar(db, mundo["imagen"])

    assert trabajo.estado == "error"
    assert trabajo.error_detalle == "artefacto_invalido"
    assert trabajo.resultado is None
    assert db.query(Inferencia).count() == 0
    assert db.query(Nodulo).count() == 0
    assert not [clave for clave in doble.objetos if clave.startswith("inferencias/")]


def test_artefacto_que_no_es_png_deja_el_trabajo_en_error(
    mundo: dict[str, Any],
    almacen: tuple[ClienteS3Falso, ObjectStorage],
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db: Session = mundo["db"]
    doble, _storage = almacen
    contrato = _contrato_11(artefactos=False)
    nodulo_crudo = {**contrato["nodulos"][0], "superposicion_png": _b64(b"no es un PNG")}
    _guardar_contrato_11(mundo, almacen, monkeypatch, {**contrato, "nodulos": [nodulo_crudo]})

    trabajo = _procesar(db, mundo["imagen"])

    assert trabajo.estado == "error"
    assert trabajo.error_detalle == "artefacto_invalido"
    assert db.query(Inferencia).count() == 0
    assert not [clave for clave in doble.objetos if clave.startswith("inferencias/")]


def test_artefactos_sobre_el_tope_dejan_el_trabajo_en_error(
    mundo: dict[str, Any],
    almacen: tuple[ClienteS3Falso, ObjectStorage],
    sesiones: None,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    db: Session = mundo["db"]
    doble, _storage = almacen
    contrato = _contrato_11(artefactos=False)
    nodulo_crudo = {**contrato["nodulos"][0], "xml": BASE64_SOBRE_TOPE}
    _guardar_contrato_11(mundo, almacen, monkeypatch, {**contrato, "nodulos": [nodulo_crudo]})

    trabajo = _procesar(db, mundo["imagen"])

    assert trabajo.estado == "error"
    assert trabajo.error_detalle == "artefactos_demasiado_grandes"
    assert trabajo.resultado is None
    assert db.query(Inferencia).count() == 0
    assert not [clave for clave in doble.objetos if clave.startswith("inferencias/")]
