"""Límite de peticiones en memoria por proceso (HT-082, RS-APP-10).

Ventana deslizante: cada clave guarda las marcas de sus peticiones dentro de la
ventana y se rechaza cuando ya hay ``maximo``. El estado vive en la instancia de
la aplicación (``app.state``), nunca en un global de módulo, para que cada app
creada en pruebas tenga su propia cuenta y dos procesos no compartan estado.

Al ser por proceso, el límite efectivo se multiplica por el número de workers y
se reinicia al reiniciar el proceso: es una defensa de la aplicación, no un
sustituto del límite en el proxy inverso.

El reloj es inyectable para poder probar la ventana sin dormir.
"""

from __future__ import annotations

import hashlib
import math
import threading
import time
from collections import deque
from collections.abc import Callable
from typing import Final, cast

from fastapi import Request
from starlette.applications import Starlette

from app.auth.deps import SesionActual
from app.config import get_settings

__all__ = [
    "ESTADO_LIMITE_GLOBAL",
    "ESTADO_LIMITE_INFERENCIA",
    "MAX_CLAVES",
    "RUTAS_SIN_LIMITE",
    "VENTANA_SEGUNDOS",
    "LimiteExcedido",
    "VentanaDeslizante",
    "clave_de_peticion",
    "limitar_inferencia",
    "obtener_limite",
]

VENTANA_SEGUNDOS: Final[float] = 60.0
"""La ventana del límite: un minuto, como declara el nombre de la configuración."""

MAX_CLAVES: Final[int] = 10_000
"""Tope de claves retenidas; al superarlo se descarta la más antigua."""

RUTAS_SIN_LIMITE: Final[frozenset[str]] = frozenset({"/health", "/docs", "/openapi.json", "/redoc"})
"""Rutas de operación y documentación: no consumen cupo ni reciben cabeceras estrictas."""

ESTADO_LIMITE_GLOBAL: Final[str] = "limite_global"
ESTADO_LIMITE_INFERENCIA: Final[str] = "limite_inferencia"


class LimiteExcedido(Exception):
    """Se superó el número de peticiones admitidas en la ventana."""

    def __init__(self, segundos_reintento: int) -> None:
        super().__init__("Límite de peticiones excedido")
        self.segundos_reintento = max(1, segundos_reintento)


class VentanaDeslizante:
    """Cuenta peticiones por clave dentro de una ventana móvil.

    ``maximo`` igual a ``0`` desactiva el límite: todas las peticiones pasan y
    no se guarda estado.
    """

    def __init__(
        self,
        maximo: int,
        ventana_segundos: float = VENTANA_SEGUNDOS,
        reloj: Callable[[], float] = time.monotonic,
    ) -> None:
        if maximo < 0:
            raise ValueError("El máximo de peticiones no puede ser negativo")
        if ventana_segundos <= 0:
            raise ValueError("La ventana del límite debe ser positiva")
        self._maximo = maximo
        self._ventana = ventana_segundos
        self._reloj = reloj
        self._eventos: dict[str, deque[float]] = {}
        self._ultima_purga = reloj()
        # Las rutas sincrónicas corren en el pool de hilos: el conteo debe ser
        # atómico para no admitir de más cuando llegan peticiones en paralelo.
        self._bloqueo = threading.Lock()

    @property
    def maximo(self) -> int:
        return self._maximo

    def permitir(self, clave: str) -> tuple[bool, int]:
        """Registra una petición de ``clave``.

        Devuelve ``(permitida, segundos_para_reintentar)``. Si se rechaza, la
        petición no se anota: el cupo se recupera al vencer la más antigua.
        """
        if self._maximo == 0:
            return True, 0
        with self._bloqueo:
            return self._contar(clave)

    def _contar(self, clave: str) -> tuple[bool, int]:
        ahora = self._reloj()
        self._purgar(ahora)
        marcas = self._eventos.get(clave)
        if marcas is None:
            marcas = deque()
            self._eventos[clave] = marcas
            self._acotar()
        self._descartar_vencidas(marcas, ahora)
        if len(marcas) >= self._maximo:
            espera = math.ceil(marcas[0] + self._ventana - ahora)
            return False, max(1, espera)
        marcas.append(ahora)
        return True, 0

    def _descartar_vencidas(self, marcas: deque[float], ahora: float) -> None:
        limite = ahora - self._ventana
        while marcas and marcas[0] <= limite:
            marcas.popleft()

    def _purgar(self, ahora: float) -> None:
        """Elimina claves sin actividad, como mucho una vez por ventana."""
        if ahora - self._ultima_purga < self._ventana:
            return
        for clave, marcas in list(self._eventos.items()):
            self._descartar_vencidas(marcas, ahora)
            if not marcas:
                del self._eventos[clave]
        self._ultima_purga = ahora

    def _acotar(self) -> None:
        """Mantiene el estado acotado: descarta la clave más antigua."""
        while len(self._eventos) > MAX_CLAVES:
            del self._eventos[next(iter(self._eventos))]


def clave_de_peticion(request: Request, nombre_cookie: str) -> str:
    """Clave del límite: la sesión si existe, si no el host del cliente.

    El token se resume en un SHA-256 para no conservar el valor de la cookie.
    """
    token = request.cookies.get(nombre_cookie)
    if token:
        return f"sesion:{hashlib.sha256(token.encode('utf-8')).hexdigest()}"
    host = request.client.host if request.client is not None else "desconocido"
    return f"cliente:{host}"


def obtener_limite(app: Starlette, nombre: str) -> VentanaDeslizante:
    """El limitador que ``create_app`` dejó en ``app.state``."""
    return cast(VentanaDeslizante, getattr(app.state, nombre))


def limitar_inferencia(request: Request, actual: SesionActual) -> None:
    """Cupo por usuario para las inferencias, que son la operación costosa.

    Se llama solo cuando el trabajo es de tipo ``inferencia``. Lanza
    ``LimiteExcedido`` cuando el usuario agota su cupo; el manejador de la app
    lo traduce a 429 con ``Retry-After``.
    """
    if get_settings().inferencia_por_minuto <= 0:
        return
    limite = obtener_limite(request.app, ESTADO_LIMITE_INFERENCIA)
    permitido, segundos = limite.permitir(f"usuario:{actual.usuario.id}")
    if not permitido:
        raise LimiteExcedido(segundos)
