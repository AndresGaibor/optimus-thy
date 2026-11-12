"""HU-050: carga y listado de documentos del caso (RF-DOC-01/02/03).

Todo el almacenamiento es en memoria: ningún caso toca un S3 real. Los archivos
se construyen aquí mismo, con datos sintéticos.
"""

from __future__ import annotations

import hashlib
import io
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy.orm import sessionmaker

from app.api import documentos as documentos_api
from app.config import get_settings
from app.jobs import manejadores
from app.jobs.worker import MANEJADORES, procesar_una
from app.models.auditoria import Auditoria
from app.models.documentos import CampoOCR, Documento, ExtraccionOCR
from app.models.instituciones import Institucion
from app.models.trabajos import Trabajo
from app.models.usuarios import Rol, Usuario, UsuarioRol
from app.ocr import motivos
from app.ocr.cliente import (
    CampoReconocido,
    ResultadoReconocimiento,
    ServicioOcrNoDisponible,
)
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
    """Cliente S3 en memoria: guarda los objetos y no abre ninguna conexión."""

    def __init__(self) -> None:
        self.objetos: dict[str, dict[str, Any]] = {}
        self.enlaces: list[dict[str, Any]] = []
        self.borrados: list[str] = []

    def put_object(self, **kwargs: Any) -> dict[str, Any]:
        self.objetos[kwargs["Key"]] = kwargs
        return {}

    def get_object(self, **kwargs: Any) -> dict[str, Any]:
        if kwargs["Key"] not in self.objetos:
            raise RuntimeError("objeto inexistente")
        datos = self.objetos[kwargs["Key"]]["Body"]
        return {"Body": io.BytesIO(datos), "ContentLength": len(datos)}

    def delete_object(self, **kwargs: Any) -> dict[str, Any]:
        self.objetos.pop(kwargs["Key"], None)
        self.borrados.append(kwargs["Key"])
        return {}

    def generate_presigned_url(
        self, ClientMethod: str, Params: dict[str, Any], ExpiresIn: int
    ) -> str:
        self.enlaces.append({"metodo": ClientMethod, "params": Params, "expira": ExpiresIn})
        return f"https://storage.local/{Params['Bucket']}/{Params['Key']}?firma=abc"


def _pdf(extra: bytes = b"", vista_inicial: bytes = b"") -> bytes:
    """PDF mínimo con catálogo, página, trailer, startxref y %%EOF.

    ``vista_inicial`` se añade al diccionario del catálogo (por ejemplo
    ``/OpenAction [3 0 R /Fit]``, que no es contenido activo).
    """
    return (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R" + vista_inicial + b" >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>\nendobj\n"
        + extra
        + b"trailer\n<< /Root 1 0 R /Size 4 >>\nstartxref\n0\n%%EOF\n"
    )


def _png() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (96, 96), (40, 90, 140)).save(buf, format="PNG")
    return buf.getvalue()


def _jpeg_con_exif() -> bytes:
    """JPEG con EXIF de cámara: la copia guardada debe perderlo."""
    imagen = Image.new("RGB", (96, 96), (30, 90, 140))
    exif = Image.Exif()
    exif[0x010F] = "CamaraDePrueba"
    exif[0x0110] = "ModeloDePrueba"
    exif[0x0132] = "2026:01:01 00:00:00"
    buf = io.BytesIO()
    imagen.save(buf, format="JPEG", exif=exif)
    return buf.getvalue()


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
    rol = Rol(nombre="doctor", descripcion="doctor")
    db_session.add(rol)
    db_session.commit()
    return {
        "institucion": espoch,
        "medico": _usuario(db_session, espoch, "medico@t.com", rol),
        "medico_solca": _usuario(db_session, solca, "solca@t.com", rol),
    }


@pytest.fixture()
def almacen(
    client: TestClient,
) -> tuple[ObjectStorage, ClienteS3Falso]:
    """Sustituye el almacenamiento real por uno en memoria en toda la app."""
    cliente = ClienteS3Falso()
    storage = ObjectStorage(cliente, bucket="pruebas", presigned_seconds=600)
    client.app.dependency_overrides[get_storage] = lambda: storage
    return storage, cliente


def _entrar(client: TestClient, correo: str) -> TestClient:
    respuesta = client.post("/auth/login", json={"correo": correo, "password": CLAVE})
    assert respuesta.status_code == 200, respuesta.text
    return client


def _caso(client: TestClient) -> str:
    paciente = client.post("/pacientes", json=PACIENTE)
    assert paciente.status_code == 201, paciente.text
    caso = client.post(f"/pacientes/{paciente.json()['id']}/casos")
    assert caso.status_code == 201, caso.text
    return caso.json()["id"]


def _subir(
    client: TestClient,
    caso_id: str,
    contenido: bytes,
    nombre: str = "informe.pdf",
    tipo: str = "application/pdf",
):
    return client.post(
        f"/casos/{caso_id}/documentos",
        files={"archivo": (nombre, contenido, tipo)},
    )


def _eventos(db_session) -> list[tuple[str, str]]:
    db_session.expire_all()
    return [
        (accion, entidad)
        for accion, entidad in db_session.query(Auditoria.accion, Auditoria.entidad)
        .order_by(Auditoria.id)
        .all()
    ]


def test_pdf_valido_se_guarda_en_el_almacen_y_en_la_base(
    client, mundo, db_session, almacen
) -> None:
    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    contenido = _pdf(vista_inicial=b" /OpenAction [3 0 R /Fit]")
    respuesta = _subir(client, caso_id, contenido, nombre="informe.pdf")

    assert respuesta.status_code == 201, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["nombre_original"] == "informe.pdf"
    assert cuerpo["tipo_mime"] == "application/pdf"
    assert cuerpo["hash_sha256"] == hashlib.sha256(contenido).hexdigest()
    assert cuerpo["tamano_bytes"] == len(contenido)
    assert "ruta_s3" not in cuerpo
    assert "url" not in cuerpo and "enlace" not in cuerpo

    fila = db_session.get(Documento, uuid.UUID(cuerpo["id"]))
    assert fila is not None
    assert fila.caso_id == uuid.UUID(caso_id)
    assert fila.nombre_original == "informe.pdf"
    assert fila.version == 1
    assert fila.tipo_mime == "application/pdf"
    assert fila.tamano_bytes == len(contenido)
    assert fila.hash_sha256 == hashlib.sha256(contenido).hexdigest()

    assert fila.ruta_s3.startswith("documentos/")
    assert fila.ruta_s3.endswith(".pdf")
    guardado = cliente_s3.objetos[fila.ruta_s3]
    assert guardado["ContentType"] == "application/pdf"
    assert guardado["Body"] == contenido
    assert guardado["Metadata"]["sha256"] == hashlib.sha256(guardado["Body"]).hexdigest()

    assert ("FILES.DOCUMENT_UPLOAD", "DOCUMENT") in _eventos(db_session)
    db_session.expire_all()
    evento = db_session.query(Auditoria).filter(Auditoria.accion == "FILES.DOCUMENT_UPLOAD").one()
    assert evento.entidad_id == cuerpo["id"]
    assert evento.detalles is not None
    assert evento.detalles.get("format") == "pdf"
    assert evento.detalles.get("file_kind") == "document"


def test_pdf_con_vista_inicial_openaction_se_acepta(client, mundo, db_session, almacen) -> None:
    """/OpenAction solo fija el destino inicial: no es contenido activo."""
    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    contenido = _pdf(vista_inicial=b" /OpenAction [3 0 R /Fit]")

    respuesta = _subir(client, caso_id, contenido, nombre="escaneo.pdf")

    assert respuesta.status_code == 201, respuesta.text
    assert respuesta.json()["tipo_mime"] == "application/pdf"
    db_session.expire_all()
    fila = (
        db_session.query(Documento).filter(Documento.id == uuid.UUID(respuesta.json()["id"])).one()
    )
    assert fila.tamano_bytes == len(contenido)
    assert cliente_s3.objetos[fila.ruta_s3]["Body"] == contenido


def test_pdf_con_javascript_se_rechaza(client, mundo, db_session, almacen) -> None:
    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    con_script = _pdf(b"4 0 obj\n<< /S /JavaScript /JS (app.alert(1)) >>\nendobj\n")

    respuesta = _subir(client, caso_id, con_script)

    assert respuesta.status_code == 422, respuesta.text
    assert respuesta.json()["error"]["code"] == "pdf_con_scripts"
    assert db_session.query(Documento).count() == 0
    assert cliente_s3.objetos == {}
    db_session.expire_all()
    rechazo = db_session.query(Auditoria).filter(Auditoria.accion == "FILES.DOCUMENT_UPLOAD").one()
    assert rechazo.detalles is not None
    assert rechazo.detalles.get("error_code") == "pdf_con_scripts"


def test_un_exe_renombrado_a_pdf_se_rechaza(client, mundo, db_session, almacen) -> None:
    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    respuesta = _subir(client, caso_id, b"MZ\x90\x00" + b"\x00" * 512, nombre="informe.pdf")

    assert respuesta.status_code == 415, respuesta.text
    error = respuesta.json()["error"]
    assert error["code"] == "tipo_no_permitido"
    assert "PDF" in error["message"] and "JPEG" in error["message"]
    assert db_session.query(Documento).count() == 0
    assert cliente_s3.objetos == {}


@pytest.mark.parametrize(
    ("contenido", "nombre", "tipo"),
    [
        (_pdf()[:-32], "truncado.pdf", "application/pdf"),
        (b"\x89PNG\r\n\x1a\n" + b"basura" * 100, "roto.png", "image/png"),
    ],
)
def test_un_archivo_danado_se_rechaza(
    client, mundo, db_session, almacen, contenido: bytes, nombre: str, tipo: str
) -> None:
    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    respuesta = _subir(client, caso_id, contenido, nombre=nombre, tipo=tipo)

    assert respuesta.status_code == 422, respuesta.text
    assert respuesta.json()["error"]["code"] == "archivo_danado"
    assert db_session.query(Documento).count() == 0
    assert cliente_s3.objetos == {}


def test_el_exceso_de_tamano_responde_413(
    client, mundo, db_session, almacen, monkeypatch: pytest.MonkeyPatch
) -> None:
    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    monkeypatch.setattr(get_settings(), "documento_max_bytes", 4096)

    respuesta = _subir(client, caso_id, _pdf(b"%" + b"x" * 5000 + b"\n"))

    assert respuesta.status_code == 413, respuesta.text
    error = respuesta.json()["error"]
    assert error["code"] == "archivo_demasiado_grande"
    assert "supera el máximo" in error["message"]
    assert db_session.query(Documento).count() == 0
    assert cliente_s3.objetos == {}


def test_el_mismo_archivo_dos_veces_responde_409_y_conserva_el_primero(
    client, mundo, db_session, almacen
) -> None:
    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    contenido = _pdf()

    primera = _subir(client, caso_id, contenido, nombre="informe.pdf")
    assert primera.status_code == 201, primera.text
    primera_fila = db_session.get(Documento, uuid.UUID(primera.json()["id"]))
    assert primera_fila is not None

    segunda = _subir(client, caso_id, contenido, nombre="informe.pdf")

    assert segunda.status_code == 409, segunda.text
    assert segunda.json()["error"]["code"] == "documento_duplicado"
    db_session.expire_all()
    filas = db_session.query(Documento).all()
    assert len(filas) == 1
    assert str(filas[0].id) == primera.json()["id"]
    assert filas[0].hash_sha256 == primera.json()["hash_sha256"]
    assert list(cliente_s3.objetos) == [primera_fila.ruta_s3]


def test_un_jpeg_con_exif_se_guarda_sin_exif(client, mundo, db_session, almacen) -> None:
    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    respuesta = _subir(
        client,
        caso_id,
        _jpeg_con_exif(),
        nombre="radiografia.jpg",
        tipo="application/octet-stream",
    )

    assert respuesta.status_code == 201, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["tipo_mime"] == "image/jpeg"
    fila = db_session.get(Documento, uuid.UUID(cuerpo["id"]))
    assert fila is not None
    assert fila.ruta_s3.endswith(".jpg")
    guardado = cliente_s3.objetos[fila.ruta_s3]["Body"]
    assert guardado.startswith(b"\xff\xd8\xff")
    assert guardado != _jpeg_con_exif()
    with Image.open(io.BytesIO(guardado)) as copia:
        assert copia.format == "JPEG"
        assert len(copia.getexif()) == 0
        assert "exif" not in copia.info
        assert "icc_profile" not in copia.info


def test_listado_devuelve_los_campos_y_el_enlace(client, mundo, db_session, almacen) -> None:
    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    pdf = _subir(client, caso_id, _pdf(), nombre="informe.pdf")
    assert pdf.status_code == 201, pdf.text
    png = _subir(client, caso_id, _png(), nombre="foto.png", tipo="image/png")
    assert png.status_code == 201, png.text

    listado = client.get(f"/casos/{caso_id}/documentos")

    assert listado.status_code == 200, listado.text
    documentos = listado.json()["documentos"]
    assert [documento["id"] for documento in documentos] == [pdf.json()["id"], png.json()["id"]]
    por_id = {documento["id"]: documento for documento in documentos}
    assert set(por_id[pdf.json()["id"]]) == {
        "id",
        "nombre_original",
        "tipo_mime",
        "tamano_bytes",
        "hash_sha256",
        "estado_ocr",
        "ocr_motivo",
        "creado_en",
        "enlace",
    }
    assert por_id[pdf.json()["id"]]["tipo_mime"] == "application/pdf"
    assert por_id[png.json()["id"]]["tipo_mime"] == "image/png"
    assert por_id[pdf.json()["id"]]["estado_ocr"] == "en_cola"
    assert por_id[pdf.json()["id"]]["ocr_motivo"] is None
    db_session.expire_all()
    primera = db_session.get(Documento, uuid.UUID(pdf.json()["id"]))
    assert primera is not None
    assert por_id[pdf.json()["id"]]["enlace"] == (
        f"https://storage.local/pruebas/{primera.ruta_s3}?firma=abc"
    )
    assert len(cliente_s3.enlaces) == 2
    assert ("FILES.DOCUMENT_READ", "CASE") in _eventos(db_session)


def test_un_caso_de_otra_institucion_responde_404(client, mundo, almacen) -> None:
    _storage, _cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    client.post("/auth/logout")
    _entrar(client, mundo["medico_solca"])

    rechazada = _subir(client, caso_id, _pdf())
    assert rechazada.status_code == 404
    assert rechazada.json()["error"]["code"] == "no_encontrado"
    listado = client.get(f"/casos/{caso_id}/documentos")
    assert listado.status_code == 404
    assert listado.json()["error"]["code"] == "no_encontrado"


# --- HU-051: estado del OCR ---

RESULTADO_OCR = ResultadoReconocimiento(
    version_contrato="1.1",
    motor="glm-ocr",
    modelo="glm-ocr-1",
    huella_modelo="c" * 64,
    paginas=1,
    campos=(
        CampoReconocido(nombre="tsh", valor="2.5", confianza=0.92, revisar=False),
        CampoReconocido(
            nombre="fecha_laboratorio", valor="2026-01-05", confianza=None, revisar=True
        ),
    ),
)


class ClienteOcrFalso:
    """Doble del cliente OCR: responde el resultado o lanza el error pedido."""

    def __init__(
        self,
        resultado: ResultadoReconocimiento | None = None,
        error: Exception | None = None,
        al_reconocer: Any = None,
    ) -> None:
        self.resultado = resultado
        self.error = error
        self.al_reconocer = al_reconocer
        self.llamadas: list[tuple[bytes, str, str]] = []

    def reconocer_documento(
        self, contenido: bytes, content_type: str, nombre: str = "documento"
    ) -> ResultadoReconocimiento:
        self.llamadas.append((contenido, content_type, nombre))
        if self.al_reconocer is not None:
            self.al_reconocer(contenido, content_type, nombre)
        if self.error is not None:
            raise self.error
        assert self.resultado is not None
        return self.resultado


@pytest.fixture()
def manejador_almacen(monkeypatch: pytest.MonkeyPatch, almacen: tuple[ObjectStorage, Any]):
    """El manejador usa el mismo almacenamiento en memoria que la API."""
    storage, cliente_s3 = almacen
    monkeypatch.setattr(manejadores, "get_storage", lambda: storage)
    return cliente_s3


@pytest.fixture()
def manejador_sesiones(monkeypatch: pytest.MonkeyPatch, test_engine: Any) -> None:
    """El manejador abre su sesión contra la base de pruebas."""
    monkeypatch.setattr(manejadores, "get_session_factory", lambda: sessionmaker(bind=test_engine))


def _cliente_ocr(monkeypatch: pytest.MonkeyPatch, doble: ClienteOcrFalso) -> ClienteOcrFalso:
    monkeypatch.setattr(manejadores, "get_cliente_ocr", lambda: doble)
    return doble


def test_la_carga_encola_el_ocr_y_deja_el_documento_en_cola(
    client, mundo, db_session, almacen
) -> None:
    _storage, _cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    respuesta = _subir(client, caso_id, _pdf(), nombre="informe.pdf")

    assert respuesta.status_code == 201, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["estado_ocr"] == "en_cola"
    assert cuerpo["ocr_motivo"] is None

    db_session.expire_all()
    trabajo = db_session.query(Trabajo).one()
    assert trabajo.tipo == "ocr"
    assert trabajo.estado == "en_cola"
    assert trabajo.payload == {"documento_id": cuerpo["id"]}
    assert trabajo.creado_por is not None


def test_si_encolar_falla_el_documento_se_guarda_con_error(
    client, mundo, db_session, almacen, monkeypatch: pytest.MonkeyPatch
) -> None:
    _storage, _cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    def _caido(*_args: Any, **_kwargs: Any) -> None:
        raise RuntimeError("la cola no responde")

    monkeypatch.setattr(documentos_api, "encolar", _caido)

    respuesta = _subir(client, caso_id, _pdf(), nombre="informe.pdf")

    assert respuesta.status_code == 201, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["estado_ocr"] == "error"
    assert cuerpo["ocr_motivo"] == "no se pudo encolar el OCR"
    assert "no responde" not in cuerpo["ocr_motivo"]

    db_session.expire_all()
    fila = db_session.get(Documento, uuid.UUID(cuerpo["id"]))
    assert fila is not None
    assert fila.estado_ocr == "error"
    assert fila.ocr_motivo == motivos.MOTIVOS[motivos.SIN_ENCOLAR]
    assert fila.ocr_actualizado_en is not None
    assert db_session.query(Trabajo).count() == 0


def test_el_detalle_devuelve_el_estado_del_ocr(client, mundo, almacen) -> None:
    _storage, _cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    subido = _subir(client, caso_id, _pdf(), nombre="informe.pdf")
    assert subido.status_code == 201, subido.text

    detalle = client.get(f"/casos/{caso_id}/documentos/{subido.json()['id']}")

    assert detalle.status_code == 200, detalle.text
    cuerpo = detalle.json()
    assert cuerpo["id"] == subido.json()["id"]
    assert cuerpo["estado_ocr"] == "en_cola"
    assert cuerpo["ocr_motivo"] is None
    assert cuerpo["enlace"].startswith("https://storage.local/")
    for prohibido in ("ruta_s3", "texto_markdown", "valor_extraido", "contenido"):
        assert prohibido not in cuerpo


def test_el_detalle_de_un_documento_de_otra_institucion_responde_404(
    client, mundo, almacen
) -> None:
    _storage, _cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    subido = _subir(client, caso_id, _pdf(), nombre="informe.pdf")
    assert subido.status_code == 201, subido.text
    client.post("/auth/logout")
    _entrar(client, mundo["medico_solca"])
    caso_ajeno = _caso(client)

    del_caso_ajeno = client.get(f"/casos/{caso_id}/documentos/{subido.json()['id']}")
    assert del_caso_ajeno.status_code == 404
    assert del_caso_ajeno.json()["error"]["code"] == "no_encontrado"

    documento_ajeno = client.get(f"/casos/{caso_ajeno}/documentos/{subido.json()['id']}")
    assert documento_ajeno.status_code == 404
    assert documento_ajeno.json()["error"]["code"] == "no_encontrado"


def test_el_manejador_de_ocr_esta_registrado() -> None:
    assert MANEJADORES["ocr"] is manejadores.manejar_ocr


def test_el_ocr_pasa_por_procesando_y_termina_listo(
    client,
    mundo,
    db_session,
    almacen,
    manejador_almacen,
    manejador_sesiones,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    subido = _subir(client, caso_id, _pdf(), nombre="informe.pdf")
    assert subido.status_code == 201, subido.text
    documento_id = uuid.UUID(subido.json()["id"])
    vistos: list[str] = []

    def _mirar(*_argumentos: Any) -> None:
        db_session.expire_all()
        fila = db_session.get(Documento, documento_id)
        assert fila is not None
        vistos.append(fila.estado_ocr)

    doble = _cliente_ocr(
        monkeypatch,
        ClienteOcrFalso(resultado=RESULTADO_OCR, al_reconocer=_mirar),
    )

    trabajo = procesar_una(db_session, MANEJADORES)

    assert trabajo is not None
    assert trabajo.tipo == "ocr"
    assert trabajo.estado == "completado"
    assert trabajo.error_detalle is None
    assert vistos == ["procesando"]
    assert len(doble.llamadas) == 1
    assert doble.llamadas[0][1] == "application/pdf"

    db_session.expire_all()
    documento = db_session.get(Documento, documento_id)
    assert documento is not None
    assert documento.estado_ocr == "listo"
    assert documento.ocr_motivo is None
    assert documento.ocr_actualizado_en is not None

    extraccion = db_session.query(ExtraccionOCR).one()
    assert extraccion.documento_id == documento_id
    assert extraccion.estado == "listo"
    assert extraccion.modelo_ocr == "glm-ocr"
    assert extraccion.version_modelo == "c" * 64
    assert extraccion.finalizado_en is not None

    campos = db_session.query(CampoOCR).order_by(CampoOCR.nombre_campo).all()
    assert [(campo.nombre_campo, campo.valor_extraido) for campo in campos] == [
        ("fecha_laboratorio", "2026-01-05"),
        ("tsh", "2.5"),
    ]
    assert campos[0].confianza == 0.0
    assert campos[1].confianza == pytest.approx(0.92)
    assert all(campo.confirmado_por_humano is False for campo in campos)

    evento = db_session.query(Auditoria).filter(Auditoria.accion == "OCR.OCR_REQUEST").one()
    assert evento.entidad == "DOCUMENT"
    assert evento.entidad_id == str(documento_id)
    assert evento.detalles is not None
    assert evento.detalles.get("format") == "pdf"
    assert evento.detalles.get("resource_count") == 2
    assert "2.5" not in str(evento.detalles)


def test_un_fallo_del_motor_deja_error_con_motivo_conocido_sin_filtrar_el_mensaje(
    client,
    mundo,
    db_session,
    almacen,
    manejador_almacen,
    manejador_sesiones,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    subido = _subir(client, caso_id, _pdf(), nombre="informe.pdf")
    assert subido.status_code == 201, subido.text
    documento_id = uuid.UUID(subido.json()["id"])

    interno = "10.0.0.5:8001 /srv/ocr/modelo.bin no responde"
    _cliente_ocr(monkeypatch, ClienteOcrFalso(error=ServicioOcrNoDisponible(interno)))

    trabajo = procesar_una(db_session, MANEJADORES)

    assert trabajo is not None
    assert trabajo.estado == "error"
    assert trabajo.error_detalle == "servicio_ocr_no_disponible"

    db_session.expire_all()
    documento = db_session.get(Documento, documento_id)
    assert documento is not None
    assert documento.estado_ocr == "error"
    assert documento.ocr_motivo == motivos.MOTIVOS[motivos.SERVICIO_NO_DISPONIBLE]
    assert "10.0.0.5" not in documento.ocr_motivo
    assert "/srv/" not in documento.ocr_motivo
    assert documento.ocr_actualizado_en is not None
    assert db_session.query(ExtraccionOCR).one().estado == "con_error"

    detalle = client.get(f"/casos/{caso_id}/documentos/{subido.json()['id']}")
    assert detalle.status_code == 200, detalle.text
    assert detalle.json()["ocr_motivo"] == motivos.MOTIVOS[motivos.SERVICIO_NO_DISPONIBLE]
    assert "10.0.0.5" not in detalle.text
    assert "/srv/" not in detalle.text

    evento = db_session.query(Auditoria).filter(Auditoria.accion == "OCR.OCR_REQUEST").one()
    assert evento.detalles is not None
    assert evento.detalles.get("error_code") == "servicio_ocr_no_disponible"
    assert "10.0.0.5" not in str(evento.detalles)


# --- HU-053: enlace firmado y registro del acceso (RF-DOC-09) ---


def _lecturas(db_session) -> list[Auditoria]:
    """Eventos de lectura de documentos, en orden de inserción."""
    db_session.expire_all()
    return (
        db_session.query(Auditoria)
        .filter(Auditoria.accion == "FILES.DOCUMENT_READ")
        .order_by(Auditoria.id)
        .all()
    )


def test_el_enlace_firmado_se_emite_para_un_documento_propio(
    client, mundo, db_session, almacen
) -> None:
    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    subido = _subir(client, caso_id, _pdf(), nombre="informe.pdf")
    assert subido.status_code == 201, subido.text
    documento_id = subido.json()["id"]
    db_session.expire_all()
    fila = db_session.get(Documento, uuid.UUID(documento_id))
    assert fila is not None

    antes = datetime.now(UTC)
    respuesta = client.post(f"/casos/{caso_id}/documentos/{documento_id}/enlace")

    assert respuesta.status_code == 200, respuesta.text
    cuerpo = respuesta.json()
    assert set(cuerpo) == {"enlace", "caduca_en"}
    assert cuerpo["enlace"] == f"https://storage.local/pruebas/{fila.ruta_s3}?firma=abc"
    assert cliente_s3.enlaces[-1]["metodo"] == "get_object"
    assert cliente_s3.enlaces[-1]["expira"] == 300
    caduca = datetime.fromisoformat(cuerpo["caduca_en"])
    assert antes + timedelta(seconds=300) <= caduca <= datetime.now(UTC) + timedelta(seconds=301)


def test_el_acceso_queda_en_la_bitacora_con_el_documento_id_sin_datos_del_paciente(
    client, mundo, db_session, almacen
) -> None:
    _storage, _cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    subido = _subir(client, caso_id, _pdf(), nombre="informe.pdf")
    assert subido.status_code == 201, subido.text
    documento_id = subido.json()["id"]

    respuesta = client.post(f"/casos/{caso_id}/documentos/{documento_id}/enlace")
    assert respuesta.status_code == 200, respuesta.text

    evento = _lecturas(db_session)[-1]
    assert evento.entidad == "DOCUMENT"
    assert evento.entidad_id == documento_id
    assert evento.detalles is not None
    assert evento.detalles.get("file_kind") == "document"
    assert evento.detalles.get("content_type") == "application/pdf"
    detalles = str(evento.detalles)
    for prohibido in (PACIENTE["nombres"], PACIENTE["apellidos"], PACIENTE["documento"]):
        assert prohibido not in detalles


def test_la_respuesta_del_enlace_no_expone_la_clave_interna(
    client, mundo, db_session, almacen
) -> None:
    _storage, _cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    subido = _subir(client, caso_id, _pdf(), nombre="informe.pdf")
    assert subido.status_code == 201, subido.text
    db_session.expire_all()
    fila = db_session.get(Documento, uuid.UUID(subido.json()["id"]))
    assert fila is not None

    respuesta = client.post(f"/casos/{caso_id}/documentos/{subido.json()['id']}/enlace")

    assert respuesta.status_code == 200, respuesta.text
    cuerpo = respuesta.json()
    assert "ruta_s3" not in respuesta.text
    assert {"ruta_s3", "key", "bucket", "url"}.isdisjoint(cuerpo)
    # La clave vive dentro de la URL firmada; nunca como valor suelto del JSON.
    valores = [valor for valor in cuerpo.values() if isinstance(valor, str)]
    assert fila.ruta_s3 not in valores


def test_el_enlace_de_un_documento_de_otro_caso_responde_404_sin_evento(
    client, mundo, db_session, almacen
) -> None:
    _storage, _cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    paciente = client.post("/pacientes", json=PACIENTE)
    assert paciente.status_code == 201, paciente.text
    paciente_id = paciente.json()["id"]
    caso_id = client.post(f"/pacientes/{paciente_id}/casos").json()["id"]
    otro_caso = client.post(f"/pacientes/{paciente_id}/casos").json()["id"]
    subido = _subir(client, caso_id, _pdf(), nombre="informe.pdf")
    assert subido.status_code == 201, subido.text
    antes = len(_lecturas(db_session))

    respuesta = client.post(f"/casos/{otro_caso}/documentos/{subido.json()['id']}/enlace")

    assert respuesta.status_code == 404, respuesta.text
    assert respuesta.json()["error"]["code"] == "no_encontrado"
    assert len(_lecturas(db_session)) == antes


def test_sin_permiso_de_lectura_el_enlace_responde_403(client, mundo, db_session, almacen) -> None:
    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    subido = _subir(client, caso_id, _pdf(), nombre="informe.pdf")
    assert subido.status_code == 201, subido.text
    antes = len(_lecturas(db_session))
    client.post("/auth/logout")

    rol = Rol(nombre="researcher", descripcion="Investigador: cohortes")
    db_session.add(rol)
    db_session.commit()
    db_session.refresh(rol)
    investigador = _usuario(db_session, mundo["institucion"], "investigador@t.com", rol)
    _entrar(client, investigador)

    respuesta = client.post(f"/casos/{caso_id}/documentos/{subido.json()['id']}/enlace")

    assert respuesta.status_code == 403, respuesta.text
    assert respuesta.json()["error"]["code"] == "forbidden"
    assert cliente_s3.enlaces == []
    assert len(_lecturas(db_session)) == antes
