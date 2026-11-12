"""HU-060 y HT-050: carga de ecografías sin metadatos personales.

Todo el almacenamiento de estas pruebas es en memoria: ningún caso toca un S3
real. Las imágenes se generan aquí mismo, con datos sintéticos.
"""

from __future__ import annotations

import hashlib
import io
import uuid
from typing import Any

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw, PngImagePlugin

from app.api import imagenes as imagenes_api
from app.models.auditoria import Auditoria
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
    """Cliente S3 en memoria: guarda los objetos y no abre ninguna conexión."""

    def __init__(self) -> None:
        self.objetos: dict[str, dict[str, Any]] = {}
        self.enlaces: list[dict[str, Any]] = []
        self.falla = False

    def _revisar(self) -> None:
        if self.falla:
            raise RuntimeError("fallo simulado del almacenamiento")

    def put_object(self, **kwargs: Any) -> dict[str, Any]:
        self._revisar()
        self.objetos[kwargs["Key"]] = kwargs
        return {}

    def generate_presigned_url(
        self, ClientMethod: str, Params: dict[str, Any], ExpiresIn: int
    ) -> str:
        self._revisar()
        self.enlaces.append({"metodo": ClientMethod, "params": Params, "expira": ExpiresIn})
        return f"https://storage.local/{Params['Bucket']}/{Params['Key']}?firma=abc"


def _png(ancho: int = 256, alto: int = 256, texto: str | None = None) -> bytes:
    """PNG sintético con patrón, para que comprima mal y tenga bytes de sobra."""
    imagen = Image.new("RGB", (ancho, alto))
    pixeles = imagen.load()
    assert pixeles is not None
    for x in range(ancho):
        for y in range(alto):
            pixeles[x, y] = ((x * 7) % 256, (y * 11) % 256, (x * y) % 256)
    buf = io.BytesIO()
    pnginfo = None
    if texto is not None:
        pnginfo = PngImagePlugin.PngInfo()
        pnginfo.add_text("PatientName", texto)
        pnginfo.add_text("InstitutionName", "Hospital Demo")
    imagen.save(buf, format="PNG", pnginfo=pnginfo)
    return buf.getvalue()


def _jpeg_con_exif() -> bytes:
    """JPEG con EXIF de cámara y orientación: la copia guardada debe perderlo."""
    imagen = Image.new("RGB", (320, 240), (30, 90, 140))
    exif = Image.Exif()
    exif[0x010F] = "CamaraDePrueba"
    exif[0x0110] = "ModeloDePrueba"
    exif[0x0132] = "2026:01:01 00:00:00"
    exif[0x0112] = 1
    buf = io.BytesIO()
    imagen.save(buf, format="JPEG", exif=exif)
    return buf.getvalue()


def _gif() -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (128, 128), (1, 2, 3)).save(buf, format="GIF")
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
    roles = {n: Rol(nombre=n, descripcion=n) for n in ("doctor", "researcher")}
    db_session.add_all(roles.values())
    db_session.commit()
    return {
        "institucion": espoch,
        "medico": _usuario(db_session, espoch, "medico@t.com", roles["doctor"]),
        "medico_solca": _usuario(db_session, solca, "solca@t.com", roles["doctor"]),
        "investigador": _usuario(db_session, espoch, "investigador@t.com", roles["researcher"]),
    }


@pytest.fixture()
def almacen(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> tuple[ObjectStorage, ClienteS3Falso]:
    """Sustituye el almacenamiento real por uno en memoria en toda la app."""
    from app.ocr.cliente import ServicioOcrNoDisponible

    class _OcrNoDisponible:
        def detectar_texto_incrustado(
            self, contenido: bytes, content_type: str, nombre: str = "imagen"
        ) -> Any:
            raise ServicioOcrNoDisponible("no disponible en pruebas")

    cliente = ClienteS3Falso()
    storage = ObjectStorage(cliente, bucket="pruebas", presigned_seconds=600)
    client.app.dependency_overrides[get_storage] = lambda: storage
    monkeypatch.setattr(imagenes_api, "get_cliente_ocr", lambda: _OcrNoDisponible())
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


def _subir(client: TestClient, caso_id: str, contenido: bytes, nombre: str = "eco.png"):
    return client.post(
        f"/casos/{caso_id}/imagenes",
        files={"archivo": (nombre, contenido, "image/png")},
    )


def _eventos(db_session) -> list[tuple[str, str]]:
    db_session.expire_all()
    return [
        (accion, entidad)
        for accion, entidad in db_session.query(Auditoria.accion, Auditoria.entidad)
        .order_by(Auditoria.id)
        .all()
    ]


# ------------------------------------------------------------- HU-060 ----


def test_carga_correcta_guarda_en_el_almacen_y_en_la_base(
    client, mundo, db_session, almacen
) -> None:
    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    respuesta = _subir(client, caso_id, _png())

    assert respuesta.status_code == 201, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["caso_id"] == caso_id
    assert cuerpo["formato"] == "png"
    assert (cuerpo["ancho"], cuerpo["alto"]) == (256, 256)
    assert cuerpo["sin_metadatos_exif_dicom"] is True
    assert cuerpo["url_expira_en"] == 600

    fila = db_session.get(Imagen, uuid.UUID(cuerpo["id"]))
    assert fila is not None
    assert fila.caso_id == uuid.UUID(caso_id)
    assert fila.sin_metadatos_exif_dicom is True

    guardado = cliente_s3.objetos[fila.ruta_s3]
    assert fila.ruta_s3.startswith(f"casos/{uuid.UUID(caso_id).hex}/imagenes/")
    assert fila.ruta_s3.endswith(".png")
    assert guardado["ContentType"] == "image/png"
    assert guardado["Metadata"]["sha256"] == hashlib.sha256(guardado["Body"]).hexdigest()
    assert cuerpo["sha256"] == hashlib.sha256(guardado["Body"]).hexdigest()
    assert cuerpo["tamano_bytes"] == len(guardado["Body"])
    assert fila.ruta_s3 in cuerpo["url"]


def test_la_copia_guardada_no_trae_exif_ni_texto(client, mundo, db_session, almacen) -> None:
    _, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    jpeg = _subir(client, caso_id, _jpeg_con_exif(), nombre="eco.jpg")
    assert jpeg.status_code == 201, jpeg.text
    png = _subir(client, caso_id, _png(texto="Ana Pérez"), nombre="eco.png")
    assert png.status_code == 201, png.text

    fila_jpeg = db_session.get(Imagen, uuid.UUID(jpeg.json()["id"]))
    fila_png = db_session.get(Imagen, uuid.UUID(png.json()["id"]))
    assert fila_jpeg is not None and fila_png is not None
    cuerpo_jpeg = cliente_s3.objetos[fila_jpeg.ruta_s3]["Body"]
    cuerpo_png = cliente_s3.objetos[fila_png.ruta_s3]["Body"]

    with Image.open(io.BytesIO(cuerpo_jpeg)) as guardada:
        assert guardada.format == "JPEG"
        assert len(guardada.getexif()) == 0
        assert "exif" not in guardada.info
        assert "icc_profile" not in guardada.info
    with Image.open(io.BytesIO(cuerpo_png)) as guardada:
        assert guardada.format == "PNG"
        assert "PatientName" not in guardada.info
        assert "InstitutionName" not in guardada.info
        assert getattr(guardada, "text", {}) == {}


def test_un_formato_no_admitido_se_rechaza_diciendo_que_se_acepta(
    client, mundo, db_session, almacen
) -> None:
    _, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    respuesta = _subir(client, caso_id, _gif(), nombre="eco.gif")

    assert respuesta.status_code == 422, respuesta.text
    error = respuesta.json()["error"]
    assert error["code"] == "archivo_invalido"
    assert "PNG" in error["message"] and "JPEG" in error["message"]
    assert db_session.query(Imagen).count() == 0
    assert cliente_s3.objetos == {}


def test_un_archivo_corrupto_se_rechaza(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    respuesta = _subir(client, caso_id, b"esto no es una imagen" * 100, nombre="eco.png")

    assert respuesta.status_code == 422, respuesta.text
    assert "PNG o JPEG" in respuesta.json()["error"]["message"]
    assert db_session.query(Imagen).count() == 0


def test_el_exceso_de_tamano_responde_413(client, mundo, db_session, almacen, monkeypatch) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    monkeypatch.setattr(imagenes_api, "MAX_ARCHIVO_BYTES", 4096)

    respuesta = _subir(client, caso_id, _png())

    assert respuesta.status_code == 413, respuesta.text
    assert "supera el máximo" in respuesta.json()["error"]["message"]
    assert db_session.query(Imagen).count() == 0


def test_las_dimensiones_minimas_se_exigen(client, mundo, db_session, almacen) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)

    respuesta = _subir(client, caso_id, _png(ancho=32, alto=32), nombre="pequena.png")

    assert respuesta.status_code == 422, respuesta.text
    mensaje = respuesta.json()["error"]["message"]
    assert "al menos" in mensaje and "64×64" in mensaje  # noqa: RUF001
    assert db_session.query(Imagen).count() == 0


def test_un_caso_de_otra_institucion_responde_404(client, mundo, almacen) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    client.post("/auth/logout")
    _entrar(client, mundo["medico_solca"])

    assert _subir(client, caso_id, _png()).status_code == 404
    assert client.get(f"/casos/{caso_id}/imagenes").status_code == 404


def test_el_investigador_no_puede_cargar_ni_leer(client, mundo, almacen) -> None:
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    client.post("/auth/logout")
    _entrar(client, mundo["investigador"])

    assert _subir(client, caso_id, _png()).status_code == 403
    assert client.get(f"/casos/{caso_id}/imagenes").status_code == 403


def test_listado_y_auditoria(client, mundo, db_session, almacen) -> None:
    _, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    cargada = _subir(client, caso_id, _png())
    assert cargada.status_code == 201, cargada.text

    listado = client.get(f"/casos/{caso_id}/imagenes")

    assert listado.status_code == 200, listado.text
    cuerpo = listado.json()
    assert cuerpo["total"] == 1
    item = cuerpo["items"][0]
    assert item["id"] == cargada.json()["id"]
    assert item["sha256"] == cargada.json()["sha256"]
    assert item["formato"] == "png"
    assert item["sin_metadatos_exif_dicom"] is True
    assert item["texto_incrustado_detectado"] is None
    assert item["necesita_revision_texto"] is False
    assert item["url"].startswith("https://storage.local/pruebas/casos/")
    assert len(cliente_s3.enlaces) == 2

    eventos = _eventos(db_session)
    assert ("FILES.IMAGE_UPLOAD", "IMAGE") in eventos
    assert ("FILES.IMAGE_READ", "CASE") in eventos

    db_session.expire_all()
    subida = db_session.query(Auditoria).filter(Auditoria.accion == "FILES.IMAGE_UPLOAD").one()
    assert subida.entidad_id == cargada.json()["id"]
    assert subida.detalles is not None and subida.detalles.get("format") == "png"


# ------------------------------------------------------------- HT-051 ----


def _png_con_texto(texto: str, ancho: int = 256, alto: int = 256) -> bytes:
    imagen = Image.new("RGB", (ancho, alto), "white")
    dibujo = ImageDraw.Draw(imagen)
    dibujo.text((12, 12), texto, fill="black")
    buf = io.BytesIO()
    imagen.save(buf, format="PNG")
    return buf.getvalue()


def _bbox_imagen(
    imagen_bytes: bytes, xy: tuple[int, int, int, int]
) -> tuple[float, float, float, float]:
    with Image.open(io.BytesIO(imagen_bytes)) as imagen:
        ancho, alto = imagen.size
    x1, y1, x2, y2 = xy
    return (x1 / ancho, y1 / alto, x2 / ancho, y2 / alto)


def _cliente_ocr_falso(regiones: list[Any] | None = None, error: Exception | None = None) -> Any:
    from app.ocr.cliente import ResultadoTextoIncrustado

    class _Cliente:
        def detectar_texto_incrustado(
            self, contenido: bytes, content_type: str, nombre: str = "imagen"
        ) -> ResultadoTextoIncrustado:
            if error is not None:
                raise error
            regs = tuple(regiones or [])
            return ResultadoTextoIncrustado(
                version_contrato="1.1",
                motor="falso",
                regiones=regs,
                detectado=bool(regs),
            )

    return _Cliente()


@pytest.mark.parametrize(
    ("texto", "esperado"),
    [
        ("PACIENTES A APP", True),
        ("2026-03-14", True),
        ("FECHA:", True),
        ("NOMBRE COMPLETO", True),
        ("CÉDULA", True),
        ("HISTORIA CLINICA", True),
        ("SINT-0001", True),
        ("EDAD: 45", True),
        ("H— ”", False),
        ("mn - O o", False),
        ("nacio", False),
        ("NÓDULO QUÍSTICO", False),
        ("", False),
    ],
)
def test_ht051_clasificador_de_texto_sospechoso(texto: str, esperado: bool) -> None:
    assert imagenes_api._es_texto_sospechoso(texto) is esperado


def test_ht051_texto_sospechoso_tapado_con_confianza_baja_y_metadatos_sin_texto(
    client, mundo, db_session, almacen, monkeypatch
) -> None:
    from app.ocr.cliente import RegionTextoIncrustado

    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    base = _png_con_texto("PACIENTE 123")
    caja = (8, 8, 180, 36)
    # 0.30: por debajo del umbral anterior (0.60) y por encima del nuevo (0.25).
    region = RegionTextoIncrustado(
        bbox=_bbox_imagen(base, caja), texto="PACIENTE 123", confianza=0.30
    )

    monkeypatch.setattr(imagenes_api, "get_cliente_ocr", lambda: _cliente_ocr_falso([region]))

    respuesta = _subir(client, caso_id, base)
    assert respuesta.status_code == 201, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["texto_incrustado_detectado"] is True
    assert cuerpo["necesita_revision_texto"] is False
    assert "texto" not in cuerpo
    assert "regiones" not in cuerpo
    assert "coordenadas" not in str(cuerpo).lower()

    fila = db_session.get(Imagen, uuid.UUID(cuerpo["id"]))
    assert fila is not None
    assert fila.texto_incrustado_detectado is True
    assert fila.necesita_revision_texto is False
    assert fila.texto_incrustado_motivo is None

    guardado = cliente_s3.objetos[fila.ruta_s3]["Body"]
    with Image.open(io.BytesIO(guardado)) as imagen:
        pixel = imagen.getpixel((20, 20))
    assert pixel in ((0, 0, 0), 0)


def test_ht051_basura_del_ocr_no_se_tapa_ni_marca_revision(
    client, mundo, db_session, almacen, monkeypatch
) -> None:
    from app.ocr.cliente import RegionTextoIncrustado

    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    base = _png(ancho=256, alto=256)
    regiones = [
        RegionTextoIncrustado(
            bbox=_bbox_imagen(base, (10, 10, 80, 30)), texto="H— ”", confianza=0.99
        ),
        RegionTextoIncrustado(
            bbox=_bbox_imagen(base, (10, 40, 120, 60)), texto="mn - O o", confianza=0.99
        ),
    ]
    monkeypatch.setattr(imagenes_api, "get_cliente_ocr", lambda: _cliente_ocr_falso(regiones))

    respuesta = _subir(client, caso_id, base)
    assert respuesta.status_code == 201, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["texto_incrustado_detectado"] is False
    assert cuerpo["necesita_revision_texto"] is False

    fila = db_session.get(Imagen, uuid.UUID(cuerpo["id"]))
    assert fila is not None
    assert fila.texto_incrustado_detectado is False
    assert fila.texto_incrustado_motivo == "sin_texto_sospechoso"

    guardado = cliente_s3.objetos[fila.ruta_s3]["Body"]
    with Image.open(io.BytesIO(base)) as original, Image.open(io.BytesIO(guardado)) as copia:
        assert copia.tobytes() == original.tobytes()


def test_ht051_texto_sospechoso_con_confianza_de_ruido_no_se_tapa(
    client, mundo, db_session, almacen, monkeypatch
) -> None:
    from app.ocr.cliente import RegionTextoIncrustado

    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    base = _png(ancho=256, alto=256)
    region = RegionTextoIncrustado(
        bbox=_bbox_imagen(base, (10, 10, 120, 40)), texto="PACIENTE 123", confianza=0.10
    )
    monkeypatch.setattr(imagenes_api, "get_cliente_ocr", lambda: _cliente_ocr_falso([region]))

    respuesta = _subir(client, caso_id, base)
    assert respuesta.status_code == 201, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["texto_incrustado_detectado"] is False
    assert cuerpo["necesita_revision_texto"] is False

    fila = db_session.get(Imagen, uuid.UUID(cuerpo["id"]))
    assert fila is not None
    assert fila.texto_incrustado_motivo == "sin_texto_sospechoso"

    guardado = cliente_s3.objetos[fila.ruta_s3]["Body"]
    with Image.open(io.BytesIO(base)) as original, Image.open(io.BytesIO(guardado)) as copia:
        assert copia.tobytes() == original.tobytes()


def test_ht051_region_grande_sospechosa_no_se_tapa_y_se_marca_revision(
    client, mundo, db_session, almacen, monkeypatch
) -> None:
    from app.ocr.cliente import RegionTextoIncrustado

    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    base = _png(ancho=256, alto=256)
    caja = (0, 0, 200, 200)  # >15% del área
    original = base
    region = RegionTextoIncrustado(
        bbox=_bbox_imagen(base, caja), texto="PACIENTE GRANDE", confianza=0.99
    )
    monkeypatch.setattr(imagenes_api, "get_cliente_ocr", lambda: _cliente_ocr_falso([region]))

    respuesta = _subir(client, caso_id, base)
    assert respuesta.status_code == 201, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["texto_incrustado_detectado"] is True
    assert cuerpo["necesita_revision_texto"] is True

    fila = db_session.get(Imagen, uuid.UUID(cuerpo["id"]))
    assert fila is not None
    assert fila.necesita_revision_texto is True
    assert fila.texto_incrustado_motivo == "region_grande"
    assert fila.texto_incrustado_motivo != "PACIENTE GRANDE"

    guardado = cliente_s3.objetos[fila.ruta_s3]["Body"]
    # región grande no tapada: píxeles centrales conservan patrón original
    with Image.open(io.BytesIO(original)) as img_o, Image.open(io.BytesIO(guardado)) as img_g:
        assert img_g.getpixel((100, 100)) == img_o.getpixel((100, 100))


def test_ht051_ocr_caido_guarda_imagen_con_null_sin_fallar(
    client, mundo, db_session, almacen, monkeypatch
) -> None:
    from app.ocr.cliente import ServicioOcrNoDisponible

    _storage, cliente_s3 = almacen
    _entrar(client, mundo["medico"])
    caso_id = _caso(client)
    contenido = _png()
    monkeypatch.setattr(
        imagenes_api,
        "get_cliente_ocr",
        lambda: _cliente_ocr_falso(error=ServicioOcrNoDisponible("timeout")),
    )

    respuesta = _subir(client, caso_id, contenido)
    assert respuesta.status_code == 201, respuesta.text
    cuerpo = respuesta.json()
    assert cuerpo["texto_incrustado_detectado"] is None
    assert cuerpo["necesita_revision_texto"] is False

    fila = db_session.get(Imagen, uuid.UUID(cuerpo["id"]))
    assert fila is not None
    assert fila.texto_incrustado_detectado is None
    assert fila.necesita_revision_texto is False
    assert cliente_s3.objetos[fila.ruta_s3]["Body"]  # imagen guardada

    listado = client.get(f"/casos/{caso_id}/imagenes")
    assert listado.status_code == 200
    item = listado.json()["items"][0]
    assert item["texto_incrustado_detectado"] is None
    assert item["necesita_revision_texto"] is False
    assert "texto" not in item
    assert "regiones" not in item
    assert "coordenadas" not in str(item).lower()
