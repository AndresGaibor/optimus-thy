"""Manejador del trabajo ``inferencia`` (HT-063, RF-INF-05/06/07).

El trabajo solo trae ``imagen_id`` en el payload. El manejador lee la imagen del
almacenamiento, llama al servicio de IA, y guarda en una transacción la
inferencia, sus nódulos y el contrato crudo como artefacto.

Si el contrato es 1.1, cada nódulo puede traer sus artefactos en base64 (máscara
final, máscara MGAC, XML Pascal-VOC y superposición). Se guardan antes del commit
con una clave por nódulo y sus rutas quedan en ``Nodulo.mascara_ruta_s3``,
``mgac_ruta_s3``, ``xml_ruta_s3`` y ``superposicion_ruta_s3``. Un contrato 1.0,
o uno 1.1 sin artefactos, deja esas rutas en ``NULL``.

Si el servicio no responde o no tiene modelos, lanza y el worker deja el trabajo
en ``error`` con un código estable: no hay fila de inferencia ni resultado
inventado (RF-INF-07).

El trabajo ``ocr`` (HU-051) lee el documento del caso y anota su estado en
``documentos.estado_ocr``: ``procesando`` al empezar y ``listo`` o ``error`` al
terminar. En el error solo se guarda un motivo de la tabla conocida.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any, cast

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.audit.actions import AuditAction, AuditModule, AuditObjectType
from app.audit.service import AuditService
from app.db import get_session_factory
from app.ia.cliente import (
    ArtefactosNodulo,
    ClienteIA,
    decodificar_artefactos,
    get_cliente_ia,
)
from app.models.documentos import CampoOCR, Documento, ExtraccionOCR
from app.models.imagenes import Imagen, Inferencia, ModeloIA, Nodulo
from app.models.trabajos import Trabajo
from app.ocr import motivos
from app.ocr.cliente import (
    ClienteOcr,
    ContratoOcrInvalido,
    DocumentoOcrDanado,
    FormatoOcrNoAdmitido,
    ResultadoReconocimiento,
    ServicioOcrNoDisponible,
    TiempoOcrExcedido,
    get_cliente_ocr,
)
from app.storage.s3 import ObjectStorage, StorageError, get_storage

logger = logging.getLogger("optimus_thy.jobs")

PREFIJO_ARTEFACTOS = "inferencias"
"""Raíz de los artefactos derivados de una inferencia."""

NOMBRE_MODELO = "optimus-thy"
"""Nombre con el que se registra el conjunto de pesos del servicio de IA."""

TIPO_XML = "application/xml"
TIPO_PNG = "image/png"


@dataclass(frozen=True, slots=True)
class _RutasNodulo:
    """Claves guardadas de los artefactos de un nódulo; ``None`` si no vino."""

    mascara: str | None = None
    mgac: str | None = None
    xml: str | None = None
    superposicion: str | None = None


SIN_ARTEFACTOS = _RutasNodulo()


class ErrorInferencia(Exception):
    """Fallo del manejador con un código estable para el trabajo."""

    codigo = "fallo_inferencia"

    def __init__(self, mensaje: str, codigo: str | None = None) -> None:
        super().__init__(mensaje)
        self.mensaje = mensaje
        if codigo is not None:
            self.codigo = codigo


def manejar_inferencia(trabajo: Trabajo) -> dict[str, Any]:
    """Ejecuta la inferencia del trabajo y devuelve un resumen mínimo.

    El worker llama con un único argumento; las dependencias salen del entorno y
    se sustituyen en las pruebas con dobles.
    """
    db = get_session_factory()()
    try:
        return _procesar(db, trabajo, get_storage(), get_cliente_ia())
    finally:
        db.close()


def _procesar(
    db: Session,
    trabajo: Trabajo,
    almacenamiento: ObjectStorage,
    cliente: ClienteIA,
) -> dict[str, Any]:
    imagen = _imagen_de(db, trabajo)
    contenido = almacenamiento.get_bytes(imagen.ruta_s3)

    inicio = time.monotonic()
    contrato = cliente.inferir(contenido, nombre=_nombre_opaco(imagen))
    tiempo_ms = int((time.monotonic() - inicio) * 1000)

    # Decodificar antes de tocar el almacenamiento: un artefacto roto deja el
    # trabajo en error sin objetos huérfanos ni filas a medias.
    artefactos = decodificar_artefactos(contrato)
    inferencia, modelo, ruta = _persistir(
        db, imagen, contrato, almacenamiento, tiempo_ms, artefactos
    )
    logger.info(
        "inferencia_guardada",
        extra={"trabajo_id": str(trabajo.id), "inferencia_id": str(inferencia.id)},
    )
    return {
        "inferencia_id": str(inferencia.id),
        "modelo_ia_id": str(modelo.id),
        # ``validar_contrato`` ya garantiza que ``nodulos`` es una lista.
        "nodulos": len(cast("list[object]", contrato["nodulos"])),
        "contrato_ruta_s3": ruta,
    }


def _imagen_de(db: Session, trabajo: Trabajo) -> Imagen:
    valor = (trabajo.payload or {}).get("imagen_id")
    if not isinstance(valor, str):
        raise ErrorInferencia("El trabajo no trae «imagen_id».", codigo="payload_invalido")
    try:
        imagen_id = uuid.UUID(valor)
    except ValueError as exc:
        raise ErrorInferencia(
            "El trabajo trae un «imagen_id» inválido.", codigo="payload_invalido"
        ) from exc
    imagen = db.get(Imagen, imagen_id)
    if imagen is None:
        raise ErrorInferencia("La imagen del trabajo ya no existe.", codigo="imagen_no_encontrada")
    return imagen


def _nombre_opaco(imagen: Imagen) -> str:
    """Nombre para el multipart: la clave opaca, sin datos del paciente."""
    return imagen.ruta_s3.rsplit("/", 1)[-1] or f"{imagen.id.hex}.png"


def _modelo_de(db: Session, contrato: dict[str, Any]) -> ModeloIA:
    """Reutiliza el registro del mismo peso y contrato, o lo crea (RIA-04/05)."""
    huella = str(contrato["huella_modelos"])
    version = str(contrato["version_contrato"])
    modelo = (
        db.execute(
            select(ModeloIA).where(ModeloIA.hash_pesos == huella, ModeloIA.version == version)
        )
        .scalars()
        .first()
    )
    if modelo is not None:
        return modelo
    modelo = ModeloIA(nombre=NOMBRE_MODELO, version=version, hash_pesos=huella)
    db.add(modelo)
    db.flush()
    return modelo


def _resultado(nodulos: list[dict[str, Any]]) -> tuple[str, float | None]:
    """Resultado global: sin nódulos no se clasifica (RF-INF-13/14)."""
    if not nodulos:
        return "sin_nodulo", None
    malignos = [n for n in nodulos if n["clase"] == "maligno"]
    if malignos:
        return "maligno", round(max(n["probabilidad_maligno"] for n in malignos), 6)
    return "benigno", round(max(n["probabilidad_benigno"] for n in nodulos), 6)


def _fila_nodulo(inferencia_id: uuid.UUID, nodulo: dict[str, Any], rutas: _RutasNodulo) -> Nodulo:
    caja = nodulo["caja"]
    return Nodulo(
        inferencia_id=inferencia_id,
        indice=nodulo["indice"],
        caja_x=float(caja["xmin"]),
        caja_y=float(caja["ymin"]),
        caja_w=float(caja["xmax"] - caja["xmin"]),
        caja_h=float(caja["ymax"] - caja["ymin"]),
        confianza=float(nodulo["confianza_detector"]),
        origen_mascara=nodulo["origen_mascara"],
        clase=nodulo["clase"],
        probabilidad_benigno=float(nodulo["probabilidad_benigno"]),
        probabilidad_maligno=float(nodulo["probabilidad_maligno"]),
        region_analizada=nodulo["region_analizada"],
        pixeles_mascara=int(nodulo["pixeles_mascara"]),
        mascara_ruta_s3=rutas.mascara,
        mgac_ruta_s3=rutas.mgac,
        xml_ruta_s3=rutas.xml,
        superposicion_ruta_s3=rutas.superposicion,
    )


def _guardar(
    almacenamiento: ObjectStorage, clave: str, contenido: bytes | None, tipo: str
) -> str | None:
    """Guarda un artefacto si vino en el contrato y devuelve su clave."""
    if contenido is None:
        return None
    almacenamiento.put_object_at(clave, contenido, tipo)
    return clave


def _guardar_artefactos(
    almacenamiento: ObjectStorage,
    inferencia_id: uuid.UUID,
    artefactos: tuple[ArtefactosNodulo, ...],
) -> dict[int, _RutasNodulo]:
    """Sube los artefactos de cada nódulo a su clave y devuelve las rutas."""
    rutas: dict[int, _RutasNodulo] = {}
    for nodulo in artefactos:
        base = f"{PREFIJO_ARTEFACTOS}/{inferencia_id}/nodulos/{nodulo.indice}"
        rutas[nodulo.indice] = _RutasNodulo(
            mascara=_guardar(almacenamiento, f"{base}/mascara.png", nodulo.mascara, TIPO_PNG),
            mgac=_guardar(almacenamiento, f"{base}/mgac.png", nodulo.mgac, TIPO_PNG),
            xml=_guardar(almacenamiento, f"{base}/resultado.xml", nodulo.xml, TIPO_XML),
            superposicion=_guardar(
                almacenamiento, f"{base}/superposicion.png", nodulo.superposicion, TIPO_PNG
            ),
        )
    return rutas


def _persistir(
    db: Session,
    imagen: Imagen,
    contrato: dict[str, Any],
    almacenamiento: ObjectStorage,
    tiempo_ms: int,
    artefactos: tuple[ArtefactosNodulo, ...],
) -> tuple[Inferencia, ModeloIA, str]:
    """Una sola transacción: inferencia, nódulos y artefacto del contrato."""
    inferencia_id = uuid.uuid4()
    ruta = f"{PREFIJO_ARTEFACTOS}/{inferencia_id}/contrato.json"
    crudo = json.dumps(contrato, ensure_ascii=False, sort_keys=True).encode("utf-8")
    # Los artefactos van antes del commit para que una inferencia guardada
    # siempre tenga los suyos; si el commit falla, los objetos quedan huérfanos
    # y sin ninguna fila que los referencie.
    almacenamiento.put_object_at(ruta, crudo, "application/json")
    rutas = _guardar_artefactos(almacenamiento, inferencia_id, artefactos)

    resultado, confianza = _resultado(contrato["nodulos"])
    try:
        modelo = _modelo_de(db, contrato)
        inferencia = Inferencia(
            id=inferencia_id,
            imagen_id=imagen.id,
            modelo_ia_id=modelo.id,
            resultado=resultado,
            confianza=confianza,
            tiempo_ms=tiempo_ms,
            ancho=contrato["ancho"],
            alto=contrato["alto"],
            version_contrato=contrato["version_contrato"],
            umbrales=contrato["umbrales"],
            huella_modelos=contrato["huella_modelos"],
        )
        db.add(inferencia)
        db.flush()
        for nodulo in contrato["nodulos"]:
            indice = int(nodulo["indice"])
            db.add(_fila_nodulo(inferencia.id, nodulo, rutas.get(indice, SIN_ARTEFACTOS)))
        db.commit()
    except Exception:
        db.rollback()
        raise
    return inferencia, modelo, ruta


# --- OCR de documentos (HU-051) ---


class ErrorOcrTrabajo(Exception):
    """Fallo del OCR con un código estable para el trabajo."""

    codigo = "fallo_ocr"

    def __init__(self, mensaje: str, codigo: str | None = None) -> None:
        super().__init__(mensaje)
        self.mensaje = mensaje
        if codigo is not None:
            self.codigo = codigo


#: Fallos esperados del OCR: se registran sin traza y con su motivo conocido.
_FALLOS_OCR_CONOCIDOS: tuple[type[BaseException], ...] = (
    ServicioOcrNoDisponible,
    FormatoOcrNoAdmitido,
    DocumentoOcrDanado,
    ContratoOcrInvalido,
    StorageError,
)


def manejar_ocr(trabajo: Trabajo) -> dict[str, Any]:
    """Lee el documento del trabajo y anota el estado de su OCR (HU-051).

    El estado del documento avanza ``procesando`` → ``listo`` o ``error``. En
    el error solo queda un motivo de la tabla conocida: el mensaje del motor no
    sale de este proceso.
    """
    db = get_session_factory()()
    try:
        return _procesar_ocr(db, trabajo, get_storage(), get_cliente_ocr())
    finally:
        db.close()


def _procesar_ocr(
    db: Session,
    trabajo: Trabajo,
    almacenamiento: ObjectStorage,
    cliente: ClienteOcr,
) -> dict[str, Any]:
    documento = _documento_de(db, trabajo)
    extraccion = _iniciar_ocr(db, documento)
    try:
        contenido = almacenamiento.get_bytes(documento.ruta_s3)
        resultado = cliente.reconocer_documento(
            contenido,
            documento.tipo_mime or "application/octet-stream",
            _nombre_opaco_documento(documento),
        )
    except Exception as exc:
        codigo = _codigo_de_ocr(exc)
        if isinstance(exc, _FALLOS_OCR_CONOCIDOS):
            logger.warning(
                "ocr_fallido",
                extra={"trabajo_id": str(trabajo.id), "error_code": codigo},
            )
        else:
            logger.exception("ocr_fallido_sin_clasificar", extra={"trabajo_id": str(trabajo.id)})
        _fallar_ocr(db, documento, extraccion, codigo)
        raise ErrorOcrTrabajo(motivos.motivo_de(codigo), codigo=codigo) from exc
    _completar_ocr(db, documento, extraccion, resultado)
    logger.info(
        "ocr_guardado",
        extra={"trabajo_id": str(trabajo.id), "documento_id": str(documento.id)},
    )
    return {"documento_id": str(documento.id), "campos": len(resultado.campos)}


def _documento_de(db: Session, trabajo: Trabajo) -> Documento:
    valor = (trabajo.payload or {}).get("documento_id")
    if not isinstance(valor, str):
        raise ErrorOcrTrabajo("El trabajo no trae «documento_id».", codigo="payload_invalido")
    try:
        documento_id = uuid.UUID(valor)
    except ValueError as exc:
        raise ErrorOcrTrabajo(
            "El trabajo trae un «documento_id» inválido.", codigo="payload_invalido"
        ) from exc
    documento = db.get(Documento, documento_id)
    if documento is None:
        raise ErrorOcrTrabajo(
            "El documento del trabajo ya no existe.", codigo="documento_no_encontrado"
        )
    return documento


def _iniciar_ocr(db: Session, documento: Documento) -> ExtraccionOCR:
    """Marca el documento en curso y abre la extracción que se completará."""
    ahora = datetime.now(UTC)
    documento.estado_ocr = motivos.PROCESANDO
    documento.ocr_motivo = None
    documento.ocr_actualizado_en = ahora
    extraccion = ExtraccionOCR(documento_id=documento.id, estado="procesando", iniciado_en=ahora)
    db.add(extraccion)
    db.commit()
    db.refresh(extraccion)
    return extraccion


def _completar_ocr(
    db: Session,
    documento: Documento,
    extraccion: ExtraccionOCR,
    resultado: ResultadoReconocimiento,
) -> None:
    ahora = datetime.now(UTC)
    extraccion.estado = "listo"
    extraccion.modelo_ocr = resultado.motor[:128]
    extraccion.version_modelo = (resultado.huella_modelo or resultado.modelo)[:64]
    extraccion.finalizado_en = ahora
    for campo in resultado.campos:
        db.add(
            CampoOCR(
                extraccion_ocr_id=extraccion.id,
                nombre_campo=campo.nombre[:128],
                valor_extraido=campo.valor,
                # El motor no siempre reporta confianza: 0.0 significa sin dato.
                confianza=campo.confianza if campo.confianza is not None else 0.0,
            )
        )
    documento.estado_ocr = motivos.LISTO
    documento.ocr_motivo = None
    documento.ocr_actualizado_en = ahora
    _registrar_ocr(db, documento, campos=len(resultado.campos))
    db.commit()


def _fallar_ocr(db: Session, documento: Documento, extraccion: ExtraccionOCR, codigo: str) -> None:
    ahora = datetime.now(UTC)
    extraccion.estado = "con_error"
    extraccion.finalizado_en = ahora
    documento.estado_ocr = motivos.ERROR
    documento.ocr_motivo = motivos.motivo_de(codigo)
    documento.ocr_actualizado_en = ahora
    _registrar_ocr(db, documento, codigo=codigo)
    db.commit()


def _registrar_ocr(
    db: Session,
    documento: Documento,
    *,
    campos: int | None = None,
    codigo: str | None = None,
) -> None:
    """Evento del OCR con códigos y conteos: nunca texto ni datos del paciente."""
    detalles: dict[str, str | int] = {"format": _formato_de(documento)}
    if campos is not None:
        detalles["resource_count"] = campos
    if codigo is not None:
        detalles["error_code"] = codigo
    AuditService(db).record(
        AuditAction.OCR_REQUEST,
        AuditModule.OCR,
        institucion_id=documento.caso.institucion_id,
        tipo_objeto=AuditObjectType.DOCUMENT,
        objeto_id=documento.id,
        detalles=detalles,
    )


def _codigo_de_ocr(exc: Exception) -> str:
    """Motivo conocido del fallo; nunca se usa el mensaje de la excepción."""
    if isinstance(exc, TiempoOcrExcedido):
        return motivos.TIEMPO_EXCEDIDO
    if isinstance(exc, FormatoOcrNoAdmitido):
        return motivos.FORMATO_NO_ADMITIDO
    if isinstance(exc, (DocumentoOcrDanado, StorageError)):
        return motivos.DOCUMENTO_DANADO
    return motivos.SERVICIO_NO_DISPONIBLE


def _formato_de(documento: Documento) -> str:
    return "pdf" if documento.tipo_mime == "application/pdf" else "image"


def _nombre_opaco_documento(documento: Documento) -> str:
    """Nombre para el multipart: la clave opaca, sin datos del paciente."""
    return documento.ruta_s3.rsplit("/", 1)[-1] or f"{documento.id.hex}.pdf"
