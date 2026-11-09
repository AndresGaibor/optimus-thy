"""Almacenamiento de archivos compatible con S3 (HT-007)."""

from app.storage.s3 import (
    ObjectStorage,
    PresignedLink,
    StorageError,
    StoredObject,
    build_object_key,
    get_storage,
)

__all__ = [
    "ObjectStorage",
    "PresignedLink",
    "StorageError",
    "StoredObject",
    "build_object_key",
    "get_storage",
]
