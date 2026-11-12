"""Motores de reconocimiento del servicio de OCR.

Dos implementaciones del mismo protocolo ``MotorOcr``:

- ``MotorGlmOcr``: GLM-OCR con el paquete oficial ``glmocr``. En su variante
  local habla con un servidor de inferencia propio (vLLM, SGLang, Ollama o MLX)
  en ``127.0.0.1``: el documento no sale del equipo. La variante hospedada
  (Zhipu) solo se activa si el servicio le pasa una clave porque
  ``OCR_PERMITIR_API_EXTERNA`` está encendida.
- ``MotorTesseract``: PyMuPDF para rasterizar y ``pytesseract`` con ``spa``,
  que sí reporta confianza por palabra.

Los dos importan sus dependencias de forma perezosa: si el paquete no está
instalado, el servicio arranca en ``degradado`` y lo dice, en vez de fallar al
importar el módulo.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import shutil
import socket
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

from .contrato import ETIQUETAS, BloqueOcr, DocumentoOcr

MODELO_GLM = "zai-org/GLM-OCR"
MODELO_TESSERACT = "tesseract-ocr-spa"

# Segmentación de página de Tesseract. La detección automática (``--psm 3``)
# extrae mejor los campos de las fichas y se usa en ``/reconocer``; el texto
# suelto de una ecografía se descarta con ella, así que la detección de texto
# incrustado usa un bloque uniforme (``--psm 6``) y reintenta ``--psm 3`` solo
# si no reconoce ningún bloque.
PSM_TEXTO_EN_BLOQUE = "--psm 6"
PSM_DOCUMENTO = "--psm 3"

# Nombre con el que se sirve el modelo en el servidor local
# (`vllm serve zai-org/GLM-OCR --served-model-name glm-ocr`).
NOMBRE_SERVIDO_GLM = "glm-ocr"
SERVIDOR_GLM_POR_DEFECTO = ("127.0.0.1", 8080)

AVISO_SIN_CONFIANZA = "el motor no reporta confianza por bloque"
AVISO_API_EXTERNA = (
    "el documento se envió a la API hospedada de GLM-OCR, fuera de la infraestructura propia"
)

# El modelo de layout que usa el SDK descarga sus pesos de Hugging Face si no
# están en disco; con estas variables solo se usa lo que ya está instalado.
VARIABLES_SIN_RED = ("HF_HUB_OFFLINE", "TRANSFORMERS_OFFLINE", "HF_DATASETS_OFFLINE")


class ErrorMotorOcr(RuntimeError):
    """El motor no puede reconocer: falta el paquete, los pesos o el servidor."""


class MotorOcr(Protocol):
    """Lo que el servicio necesita de un motor de OCR."""

    nombre: str
    modelo: str

    def disponible(self) -> str | None:
        """``None`` si puede reconocer; si no, el motivo, sin detalles internos."""
        ...

    def reconocer(
        self, contenido: bytes, tipo: str, *, texto_incrustado: bool = False
    ) -> DocumentoOcr:
        """Reconoce el documento y devuelve el contrato completo.

        ``texto_incrustado`` marca que la entrada es una fotografía con
        anotaciones (una ecografía): el motor usa la segmentación que sí lee el
        texto suelto y devuelve una palabra por bloque, con su confianza, para
        poder tapar solo las anotaciones.
        """
        ...


@dataclass(frozen=True, slots=True)
class MotorNoDisponible:
    """Marcador para una configuración inválida: el servicio sigue en pie."""

    nombre: str
    modelo: str
    motivo: str

    def disponible(self) -> str | None:
        return self.motivo

    def reconocer(
        self, contenido: bytes, tipo: str, *, texto_incrustado: bool = False
    ) -> DocumentoOcr:
        raise ErrorMotorOcr(self.motivo)


class MotorGlmOcr:
    """GLM-OCR mediante el paquete oficial ``glmocr``.

    Llamada local (la única que el servicio usa por defecto)::

        import glmocr

        with glmocr.GlmOcr(
            mode="selfhosted",          # nunca MaaS: nada sale del equipo
            ocr_api_host="127.0.0.1",   # servidor de inferencia propio
            ocr_api_port=8080,
            model="glm-ocr",
            layout_device="cpu",        # funciona sin GPU
            _dotted={"pipeline.layout.model_dir": "/ruta/a/pesos-layout"},
        ) as parser:
            resultado = parser.parse(<bytes del PDF o de la imagen>)
            resultado.markdown_result            # Markdown
            resultado.json_result                # páginas → bloques

    El SDK no carga los pesos de GLM-OCR: los sirve el servidor de inferencia.
    Lo único que carga en proceso es el detector de layout (PP-DocLayoutV3),
    cuyos pesos van en ``layout_dir``; con ``VARIABLES_SIN_RED`` el SDK no los
    descarga y falla si no están en disco.

    Cada página de ``json_result`` es una lista de regiones con ``label``,
    ``content`` y ``bbox_2d`` normalizada 0..1000, que aquí se lleva a 0..1.
    """

    nombre = "glm-ocr"
    modelo = MODELO_GLM

    def __init__(
        self,
        *,
        modelo_dir: str | Path | None = None,
        layout_dir: str | Path | None = None,
        api_key: str | None = None,
        api_url: str | None = None,
        servidor: tuple[str, int] = SERVIDOR_GLM_POR_DEFECTO,
    ) -> None:
        """``api_key`` solo llega aquí si el servicio permitió la API externa.

        ``modelo_dir`` son los pesos de GLM-OCR que consume el servidor de
        inferencia (el SDK no los toca); ``layout_dir``, los de PP-DocLayoutV3
        que sí carga el SDK. Si ``layout_dir`` falta se usa el identificador
        por defecto del SDK y hace falta caché local de Hugging Face.
        """
        self.modo = "api" if api_key else "local"
        self._api_key = api_key
        self._api_url = api_url
        self._servidor = servidor
        self._modelo_dir = Path(modelo_dir) if modelo_dir else None
        self._layout_dir = Path(layout_dir) if layout_dir else None
        self._parser: Any = None
        self._huella = _huella_directorio(self._modelo_dir)

    def disponible(self) -> str | None:
        if importlib.util.find_spec("glmocr") is None:
            return "el paquete glmocr no está instalado"
        if self.modo == "api":
            return None
        if self._modelo_dir is not None and not self._modelo_dir.is_dir():
            return "no están los pesos del modelo en OCR_MODELO_DIR"
        if self._layout_dir is not None and not self._layout_dir.is_dir():
            return "no están los pesos del detector de layout en OCR_MODELO_LAYOUT_DIR"
        host, puerto = self._servidor
        if not _puerto_abierto(host, puerto):
            return f"no hay servidor de inferencia de GLM-OCR en {host}:{puerto}"
        return None

    def reconocer(
        self, contenido: bytes, tipo: str, *, texto_incrustado: bool = False
    ) -> DocumentoOcr:
        # `tipo` ya se validó en el endpoint; el SDK deduce el formato del contenido.
        # GLM-OCR es de layout: no hay ``--psm`` que elegir y sus regiones ya
        # vienen con caja y texto; ``texto_incrustado`` no cambia el resultado.
        motivo = self.disponible()
        if motivo is not None:
            raise ErrorMotorOcr(motivo)
        try:
            resultado = self._obtener_parser().parse(contenido)
        except Exception as exc:  # el SDK falla con tipos propios; no se filtran
            raise ErrorMotorOcr("el motor de GLM-OCR no pudo procesar el documento") from exc
        return self._a_documento(resultado)

    def cerrar(self) -> None:
        """Cierra el parser del SDK, que mantiene hilos y conexiones abiertos."""
        if self._parser is not None:
            try:
                self._parser.close()
            except Exception:  # cerrar nunca debe tumbar el apagado del servicio
                pass
            self._parser = None

    def _obtener_parser(self) -> Any:
        if self._parser is None:
            self._parser = _crear_parser_glm(
                api_key=self._api_key,
                api_url=self._api_url,
                servidor=self._servidor,
                layout_dir=self._layout_dir,
            )
        return self._parser

    def _a_documento(self, resultado: Any) -> DocumentoOcr:
        paginas = _paginas_glm(resultado)
        bloques: list[BloqueOcr] = []
        for numero, regiones in enumerate(paginas, start=1):
            for region in regiones:
                texto = str(region.get("content") or "").strip()
                if not texto:
                    continue
                bloques.append(
                    BloqueOcr(
                        pagina=numero,
                        orden=len(bloques),
                        etiqueta=_etiqueta(region.get("label")),
                        texto=texto,
                        bbox=_bbox_glm(region.get("bbox_2d")),
                        confianza=None,
                    )
                )
        avisos = [AVISO_SIN_CONFIANZA]
        if self.modo == "api":
            avisos.insert(0, AVISO_API_EXTERNA)
        return DocumentoOcr(
            motor=self.nombre,
            modelo=self.modelo,
            huella_modelo=self._huella,
            paginas=max(len(paginas), 1),
            texto_markdown=str(getattr(resultado, "markdown_result", "") or ""),
            bloques=tuple(bloques),
            avisos=tuple(avisos),
        )


class MotorTesseract:
    """Tesseract en español sobre las páginas rasterizadas con PyMuPDF.

    Devuelve un bloque por línea de texto, con la confianza media de sus
    palabras (Tesseract la da en porcentaje; aquí se lleva a 0..1) y la caja de
    la línea normalizada por el tamaño de la página.
    """

    nombre = "tesseract"
    modelo = MODELO_TESSERACT
    dpi = 200

    def __init__(self, idioma: str = "spa") -> None:
        self._idioma = idioma
        self._huella: str | None = None
        self._huella_calculada = False

    def disponible(self) -> str | None:
        if not _modulo_instalado("pymupdf"):
            return "el paquete pymupdf no está instalado"
        if not _modulo_instalado("pytesseract"):
            return "el paquete pytesseract no está instalado"
        if shutil.which("tesseract") is None:
            return "el binario tesseract no está instalado"
        return None

    def reconocer(
        self, contenido: bytes, tipo: str, *, texto_incrustado: bool = False
    ) -> DocumentoOcr:
        motivo = self.disponible()
        if motivo is not None:
            raise ErrorMotorOcr(motivo)
        try:
            paginas = _paginas_de(contenido, tipo, dpi=self.dpi)
        except Exception as exc:  # archivo corrupto o ilegible
            raise ErrorMotorOcr("no se pudo abrir el documento para el OCR") from exc
        if not paginas:
            raise ErrorMotorOcr("el documento no tiene páginas que reconocer")

        bloques: list[BloqueOcr] = []
        textos: list[str] = []
        avisos: list[str] = []
        for numero, imagen in enumerate(paginas, start=1):
            de_pagina = _bloques_de_pagina(
                imagen, numero, self._idioma, texto_incrustado=texto_incrustado
            )
            if not de_pagina:
                avisos.append(f"la página {numero} no produjo texto reconocible")
            bloques.extend(de_pagina)
            textos.append("\n".join(bloque.texto for bloque in de_pagina))
        return DocumentoOcr(
            motor=self.nombre,
            modelo=self.modelo,
            huella_modelo=self._huella_del_binario(),
            paginas=len(paginas),
            texto_markdown="\n\n".join(texto for texto in textos if texto),
            bloques=tuple(bloques),
            avisos=tuple(avisos),
        )

    def _huella_del_binario(self) -> str | None:
        """sha256 de la versión de Tesseract: identifica qué motor se usó."""
        if not self._huella_calculada:
            self._huella_calculada = True
            try:
                import pytesseract

                self._huella = hashlib.sha256(
                    str(pytesseract.get_tesseract_version()).encode("utf-8")
                ).hexdigest()
            except Exception:  # el binario puede faltar o no responder
                self._huella = None
        return self._huella


def _crear_parser_glm(
    *,
    api_key: str | None,
    api_url: str | None,
    servidor: tuple[str, int],
    layout_dir: Path | None,
) -> Any:
    """Construye el parser del SDK; el que llama ya comprobó que está instalado.

    ``modelo_dir`` no se usa aquí: ``pipeline.layout.model_dir`` es el detector
    de layout (PP-DocLayoutV3), no los pesos de GLM-OCR, que los carga el
    servidor de inferencia. Apuntar la clave de layout a los pesos del OCR
    hacía que el SDK intentara cargarlos como detector.
    """
    import glmocr

    if api_key:
        opciones: dict[str, Any] = {"mode": "maas", "api_key": api_key}
        if api_url:
            opciones["api_url"] = api_url
        return glmocr.GlmOcr(**opciones)

    for variable in VARIABLES_SIN_RED:
        os.environ[variable] = "1"
    host, puerto = servidor
    puntuales: dict[str, Any] = {"pipeline.ocr_api.connect_timeout": 5}
    if layout_dir is not None:
        puntuales["pipeline.layout.model_dir"] = str(layout_dir)
    return glmocr.GlmOcr(
        mode="selfhosted",
        ocr_api_host=host,
        ocr_api_port=puerto,
        model=NOMBRE_SERVIDO_GLM,
        layout_device="cpu",
        _dotted=puntuales,
    )


def _paginas_glm(resultado: Any) -> list[list[dict[str, Any]]]:
    """Normaliza ``json_result`` del SDK a una lista de páginas con regiones."""
    crudo = getattr(resultado, "json_result", None)
    if isinstance(crudo, str):
        try:
            crudo = json.loads(crudo)
        except json.JSONDecodeError:
            return []
    if isinstance(crudo, dict):
        crudo = crudo.get("layout_details") or []
    if not isinstance(crudo, list):
        return []
    paginas: list[list[dict[str, Any]]] = []
    for pagina in crudo:
        if isinstance(pagina, dict):
            pagina = [pagina]
        regiones = [region for region in pagina if isinstance(region, dict)]
        paginas.append(regiones)
    return paginas


def _etiqueta(valor: object) -> str:
    etiqueta = str(valor or "text").strip().lower()
    return etiqueta if etiqueta in ETIQUETAS else "text"


def _bbox_glm(valor: object) -> tuple[float, float, float, float] | None:
    """``bbox_2d`` del SDK viene en 0..1000; el contrato la pide en 0..1."""
    if not isinstance(valor, list | tuple) or len(valor) != 4:
        return None
    try:
        numeros = [float(coordenada) for coordenada in valor]
    except (TypeError, ValueError):
        return None
    caja = tuple(min(max(coordenada / 1000.0, 0.0), 1.0) for coordenada in numeros)
    x1, y1, x2, y2 = caja
    return (x1, y1, x2, y2) if x1 <= x2 and y1 <= y2 else None


def _normalizar_caja(
    caja: tuple[float, float, float, float], tamano: tuple[int, int]
) -> tuple[float, float, float, float] | None:
    ancho, alto = tamano
    if ancho <= 0 or alto <= 0:
        return None
    x1, y1, x2, y2 = caja
    return (
        min(max(x1 / ancho, 0.0), 1.0),
        min(max(y1 / alto, 0.0), 1.0),
        min(max(x2 / ancho, 0.0), 1.0),
        min(max(y2 / alto, 0.0), 1.0),
    )


def _bloques_de_palabras(
    datos: dict[str, list[Any]], pagina: int, tamano: tuple[int, int]
) -> list[BloqueOcr]:
    """Agrupa las palabras de ``image_to_data`` en una línea por bloque."""
    lineas: dict[tuple[int, int, int], list[int]] = {}
    for indice, palabra in enumerate(datos["text"]):
        if not str(palabra).strip():
            continue
        clave = (datos["block_num"][indice], datos["par_num"][indice], datos["line_num"][indice])
        lineas.setdefault(clave, []).append(indice)

    bloques: list[BloqueOcr] = []
    for orden, indices in enumerate(lineas.values()):
        izquierda = min(float(datos["left"][i]) for i in indices)
        arriba = min(float(datos["top"][i]) for i in indices)
        derecha = max(float(datos["left"][i]) + float(datos["width"][i]) for i in indices)
        abajo = max(float(datos["top"][i]) + float(datos["height"][i]) for i in indices)
        confianzas = [float(datos["conf"][i]) for i in indices]
        confianzas = [valor for valor in confianzas if valor >= 0]
        bloques.append(
            BloqueOcr(
                pagina=pagina,
                orden=orden,
                etiqueta="text",
                texto=" ".join(str(datos["text"][i]).strip() for i in indices),
                bbox=_normalizar_caja((izquierda, arriba, derecha, abajo), tamano),
                confianza=round(sum(confianzas) / len(confianzas) / 100, 4) if confianzas else None,
            )
        )
    return bloques


def _bloques_de_pagina(
    imagen: Any, numero: int, idioma: str, *, texto_incrustado: bool
) -> list[BloqueOcr]:
    """Reconoce una página con la segmentación que corresponde a su contenido.

    Los documentos usan ``--psm 3`` (detección automática), el comportamiento
    medido en ``docs/pruebas/medicion-ocr.md``: cambiarlo pierde campos de las
    fichas. Las ecografías con anotaciones sueltas se pierden con esa
    segmentación, así que en ``texto_incrustado`` se usa ``--psm 6`` (bloque
    uniforme) y solo se reintenta ``--psm 3`` si no hubo ningún bloque: una
    sola de las dos pasadas por página salvo que la primera no reconozca nada.

    En ``texto_incrustado`` se devuelve una palabra por bloque, con su propia
    confianza, para que quien tapa el texto cubra solo la anotación y no la
    zona clínica que la rodea.
    """
    tamano = imagen.size
    if not texto_incrustado:
        datos = _datos_de_tesseract(imagen, idioma, PSM_DOCUMENTO)
        return _bloques_de_palabras(datos, numero, tamano)
    datos = _datos_de_tesseract(imagen, idioma, PSM_TEXTO_EN_BLOQUE)
    bloques = _bloques_de_palabras_sueltas(datos, numero, tamano)
    if bloques:
        return bloques
    datos = _datos_de_tesseract(imagen, idioma, PSM_DOCUMENTO)
    return _bloques_de_palabras_sueltas(datos, numero, tamano)


def _bloques_de_palabras_sueltas(
    datos: dict[str, list[Any]], pagina: int, tamano: tuple[int, int]
) -> list[BloqueOcr]:
    """Una palabra reconocida por bloque, con su propia caja y confianza.

    Tesseract marca con ``-1`` las filas que no son palabras; se descartan.
    La confianza se lleva de porcentaje a ``0..1`` sin promediar con vecinas,
    que es lo que permite tapar solo la anotación y no la zona clínica.
    """
    bloques: list[BloqueOcr] = []
    for indice, palabra in enumerate(datos["text"]):
        texto = str(palabra).strip()
        confianza = float(datos["conf"][indice])
        if not texto or confianza < 0:
            continue
        izquierda = float(datos["left"][indice])
        arriba = float(datos["top"][indice])
        derecha = izquierda + float(datos["width"][indice])
        abajo = arriba + float(datos["height"][indice])
        bloques.append(
            BloqueOcr(
                pagina=pagina,
                orden=len(bloques),
                etiqueta="text",
                texto=texto,
                bbox=_normalizar_caja((izquierda, arriba, derecha, abajo), tamano),
                confianza=round(confianza / 100, 4),
            )
        )
    return bloques


def _datos_de_tesseract(imagen: Any, idioma: str, config: str = "") -> dict[str, list[Any]]:
    """OCR de una página en el formato de ``image_to_data``."""
    import pytesseract

    return pytesseract.image_to_data(
        imagen, lang=idioma, config=config, output_type=pytesseract.Output.DICT
    )


def _paginas_de(contenido: bytes, tipo: str, dpi: int = 200) -> list[Any]:
    """Rasteriza el PDF con PyMuPDF, o abre la imagen tal cual."""
    if tipo == "application/pdf":
        import pymupdf

        with pymupdf.open(stream=contenido, filetype="pdf") as documento:
            return [
                _imagen_desde_bytes(pagina.get_pixmap(dpi=dpi).tobytes("png"))
                for pagina in documento
            ]
    return [_imagen_desde_bytes(contenido)]


def _imagen_desde_bytes(datos: bytes) -> Any:
    import io

    from PIL import Image

    with Image.open(io.BytesIO(datos)) as imagen:
        return imagen.convert("RGB")


def _modulo_instalado(*nombres: str) -> bool:
    try:
        return any(importlib.util.find_spec(nombre) is not None for nombre in nombres)
    except (ImportError, ValueError):
        return False


def _puerto_abierto(host: str, puerto: int, tiempo: float = 0.3) -> bool:
    try:
        with socket.create_connection((host, puerto), timeout=tiempo):
            return True
    except OSError:
        return False


def _huella_directorio(ruta: Path | None) -> str | None:
    """sha256 del inventario de pesos (ruta relativa y tamaño).

    No se leen los 2,65 GB del modelo: la huella describe el conjunto de
    archivos desplegado, que es lo que cambia entre instalaciones.
    """
    if ruta is None or not ruta.is_dir():
        return None
    resumen = hashlib.sha256()
    try:
        for archivo in sorted(camino for camino in ruta.rglob("*") if camino.is_file()):
            relativo = archivo.relative_to(ruta).as_posix()
            resumen.update(f"{relativo}\0{archivo.stat().st_size}\n".encode())
    except OSError:
        return None
    return resumen.hexdigest()
