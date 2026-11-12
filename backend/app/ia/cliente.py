"""Cliente HTTP del servicio de IA (HT-063).

Contrato de entrada: ``POST /inferir`` con ``multipart/form-data`` y el campo
``imagen``. Contrato de salida: el diccionario versionado que documenta
``ia/app/contrato.py`` más ``huella_modelos`` y ``umbrales``.

Contrato 1.1: cada nódulo puede traer sus artefactos derivados en base64
(``mascara_png``, ``mgac_png``, ``xml`` y ``superposicion_png``), todos
opcionales por separado. Los contratos 1.0 no los traen y siguen siendo válidos.

Los fallos se traducen a errores tipados que llevan un código estable para el
trabajo en cola; el mensaje nunca incluye datos del paciente ni el cuerpo de la
respuesta del servicio.
"""

from __future__ import annotations

import base64
import binascii
import re
from collections.abc import Mapping
from dataclasses import dataclass

import httpx

from app.config import get_settings

__all__ = [
    "CODIGO_ARTEFACTOS_DEMASIADO_GRANDES",
    "CODIGO_ARTEFACTO_INVALIDO",
    "CODIGO_CONTRATO_INVALIDO",
    "CODIGO_MODELO_NO_DISPONIBLE",
    "CODIGO_SERVICIO_NO_DISPONIBLE",
    "MAX_BYTES_ARTEFACTOS",
    "ArtefactoInvalido",
    "ArtefactosDemasiadoGrandes",
    "ArtefactosNodulo",
    "ClienteIA",
    "ContratoInvalido",
    "ErrorIA",
    "ServicioNoDisponible",
    "ServicioRespondioError",
    "decodificar_artefactos",
    "get_cliente_ia",
]

CODIGO_MODELO_NO_DISPONIBLE = "modelo_no_disponible"
CODIGO_SERVICIO_NO_DISPONIBLE = "servicio_ia_no_disponible"
CODIGO_CONTRATO_INVALIDO = "contrato_invalido"
CODIGO_ARTEFACTO_INVALIDO = "artefacto_invalido"
CODIGO_ARTEFACTOS_DEMASIADO_GRANDES = "artefactos_demasiado_grandes"

#: Campos que el contrato de salida debe traer siempre.
CAMPOS_CONTRATO = (
    "version_contrato",
    "ancho",
    "alto",
    "sin_nodulo",
    "nodulos",
    "huella_modelos",
    "umbrales",
)
CAMPOS_NODULO = (
    "indice",
    "caja",
    "confianza_detector",
    "origen_mascara",
    "clase",
    "probabilidad_benigno",
    "probabilidad_maligno",
    "region_analizada",
    "pixeles_mascara",
)
CAMPOS_CAJA = ("xmin", "ymin", "xmax", "ymax")

CLASES = frozenset({"benigno", "maligno"})

#: Máximo de nódulos por inferencia que admite el contrato.
MAX_NODULOS = 3

#: Artefactos que el contrato 1.1 puede traer por nódulo, en base64.
CAMPOS_ARTEFACTO = ("mascara_png", "mgac_png", "xml", "superposicion_png")

MAX_BYTES_ARTEFACTOS = 8 * 1024 * 1024
"""Tope de seguridad de un artefacto de inferencia ya decodificado."""

_BASE64 = re.compile(r"\A[A-Za-z0-9+/]*={0,2}\Z")
_FIRMA_PNG = b"\x89PNG\r\n\x1a\n"


class ErrorIA(Exception):
    """Fallo al obtener la inferencia, con el código que queda en el trabajo."""

    codigo = CODIGO_SERVICIO_NO_DISPONIBLE

    def __init__(self, mensaje: str, codigo: str | None = None) -> None:
        super().__init__(mensaje)
        self.mensaje = mensaje
        if codigo is not None:
            self.codigo = codigo


class ServicioNoDisponible(ErrorIA):
    """No hubo respuesta o el servicio no tiene los modelos cargados."""


class ServicioRespondioError(ErrorIA):
    """El servicio respondió, pero con un error que no es de disponibilidad."""


class ContratoInvalido(ErrorIA):
    """La respuesta no cumple la forma mínima del contrato versionado."""

    codigo = CODIGO_CONTRATO_INVALIDO


class ArtefactoInvalido(ContratoInvalido):
    """Un artefacto del contrato no decodifica o no es un PNG válido."""

    codigo = CODIGO_ARTEFACTO_INVALIDO


class ArtefactosDemasiadoGrandes(ContratoInvalido):
    """Los artefactos del contrato superan el tope de seguridad."""

    codigo = CODIGO_ARTEFACTOS_DEMASIADO_GRANDES


@dataclass(frozen=True, slots=True)
class ArtefactosNodulo:
    """Artefactos decodificados de un nódulo; ``None`` si el campo no vino."""

    indice: int
    mascara: bytes | None
    mgac: bytes | None
    xml: bytes | None
    superposicion: bytes | None


def _es_entero(valor: object) -> bool:
    return isinstance(valor, int) and not isinstance(valor, bool)


def _es_numero(valor: object) -> bool:
    return isinstance(valor, (int, float)) and not isinstance(valor, bool)


def _revisar_caja(caja: object, donde: str) -> None:
    if not isinstance(caja, dict) or any(campo not in caja for campo in CAMPOS_CAJA):
        raise ContratoInvalido(f"El contrato no trae la caja de {donde}.")
    if any(not _es_entero(caja[campo]) for campo in CAMPOS_CAJA):
        raise ContratoInvalido(f"La caja de {donde} no tiene coordenadas enteras.")


def _revisar_nodulo(nodulo: object, posicion: int) -> None:
    donde = f"el nódulo {posicion}"
    if not isinstance(nodulo, dict):
        raise ContratoInvalido(f"El contrato no describe {donde}.")
    faltan = [campo for campo in CAMPOS_NODULO if campo not in nodulo]
    if faltan:
        raise ContratoInvalido(f"Al contrato le falta un campo de {donde}.")
    if not _es_entero(nodulo["indice"]) or not 1 <= nodulo["indice"] <= MAX_NODULOS:
        raise ContratoInvalido(f"El índice de {donde} está fuera de rango.")
    _revisar_caja(nodulo["caja"], donde)
    _revisar_caja(nodulo["region_analizada"], donde)
    for campo in ("confianza_detector", "probabilidad_benigno", "probabilidad_maligno"):
        if not _es_numero(nodulo[campo]) or not 0.0 <= nodulo[campo] <= 1.0:
            raise ContratoInvalido(f"La probabilidad de {donde} no está entre 0 y 1.")
    if nodulo["clase"] not in CLASES:
        raise ContratoInvalido(f"La clase de {donde} no es «benigno» ni «maligno».")
    if not isinstance(nodulo["origen_mascara"], str) or not nodulo["origen_mascara"]:
        raise ContratoInvalido(f"El origen de la máscara de {donde} no es válido.")
    if not _es_entero(nodulo["pixeles_mascara"]) or nodulo["pixeles_mascara"] < 0:
        raise ContratoInvalido(f"Los píxeles de máscara de {donde} no son válidos.")


def _bytes_base64(texto: str) -> int:
    """Tamaño decodificado de un base64, sin decodificarlo."""
    relleno = len(texto) - len(texto.rstrip("="))
    return len(texto) // 4 * 3 - relleno


def _tamano_artefacto(valor: object, campo: str) -> int:
    """Comprueba que ``valor`` sea base64 y devuelve su tamaño decodificado."""
    if not isinstance(valor, str) or not valor:
        raise ContratoInvalido(f"El contrato no trae «{campo}» como base64.")
    if len(valor) % 4 or not _BASE64.match(valor):
        raise ArtefactoInvalido(f"El campo «{campo}» del contrato no es base64 válido.")
    return _bytes_base64(valor)


def _tamano_artefactos(nodulo: dict[str, object], posicion: int) -> int:
    """Suma el tamaño de los artefactos que trae un nódulo ya bien formado."""
    total = 0
    for campo in CAMPOS_ARTEFACTO:
        valor = nodulo.get(campo)
        if valor is None:
            continue
        total += _tamano_artefacto(valor, f"{campo} del nódulo {posicion}")
    return total


def _decodificar(valor: object, campo: str, firma_png: bool) -> bytes:
    if not isinstance(valor, str):
        raise ArtefactoInvalido(f"El campo «{campo}» del contrato no es base64 válido.")
    try:
        contenido = base64.b64decode(valor, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ArtefactoInvalido(f"El campo «{campo}» no decodifica como base64.") from exc
    if firma_png and not contenido.startswith(_FIRMA_PNG):
        raise ArtefactoInvalido(f"El campo «{campo}» no es un PNG válido.")
    return contenido


def _decodificar_opcional(valor: object, campo: str, firma_png: bool) -> bytes | None:
    if valor is None:
        return None
    return _decodificar(valor, campo, firma_png)


def decodificar_artefactos(contrato: Mapping[str, object]) -> tuple[ArtefactosNodulo, ...]:
    """Decodifica los artefactos por nódulo de un contrato ya validado.

    ``validar_contrato`` comprobó forma, base64 y tamaño; aquí solo se
    materializan los bytes que el manejador guarda.
    """
    nodulos = contrato.get("nodulos")
    if not isinstance(nodulos, list):
        return ()
    decodificados: list[ArtefactosNodulo] = []
    for nodulo in nodulos:
        if not isinstance(nodulo, dict):
            continue
        indice = int(nodulo["indice"])
        decodificados.append(
            ArtefactosNodulo(
                indice=indice,
                mascara=_decodificar_opcional(
                    nodulo.get("mascara_png"), f"mascara_png del nódulo {indice}", True
                ),
                mgac=_decodificar_opcional(
                    nodulo.get("mgac_png"), f"mgac_png del nódulo {indice}", True
                ),
                xml=_decodificar_opcional(nodulo.get("xml"), f"xml del nódulo {indice}", False),
                superposicion=_decodificar_opcional(
                    nodulo.get("superposicion_png"), f"superposicion_png del nódulo {indice}", True
                ),
            )
        )
    return tuple(decodificados)


def validar_contrato(datos: object) -> dict[str, object]:
    """Comprueba la forma mínima del contrato y devuelve el diccionario.

    Acepta ``1.0`` y ``1.1``: en ``1.1`` cada nódulo puede traer sus artefactos
    en base64, opcionales por separado.

    No copia ni reescribe valores: el contrato crudo es el artefacto que se
    conserva, así que solo se valida.
    """
    if not isinstance(datos, dict):
        raise ContratoInvalido("La respuesta del servicio de IA no es un objeto JSON.")
    faltan = [campo for campo in CAMPOS_CONTRATO if campo not in datos]
    if faltan:
        raise ContratoInvalido("La respuesta del servicio de IA no cumple el contrato.")
    if not isinstance(datos["version_contrato"], str) or not datos["version_contrato"]:
        raise ContratoInvalido("El contrato no trae una versión válida.")
    if (
        not _es_entero(datos["ancho"])
        or not _es_entero(datos["alto"])
        or datos["ancho"] <= 0
        or datos["alto"] <= 0
    ):
        raise ContratoInvalido("El contrato no trae el tamaño de la imagen.")
    if not isinstance(datos["huella_modelos"], str):
        raise ContratoInvalido("El contrato no trae la huella de los modelos.")
    if not isinstance(datos["umbrales"], dict):
        raise ContratoInvalido("El contrato no trae los umbrales usados.")
    if not isinstance(datos["sin_nodulo"], bool):
        raise ContratoInvalido("El contrato no indica si hubo nódulos.")
    nodulos = datos["nodulos"]
    if not isinstance(nodulos, list):
        raise ContratoInvalido("El contrato no trae la lista de nódulos.")
    if len(nodulos) > MAX_NODULOS:
        raise ContratoInvalido("El contrato trae más nódulos de los admitidos.")
    if datos["sin_nodulo"] is not (len(nodulos) == 0):
        raise ContratoInvalido("El contrato se contradice sobre la detección de nódulos.")
    for posicion, nodulo in enumerate(nodulos, start=1):
        _revisar_nodulo(nodulo, posicion)
    indices = [nodulo["indice"] for nodulo in nodulos]
    if len(set(indices)) != len(indices):
        raise ContratoInvalido("El contrato repite el índice de un nódulo.")
    # Tope de seguridad antes de decodificar: los artefactos del contrato 1.1
    # son opcionales, pero la suma decodificada nunca pasa de 8 MB.
    total_artefactos = sum(
        _tamano_artefactos(nodulo, posicion) for posicion, nodulo in enumerate(nodulos, start=1)
    )
    if total_artefactos > MAX_BYTES_ARTEFACTOS:
        raise ArtefactosDemasiadoGrandes(
            "Los artefactos de la inferencia superan el tamaño máximo admitido."
        )
    return datos


class ClienteIA:
    """Cliente del servicio de IA; el transporte se puede sustituir en pruebas."""

    def __init__(
        self,
        url: str,
        timeout_segundos: float = 30.0,
        transporte: httpx.BaseTransport | None = None,
    ) -> None:
        if not url.strip():
            raise ValueError("Falta la URL del servicio de IA")
        if timeout_segundos <= 0:
            raise ValueError("El tiempo máximo de espera del servicio de IA debe ser positivo")
        self._url = url.rstrip("/")
        self._timeout = httpx.Timeout(timeout_segundos)
        self._transporte = transporte

    def inferir(self, imagen: bytes, nombre: str) -> dict[str, object]:
        """Envía la imagen y devuelve el contrato validado.

        ``nombre`` es el nombre del archivo en el multipart; debe ser opaco, sin
        datos del paciente.
        """
        if not imagen:
            raise ContratoInvalido("La imagen llegó vacía.")
        try:
            with httpx.Client(timeout=self._timeout, transport=self._transporte) as cliente:
                respuesta = cliente.post(
                    f"{self._url}/inferir",
                    files={"imagen": (nombre, imagen, "application/octet-stream")},
                )
        except httpx.TimeoutException as exc:
            raise ServicioNoDisponible(
                "El servicio de IA no respondió dentro del tiempo máximo.",
                codigo=CODIGO_SERVICIO_NO_DISPONIBLE,
            ) from exc
        except httpx.HTTPError as exc:
            raise ServicioNoDisponible(
                "No se pudo contactar el servicio de IA.",
                codigo=CODIGO_SERVICIO_NO_DISPONIBLE,
            ) from exc

        if respuesta.status_code == httpx.codes.SERVICE_UNAVAILABLE:
            raise ServicioNoDisponible(
                "El servicio de IA no tiene los modelos cargados.",
                codigo=CODIGO_MODELO_NO_DISPONIBLE,
            )
        if respuesta.status_code >= httpx.codes.INTERNAL_SERVER_ERROR:
            raise ServicioRespondioError(
                f"El servicio de IA falló con estado {respuesta.status_code}.",
                codigo=CODIGO_SERVICIO_NO_DISPONIBLE,
            )
        if respuesta.status_code >= httpx.codes.BAD_REQUEST:
            raise ServicioRespondioError(
                f"El servicio de IA rechazó la solicitud con estado {respuesta.status_code}.",
                codigo=CODIGO_SERVICIO_NO_DISPONIBLE,
            )
        try:
            datos = respuesta.json()
        except ValueError as exc:
            raise ContratoInvalido("La respuesta del servicio de IA no es JSON.") from exc
        return validar_contrato(datos)


def get_cliente_ia() -> ClienteIA:
    """Cliente configurado desde el entorno."""
    settings = get_settings()
    return ClienteIA(settings.ia_url, settings.ia_timeout_segundos)
