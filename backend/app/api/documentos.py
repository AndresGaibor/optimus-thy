"""Carga y listado de los documentos del caso (HU-050, RF-DOC-01/02/03).

Reglas que garantiza este módulo:

- El tipo real del archivo se decide por su contenido (firma), nunca por la
  extensión ni por la cabecera ``Content-Type`` que anuncia el cliente. Solo se
  admiten PDF, JPEG y PNG; un ejecutable o un comprimido responde 415.
- Un PDF con contenido activo (scripts, ``/Launch``, ``/EmbeddedFile``,
  ``/RichMedia``, ``/OpenAction``, ``/AA`` o XFA) se rechaza con 422
  ``pdf_con_scripts``; uno truncado, con 422 ``archivo_danado``.
- Las imágenes se validan con Pillow y se guardan re-codificadas, sin EXIF ni
  ningún otro metadato. El SHA-256 es el del contenido realmente guardado.
- La clave del objeto es opaca (``documentos/<uuid>.<ext>``); la base guarda
  metadatos y enlaces firmados, nunca el archivo.
- Cada carga y cada rechazo dejan un evento en la bitácora, con códigos y sin
  contenido del archivo ni datos del paciente.
- Un caso de otra institución responde 404, igual que uno inexistente
  (RS-ACC-04).
- El acceso se pide con ``POST .../enlace``: emite un enlace firmado de cinco
  minutos y deja el evento en la bitácora con el documento y su tipo MIME,
  nunca con datos del paciente (HU-053).
- La carga encola el OCR del documento y lo deja ``en_cola``; el estado
  (``no_solicitado``, ``en_cola``, ``procesando``, ``listo``, ``error``) y el
  motivo del fallo se ven en el listado y en el detalle (HU-051). El texto
  reconocido nunca sale por la API.
"""

from __future__ import annotations

import contextlib
import hashlib
import io
import logging
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated, Final

from fastapi import APIRouter, Depends, File, Request, UploadFile, status
from fastapi.responses import JSONResponse
from PIL import Image, ImageOps, UnidentifiedImageError
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.http import registrar
from app.auth.deps import SesionActual, requiere_permiso
from app.config import get_settings
from app.db import session_dep
from app.jobs.queue import encolar
from app.media.imagenes import codificar, sin_metadatos
from app.models.documentos import Documento
from app.models.fichas import Caso
from app.ocr import motivos
from app.storage.s3 import ObjectStorage, StorageError, get_storage

logger = logging.getLogger(__name__)

router = APIRouter(tags=["documentos"])

#: Tipos admitidos: tipo detectado -> (MIME real, extensión de la clave opaca).
TIPOS_ADMITIDOS: Final[dict[str, tuple[str, str]]] = {
    "pdf": ("application/pdf", "pdf"),
    "jpeg": ("image/jpeg", "jpg"),
    "png": ("image/png", "png"),
}

#: Firmas que deciden el tipo: la extensión del nombre no cuenta.
_FIRMAS: Final[tuple[tuple[bytes, str], ...]] = (
    (b"%PDF-", "pdf"),
    (b"\xff\xd8\xff", "jpeg"),
    (b"\x89PNG\r\n\x1a\n", "png"),
)

#: Firmas de ejecutables y comprimidos: se rechazan con un motivo explícito.
_FIRMAS_PROHIBIDAS: Final[tuple[bytes, ...]] = (
    b"MZ",  # PE/EXE
    b"\x7fELF",  # ELF
    b"\xfe\xed\xfa",  # Mach-O 32/64 bits, big-endian
    b"\xce\xfa\xed\xfe",  # Mach-O 32 bits, little-endian
    b"\xcf\xfa\xed\xfe",  # Mach-O 64 bits, little-endian
    b"\xca\xfe\xba\xbe",  # Java class / universal binary
    b"#!",  # script con shebang
    b"PK\x03\x04",  # ZIP (y los formatos que lo usan: DOCX, XLSX, ODT…)
)

#: Marcas de contenido activo dentro de un PDF: scripts, acciones automáticas,
#: formularios XFA y archivos incrustados. ``/OpenAction`` no está aquí porque
#: solo fija la vista inicial (un destino de página), sin ejecutar nada.
_TOKENS_PDF_PELIGROSOS: Final[tuple[bytes, ...]] = (
    b"/JavaScript",
    b"/JS",
    b"/Launch",
    b"/EmbeddedFile",
    b"/RichMedia",
    b"/AA",
    b"XFA",
)

_QUE_SE_ACEPTA: Final[str] = "Solo se aceptan PDF, JPEG o PNG."
_TROZO_LECTURA: Final[int] = 64 * 1024
_MAX_NOMBRE: Final[int] = 255
_NOMBRE_POR_DEFECTO: Final[str] = "documento"

#: Vigencia del enlace puntual de acceso (RF-DOC-09): cinco minutos.
_VIGENCIA_ENLACE_SEGUNDOS: Final[int] = 5 * 60


class DocumentoOut(BaseModel):
    """Metadatos del documento cargado; el archivo se lee por enlace firmado."""

    id: str
    nombre_original: str
    tipo_mime: str
    tamano_bytes: int
    hash_sha256: str
    estado_ocr: str
    ocr_motivo: str | None
    creado_en: datetime


class DocumentoResumenOut(DocumentoOut):
    """Documento ya guardado, con su enlace de descarga firmado."""

    enlace: str


class DocumentosListOut(BaseModel):
    documentos: list[DocumentoResumenOut]


class DocumentoEnlaceOut(BaseModel):
    """Enlace firmado de corta vida para abrir o descargar un documento."""

    enlace: str
    caduca_en: datetime


class _ArchivoRechazado(Exception):
    """El archivo no cumple los requisitos; el mensaje es para el usuario."""

    codigo_http: int = status.HTTP_422_UNPROCESSABLE_ENTITY
    codigo: str = "archivo_danado"

    def __init__(self, mensaje: str) -> None:
        super().__init__(mensaje)
        self.mensaje = mensaje


class _TipoNoPermitido(_ArchivoRechazado):
    """La firma no corresponde a un tipo admitido."""

    codigo_http = status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
    codigo = "tipo_no_permitido"


class _ArchivoDemasiadoGrande(_ArchivoRechazado):
    """Supera el tope de tamaño: el cliente debe reducirlo, no reintentar."""

    codigo_http = status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
    codigo = "archivo_demasiado_grande"


class _ArchivoDanado(_ArchivoRechazado):
    """La firma es correcta pero el contenido está truncado o corrupto."""

    codigo_http = status.HTTP_422_UNPROCESSABLE_ENTITY
    codigo = "archivo_danado"


class _PdfConScripts(_ArchivoRechazado):
    """El PDF trae contenido activo que no se acepta en el expediente."""

    codigo_http = status.HTTP_422_UNPROCESSABLE_ENTITY
    codigo = "pdf_con_scripts"


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
        "no_encontrado",
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


def _documento_del_caso(db: Session, caso: Caso, id_texto: str) -> Documento | None:
    """El documento solo si pertenece al caso; otro responde igual que inexistente."""
    documento_id = _uuid(id_texto)
    if documento_id is None:
        return None
    return (
        db.query(Documento)
        .filter(Documento.id == documento_id, Documento.caso_id == caso.id)
        .first()
    )


def _nombre_original(nombre: str | None) -> str:
    """Nombre sin rutas ni caracteres de control; nunca se usa como ruta."""
    base = (nombre or "").replace("\\", "/").rsplit("/", 1)[-1]
    limpio = "".join(caracter for caracter in base if caracter.isprintable()).strip()
    limpio = limpio[:_MAX_NOMBRE]
    if not limpio or limpio in {".", ".."}:
        return _NOMBRE_POR_DEFECTO
    return limpio


def _detectar_tipo(contenido: bytes) -> str | None:
    for firma, tipo in _FIRMAS:
        if contenido.startswith(firma):
            return tipo
    return None


def _es_ejecutable_o_comprimido(contenido: bytes) -> bool:
    return any(contenido.startswith(firma) for firma in _FIRMAS_PROHIBIDAS)


def _validar_pdf(contenido: bytes) -> None:
    """Rechaza PDF con contenido activo y los truncados."""
    for token in _TOKENS_PDF_PELIGROSOS:
        if token in contenido:
            raise _PdfConScripts(
                "El PDF contiene contenido activo (scripts, acciones automáticas o "
                "archivos incrustados). Vuelve a generarlo sin esas funciones."
            )
    if b"%%EOF" not in contenido or b"startxref" not in contenido:
        raise _ArchivoDanado("El PDF está incompleto o dañado: no se pudo leer su estructura.")


def _validar_imagen(contenido: bytes, tipo: str) -> bytes:
    """Verifica la imagen por contenido y devuelve la copia sin metadatos."""
    formato = "JPEG" if tipo == "jpeg" else "PNG"
    try:
        with Image.open(io.BytesIO(contenido)) as sondeo:
            if (sondeo.format or "").upper() != formato:
                raise _ArchivoDanado(f"El contenido no corresponde a una imagen {formato} válida.")
            sondeo.verify()
        with Image.open(io.BytesIO(contenido)) as original:
            original.load()
            limpia = sin_metadatos(ImageOps.exif_transpose(original))
    except _ArchivoRechazado:
        raise
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        raise _ArchivoDanado("La imagen está dañada o no se pudo leer.") from exc
    return codificar(limpia, formato)


def _preparar(contenido: bytes) -> tuple[str, bytes]:
    """Detecta el tipo por firma, lo valida y devuelve lo que se guarda."""
    tipo = _detectar_tipo(contenido)
    if tipo is None:
        if _es_ejecutable_o_comprimido(contenido):
            raise _TipoNoPermitido(
                f"El archivo es un ejecutable o un archivo comprimido. {_QUE_SE_ACEPTA}"
            )
        raise _TipoNoPermitido(f"Tipo de archivo no permitido. {_QUE_SE_ACEPTA}")
    if tipo == "pdf":
        _validar_pdf(contenido)
        return tipo, contenido
    return tipo, _validar_imagen(contenido, tipo)


async def _leer_archivo(archivo: UploadFile, limite: int) -> bytes:
    """Lee como máximo un byte más que el tope, para poder rechazar el exceso."""
    trozos: list[bytes] = []
    total = 0
    while True:
        trozo = await archivo.read(_TROZO_LECTURA)
        if not trozo:
            break
        total += len(trozo)
        if total > limite:
            raise _ArchivoDemasiadoGrande(
                f"El archivo supera el máximo de {limite} bytes permitido."
            )
        trozos.append(trozo)
    if total == 0:
        raise _TipoNoPermitido(f"El archivo está vacío. {_QUE_SE_ACEPTA}")
    return b"".join(trozos)


def _siguiente_version(db: Session, caso_id: uuid.UUID, nombre: str) -> int:
    """La versión 1 para un nombre nuevo; la siguiente si el nombre ya existe."""
    usada = (
        db.query(func.max(Documento.version))
        .filter(Documento.caso_id == caso_id, Documento.nombre_original == nombre)
        .scalar()
    )
    return int(usada or 0) + 1


def _salida(documento: Documento) -> DocumentoOut:
    return DocumentoOut(
        id=str(documento.id),
        nombre_original=documento.nombre_original,
        tipo_mime=documento.tipo_mime or "application/octet-stream",
        tamano_bytes=documento.tamano_bytes,
        hash_sha256=documento.hash_sha256,
        estado_ocr=documento.estado_ocr,
        ocr_motivo=documento.ocr_motivo,
        creado_en=documento.creado_en,
    )


def _resumen(documento: Documento, storage: ObjectStorage) -> DocumentoResumenOut:
    """Vista de un documento guardado, con su enlace firmado."""
    enlace = storage.generate_presigned_link(documento.ruta_s3)
    return DocumentoResumenOut(**_salida(documento).model_dump(), enlace=enlace.url)


def _registrar_rechazo(
    db: Session,
    request: Request,
    actual: SesionActual,
    caso: Caso,
    codigo: str,
) -> None:
    """Un evento por rechazo: el código del motivo, nunca el archivo."""
    registrar(
        db,
        request,
        AuditAction.DOCUMENT_UPLOAD,
        AuditModule.FILES,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.CASE,
        objeto_id=caso.id,
        detalles={"error_code": codigo, "file_kind": "document"},
    )


def _encolar_ocr(db: Session, documento: Documento, usuario_id: uuid.UUID) -> None:
    """Encola el OCR del documento recién guardado (HU-051).

    Si encolar falla, la carga no se cae: el documento queda guardado con
    ``error`` y el motivo conocido, para que el médico pueda reintentarlo.
    """
    try:
        encolar(db, "ocr", {"documento_id": str(documento.id)}, creado_por=usuario_id)
    except Exception:
        logger.exception("ocr_no_encolado", extra={"documento_id": str(documento.id)})
        db.rollback()
        documento.estado_ocr = motivos.ERROR
        documento.ocr_motivo = motivos.motivo_de(motivos.SIN_ENCOLAR)
        documento.ocr_actualizado_en = datetime.now(UTC)
        db.commit()


@router.post(
    "/casos/{caso_id}/documentos",
    status_code=status.HTTP_201_CREATED,
    response_model=None,
)
async def cargar_documento(
    request: Request,
    caso_id: str,
    archivo: Annotated[UploadFile, File(description="Documento en PDF, JPEG o PNG")],
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("documento.cargar"))],
    storage: Annotated[ObjectStorage, Depends(get_storage)],
) -> DocumentoOut | JSONResponse:
    """Carga un documento del caso y lo guarda en el almacenamiento privado."""
    caso = _caso_de(db, actual, caso_id)
    if caso is None:
        return _no_encontrado(request)

    limite = get_settings().documento_max_bytes
    try:
        contenido = await _leer_archivo(archivo, limite)
        tipo, preparado = _preparar(contenido)
    except _ArchivoRechazado as rechazo:
        _registrar_rechazo(db, request, actual, caso, rechazo.codigo)
        return _error(request, rechazo.codigo_http, rechazo.codigo, rechazo.mensaje)

    sha256 = hashlib.sha256(preparado).hexdigest()
    duplicado = (
        db.query(Documento.id)
        .filter(Documento.caso_id == caso.id, Documento.hash_sha256 == sha256)
        .first()
    )
    if duplicado is not None:
        _registrar_rechazo(db, request, actual, caso, "documento_duplicado")
        return _error(
            request,
            status.HTTP_409_CONFLICT,
            "documento_duplicado",
            "El caso ya tiene un documento con ese mismo contenido.",
        )

    mime, extension = TIPOS_ADMITIDOS[tipo]
    nombre = _nombre_original(archivo.filename)
    version = _siguiente_version(db, caso.id, nombre)
    try:
        guardado = storage.put_object_at(
            f"documentos/{uuid.uuid4().hex}.{extension}", preparado, mime
        )
    except StorageError:
        return _error(
            request,
            status.HTTP_502_BAD_GATEWAY,
            "storage_error",
            "No se pudo guardar el documento; intenta de nuevo.",
        )

    documento = Documento(
        caso_id=caso.id,
        nombre_original=nombre,
        ruta_s3=guardado.key,
        hash_sha256=guardado.sha256,
        version=version,
        tipo_mime=mime,
        tamano_bytes=guardado.size_bytes,
        estado_ocr=motivos.EN_COLA,
        ocr_actualizado_en=datetime.now(UTC),
    )
    try:
        db.add(documento)
        db.flush()
        registrar(
            db,
            request,
            AuditAction.DOCUMENT_UPLOAD,
            AuditModule.FILES,
            usuario=actual.usuario,
            rol=actual.rol_activo.nombre if actual.rol_activo else None,
            tipo_objeto=AuditObjectType.DOCUMENT,
            objeto_id=documento.id,
            detalles={"format": tipo, "file_kind": "document", "version": version},
        )
    except IntegrityError:
        db.rollback()
        with contextlib.suppress(StorageError):
            storage.delete_object(guardado.key)
        return _error(
            request,
            status.HTTP_409_CONFLICT,
            "documento_duplicado",
            "El documento ya existe en el caso.",
        )
    _encolar_ocr(db, documento, actual.usuario.id)
    db.refresh(documento)
    return _salida(documento)


@router.get("/casos/{caso_id}/documentos", response_model=None)
def listar_documentos(
    request: Request,
    caso_id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("documento.leer"))],
    storage: Annotated[ObjectStorage, Depends(get_storage)],
) -> DocumentosListOut | JSONResponse:
    """Lista los documentos del caso, cada uno con su enlace firmado."""
    caso = _caso_de(db, actual, caso_id)
    if caso is None:
        return _no_encontrado(request)
    filas = (
        db.query(Documento)
        .filter(Documento.caso_id == caso.id)
        .order_by(Documento.creado_en, Documento.id)
        .all()
    )
    try:
        documentos = [_resumen(fila, storage) for fila in filas]
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
        AuditAction.DOCUMENT_READ,
        AuditModule.FILES,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.CASE,
        objeto_id=caso.id,
        detalles={"resource_count": len(documentos)},
    )
    return DocumentosListOut(documentos=documentos)


@router.get("/casos/{caso_id}/documentos/{documento_id}", response_model=None)
def obtener_documento(
    request: Request,
    caso_id: str,
    documento_id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("documento.leer"))],
    storage: Annotated[ObjectStorage, Depends(get_storage)],
) -> DocumentoResumenOut | JSONResponse:
    """El documento del caso con su estado de OCR y su enlace firmado."""
    caso = _caso_de(db, actual, caso_id)
    if caso is None:
        return _no_encontrado(request)
    documento = _documento_del_caso(db, caso, documento_id)
    if documento is None:
        return _no_encontrado(request)
    try:
        salida = _resumen(documento, storage)
    except StorageError:
        return _error(
            request,
            status.HTTP_502_BAD_GATEWAY,
            "storage_error",
            "No se pudo firmar el enlace; intenta de nuevo.",
        )
    registrar(
        db,
        request,
        AuditAction.DOCUMENT_READ,
        AuditModule.FILES,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.DOCUMENT,
        objeto_id=documento.id,
        detalles={"file_kind": "document"},
    )
    return salida


@router.post("/casos/{caso_id}/documentos/{documento_id}/enlace", response_model=None)
def crear_enlace_documento(
    request: Request,
    caso_id: str,
    documento_id: str,
    db: Annotated[Session, Depends(session_dep)],
    actual: Annotated[SesionActual, Depends(requiere_permiso("documento.leer"))],
    storage: Annotated[ObjectStorage, Depends(get_storage)],
) -> DocumentoEnlaceOut | JSONResponse:
    """Emite un enlace firmado de corta vida y registra el acceso en la bitácora."""
    caso = _caso_de(db, actual, caso_id)
    if caso is None:
        return _no_encontrado(request)
    documento = _documento_del_caso(db, caso, documento_id)
    if documento is None:
        return _no_encontrado(request)
    try:
        enlace = storage.generate_presigned_link(
            documento.ruta_s3, expires_in_seconds=_VIGENCIA_ENLACE_SEGUNDOS
        )
    except StorageError:
        return _error(
            request,
            status.HTTP_502_BAD_GATEWAY,
            "storage_error",
            "No se pudo firmar el enlace; intenta de nuevo.",
        )
    registrar(
        db,
        request,
        AuditAction.DOCUMENT_READ,
        AuditModule.FILES,
        usuario=actual.usuario,
        rol=actual.rol_activo.nombre if actual.rol_activo else None,
        tipo_objeto=AuditObjectType.DOCUMENT,
        objeto_id=documento.id,
        detalles={
            "file_kind": "document",
            "content_type": documento.tipo_mime or "application/octet-stream",
        },
    )
    return DocumentoEnlaceOut(
        enlace=enlace.url,
        caduca_en=datetime.now(UTC) + timedelta(seconds=enlace.expires_in_seconds),
    )
