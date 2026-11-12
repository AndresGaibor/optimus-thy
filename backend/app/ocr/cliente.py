"""Cliente HTTP del servicio de OCR.

Dos operaciones: ``POST /texto-incrustado`` para detectar texto sospechoso sobre
una ecografía (HT-051) y ``POST /reconocer`` para leer una ficha completa
(HU-051). Usa ``httpx`` (ya presente en el backend) con timeout corto y errores
tipados. No expone ni registra el texto reconocido.
"""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass

import httpx

from app.config import get_settings


class ErrorOcr(Exception):
    """Fallo al consultar el servicio de OCR."""


class ServicioOcrNoDisponible(ErrorOcr):
    """No hubo respuesta útil del servicio de OCR dentro del tiempo previsto."""


class TiempoOcrExcedido(ServicioOcrNoDisponible):
    """La petición superó el tiempo de espera configurado."""


class ContratoOcrInvalido(ErrorOcr):
    """La respuesta del OCR no cumple la forma esperada."""


class DocumentoOcrDanado(ErrorOcr):
    """El servicio no pudo leer el documento recibido."""


class FormatoOcrNoAdmitido(ErrorOcr):
    """El servicio no reconoce el tipo del documento recibido."""


@dataclass(frozen=True, slots=True)
class RegionTextoIncrustado:
    """Zona con texto sospechoso detectada sobre la imagen."""

    bbox: tuple[float, float, float, float]
    texto: str
    confianza: float | None


@dataclass(frozen=True, slots=True)
class ResultadoTextoIncrustado:
    """Resultado de ``POST /texto-incrustado`` ya validado."""

    version_contrato: str
    motor: str
    regiones: tuple[RegionTextoIncrustado, ...]
    detectado: bool
    avisos: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class CampoReconocido:
    """Valor clínico extraído del texto reconocido."""

    nombre: str
    valor: str
    confianza: float | None
    revisar: bool


@dataclass(frozen=True, slots=True)
class ResultadoReconocimiento:
    """Resultado de ``POST /reconocer`` ya validado.

    Solo se conservan los metadatos y los campos que el trabajador guarda: el
    texto reconocido no sale del servicio (HU-051).
    """

    version_contrato: str
    motor: str
    modelo: str
    huella_modelo: str | None
    paginas: int
    campos: tuple[CampoReconocido, ...]
    avisos: tuple[str, ...] = ()


def _numero(valor: object, nombre: str) -> float:
    if isinstance(valor, bool) or not isinstance(valor, int | float):
        raise ContratoOcrInvalido(f"{nombre} no es numérico")
    numero = float(valor)
    if not 0.0 <= numero <= 1.0:
        raise ContratoOcrInvalido(f"{nombre} fuera de rango")
    return numero


def _bbox(valor: object) -> tuple[float, float, float, float]:
    if not isinstance(valor, list | tuple) or len(valor) != 4:
        raise ContratoOcrInvalido("bbox inválida")
    x1, y1, x2, y2 = (_numero(coordenada, "bbox") for coordenada in valor)
    if x1 > x2 or y1 > y2:
        raise ContratoOcrInvalido("bbox invertida")
    return (x1, y1, x2, y2)


def _confianza(valor: object) -> float | None:
    if valor is None:
        return None
    return _numero(valor, "confianza")


def _region(valor: object) -> RegionTextoIncrustado:
    if not isinstance(valor, Mapping):
        raise ContratoOcrInvalido("región inválida")
    texto = valor.get("texto")
    if not isinstance(texto, str):
        raise ContratoOcrInvalido("texto de región inválido")
    return RegionTextoIncrustado(
        bbox=_bbox(valor.get("bbox")),
        texto=texto,
        confianza=_confianza(valor.get("confianza")),
    )


def validar_texto_incrustado(datos: object) -> ResultadoTextoIncrustado:
    """Comprueba la forma mínima del contrato y devuelve un resultado tipado."""
    if not isinstance(datos, dict):
        raise ContratoOcrInvalido("la respuesta no es un objeto")
    version = datos.get("version_contrato")
    motor = datos.get("motor")
    detectado = datos.get("detectado")
    regiones_crudas = datos.get("regiones")
    if (
        not isinstance(version, str)
        or not isinstance(motor, str)
        or not isinstance(detectado, bool)
    ):
        raise ContratoOcrInvalido("faltan campos obligatorios")
    if not isinstance(regiones_crudas, list):
        raise ContratoOcrInvalido("regiones inválidas")
    regiones = tuple(_region(region) for region in regiones_crudas)
    avisos_crudos = datos.get("avisos")
    avisos: tuple[str, ...] = ()
    if avisos_crudos is not None:
        if not isinstance(avisos_crudos, list) or not all(
            isinstance(a, str) for a in avisos_crudos
        ):
            raise ContratoOcrInvalido("avisos inválidos")
        avisos = tuple(avisos_crudos)
    return ResultadoTextoIncrustado(
        version_contrato=version,
        motor=motor,
        regiones=regiones,
        detectado=detectado,
        avisos=avisos,
    )


def _campo_reconocido(valor: object) -> CampoReconocido:
    if not isinstance(valor, Mapping):
        raise ContratoOcrInvalido("campo inválido")
    nombre = valor.get("nombre")
    contenido = valor.get("valor")
    revisar = valor.get("revisar", False)
    if not isinstance(nombre, str) or not nombre or not isinstance(contenido, str):
        raise ContratoOcrInvalido("campo inválido")
    if not isinstance(revisar, bool):
        raise ContratoOcrInvalido("revisar inválido")
    return CampoReconocido(
        nombre=nombre,
        valor=contenido,
        confianza=_confianza(valor.get("confianza")),
        revisar=revisar,
    )


def validar_reconocimiento(datos: object) -> ResultadoReconocimiento:
    """Comprueba la forma mínima de ``POST /reconocer`` y tipa el resultado."""
    if not isinstance(datos, dict):
        raise ContratoOcrInvalido("la respuesta no es un objeto")
    version = datos.get("version_contrato")
    motor = datos.get("motor")
    modelo = datos.get("modelo")
    huella = datos.get("huella_modelo")
    paginas = datos.get("paginas")
    campos_crudos = datos.get("campos")
    if (
        not isinstance(version, str)
        or not isinstance(motor, str)
        or not isinstance(modelo, str)
        or not isinstance(paginas, int)
        or isinstance(paginas, bool)
        or paginas < 1
    ):
        raise ContratoOcrInvalido("faltan campos obligatorios")
    if huella is not None and not isinstance(huella, str):
        raise ContratoOcrInvalido("huella de modelo inválida")
    if not isinstance(campos_crudos, list):
        raise ContratoOcrInvalido("campos inválidos")
    campos = tuple(_campo_reconocido(campo) for campo in campos_crudos)
    avisos_crudos = datos.get("avisos")
    avisos: tuple[str, ...] = ()
    if avisos_crudos is not None:
        if not isinstance(avisos_crudos, list) or not all(
            isinstance(aviso, str) for aviso in avisos_crudos
        ):
            raise ContratoOcrInvalido("avisos inválidos")
        avisos = tuple(avisos_crudos)
    return ResultadoReconocimiento(
        version_contrato=version,
        motor=motor,
        modelo=modelo,
        huella_modelo=huella,
        paginas=paginas,
        campos=campos,
        avisos=avisos,
    )


class ClienteOcr:
    """Cliente del servicio de OCR; el transporte se puede sustituir en pruebas."""

    def __init__(
        self,
        base_url: str,
        timeout_segundos: float,
        transporte: httpx.BaseTransport | None = None,
        timeout_documento_segundos: float | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout_segundos
        self._timeout_documento = timeout_documento_segundos or timeout_segundos
        self._transporte = transporte

    def _post(
        self,
        ruta: str,
        campo: str,
        nombre: str,
        contenido: bytes,
        content_type: str,
        timeout_segundos: float | None = None,
    ) -> httpx.Response:
        try:
            with httpx.Client(
                base_url=self._base_url,
                timeout=timeout_segundos or self._timeout,
                transport=self._transporte,
            ) as cliente:
                return cliente.post(
                    ruta,
                    files={campo: (nombre, contenido, content_type)},
                )
        except httpx.TimeoutException as exc:
            raise TiempoOcrExcedido("timeout") from exc
        except httpx.HTTPError as exc:
            raise ServicioOcrNoDisponible("sin conexión") from exc

    def detectar_texto_incrustado(
        self, contenido: bytes, content_type: str, nombre: str = "imagen"
    ) -> ResultadoTextoIncrustado:
        """Envía la imagen ya saneada y devuelve las regiones detectadas."""
        respuesta = self._post("/texto-incrustado", "imagen", nombre, contenido, content_type)
        if respuesta.status_code in (503, 504):
            raise ServicioOcrNoDisponible(f"HTTP {respuesta.status_code}")
        if respuesta.status_code >= 400:
            raise ServicioOcrNoDisponible(f"HTTP {respuesta.status_code}")
        try:
            datos = respuesta.json()
        except ValueError as exc:
            raise ContratoOcrInvalido("respuesta no es JSON") from exc
        return validar_texto_incrustado(datos)

    def reconocer_documento(
        self, contenido: bytes, content_type: str, nombre: str = "documento"
    ) -> ResultadoReconocimiento:
        """Reconoce un documento completo (``POST /reconocer``).

        Los rechazos del servicio se traducen a errores tipados para que el
        trabajador pueda elegir un motivo conocido sin ver el detalle interno.
        """
        respuesta = self._post(
            "/reconocer",
            "documento",
            nombre,
            contenido,
            content_type,
            timeout_segundos=self._timeout_documento,
        )
        if respuesta.status_code == 415:
            raise FormatoOcrNoAdmitido("tipo de documento no admitido")
        if respuesta.status_code == 422:
            raise DocumentoOcrDanado("el servicio no pudo leer el documento")
        if respuesta.status_code >= 400:
            raise ServicioOcrNoDisponible(f"HTTP {respuesta.status_code}")
        try:
            datos = respuesta.json()
        except ValueError as exc:
            raise ContratoOcrInvalido("respuesta no es JSON") from exc
        return validar_reconocimiento(datos)


def get_cliente_ocr() -> ClienteOcr:
    """Cliente configurado desde el entorno."""
    settings = get_settings()
    return ClienteOcr(
        settings.ocr_url,
        settings.ocr_timeout_segundos,
        timeout_documento_segundos=settings.ocr_documento_timeout_segundos,
    )
