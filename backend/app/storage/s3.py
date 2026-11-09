"""Almacenamiento de archivos compatible con S3 (HT-007).

Reglas del ADR-005: bucket privado, nombres opacos, contenido nunca en la base,
descarga solo por enlace firmado de corta duración y SHA-256 en los metadatos.
"""

from __future__ import annotations

import hashlib
import re
import uuid
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import UTC, datetime
from functools import lru_cache
from typing import Any, Protocol

import boto3
from botocore.client import Config

from app.config import get_settings

__all__ = [
    "ObjectStorage",
    "PresignedLink",
    "StorageError",
    "StoredObject",
    "build_object_key",
    "get_storage",
    "sanitize_extension",
]

_EXTENSION_RE = re.compile(r"^[a-z0-9]{1,8}$")
_PREFIX_RE = re.compile(r"^[a-z0-9/_-]{1,200}$")

MAX_PRESIGNED_SECONDS = 24 * 60 * 60
"""Tope duro de vigencia de un enlace firmado."""


class StorageError(Exception):
    """Fallo del almacenamiento, con mensaje apto para el cliente."""


@dataclass(frozen=True)
class StoredObject:
    """Metadatos de un objeto guardado; lo que va a la base."""

    bucket: str
    key: str
    size_bytes: int
    sha256: str
    content_type: str


@dataclass(frozen=True)
class PresignedLink:
    """Enlace temporal de descarga."""

    url: str
    expires_in_seconds: int


class S3Client(Protocol):
    """Subconjunto del cliente de boto3 que usa el adaptador."""

    def put_object(self, **kwargs: Any) -> Mapping[str, Any]: ...

    def get_object(self, **kwargs: Any) -> Mapping[str, Any]: ...

    def head_object(self, **kwargs: Any) -> Mapping[str, Any]: ...

    def head_bucket(self, **kwargs: Any) -> Mapping[str, Any]: ...

    def delete_object(self, **kwargs: Any) -> Mapping[str, Any]: ...

    def generate_presigned_url(
        self, ClientMethod: str, Params: Mapping[str, Any], ExpiresIn: int
    ) -> str: ...

    def create_bucket(self, **kwargs: Any) -> Mapping[str, Any]: ...

    def put_bucket_public_access_block(self, **kwargs: Any) -> Mapping[str, Any]: ...


def sanitize_extension(extension: str) -> str:
    """Normaliza la extensión y rechaza cualquier intento de salir de la ruta."""
    limpia = extension.lower().lstrip(".")
    if not limpia:
        return ""
    if not _EXTENSION_RE.match(limpia):
        raise StorageError("Extensión de archivo no permitida")
    return f".{limpia}"


def build_object_key(prefix: str, extension: str = "") -> str:
    """Construye una clave opaca: ``prefijo/AAAA/MM/DD/<uuid><ext>``."""
    prefijo = prefix.strip("/")
    if not _PREFIX_RE.match(prefijo) or ".." in prefijo:
        raise StorageError("Prefijo de almacenamiento no permitido")
    ahora = datetime.now(UTC)
    nombre = uuid.uuid4().hex
    return f"{prefijo}/{ahora:%Y/%m/%d}/{nombre}{sanitize_extension(extension)}"


class ObjectStorage:
    """Adaptador del almacenamiento S3; recibe el cliente ya construido."""

    def __init__(self, client: S3Client, bucket: str, presigned_seconds: int = 3600) -> None:
        if not bucket:
            raise StorageError("Falta el bucket de almacenamiento")
        if not 60 <= presigned_seconds <= MAX_PRESIGNED_SECONDS:
            raise StorageError("Vigencia de enlace firmado fuera de rango")
        self._client = client
        self._bucket = bucket
        self._presigned_seconds = presigned_seconds

    @property
    def bucket(self) -> str:
        return self._bucket

    def ensure_bucket(self) -> None:
        """Crea el bucket si no existe y le bloquea todo acceso público."""
        try:
            self._client.head_bucket(Bucket=self._bucket)
        except Exception:
            try:
                self._client.create_bucket(Bucket=self._bucket)
            except Exception as exc:
                raise StorageError("No se pudo preparar el bucket") from exc
        try:
            self._client.put_bucket_public_access_block(
                Bucket=self._bucket,
                PublicAccessBlockConfiguration={
                    "BlockPublicAcls": True,
                    "IgnorePublicAcls": True,
                    "BlockPublicPolicy": True,
                    "RestrictPublicBuckets": True,
                },
            )
        except Exception as exc:
            raise StorageError("No se pudo asegurar el bucket") from exc

    def put_object(
        self,
        content: bytes,
        content_type: str,
        prefix: str,
        extension: str = "",
    ) -> StoredObject:
        """Sube el contenido y devuelve los metadatos que se guardan en la base."""
        key = build_object_key(prefix, extension)
        digest = hashlib.sha256(content).hexdigest()
        try:
            self._client.put_object(
                Bucket=self._bucket,
                Key=key,
                Body=content,
                ContentType=content_type,
                ServerSideEncryption="AES256",
                Metadata={"sha256": digest},
            )
        except Exception as exc:
            raise StorageError("No se pudo guardar el archivo") from exc
        return StoredObject(
            bucket=self._bucket,
            key=key,
            size_bytes=len(content),
            sha256=digest,
            content_type=content_type,
        )

    def generate_presigned_link(
        self, key: str, expires_in_seconds: int | None = None
    ) -> PresignedLink:
        """Enlace temporal de descarga; es la única forma de leer el objeto."""
        segundos = self._presigned_seconds if expires_in_seconds is None else expires_in_seconds
        if not 60 <= segundos <= MAX_PRESIGNED_SECONDS:
            raise StorageError("Vigencia de enlace firmado fuera de rango")
        try:
            url = self._client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": self._bucket, "Key": key},
                ExpiresIn=segundos,
            )
        except Exception as exc:
            raise StorageError("No se pudo firmar el enlace") from exc
        return PresignedLink(url=url, expires_in_seconds=segundos)

    def delete_object(self, key: str) -> None:
        """Borra un objeto; la baja del paciente arrastra sus archivos."""
        try:
            self._client.delete_object(Bucket=self._bucket, Key=key)
        except Exception as exc:
            raise StorageError("No se pudo borrar el archivo") from exc


def _build_client() -> S3Client:
    settings = get_settings()
    client: S3Client = boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        region_name=settings.s3_region,
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )
    return client


@lru_cache(maxsize=1)
def get_storage() -> ObjectStorage:
    """Almacenamiento por defecto, configurado desde el entorno."""
    settings = get_settings()
    return ObjectStorage(
        client=_build_client(),
        bucket=settings.s3_bucket,
        presigned_seconds=settings.s3_presigned_seconds,
    )
