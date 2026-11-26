"""Detección pura de patrones inusuales en eventos de auditoría."""

from __future__ import annotations

import uuid
from collections import defaultdict
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime, time, timedelta
from typing import NamedTuple, Protocol
from zoneinfo import ZoneInfo

# Cinco fallos en quince minutos permiten detectar ataques de fuerza bruta sin
# alertar por errores aislados de inicio de sesión o permisos.
UMBRAL_FALLOS = 5
VENTANA_FALLOS = timedelta(minutes=15)
# Treinta exportaciones o descargas en un día señalan extracción masiva sin
# confundir el uso normal de informes y conjuntos de datos.
UMBRAL_EXPORTACIONES = 30
VENTANA_EXPORTACIONES = timedelta(hours=24)
# No hay zona horaria configurada en el backend; se usa la hora civil de Ecuador.
ZONA_HORARIA = ZoneInfo("America/Guayaquil")
_HORA_INICIO = time(7)
_HORA_FIN = time(19)

_ACCIONES_FALLO = frozenset({"LOGIN_FAILED", "AUTH_2FA_FAILED", "ACCESS_DENIED"})
_ACCIONES_EXPORTACION = frozenset({"EXPORT", "DATASET_EXPORT", "REPORT_DOWNLOAD"})


class EventoAuditoria(Protocol):
    """Campos mínimos que necesita el detector de eventos auditados."""

    @property
    def ocurrido_en(self) -> datetime: ...

    @property
    def usuario_id(self) -> uuid.UUID | None: ...

    @property
    def direccion_ip(self) -> str | None: ...

    @property
    def accion(self) -> str: ...


class EventoAuditoriaFila(NamedTuple):
    ocurrido_en: datetime
    usuario_id: uuid.UUID | None
    direccion_ip: str | None
    accion: str


@dataclass(frozen=True)
class Alerta:
    tipo: str
    severidad: str
    cantidad: int
    usuario_id: uuid.UUID | None
    desde: datetime
    hasta: datetime
    detalle: str


def _accion(accion: str) -> str:
    """Acepta el código desnudo y la forma MÓDULO.CÓDIGO guardada en bitácora."""
    return accion.rsplit(".", 1)[-1]


def _ventanas(
    eventos: list[EventoAuditoria], umbral: int, duracion: timedelta
) -> list[list[EventoAuditoria]]:
    ventanas: list[list[EventoAuditoria]] = []
    inicio = 0
    while inicio < len(eventos):
        limite = eventos[inicio].ocurrido_en + duracion
        fin = inicio + 1
        while fin < len(eventos) and eventos[fin].ocurrido_en <= limite:
            fin += 1
        if fin - inicio >= umbral:
            ventanas.append(eventos[inicio:fin])
            inicio = fin
        else:
            inicio += 1
    return ventanas


def detectar_alertas(eventos: Sequence[EventoAuditoria]) -> list[Alerta]:
    """Detecta fallos repetidos, descargas masivas y exportaciones fuera de hora."""
    fallos: dict[tuple[str, str], list[EventoAuditoria]] = defaultdict(list)
    exportaciones: dict[uuid.UUID | None, list[EventoAuditoria]] = defaultdict(list)
    alertas: list[Alerta] = []

    ordenados = sorted(
        eventos,
        key=lambda evento: (
            evento.ocurrido_en,
            str(evento.usuario_id or ""),
            evento.direccion_ip or "",
            evento.accion,
        ),
    )
    for evento in ordenados:
        accion = _accion(evento.accion)
        if accion in _ACCIONES_FALLO:
            fallos[(str(evento.usuario_id or "anónimo"), evento.direccion_ip or "")].append(evento)
        if accion in _ACCIONES_EXPORTACION:
            exportaciones[evento.usuario_id].append(evento)
            hora_local = evento.ocurrido_en.astimezone(ZONA_HORARIA).time()
            if not (_HORA_INICIO <= hora_local < _HORA_FIN):
                alertas.append(
                    Alerta(
                        tipo="exportaciones_fuera_de_horario",
                        severidad="alta",
                        cantidad=1,
                        usuario_id=evento.usuario_id,
                        desde=evento.ocurrido_en,
                        hasta=evento.ocurrido_en,
                        detalle=(
                            "Se registró una exportación fuera del horario permitido "
                            "(07:00-19:00, hora de Guayaquil)."
                        ),
                    )
                )

    for (_, _ip), grupo in fallos.items():
        grupo.sort(key=lambda evento: evento.ocurrido_en)
        for ventana in _ventanas(grupo, UMBRAL_FALLOS, VENTANA_FALLOS):
            usuario_id = ventana[0].usuario_id
            alertas.append(
                Alerta(
                    tipo="fallos_de_acceso",
                    severidad="alta",
                    cantidad=len(ventana),
                    usuario_id=usuario_id,
                    desde=ventana[0].ocurrido_en,
                    hasta=ventana[-1].ocurrido_en,
                    detalle=f"Se registraron {len(ventana)} fallos de acceso en quince minutos.",
                )
            )

    for usuario_id, grupo in exportaciones.items():
        grupo.sort(key=lambda evento: evento.ocurrido_en)
        for ventana in _ventanas(grupo, UMBRAL_EXPORTACIONES, VENTANA_EXPORTACIONES):
            alertas.append(
                Alerta(
                    tipo="descargas_masivas",
                    severidad="media",
                    cantidad=len(ventana),
                    usuario_id=usuario_id,
                    desde=ventana[0].ocurrido_en,
                    hasta=ventana[-1].ocurrido_en,
                    detalle=(
                        f"Se registraron {len(ventana)} exportaciones o descargas "
                        "en veinticuatro horas."
                    ),
                )
            )

    return sorted(alertas, key=lambda alerta: (alerta.tipo, alerta.desde))
