"""Carga y consulta de las ecografías del caso (HU-060, HT-050).

Reglas que garantiza este módulo:

- El tipo real del archivo se decide por su contenido con Pillow, nunca por el
  nombre ni por la cabecera ``Content-Type`` que envía el cliente.
- La copia que se guarda se reescribe píxel a píxel: sin EXIF, sin perfil ICC,
  sin texto PNG y sin bloques de fabricante. El SHA-256 es el de esa copia.
- Tras sanear, se consulta el OCR para detectar texto incrustado: las regiones
  cuyo texto parece identificar a la persona (dígitos o palabras como
  «paciente», «fecha», «documento») se tapan; las grandes se marcan para
  revisión.
- El objeto va al almacenamiento con una clave opaca y se lee solo por enlace
  firmado; la base guarda metadatos, nunca el archivo.
- Un caso de otra institución responde 404, igual que uno inexistente
  (RS-ACC-04).
"""

from __future__ import annotations

import io
import logging
import uuid
from datetime import datetime
from typing import Annotated, Final

from fastapi import APIRouter, Depends, File, Request, UploadFile, status
from fastapi.responses import JSONResponse
from PIL import Image, ImageDraw, ImageOps, UnidentifiedImageError
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.db import session_dep
from app.media.imagenes import codificar, sin_metadatos
from app.models.fichas import Caso
from app.models.imagenes import Imagen
from app.ocr.cliente import ErrorOcr, RegionTextoIncrustado, get_cliente_ocr
from app.storage.s3 import ObjectStorage, StorageError, get_storage

logger = logging.getLogger(__name__)

router = APIRouter(tags=["imagenes"])

#: Tamaño máximo aceptado para una ecografía.
MAX_ARCHIVO_BYTES: Final[int] = 15 * 1024 * 1024

#: Lado mínimo, en píxeles: por debajo no hay detalle diagnóstico posible.
MIN_ANCHO_PX: Final[int] = 64
MIN_ALTO_PX: Final[int] = 64

#: Formatos aceptados, con su tipo MIME y la extensión de la clave opaca.
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
    texto_incrustado_detectado: bool | None
    necesita_revision_texto: bool
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
    texto_incrustado_detectado: bool | None
    necesita_revision_texto: bool
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

    codigo_http = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE


def _error(request: Request, codigo_http: int, codigo: str, mensaje: str) -> JSONResponse:
    return JSONResponse(
        status_code=codigo_http,
        content={
            "error": {"code": codigo, "message": mensaje},
            "request_id": getattr(request.state, "request_id", "-"),
        },
    )


def _no_encontrado(request: Request) -> JSONResponse:
    return _error(
        request,
        status.HTTP_404_NOT_FOUND,
        "not_found",
        "No encontrado",
    )


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


_CONFIANZA_MINIMA_TEXTO: Final[float] = 0.25
_AREA_MAX_TAPADO: Final[float] = 0.15
_MARGEN_TAPADO_PX: Final[int] = 2

#: Palabras que suelen etiquetar un dato identificatorio en una anotación.
_PALABRAS_CLAVE_TEXTO: Final[tuple[str, ...]] = (
    "paciente",
    "nombre",
    "apellido",
    "fecha",
    "hoy",
    "cedula",
    "cédula",
    "ci",
    "hc",
    "historia",
    "documento",
    "sint",
    "edad",
    "sexo",
    "tel",
    "email",
)


def _es_texto_sospechoso(texto: str) -> bool:
    """¿El texto parece un dato de la persona y no ruido de la ecografía?

    Es sospechoso si trae algún dígito o una palabra clave. Las claves se
    comparan por palabra (el token empieza por la clave) para que ``PACIENTES``
    o ``FECHA:`` cuenten sin que la basura del OCR (``nacio`` → ``ci``) active
    una clave corta por casualidad.
    """
    if any(caracter.isdigit() for caracter in texto):
        return True
    palabras = "".join(c if c.isalpha() else " " for c in texto.lower()).split()
    return any(palabra.startswith(clave) for palabra in palabras for clave in _PALABRAS_CLAVE_TEXTO)


def _aplicar_texto_incrustado(
    imagen: Image.Image, regiones: tuple[RegionTextoIncrustado, ...]
) -> tuple[bool, bool, str | None]:
    """Tapa el texto sospechoso y marca revisión si alguna región es muy grande.

    Devuelve ``(detectado, necesita_revision, motivo)`` sin exponer texto ni
    coordenadas. Solo se consideran regiones cuyo texto parece identificar a la
    persona y cuya confianza no es ruido; una región grande no se tapa para no
    destruir la zona clínica. Si no hay ninguna sospechosa, la imagen no se
    toca y ``detectado`` queda en ``False``.
    """
    if not regiones:
        return False, False, None

    ancho, alto = imagen.size
    area_imagen = max(ancho * alto, 1)
    dibujo = ImageDraw.Draw(imagen)
    detectado = False
    necesita_revision = False
    motivo: str | None = None

    for region in regiones:
        if not _es_texto_sospechoso(region.texto):
            continue
        if region.confianza is not None and region.confianza < _CONFIANZA_MINIMA_TEXTO:
            continue
        x1, y1, x2, y2 = region.bbox
        ix1 = max(int(x1 * ancho) - _MARGEN_TAPADO_PX, 0)
        iy1 = max(int(y1 * alto) - _MARGEN_TAPADO_PX, 0)
        ix2 = min(int(x2 * ancho) + _MARGEN_TAPADO_PX, ancho)
        iy2 = min(int(y2 * alto) + _MARGEN_TAPADO_PX, alto)
        if ix2 <= ix1 or iy2 <= iy1:
            continue
        detectado = True
        area_region = (ix2 - ix1) * (iy2 - iy1)
        if area_region > area_imagen * _AREA_MAX_TAPADO:
            necesita_revision = True
            if motivo is None:
                motivo = "region_grande"
            continue
        dibujo.rectangle((ix1, iy1, ix2, iy2), fill=(0, 0, 0))

    if not detectado:
        return False, False, "sin_texto_sospechoso"
    return True, necesita_revision, motivo


def _detectar_y_tapar(
    imagen: Image.Image, contenido_saneado: bytes, content_type: str
) -> tuple[bool | None, bool, str | None]:
    """Consulta el OCR y aplica la política conservadora de tapado/revisión."""
    try:
        resultado = get_cliente_ocr().detectar_texto_incrustado(contenido_saneado, content_type)
    except ErrorOcr:
        logger.warning("ocr_texto_incrustado_no_disponible")
        return None, False, None
    return _aplicar_texto_incrustado(imagen, resultado.regiones)


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
        texto_incrustado_detectado=fila.texto_incrustado_detectado,
        necesita_revision_texto=fila.necesita_revision_texto,
        creado_en=fila.creado_en,
        url=enlace.url,
        url_expira_en=enlace.expires_in_seconds,
    )


@router.post(
    "/casos/{caso_id}/imagenes",
    status_code=status.HTTP_201_CREATED,
    response_model=None,
)
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
    detectado, revision, motivo = _detectar_y_tapar(limpia, saneada, content_type)
    sano_final = codificar(limpia, formato) if detectado else saneada

    try:
        guardado = storage.put_object(
            sano_final,
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

    sha256 = guardado.sha256
    imagen = Imagen(
        caso_id=caso.id,
        ruta_s3=guardado.key,
        hash_sha256=sha256,
        sin_metadatos_exif_dicom=True,
        texto_incrustado_detectado=detectado,
        necesita_revision_texto=revision,
        texto_incrustado_motivo=motivo,
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
        sha256=sha256,
        formato=formato.lower(),
        ancho=ancho,
        alto=alto,
        tamano_bytes=guardado.size_bytes,
        sin_metadatos_exif_dicom=imagen.sin_metadatos_exif_dicom,
        texto_incrustado_detectado=imagen.texto_incrustado_detectado,
        necesita_revision_texto=imagen.necesita_revision_texto,
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
        .order_by(Imagen.creado_en, Imagen.id)
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
