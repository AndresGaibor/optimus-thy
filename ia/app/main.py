"""Servicio HTTP de inferencia (HT-061, HT-062).

El proceso carga los modelos una sola vez en el ``lifespan``. Cada solicitud
recibe la configuración inmutable y los adaptadores ya cargados: no hay estado
mutable compartido ni archivos intermedios, así que dos imágenes simultáneas no
se pisan. ``/health`` confirma los tres modelos y su huella; ``/inferir``
devuelve el contrato versionado con la huella y los umbrales usados (RIA-05).

El contrato 1.1 añade la evidencia de cada nódulo: las dos máscaras y la
superposición en PNG y el XML Pascal-VOC del nódulo, los cuatro en base64.

Si falta un peso o una librería opcional, el servicio arranca igual: ``/health``
responde ``degradado`` y ``/inferir`` responde 503 con ``modelo_no_disponible``.
Nunca se inventa un resultado.
"""

from __future__ import annotations

from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from email.parser import BytesParser
from email.policy import default as politica_email
from typing import Any

import cv2
import numpy as np
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from app.carga import CargaModelos, cargar_modelos
from app.config import ConfiguracionIA, ErrorConfiguracion
from app.contrato import VERSION_CONTRATO
from app.modelos import CODIGO_MODELO_NO_DISPONIBLE
from app.pipeline import analizar_imagen

TAMANO_MAXIMO_IMAGEN = 20 * 1024 * 1024
"""20 MB: suficiente para una ecografía y acotado para no llenar la memoria."""

MARGEN_MULTIPART = 64 * 1024

TIPOS_IMAGEN = frozenset({"image/jpeg", "image/png", "image/bmp", "image/tiff", "image/webp"})

NOMBRE_CAMPO_IMAGEN = "imagen"
"""Campo del multipart y clave opaca con la que se firma el XML de cada nódulo."""

Cargador = Callable[[ConfiguracionIA], CargaModelos]


def _error(estado: int, codigo: str, mensaje: str, **extra: Any) -> JSONResponse:
    cuerpo: dict[str, Any] = {"code": codigo, "mensaje": mensaje}
    cuerpo.update(extra)
    return JSONResponse(status_code=estado, content=cuerpo)


def _parte_imagen(cuerpo: bytes, tipo_contenido: str) -> tuple[str, bytes] | None:
    """Extrae el campo ``imagen`` de un ``multipart/form-data`` con la stdlib.

    FastAPI pediría ``python-multipart``; el servicio no amplía dependencias, así
    que el análisis del formulario se hace con ``email`` (parte de Python).
    """
    if "\r" in tipo_contenido or "\n" in tipo_contenido:
        return None
    cabeceras = (
        b"Content-Type: "
        + tipo_contenido.encode("latin-1", errors="replace")
        + b"\r\nMIME-Version: 1.0\r\n\r\n"
    )
    mensaje = BytesParser(policy=politica_email).parsebytes(cabeceras + cuerpo)
    if not mensaje.is_multipart():
        return None
    for parte in mensaje.iter_parts():
        if parte.get_param("name", header="content-disposition") == NOMBRE_CAMPO_IMAGEN:
            return parte.get_content_type(), parte.get_payload(decode=True) or b""
    return None


def _carga_de(app: FastAPI) -> CargaModelos:
    carga = getattr(app.state, "carga", None)
    if isinstance(carga, CargaModelos):
        return carga
    return CargaModelos.sin_configuracion("El servicio todavía no cargó los modelos.")


def crear_aplicacion(cargador: Cargador = cargar_modelos) -> FastAPI:
    """Arma la app; ``cargador`` se sustituye en las pruebas con dobles."""

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        try:
            config = ConfiguracionIA.desde_entorno()
        except ErrorConfiguracion as error:
            app.state.config = None
            app.state.carga = CargaModelos.sin_configuracion(str(error))
        else:
            app.state.config = config
            app.state.carga = cargador(config)
        yield

    app = FastAPI(title="optimus-ia", version=VERSION_CONTRATO, lifespan=lifespan)

    @app.get("/health")
    def health(request: Request) -> dict[str, Any]:
        """Estado del servicio y de los tres modelos, con la huella de los pesos."""
        carga = _carga_de(request.app)
        datos: dict[str, Any] = {
            "status": "ok" if carga.disponible else "degradado",
            "servicio": "ia",
            "version_contrato": VERSION_CONTRATO,
            "huella_modelos": carga.huella,
            "modelos": carga.modelos_a_diccionario(),
        }
        if not carga.disponible:
            datos["faltantes"] = [estado.nombre for estado in carga.ausentes]
        return datos

    @app.post("/inferir")
    async def inferir(request: Request) -> Any:
        """Imagen ecográfica → nódulos del contrato, con huella y umbrales."""
        carga = _carga_de(request.app)
        config = getattr(request.app.state, "config", None)
        if carga.modelos is None or not isinstance(config, ConfiguracionIA):
            return _error(
                503,
                CODIGO_MODELO_NO_DISPONIBLE,
                "El servicio no tiene los tres modelos cargados.",
                faltantes=[
                    {"modelo": estado.nombre, "detalle": estado.detalle}
                    for estado in carga.ausentes
                ],
            )

        tipo_formulario = request.headers.get("content-type", "")
        if not tipo_formulario.lower().startswith("multipart/form-data"):
            return _error(
                422,
                "imagen_invalida",
                "La solicitud debe enviar la imagen como multipart/form-data en el campo 'imagen'.",
            )

        limite = TAMANO_MAXIMO_IMAGEN + MARGEN_MULTIPART
        declarado = request.headers.get("content-length")
        if declarado is not None and declarado.isdigit() and int(declarado) > limite:
            return _error(
                413,
                "imagen_demasiado_grande",
                f"La imagen supera el máximo de {TAMANO_MAXIMO_IMAGEN} bytes.",
            )

        cuerpo = await request.body()
        if len(cuerpo) > limite:
            return _error(
                413,
                "imagen_demasiado_grande",
                f"La imagen supera el máximo de {TAMANO_MAXIMO_IMAGEN} bytes.",
            )

        parte = _parte_imagen(cuerpo, tipo_formulario)
        if parte is None:
            return _error(
                422,
                "imagen_invalida",
                "Falta el campo 'imagen' del formulario.",
            )
        tipo, contenido = parte
        if tipo not in TIPOS_IMAGEN:
            return _error(
                422,
                "imagen_invalida",
                "El archivo debe ser una imagen JPEG, PNG, BMP, TIFF o WebP.",
            )
        if not contenido:
            return _error(422, "imagen_invalida", "La imagen está vacía.")
        if len(contenido) > TAMANO_MAXIMO_IMAGEN:
            return _error(
                413,
                "imagen_demasiado_grande",
                f"La imagen supera el máximo de {TAMANO_MAXIMO_IMAGEN} bytes.",
            )

        arreglo = np.frombuffer(contenido, dtype=np.uint8)
        imagen_bgr = cv2.imdecode(arreglo, cv2.IMREAD_COLOR)
        if imagen_bgr is None:
            return _error(
                422,
                "imagen_invalida",
                "No se pudo decodificar la imagen; el archivo no es una imagen válida.",
            )

        try:
            resultado = await run_in_threadpool(
                analizar_imagen,
                imagen_bgr,
                modelos=carga.modelos,
                config=config,
                con_artefactos=True,
                nombre_imagen=NOMBRE_CAMPO_IMAGEN,
            )
        except ValueError:
            return _error(
                422,
                "imagen_invalida",
                "La imagen no tiene el formato esperado para la inferencia.",
            )
        except Exception:  # noqa: BLE001 - el cliente recibe un código, nunca la traza
            return _error(
                500,
                "error_inferencia",
                "No se pudo completar la inferencia.",
            )

        datos = resultado.a_diccionario()
        datos["huella_modelos"] = carga.huella
        datos["umbrales"] = dict(carga.umbrales)
        return datos

    return app


app = crear_aplicacion()
