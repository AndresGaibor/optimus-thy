"""Pruebas del almacenamiento compatible con S3 (HT-007)."""

from __future__ import annotations

import hashlib
import re
from dataclasses import fields
from typing import Any

import pytest
from pydantic import ValidationError

from app.config import Settings
from app.storage.s3 import (
    MAX_PRESIGNED_SECONDS,
    ObjectStorage,
    StorageError,
    StoredObject,
    build_object_key,
    sanitize_extension,
)

PATRON_CLAVE = re.compile(r"^patients/[0-9a-f]{8}/images/\d{4}/\d{2}/\d{2}/[0-9a-f]{32}\.png$")


class ClienteFalso:
    """Cliente de S3 en memoria, sin red."""

    def __init__(self, existe_bucket: bool = True) -> None:
        self.existe_bucket = existe_bucket
        self.objetos: dict[str, dict[str, Any]] = {}
        self.buckets_creados: list[str] = []
        self.bloqueos: list[dict[str, Any]] = []
        self.enlaces: list[dict[str, Any]] = []
        self.borrados: list[str] = []
        self.falla = False

    def _revisar(self) -> None:
        if self.falla:
            raise RuntimeError("fallo simulado del almacenamiento")

    def head_bucket(self, **kwargs: Any) -> dict[str, Any]:
        self._revisar()
        if not self.existe_bucket:
            raise RuntimeError("bucket inexistente")
        return {}

    def create_bucket(self, **kwargs: Any) -> dict[str, Any]:
        self._revisar()
        self.existe_bucket = True
        self.buckets_creados.append(kwargs["Bucket"])
        return {}

    def put_bucket_public_access_block(self, **kwargs: Any) -> dict[str, Any]:
        self._revisar()
        self.bloqueos.append(kwargs["PublicAccessBlockConfiguration"])
        return {}

    def put_object(self, **kwargs: Any) -> dict[str, Any]:
        self._revisar()
        self.objetos[kwargs["Key"]] = kwargs
        return {}

    def get_object(self, **kwargs: Any) -> dict[str, Any]:
        self._revisar()
        return {"Body": self.objetos[kwargs["Key"]]["Body"]}

    def head_object(self, **kwargs: Any) -> dict[str, Any]:
        self._revisar()
        return {"ContentLength": len(self.objetos[kwargs["Key"]]["Body"])}

    def delete_object(self, **kwargs: Any) -> dict[str, Any]:
        self._revisar()
        self.borrados.append(kwargs["Key"])
        self.objetos.pop(kwargs["Key"], None)
        return {}

    def generate_presigned_url(
        self, ClientMethod: str, Params: dict[str, Any], ExpiresIn: int
    ) -> str:
        self._revisar()
        self.enlaces.append({"metodo": ClientMethod, "params": Params, "expira": ExpiresIn})
        return f"https://storage.local/{Params['Bucket']}/{Params['Key']}?firma=abc"


@pytest.fixture()
def almacenamiento() -> tuple[ObjectStorage, ClienteFalso]:
    """Almacenamiento conectado al cliente falso."""
    cliente = ClienteFalso()
    return ObjectStorage(cliente, bucket="optimus"), cliente


def test_la_clave_es_opaca_y_unica() -> None:
    """La ruta no lleva datos personales y cambia en cada archivo."""
    primera = build_object_key("patients/abc12345/images", ".PNG")
    segunda = build_object_key("patients/abc12345/images", "png")

    assert PATRON_CLAVE.match(primera), primera
    assert primera != segunda


def test_la_extension_no_permite_escapar_de_la_ruta() -> None:
    """Se aceptan extensiones simples y se rechaza el resto."""
    assert sanitize_extension("PDF") == ".pdf"
    assert sanitize_extension(".png") == ".png"
    assert sanitize_extension("") == ""

    for intento in ("../etc/passwd", "p ng", "png/..", "ejecutable", "a.b"):
        with pytest.raises(StorageError):
            sanitize_extension(intento)


def test_el_prefijo_no_permite_rutas_arbitrarias() -> None:
    """El prefijo lo elige el servidor, no el usuario."""
    for prefijo in ("../secreto", "Patients/ABC", "", "patients/abc/../x"):
        with pytest.raises(StorageError):
            build_object_key(prefijo)


def test_subir_cifra_en_el_servidor_y_guarda_la_huella(
    almacenamiento: tuple[ObjectStorage, ClienteFalso],
) -> None:
    """El objeto sube cifrado, con su SHA-256 y sin permiso público."""
    storage, cliente = almacenamiento
    contenido = b"ecografia sintetica"

    guardado = storage.put_object(contenido, "image/png", "patients/abc12345/images", "png")

    llamada = cliente.objetos[guardado.key]
    assert llamada["ServerSideEncryption"] == "AES256"
    assert llamada["ContentType"] == "image/png"
    assert llamada["Metadata"]["sha256"] == hashlib.sha256(contenido).hexdigest()
    assert "ACL" not in llamada
    assert guardado.size_bytes == len(contenido)
    assert guardado.sha256 == hashlib.sha256(contenido).hexdigest()
    assert guardado.bucket == "optimus"


def test_los_metadatos_no_incluyen_enlace(
    almacenamiento: tuple[ObjectStorage, ClienteFalso],
) -> None:
    """Lo que se guarda en la base son metadatos y ubicación, nunca una URL."""
    storage, _ = almacenamiento

    guardado = storage.put_object(b"x", "application/pdf", "patients/abc12345/documents", "pdf")

    assert {campo.name for campo in fields(StoredObject)} == {
        "bucket",
        "key",
        "size_bytes",
        "sha256",
        "content_type",
    }
    assert not hasattr(guardado, "url")


def test_el_enlace_firmado_es_temporal(
    almacenamiento: tuple[ObjectStorage, ClienteFalso],
) -> None:
    """La descarga exige un enlace firmado con vigencia corta."""
    storage, cliente = almacenamiento
    key = build_object_key("patients/abc12345/images", "png")

    por_defecto = storage.generate_presigned_link(key)
    corto = storage.generate_presigned_link(key, expires_in_seconds=300)

    assert por_defecto.expires_in_seconds == 3600
    assert corto.expires_in_seconds == 300
    assert cliente.enlaces[0]["metodo"] == "get_object"
    assert cliente.enlaces[0]["params"] == {"Bucket": "optimus", "Key": key}
    assert por_defecto.url.startswith("https://")

    for invalida in (10, MAX_PRESIGNED_SECONDS + 1, 0, -1):
        with pytest.raises(StorageError):
            storage.generate_presigned_link(key, expires_in_seconds=invalida)


def test_vigencia_invalida_al_construir() -> None:
    """Un adaptador no puede quedar con enlaces de duración absurda."""
    for segundos in (0, 59, MAX_PRESIGNED_SECONDS + 1):
        with pytest.raises(StorageError):
            ObjectStorage(ClienteFalso(), bucket="optimus", presigned_seconds=segundos)


def test_el_bucket_queda_privado(
    almacenamiento: tuple[ObjectStorage, ClienteFalso],
) -> None:
    """Se crea si falta y se bloquea todo acceso público."""
    storage, cliente = almacenamiento
    storage.ensure_bucket()

    assert cliente.bloqueos == [
        {
            "BlockPublicAcls": True,
            "IgnorePublicAcls": True,
            "BlockPublicPolicy": True,
            "RestrictPublicBuckets": True,
        }
    ]
    assert cliente.buckets_creados == []

    storage_con_bucket_nuevo = ObjectStorage(ClienteFalso(existe_bucket=False), bucket="optimus")
    storage_con_bucket_nuevo.ensure_bucket()


def test_un_bucket_nuevo_se_crea(
    almacenamiento: tuple[ObjectStorage, ClienteFalso],
) -> None:
    """Si el bucket no existe se crea una sola vez."""
    cliente = ClienteFalso(existe_bucket=False)
    ObjectStorage(cliente, bucket="optimus").ensure_bucket()

    assert cliente.buckets_creados == ["optimus"]


def test_los_fallos_del_cliente_no_filtran_detalles(
    almacenamiento: tuple[ObjectStorage, ClienteFalso],
) -> None:
    """Un error del almacenamiento se convierte en un mensaje genérico."""
    storage, cliente = almacenamiento
    cliente.falla = True

    with pytest.raises(StorageError) as error:
        storage.put_object(b"x", "image/png", "patients/abc12345/images", "png")

    assert "fallo simulado" not in str(error.value)
    assert str(error.value) == "No se pudo guardar el archivo"


def test_borrar_informa_la_clave(
    almacenamiento: tuple[ObjectStorage, ClienteFalso],
) -> None:
    """El borrado se delega al almacenamiento con la clave exacta."""
    storage, cliente = almacenamiento
    guardado = storage.put_object(b"x", "image/png", "patients/abc12345/images", "png")

    storage.delete_object(guardado.key)

    assert cliente.borrados == [guardado.key]


def test_la_vigencia_por_defecto_viene_del_entorno() -> None:
    """La configuración valida el rango antes de llegar al adaptador."""
    assert Settings(s3_presigned_seconds=900).s3_presigned_seconds == 900

    with pytest.raises(ValidationError):
        Settings(s3_presigned_seconds=5)
