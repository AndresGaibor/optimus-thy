"""Servicio de OCR local de OPTIMUS-THY (HT-040, contrato 1.1).

Dos motores, un solo contrato:

- ``glm`` (por defecto): GLM-OCR con el paquete oficial ``glmocr`` contra un
  servidor de inferencia propio. Nada sale del equipo.
- ``tesseract``: Tesseract en español, la alternativa ligera.

Salvo que ``OCR_PERMITIR_API_EXTERNA`` esté encendida y haya clave, el servicio
no habla con internet: si el motor no está, `/health` queda en ``degradado`` con
el motivo y `/reconocer` responde 503, nunca un texto inventado.
"""

from __future__ import annotations

import os
from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass, replace
from pathlib import Path
from typing import Annotated, Any

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.concurrency import run_in_threadpool

from .contrato import VERSION_CONTRATO, DocumentoOcr
from .motores import (
    ErrorMotorOcr,
    MotorGlmOcr,
    MotorNoDisponible,
    MotorOcr,
    MotorTesseract,
)
from .reglas import extraer_campos

MAX_BYTES_POR_DEFECTO = 20 * 1024 * 1024
LECTURA_POR_TROZOS = 64 * 1024
MOTORES = ("glm", "tesseract")

# Lo que se admite: el tipo declarado por el navegador o, si viene genérico, el
# que diga la extensión del archivo.
TIPOS_ADMITIDOS = ("application/pdf", "image/jpeg", "image/png")
SUFIJOS = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}


@dataclass(frozen=True, slots=True)
class Configuracion:
    """Ajustes del servicio, todos por variable de entorno."""

    motor: str = "glm"
    modelo_dir: str | None = None
    layout_dir: str | None = None
    max_bytes: int = MAX_BYTES_POR_DEFECTO
    confianza_minima: float = 0.60
    permitir_api_externa: bool = False
    glm_api_key: str | None = None
    glm_api_url: str | None = None
    glm_api_host: str = "127.0.0.1"
    glm_api_port: int = 8080

    @classmethod
    def desde_entorno(cls) -> Configuracion:
        return cls(
            motor=(os.environ.get("OCR_MOTOR") or "glm").strip().lower(),
            modelo_dir=os.environ.get("OCR_MODELO_DIR") or None,
            layout_dir=os.environ.get("OCR_MODELO_LAYOUT_DIR") or None,
            max_bytes=_entero(os.environ.get("OCR_MAX_BYTES"), MAX_BYTES_POR_DEFECTO),
            confianza_minima=_proporcion(os.environ.get("OCR_CONFIANZA_MINIMA"), 0.60),
            permitir_api_externa=_booleano(os.environ.get("OCR_PERMITIR_API_EXTERNA")),
            glm_api_key=os.environ.get("OCR_GLM_API_KEY") or None,
            glm_api_url=os.environ.get("OCR_GLM_API_URL") or None,
            glm_api_host=os.environ.get("OCR_GLM_API_HOST") or "127.0.0.1",
            glm_api_port=_entero(os.environ.get("OCR_GLM_API_PORT"), 8080),
        )


def _booleano(valor: str | None) -> bool:
    return (valor or "").strip().lower() in ("1", "true", "si", "sí", "yes", "on")


def _entero(valor: str | None, defecto: int) -> int:
    try:
        numero = int(str(valor))
    except (TypeError, ValueError):
        return defecto
    return numero if numero > 0 else defecto


def _proporcion(valor: str | None, defecto: float) -> float:
    try:
        numero = float(str(valor).replace(",", "."))
    except (TypeError, ValueError):
        return defecto
    return numero if 0.0 <= numero <= 1.0 else defecto


def _construir_motor(config: Configuracion) -> MotorOcr:
    """Elige el motor según ``OCR_MOTOR``; uno desconocido deja el servicio degradado."""
    if config.motor == "tesseract":
        return MotorTesseract()
    if config.motor == "glm":
        return MotorGlmOcr(
            modelo_dir=config.modelo_dir,
            layout_dir=config.layout_dir,
            # La clave solo llega al motor si la API externa está permitida.
            api_key=config.glm_api_key if config.permitir_api_externa else None,
            api_url=config.glm_api_url,
            servidor=(config.glm_api_host, config.glm_api_port),
        )
    return MotorNoDisponible(
        nombre=config.motor,
        modelo="—",
        motivo=f"motor «{config.motor}» no reconocido; use OCR_MOTOR={' o '.join(MOTORES)}",
    )


def crear_app(fabrica_motor: Callable[[Configuracion], MotorOcr] = _construir_motor) -> FastAPI:
    """Arma la aplicación. Las pruebas pasan su propia fábrica de motor."""

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        config = Configuracion.desde_entorno()
        app.state.configuracion = config
        motor = fabrica_motor(config)
        app.state.motor = motor
        yield
        cerrar = getattr(motor, "cerrar", None)
        if callable(cerrar):
            cerrar()

    app = FastAPI(title="optimus-ocr", version=VERSION_CONTRATO, lifespan=lifespan)

    @app.get("/health")
    def health(peticion: Request) -> dict[str, Any]:
        """Estado del servicio y del motor, para el compose y quien lo consuma.

        ``modelo_cargado`` significa que el motor y sus pesos están presentes,
        no que los pesos estén en memoria.
        """
        motor: MotorOcr = peticion.app.state.motor
        motivo = motor.disponible()
        estado: dict[str, Any] = {
            "status": "ok" if motivo is None else "degradado",
            "servicio": "ocr",
            "motor": motor.nombre,
            "modelo": motor.modelo,
            "modelo_cargado": motivo is None,
            "version_contrato": VERSION_CONTRATO,
        }
        if motivo is not None:
            estado["detalle"] = motivo
        return estado

    @app.post("/reconocer")
    async def reconocer(
        peticion: Request,
        documento: Annotated[UploadFile, File(description="PDF, JPG o PNG de una ficha")],
    ) -> dict[str, Any]:
        """Reconoce el documento recibido y devuelve el contrato 1.1.

        Rechazos: 415 tipo no admitido, 413 más de ``OCR_MAX_BYTES``, 422
        documento vacío, 503 motor no disponible, 500 fallo del motor. Los
        mensajes no incluyen detalles internos.
        """
        config: Configuracion = peticion.app.state.configuracion
        tipo = _tipo_de(documento)
        if tipo is None:
            raise HTTPException(status_code=415, detail="tipo de documento no admitido")
        contenido = await _leer(documento, config.max_bytes)
        if not contenido:
            raise HTTPException(status_code=422, detail="el documento está vacío")

        motor: MotorOcr = peticion.app.state.motor
        try:
            resultado: DocumentoOcr = await run_in_threadpool(motor.reconocer, contenido, tipo)
        except ErrorMotorOcr:
            raise HTTPException(
                status_code=503, detail="el motor de OCR no está disponible"
            ) from None
        except Exception:
            raise HTTPException(
                status_code=500, detail="no se pudo procesar el documento"
            ) from None
        campos = extraer_campos(resultado, config.confianza_minima)
        avisos = list(resultado.avisos)
        sin_confianza = sum(1 for campo in campos if campo.confianza is None)
        if sin_confianza:
            avisos.append(
                f"{sin_confianza} campo{'s' if sin_confianza != 1 else ''} sin confianza del motor"
            )
        en_revision = sum(1 for campo in campos if campo.revisar)
        if en_revision:
            avisos.append(
                f"{en_revision} campo{'s' if en_revision != 1 else ''} "
                f"marcado{'s' if en_revision != 1 else ''} para revisión"
            )
        enriquecido = replace(resultado, campos=campos, avisos=tuple(avisos))
        return enriquecido.a_diccionario()

    @app.post("/texto-incrustado")
    async def texto_incrustado(
        peticion: Request,
        imagen: Annotated[UploadFile, File(description="JPEG o PNG de una ecografía")],
    ) -> dict[str, Any]:
        """Detecta zonas con texto incrustado en la imagen.

        Contrato propio dentro de 1.1: devuelve regiones con bbox normalizada,
        texto y confianza por región, más ``detectado``. Reutiliza el motor
        configurado; con Tesseract la confianza sale de las palabras reconocidas.
        """
        config: Configuracion = peticion.app.state.configuracion
        tipo = _tipo_de(imagen)
        if tipo not in ("image/jpeg", "image/png"):
            raise HTTPException(status_code=415, detail="tipo de documento no admitido")
        contenido = await _leer(imagen, config.max_bytes)
        if not contenido:
            raise HTTPException(status_code=422, detail="el documento está vacío")

        motor: MotorOcr = peticion.app.state.motor
        try:
            resultado: DocumentoOcr = await run_in_threadpool(
                motor.reconocer, contenido, tipo, texto_incrustado=True
            )
        except ErrorMotorOcr:
            raise HTTPException(
                status_code=503, detail="el motor de OCR no está disponible"
            ) from None
        except Exception:
            raise HTTPException(
                status_code=500, detail="no se pudo procesar el documento"
            ) from None

        regiones = [
            {
                "bbox": list(bloque.bbox) if bloque.bbox is not None else None,
                "texto": bloque.texto,
                "confianza": bloque.confianza,
            }
            for bloque in resultado.bloques
            if bloque.bbox is not None and bloque.texto.strip()
        ]
        cuerpo: dict[str, Any] = {
            "version_contrato": VERSION_CONTRATO,
            "motor": resultado.motor,
            "regiones": regiones,
            "detectado": bool(regiones),
        }
        if resultado.avisos:
            cuerpo["avisos"] = list(resultado.avisos)
        return cuerpo

    return app


def _tipo_de(documento: UploadFile) -> str | None:
    """Tipo admitido del archivo, o ``None`` si no lo es."""
    declarado = (documento.content_type or "").split(";")[0].strip().lower()
    if declarado in TIPOS_ADMITIDOS:
        return declarado
    return SUFIJOS.get(Path(documento.filename or "").suffix.lower())


async def _leer(documento: UploadFile, maximo: int) -> bytes:
    """Lee el archivo por trozos y corta en cuanto supera el máximo."""
    partes: list[bytes] = []
    total = 0
    while trozo := await documento.read(LECTURA_POR_TROZOS):
        total += len(trozo)
        if total > maximo:
            raise HTTPException(
                status_code=413, detail="el documento supera el tamaño máximo admitido"
            )
        partes.append(trozo)
    return b"".join(partes)


app = crear_app()
