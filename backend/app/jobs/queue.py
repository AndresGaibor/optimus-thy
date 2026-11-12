"""Cola de trabajos largos sobre PostgreSQL (sin broker externo).

Estados: ``en_cola`` (espera), ``en_proceso`` (corriendo), ``completado`` y
``error``. Un trabajo que agota sus intentos queda en ``error`` y solo vuelve a
la cola con un reintento manual.

``error_detalle`` guarda un CÓDIGO (``fallo_manejador``, ``sin_manejador``,
``tiempo_excedido``); el detalle técnico va al log, nunca al cliente.
"""

from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.trabajos import Trabajo

logger = logging.getLogger("optimus_thy.jobs")

#: Tipos que el sistema sabe procesar; el resto se rechaza al encolar.
TIPOS = ("ocr", "inferencia")


def encolar(
    db: Session,
    tipo: str,
    payload: dict[str, Any],
    max_intentos: int = 3,
    prioridad: int = 0,
    creado_por: uuid.UUID | None = None,
    timeout_segundos: int = 300,
) -> Trabajo:
    trabajo = Trabajo(
        tipo=tipo,
        estado="en_cola",
        prioridad=prioridad,
        intentos=0,
        max_intentos=max_intentos,
        disponible_en=datetime.now(UTC),
        payload=payload,
        creado_por=creado_por,
        timeout_segundos=timeout_segundos,
    )
    db.add(trabajo)
    db.commit()
    db.refresh(trabajo)
    return trabajo


def reservar_siguiente(db: Session) -> Trabajo | None:
    stmt = (
        select(Trabajo)
        .where(Trabajo.estado == "en_cola", Trabajo.disponible_en <= datetime.now(UTC))
        .order_by(Trabajo.prioridad.desc(), Trabajo.disponible_en.asc(), Trabajo.creado_en.asc())
        .with_for_update(skip_locked=True)
        .limit(1)
    )
    trabajo = db.execute(stmt).scalars().first()
    if trabajo is None:
        db.rollback()
        return None
    trabajo.estado = "en_proceso"
    trabajo.iniciado_en = datetime.now(UTC)
    db.commit()
    db.refresh(trabajo)
    return trabajo


def marcar_completado(db: Session, trabajo: Trabajo, resultado: dict[str, Any]) -> Trabajo:
    trabajo.estado = "completado"
    trabajo.resultado = resultado
    trabajo.error_detalle = None
    db.commit()
    db.refresh(trabajo)
    return trabajo


def marcar_error(db: Session, trabajo: Trabajo, codigo: str, definitivo: bool = False) -> Trabajo:
    """Cuenta el intento; reencola con espera creciente o cierra en ``error``.

    ``definitivo`` cierra en ``error`` sin reencolar: el fallo no se arregla
    repitiéndolo solo.
    """
    trabajo.intentos = (trabajo.intentos or 0) + 1
    trabajo.error_detalle = codigo
    if definitivo or trabajo.intentos >= (trabajo.max_intentos or 3):
        trabajo.estado = "error"
        trabajo.disponible_en = datetime.now(UTC)
    else:
        trabajo.estado = "en_cola"
        backoff = 2 ** (trabajo.intentos - 1)
        trabajo.disponible_en = datetime.now(UTC) + timedelta(seconds=backoff)
    db.commit()
    db.refresh(trabajo)
    return trabajo


def recuperar_vencidos(db: Session) -> int:
    """Trabajos ``en_proceso`` que pasaron su plazo (worker caído o colgado)."""
    ahora = datetime.now(UTC)
    vencidos = (
        db.execute(
            select(Trabajo).where(Trabajo.estado == "en_proceso").with_for_update(skip_locked=True)
        )
        .scalars()
        .all()
    )
    cuenta = 0
    for t in vencidos:
        if (
            t.iniciado_en is not None
            and t.iniciado_en + timedelta(seconds=t.timeout_segundos) < ahora
        ):
            marcar_error(db, t, "tiempo_excedido")
            cuenta += 1
    db.rollback()  # libera los bloqueos de los que no vencieron
    return cuenta


def reintentar(db: Session, trabajo: Trabajo) -> Trabajo:
    """Reintento manual: solo desde ``error``; reinicia los intentos."""
    trabajo.estado = "en_cola"
    trabajo.intentos = 0
    trabajo.error_detalle = None
    trabajo.iniciado_en = None
    trabajo.disponible_en = datetime.now(UTC)
    db.commit()
    db.refresh(trabajo)
    return trabajo
