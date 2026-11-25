"""Carga y consulta de las ecografías del caso (HU-060, HT-050).

La detección de texto incrustado requiere OCR y en operativo no se hace
(ADR-020). El saneo elimina EXIF, ICC y texto de metadatos.

- El tipo real se decide por el contenido con Pillow, nunca por nombre o cabecera.
- La copia se reescribe píxel a píxel y el SHA-256 es el de esa copia.
- El objeto se guarda con clave opaca y se lee solo por enlace firmado.
- Un caso de otra institución responde 404, igual que uno inexistente (RS-ACC-04).
"""

from __future__ import annotations

import io
import uuid
from datetime import datetime
from typing import Annotated, Final

from fastapi import APIRouter, Depends, File, Request, UploadFile, status
from fastapi.responses import JSONResponse
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.media.imagenes import codificar, sin_metadatos
from app.models.fichas import Caso
from app.models.imagenes import Imagen
from app.storage.s3 import ObjectStorage, StorageError, get_storage

router = APIRouter(tags=["imagenes"])
MAX_ARCHIVO_BYTES: Final[int] = 15 * 1024 * 1024
MIN_ANCHO_PX: Final[int] = 64
MIN_ALTO_PX: Final[int] = 64
FORMATOS_ADMITIDOS: Final[dict[str, tuple[str, str]]] = {
    "JPEG": ("image/jpeg", "jpg"),
    "PNG": ("image/png", "png"),
}
_QUE_SE_ACEPTA: Final[str] = "Solo se aceptan imágenes PNG o JPEG."
_TROZO_LECTURA: Final[int] = 64 * 1024
_EXTENSION_A_FORMATO: Final[dict[str, str]] = {"jpg": "JPEG", "png": "PNG"}


class ImagenOut(BaseModel):
    """Metadatos de la imagen cargada; el archivo se lee por ``url``."""

    id: str
    caso_id: str
    sha256: str
    formato: str
    ancho: int
    alto: int
    tamano_bytes: int
    sin_metadatos_exif_dicom: bool
    creado_en: datetime
    url: str
    url_expira_en: int


class ImagenResumenOut(BaseModel):
    """Imagen ya guardada, tal como la devuelve el listado."""

    id: str
    caso_id: str
    sha256: str
    formato: str
    sin_metadatos_exif_dicom: bool
    creado_en: datetime
    url: str
    url_expira_en: int


class ImagenesListOut(BaseModel):
    total: int
    items: list[ImagenResumenOut]


class _ArchivoRechazado(Exception):
    """El archivo no cumple los requisitos; el mensaje es para el usuario."""

    codigo_http: int = status.HTTP_422_UNPROCESSABLE_ENTITY

    def __init__(self, mensaje: str) -> None:
        super().__init__(mensaje)
        self.mensaje = mensaje


class _ArchivoDemasiadoGrande(_ArchivoRechazado):
    """Supera el tope de tamaño: el cliente debe reducirlo, no reintentar."""

    codigo_http = status.HTTP_413_CONTENT_TOO_LARGE


def _error(request: Request, codigo_http: int, codigo: str, mensaje: str) -> JSONResponse:
    return JSONResponse(
        status_code=codigo_http,
        content={
            "error": {"code": codigo, "message": mensaje},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _no_encontrado(request: Request) -> JSONResponse:
    return _error(request, status.HTTP_404_NOT_FOUND, "not_found", "No encontrado")


def _uuid(valor: str) -> uuid.UUID | None:
    try:
        return uuid.UUID(valor)
    except ValueError:
        return None


def _caso_de(db: Session, actual: SesionActual, id_texto: str) -> Caso | None:
    """El caso solo si existe y es de la institución de quien consulta."""
    caso_id = _uuid(id_texto)
    if caso_id is None:
        return None
    return (
        db.query(Caso)
        .filter(Caso.id == caso_id, Caso.institucion_id == actual.usuario.institucion_id)
        .first()
    )


def _validar_y_limpiar(contenido: bytes) -> tuple[Image.Image, str, str, int, int]:
    """Valida por contenido y devuelve la copia limpia sin codificar."""
    try:
        with Image.open(io.BytesIO(contenido)) as sondeo:
            formato = (sondeo.format or "").upper()
            if formato not in FORMATOS_ADMITIDOS:
                raise _ArchivoRechazado(f"Formato no admitido. {_QUE_SE_ACEPTA}")
            sondeo.verify()
        with Image.open(io.BytesIO(contenido)) as original:
            original.load()
            limpia = sin_metadatos(ImageOps.exif_transpose(original))
    except _ArchivoRechazado:
        raise
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        raise _ArchivoRechazado(
            f"El archivo no es una imagen válida o está dañado. {_QUE_SE_ACEPTA}"
        ) from exc
    ancho, alto = limpia.size
    if ancho < MIN_ANCHO_PX or alto < MIN_ALTO_PX:
        raise _ArchivoRechazado(
            f"La imagen es demasiado pequeña: se exigen al menos "
            f"{MIN_ANCHO_PX}×{MIN_ALTO_PX} píxeles y llegó {ancho}×{alto}."  # noqa: RUF001
        )
    return limpia, formato, FORMATOS_ADMITIDOS[formato][0], ancho, alto


async def _leer_archivo(archivo: UploadFile) -> bytes:
    """Lee como máximo un byte más que el tope, para poder rechazar el exceso."""
    trozos: list[bytes] = []
    total = 0
    while True:
        trozo = await archivo.read(_TROZO_LECTURA)
        if not trozo:
            break
        total += len(trozo)
        if total > MAX_ARCHIVO_BYTES:
            raise _ArchivoDemasiadoGrande(
                f"El archivo supera el máximo de {MAX_ARCHIVO_BYTES // (1024 * 1024)} MB."
            )
        trozos.append(trozo)
    if total == 0:
        raise _ArchivoRechazado(f"El archivo está vacío. {_QUE_SE_ACEPTA}")
    return b"".join(trozos)


def _extension_de(formato: str) -> str:
    return FORMATOS_ADMITIDOS[formato][1]


def _resumen(fila: Imagen, storage: ObjectStorage) -> ImagenResumenOut:
    """Vista de una imagen guardada; el formato sale de la extensión opaca."""
    extension = fila.ruta_s3.rsplit(".", 1)[-1]
    enlace = storage.generate_presigned_link(fila.ruta_s3)
    return ImagenResumenOut(
        id=str(fila.id),
        caso_id=str(fila.caso_id),
        sha256=fila.hash_sha256,
        formato=_EXTENSION_A_FORMATO.get(extension, extension).lower(),
        sin_metadatos_exif_dicom=fila.sin_metadatos_exif_dicom,
        creado_en=fila.creado_en,
        url=enlace.url,
        url_expira_en=enlace.expires_in_seconds,
    )


@router.post("/casos/{caso_id}/imagenes", status_code=status.HTTP_201_CREATED, response_model=None)
async def cargar_imagen(
    request: Request,
    caso_id: str,
    archivo: Annotated[UploadFile, File(description="Ecografía en PNG o JPEG")],
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("imagen.cargar"))],
    storage: Annotated[ObjectStorage, Depends(get_storage)],
) -> ImagenOut | JSONResponse:
    """Carga una ecografía del caso y guarda una copia sin metadatos."""
    caso = _caso_de(db, actual, caso_id)
    if caso is None:
        return _no_encontrado(request)
    try:
        contenido = await _leer_archivo(archivo)
        limpia, formato, content_type, ancho, alto = _validar_y_limpiar(contenido)
    except _ArchivoRechazado as rechazo:
        return _error(request, rechazo.codigo_http, "archivo_invalido", rechazo.mensaje)
    saneada = codificar(limpia, formato)
    try:
        guardado = storage.put_object(
            saneada,
            content_type,
            prefix=f"casos/{caso.id.hex}/imagenes",
            extension=_extension_de(formato),
        )
        enlace = storage.generate_presigned_link(guardado.key)
    except StorageError:
        return _error(
            request,
            status.HTTP_502_BAD_GATEWAY,
            "storage_error",
            "No se pudo guardar la imagen; intenta de nuevo.",
        )
    imagen = Imagen(
        caso_id=caso.id,
        ruta_s3=guardado.key,
        hash_sha256=guardado.sha256,
        sin_metadatos_exif_dicom=True,
    )
    db.add(imagen)
    db.commit()
    db.refresh(imagen)
    registrar(
        db,
        request,
        AuditAction.IMAGE_UPLOAD,
        AuditModule.FILES,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.IMAGE,
        objeto_id=imagen.id,
        detalles={"format": formato.lower(), "file_kind": "image"},
    )
    return ImagenOut(
        id=str(imagen.id),
        caso_id=str(imagen.caso_id),
        sha256=guardado.sha256,
        formato=formato.lower(),
        ancho=ancho,
        alto=alto,
        tamano_bytes=guardado.size_bytes,
        sin_metadatos_exif_dicom=imagen.sin_metadatos_exif_dicom,
        creado_en=imagen.creado_en,
        url=enlace.url,
        url_expira_en=enlace.expires_in_seconds,
    )


@router.get("/casos/{caso_id}/imagenes", response_model=None)
def listar_imagenes(
    request: Request,
    caso_id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("imagen.leer"))],
    storage: Annotated[ObjectStorage, Depends(get_storage)],
) -> ImagenesListOut | JSONResponse:
    """Lista las ecografías del caso, cada una con su enlace firmado."""
    caso = _caso_de(db, actual, caso_id)
    if caso is None:
        return _no_encontrado(request)
    filas = (
        db.query(Imagen)
        .filter(Imagen.caso_id == caso.id)
        .order_by(Imagen.creado_en.desc(), Imagen.id.desc())
        .all()
    )
    try:
        items = [_resumen(fila, storage) for fila in filas]
    except StorageError:
        return _error(
            request,
            status.HTTP_502_BAD_GATEWAY,
            "storage_error",
            "No se pudieron firmar los enlaces; intenta de nuevo.",
        )
    registrar(
        db,
        request,
        AuditAction.IMAGE_READ,
        AuditModule.FILES,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.CASE,
        objeto_id=caso.id,
        detalles={"resource_count": len(items)},
    )
    return ImagenesListOut(total=len(items), items=items)
