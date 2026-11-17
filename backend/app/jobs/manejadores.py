"""Manejador del trabajo ``inferencia`` (HT-063, RF-INF-05/06/07).

El trabajo solo trae ``imagen_id`` en el payload. El manejador lee la imagen del
almacenamiento, llama al servicio de IA y guarda en una transacción la inferencia,
sus nódulos y el contrato crudo como artefacto.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from dataclasses import dataclass
from typing import Any, cast

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.consentimientos import hay_consentimiento_vigente
from app.db import get_session_factory
from app.ia.cliente import ArtefactosNodulo, ClienteIA, decodificar_artefactos, get_cliente_ia
from app.models.imagenes import Imagen, Inferencia, ModeloIA, Nodulo
from app.models.trabajos import Trabajo
from app.storage.s3 import ObjectStorage, get_storage

logger = logging.getLogger("optimus_thy.jobs")
PREFIJO_ARTEFACTOS = "inferencias"
NOMBRE_MODELO = "optimus-thy"
TIPO_XML = "application/xml"
TIPO_PNG = "image/png"


@dataclass(frozen=True, slots=True)
class _RutasNodulo:
    """Claves guardadas de los artefactos de un nódulo."""

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
    """Ejecuta la inferencia del trabajo y devuelve un resumen mínimo."""
    db = get_session_factory()()
    try:
        return _procesar(db, trabajo, get_storage(), get_cliente_ia())
    finally:
        db.close()


def _procesar(
    db: Session, trabajo: Trabajo, almacenamiento: ObjectStorage, cliente: ClienteIA
) -> dict[str, Any]:
    imagen = _imagen_de(db, trabajo)
    if not hay_consentimiento_vigente(db, imagen.caso_id):
        raise ErrorInferencia(
            "El caso no tiene consentimiento vigente de atención de salud.",
            codigo="sin_consentimiento",
        )
    contenido = almacenamiento.get_bytes(imagen.ruta_s3)
    inicio = time.monotonic()
    contrato = cliente.inferir(contenido, nombre=_nombre_opaco(imagen))
    tiempo_ms = int((time.monotonic() - inicio) * 1000)
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
